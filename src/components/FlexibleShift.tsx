import { useEffect, useReducer } from "react";
import {
  FlexibleSchemaErrors,
  FlexibleShiftSchema,
  FlexibleShiftState,
} from "../utils/types";
import { z } from "zod";
import useShiftTimer from "../hooks/useShiftTimer";
import ProgressArc from "./ProgressArc";
import { AnimatePresence, motion } from "motion/react";

const flexibleShiftInitialState = {
  startTime: null,
  endTime: null,
  durationHours: null,
  durationMinutes: null,
  hourlyRate: null,
  isTimerRunning: false,
  pausedTime: null,
  pausedDuration: 0,
  errors: { _errors: [] },
};

type FlexibleShiftAction =
  | { type: "UPDATE_ALL"; payload: FlexibleShiftState }
  | { type: "SET_START_TIME"; payload: number | null }
  | { type: "SET_END_TIME"; payload: number | null }
  | { type: "SET_HOURLY_RATE"; payload: number | null }
  | { type: "SET_DURATION_HOURS"; payload: number | null }
  | { type: "SET_DURATION_MINUTES"; payload: number | null }
  | { type: "SET_IS_DURATION_MODE"; payload: boolean }
  | { type: "SET_TIMER_RUNNING"; payload: boolean }
  | {
      type: "SET_ERRORS";
      payload: FlexibleSchemaErrors;
    }
  | { type: "RESET" };

const flexibleShiftReducer = (
  state: FlexibleShiftState,
  action: FlexibleShiftAction
): FlexibleShiftState => {
  switch (action.type) {
    case "UPDATE_ALL":
      return action.payload;
    case "SET_START_TIME":
      return { ...state, startTime: action.payload };
    case "SET_END_TIME":
      return { ...state, endTime: action.payload };
    case "SET_HOURLY_RATE":
      return { ...state, hourlyRate: action.payload };
    case "SET_DURATION_HOURS":
      return { ...state, durationHours: action.payload };
    case "SET_DURATION_MINUTES":
      return { ...state, durationMinutes: action.payload };
    case "SET_TIMER_RUNNING":
      return {
        ...state,
        isTimerRunning: action.payload,
        pausedTime: state.isTimerRunning ? Date.now() : null,
        pausedDuration: state.pausedTime
          ? state.pausedDuration + Date.now() - state.pausedTime
          : state.pausedDuration,
      };
    case "SET_ERRORS":
      return { ...state, errors: action.payload };
    case "RESET":
      return flexibleShiftInitialState;
    default:
      return state;
  }
};

const FlexibleShift = ({ visible }: { visible: boolean }) => {
  const [state, dispatch] = useReducer(
    flexibleShiftReducer,
    flexibleShiftInitialState
  );

  const { currentTime, progress, timer } = useShiftTimer(
    state.startTime,
    state.endTime,
    state.isTimerRunning,
    state.pausedDuration
  );

  const totalDuration =
    (state.durationHours ?? 0) * 3600000 + (state.durationMinutes ?? 0) * 60000;

  const validateAndDispatch = (newState: FlexibleShiftState) => {
    const validationResult = FlexibleShiftSchema.safeParse(newState);

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

  useEffect(() => {
    if (state.startTime) {
      dispatch({
        type: "SET_END_TIME",
        payload: totalDuration ? state.startTime + totalDuration : null,
      });
    }
  }, [state.durationHours, state.durationMinutes]);

  const earnings =
    timer && timer > 0 && state.hourlyRate
      ? (state.hourlyRate * Math.min(timer, totalDuration)) / 3600000
      : 0;

  return visible ? (
    <div className="w-full space-y-6">
      <div className="sm:px-32">
        <ProgressArc
          progress={progress}
          breaks={[]}
          startTime={state.startTime}
          endTime={state.endTime}
          currentTime={currentTime}
          timeToShiftStart={0}
          earnings={earnings}>
          <AnimatePresence>
            {progress !== 1 && (
              <motion.button
                className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-lg w-40 py-1 sm:text-xl sm:w-52 sm:py-2 ${
                  state.isTimerRunning
                    ? "bg-[#AD5944] hover:bg-[#C17663]"
                    : "bg-[#8E44AD] hover:bg-[#A563C1]"
                } rounded-md font-bold cursor-pointer transition`}
                exit={{ translate: "0 40%", opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  if (!state.startTime) {
                    const validationResult = FlexibleShiftSchema.superRefine(
                      (data, ctx) => {
                        if (!data.durationHours && !data.durationMinutes) {
                          ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            path: ["durationHours"],
                            message: "Duration must be set",
                          });
                        }
                      }
                    ).safeParse(state);

                    if (validationResult.error) {
                      dispatch({
                        type: "SET_ERRORS",
                        payload: validationResult.error.format(),
                      });
                      return;
                    }
                    const startTime = Date.now();
                    dispatch({
                      type: "UPDATE_ALL",
                      payload: {
                        ...state,
                        startTime: startTime,
                        endTime: startTime + totalDuration,
                      },
                    });
                  }

                  dispatch({
                    type: "SET_TIMER_RUNNING",
                    payload: !state.isTimerRunning,
                  });
                }}>
                {state.isTimerRunning ? "Pause" : "Start"}
              </motion.button>
            )}
          </AnimatePresence>
        </ProgressArc>
      </div>
      <div className="space-y-6 bg-neutral-800 px-3 sm:px-10 py-6 rounded-xl">
        <div className="flex gap-6 relative">
          <div className="flex-1">
            <label htmlFor="durationHours" className="text-[#ffffff90]">
              Hours:
            </label>
            <input
              id="durationHours"
              type="number"
              placeholder="HH"
              value={state.durationHours || ""}
              onChange={(e) =>
                validateAndDispatch({
                  ...state,
                  durationHours: Number(e.target.value) || null,
                })
              }
              className="w-full bg-neutral-700 text-white p-2 rounded"
              min="1"
            />
          </div>
          <div className="flex-1 relative">
            <label htmlFor="durationMinutes" className="text-[#ffffff90]">
              Minutes:
            </label>
            <input
              id="durationMinutes"
              type="number"
              placeholder="MM"
              value={state.durationMinutes || ""}
              onChange={(e) =>
                validateAndDispatch({
                  ...state,
                  durationMinutes: Number(e.target.value) || null,
                })
              }
              className="w-full bg-neutral-700 text-white p-2 rounded"
              min="1"
            />
          </div>
          <span className="text-red-400 absolute left-0 top-[100%]">
            {
              [
                ...(state.errors["durationHours"]?._errors || []),
                ...(state.errors["durationMinutes"]?._errors || []),
              ][0]
            }
          </span>
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
            step="0.1"
          />
          <span className="text-red-400 absolute left-0 top-[100%]">
            {state.errors["hourlyRate"]?._errors[0]}
          </span>
        </div>
        <div className="w-full h-[1px] bg-[#ffffff90]" />
        <button
          onClick={() => dispatch({ type: "RESET" })}
          className="w-full py-2 rounded text-center font-semibold border border-[#ffffff90] hover:outline hover:outline-2 hover:outline-[#ffffff90]">
          Reset
        </button>
      </div>
    </div>
  ) : null;
};

export default FlexibleShift;
