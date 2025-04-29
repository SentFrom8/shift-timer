import { z } from "zod";

export type AppState = {
  isTimerRunning: boolean;
  pausedTime: number | null;
  pausedDuration: number;
};

export const breakObject = z.object({
  breakStart: z
    .preprocess((input) => `${input}:00`, z.string().datetime({ local: true }))
    .or(z.literal("")),
  breakEnd: z
    .preprocess((input) => `${input}:00`, z.string().datetime({ local: true }))
    .or(z.literal("")),
});

export type BreakObject = z.infer<typeof breakObject>;

export const standardShiftSchema = z
  .object({
    startTime: z
      .preprocess(
        (input) => `${input}:00`,
        z.string().datetime({ local: true })
      )
      .or(z.literal("")),
    endTime: z
      .preprocess(
        (input) => `${input}:00`,
        z.string().datetime({ local: true })
      )
      .or(z.literal("")),
    hourlyRate: z.number().positive().nullable(),
    breaks: z.array(breakObject),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime) {
      if (data.startTime > data.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_date,
          path: ["endTime"],
          message: "Shift ends before it begins",
        });
      }
      data.breaks.forEach((b, i) => {
        if (
          b.breakStart &&
          (b.breakStart < data.startTime || b.breakStart > data.endTime)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_date,
            path: ["breaks", i, "breakStart"],
            message: "Break outside shift hours",
          });
        }
        if (
          b.breakEnd &&
          (b.breakEnd > data.endTime || b.breakEnd < data.startTime)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_date,
            path: ["breaks", i, "breakEnd"],
            message: "Break outside shift hours",
          });
        }
        if (b.breakStart && b.breakEnd) {
          if (b.breakStart > b.breakEnd) {
            ctx.addIssue({
              code: z.ZodIssueCode.invalid_date,
              path: ["breaks", i, "breakEnd"],
              message: "Break ends before it begins",
            });
          }
        }
      });
    } else {
      data.breaks.forEach((b, i) => {
        if (b.breakStart || b.breakEnd) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["breaks", i],
            message: "Shift must be set before breaks are added",
          });
        }
      });
    }
  });

export type StandardShiftSchemaState = z.infer<typeof standardShiftSchema>;

export type StandardShiftSchemaErrors = z.ZodFormattedError<
  StandardShiftSchemaState,
  string
>;

export type StandardShiftState = StandardShiftSchemaState & {
  errors: StandardShiftSchemaErrors;
} & AppState;

export const FlexibleShiftSchema = z.object({
  durationHours: z.number().int().nonnegative().nullable(),
  durationMinutes: z.number().int().nonnegative().lt(60).nullable(),
  hourlyRate: z.number().positive().nullable(),
});

export type FlexibleSchemaState = z.infer<typeof FlexibleShiftSchema>;

export type FlexibleSchemaErrors = z.ZodFormattedError<
  FlexibleSchemaState,
  string
>;

export type FlexibleShiftState = {
  startTime: number | null;
  endTime: number | null;
  errors: FlexibleSchemaErrors;
} & FlexibleSchemaState &
  AppState;
