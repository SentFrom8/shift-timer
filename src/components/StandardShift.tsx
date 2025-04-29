import { AnimatePresence, motion } from "motion/react";
import { useReducer } from "react";
import { z } from "zod";
import useShiftTimer from "../hooks/useShiftTimer";
import {
  standardShiftSchema,
  StandardShiftSchemaErrors,
  StandardShiftState,
} from "../utils/types";
import ProgressArc from "./ProgressArc";

const standardShiftInitialState = {
  startTime: "",
  endTime: "",
  hourlyRate: null,
  breaks: [],
  errors: { _errors: [] },
  isTimerRunning: false,
  pausedTime: null,
  pausedDuration: 0,
};

type StandardShiftShiftAction =
  | { type: "UPDATE_ALL"; payload: StandardShiftState }
  | { type: "SET_START_TIME"; payload: string }
  | { type: "SET_END_TIME"; payload: string }
  | { type: "ADD_BREAK" }
  | { type: "REMOVE_BREAK"; payload: number }
  | {
      type: "UPDATE_BREAK";
      payload: {
        index: number;
        field: "breakStart" | "breakEnd";
        value: string;
      };
    }
  | { type: "SET_HOURLY_RATE"; payload: number }
  | { type: "SET_ERRORS"; payload: StandardShiftSchemaErrors }
  | { type: "SET_IS_DURATION_MODE"; payload: boolean }
  | { type: "SET_TIMER_RUNNING"; payload: boolean }
  | { type: "RESET" };

const fixedTimeShiftShiftReducer = (
  state: StandardShiftState,
  action: StandardShiftShiftAction
): StandardShiftState => {
  switch (action.type) {
    case "UPDATE_ALL":
      return action.payload;
    case "SET_START_TIME":
      return { ...state, startTime: action.payload };
    case "SET_END_TIME":
      return { ...state, endTime: action.payload };
    case "ADD_BREAK": {
      return {
        ...state,
        breaks: [...state.breaks, { breakStart: "", breakEnd: "" }],
      };
    }
    case "REMOVE_BREAK":
      return {
        ...state,
        breaks: state.breaks.filter((_, i) => i !== action.payload),
      };
    case "UPDATE_BREAK":
      const newBreaks = [...state.breaks];
      newBreaks[action.payload.index] = {
        ...newBreaks[action.payload.index],
        [action.payload.field]: action.payload.value,
      };
      return { ...state, breaks: newBreaks };
    case "SET_HOURLY_RATE":
      return { ...state, hourlyRate: action.payload };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "SET_TIMER_RUNNING":
      return {
        ...state,
        isTimerRunning: action.payload,
        pausedTime: state.isTimerRunning ? Date.now() : null,
        pausedDuration: state.pausedTime
          ? state.pausedDuration + Date.now() - state.pausedTime
          : state.pausedDuration,
      };
    case "RESET":
      return standardShiftInitialState;
    default:
      return state;
  }
};

const StandardShift = ({ visible }: { visible: boolean }) => {
  const [state, dispatch] = useReducer(
    fixedTimeShiftShiftReducer,
    standardShiftInitialState
  );

  const startTime = state.startTime
    ? new Date(state.startTime).getTime()
    : null;

  const endTime = state.endTime ? new Date(state.endTime).getTime() : null;

  const { currentTime, progress, timer } = useShiftTimer(
    startTime,
    endTime,
    state.isTimerRunning
  );

  const timeToShiftStart = timer && timer < 0 ? Math.abs(timer) : null;

  const totalDuration = endTime && startTime ? endTime - startTime : 0;

  const earnings =
    timer && timer > 0 && state.hourlyRate
      ? (state.hourlyRate * Math.min(timer, totalDuration)) / 3600000
      : 0;

  const validateAndDispatch = (newState: StandardShiftState) => {
    const validationResult = standardShiftSchema.safeParse(newState);

    if (validationResult.error) {
      dispatch({
        type: "SET_ERRORS",
        payload: validationResult.error.format(),
      });
      return;
    }

    dispatch({
      type: "UPDATE_ALL",
      payload: { ...newState, errors: { _errors: [] } },
    });
  };

  return visible ? (
    <div className="w-full space-y-6">
      <div className="px-5 sm:px-32">
        <ProgressArc
          progress={progress}
          breaks={state.breaks}
          startTime={startTime}
          endTime={endTime}
          currentTime={currentTime}
          timeToShiftStart={timeToShiftStart}
          earnings={earnings}>
          <AnimatePresence>
            {!state.isTimerRunning && (
              <motion.button
                className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-lg w-40 py-1 sm:text-xl sm:w-52 sm:py-2 bg-[#8E44AD] hover:bg-[#A563C1] rounded-md font-bold cursor-pointer`}
                exit={{ translate: "0 40%", opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  if (!state.startTime) {
                    const validationResult = standardShiftSchema
                      .superRefine((data, ctx) => {
                        if (!data.startTime && !data.endTime) {
                          ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            path: ["startTime"],
                            message: "Time is required",
                          });
                          ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            path: ["endTime"],
                            message: "Time is required",
                          });
                        }
                      })
                      .safeParse(state);

                    if (validationResult.error) {
                      dispatch({
                        type: "SET_ERRORS",
                        payload: validationResult.error.format(),
                      });
                      return;
                    }
                  }

                  dispatch({
                    type: "SET_TIMER_RUNNING",
                    payload: true,
                  });
                }}>
                {state.isTimerRunning ? "Pause" : "Start"}
              </motion.button>
            )}
          </AnimatePresence>
        </ProgressArc>
      </div>
      <div className="space-y-6 bg-neutral-800 px-3 sm:px-10 py-6 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-6 flex-wrap">
          <div className="flex-1 relative">
            <label htmlFor="startTime" className="text-[#ffffff90]">
              Start time:
            </label>
            <input
              id="startTime"
              type="datetime-local"
              style={{ colorScheme: "dark" }}
              value={state.startTime}
              onChange={(e) =>
                validateAndDispatch({ ...state, startTime: e.target.value })
              }
              className="w-full bg-neutral-700 text-white p-2 rounded"
            />
            <span className="text-red-400 absolute left-0 top-[100%]">
              {state.errors["startTime"]?._errors[0]}
            </span>
          </div>
          <div className="flex-1 relative">
            <label htmlFor="endTime" className="text-[#ffffff90]">
              End time:
            </label>
            <input
              id="endTime"
              type="datetime-local"
              style={{ colorScheme: "dark" }}
              value={state.endTime}
              onChange={(e) =>
                validateAndDispatch({ ...state, endTime: e.target.value })
              }
              className="w-full bg-neutral-700 text-white p-2 rounded"
            />
            <span className="text-red-400 absolute left-0 top-[100%]">
              {state.errors["endTime"]?._errors[0]}
            </span>
          </div>
        </div>
        <div className="relative">
          <label htmlFor="hourlyRate" className="text-[#ffffff90]">
            Hourly rate:
          </label>
          <input
            id="hourlyRate"
            type="number"
            placeholder="Hourly Rate ($)"
            value={state.hourlyRate || ""}
            onChange={(e) =>
              validateAndDispatch({
                ...state,
                hourlyRate: Number(e.target.value) || null,
              })
            }
            className="w-full bg-neutral-700 text-white p-2 rounded"
            min="0"
            step="0.01"
          />
          <span className="text-red-400 absolute left-0 top-[100%]">
            {state.errors["hourlyRate"]?._errors[0]}
          </span>
        </div>
        {state.breaks.map((br, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row gap-6 px-3 sm:px-5 pt-4 pb-6 flex-wrap bg-[#8E44AD1A] border-l border-l-4 border-l-[#8E44AD] rounded-xl relative">
            <div className="flex-1 relative">
              <label htmlFor="breakStart" className="text-[#ffffff90]">
                Break start:
              </label>
              <input
                id="breakStart"
                type="datetime-local"
                style={{ colorScheme: "dark" }}
                value={br.breakStart}
                onChange={(e) =>
                  validateAndDispatch({
                    ...state,
                    breaks: [
                      ...state.breaks.slice(0, i),
                      { ...state.breaks[i], breakStart: e.target.value },
                      ...state.breaks.slice(i + 1),
                    ],
                  })
                }
                className="w-full bg-neutral-700 text-white p-2 rounded"
              />
              <span className="text-red-400 absolute left-0 top-[100%]">
                {state.errors["breaks"]?.[i]?.breakStart?._errors[0]}
              </span>
            </div>
            <div className="flex-1 relative">
              <label htmlFor="breakEnd" className="text-[#ffffff90]">
                Break end:
              </label>
              <input
                id="breakEnd"
                type="datetime-local"
                style={{ colorScheme: "dark" }}
                value={br.breakEnd}
                onChange={(e) =>
                  validateAndDispatch({
                    ...state,
                    breaks: [
                      ...state.breaks.slice(0, i),
                      { ...state.breaks[i], breakEnd: e.target.value },
                      ...state.breaks.slice(i + 1),
                    ],
                  })
                }
                className="w-full bg-neutral-700 text-white p-2 rounded"
              />
              <span className="text-red-400 absolute left-0 top-[100%]">
                {state.errors["breaks"]?.[i]?.breakEnd?._errors[0]}
              </span>
            </div>
            <button
              onClick={() => dispatch({ type: "REMOVE_BREAK", payload: i })}
              className="absolute top-0 right-0 px-2 py-1 hover:text-neutral-400">
              x
            </button>
            <span className="text-red-400 absolute left-0 top-[100%]">
              {state.errors["breaks"]?.[i]?._errors[0]}
            </span>
          </div>
        ))}
        <div className="w-full h-[1px] bg-[#ffffff90]" />
        <div className="flex gap-6">
          <button
            onClick={() => dispatch({ type: "RESET" })}
            className="flex-1 py-2 rounded text-center font-semibold border border-[#ffffff90] hover:outline hover:outline-2 hover:outline-[#ffffff90]">
            Reset
          </button>
          <button
            onClick={() =>
              dispatch({
                type: "ADD_BREAK",
              })
            }
            className="flex-1 py-2 rounded border border-[#A563C1] text-[#A563C1] font-semibold hover:outline hover:outline-2">
            + Add Break
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default StandardShift;
