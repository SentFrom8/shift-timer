import { AnimatePresence, motion } from "motion/react";
import { useState, useMemo } from "react";
import {
  arcSvgConfig,
  formatTime,
  getArcSegmentLine,
} from "../utils/functions";
import { BreakObject } from "../utils/types";

interface ProgressArcProps {
  progress: number;
  breaks: BreakObject[];
  startTime: number | null;
  endTime: number | null;
  currentTime: number | null;
  timeToShiftStart: number | null;
  earnings: number;
  children?: React.ReactNode;
}

const ProgressArc = ({ startTime, endTime, ...props }: ProgressArcProps) => {
  const {
    viewBoxBoundry,
    arcCenter,
    arcStart,
    arcEnd,
    radius,
    strokeWidth,
    gapAngle,
    flipPercentage,
  } = arcSvgConfig;

  const [breakHovered, setBreakHovered] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const breakTimer =
    props.currentTime && breakHovered && props.currentTime < breakHovered.end
      ? props.currentTime > breakHovered.start
        ? breakHovered.end - props.currentTime
        : props.currentTime - breakHovered.start
      : null;

  const breakLines = useMemo(() => {
    if (!startTime || !endTime) {
      return [];
    }

    const breakTimes = props.breaks
      .filter((b) => b.breakStart && b.breakEnd)
      .map((b) => ({
        start: new Date(b.breakStart!).getTime(),
        end: new Date(b.breakEnd!).getTime(),
      }))
      .sort((a, b) => a.start - b.start);

    const reducedBreaks = breakTimes.reduce((acc, curr) => {
      if (!acc.length) return [curr];
      const last = acc[acc.length - 1];
      if (curr.start <= last.end) {
        last.end = Math.max(last.end, curr.end);
        return acc;
      }
      return [...acc, curr];
    }, [] as { start: number; end: number }[]);

    return reducedBreaks.map((b) => {
      const breakStart = Math.min(
        Math.max((b.start - startTime) / (endTime - startTime), 0),
        1
      );
      const breakSpan = Math.min(
        Math.max((b.end - b.start) / (endTime - startTime), 0),
        1 - breakStart
      );
      const line = getArcSegmentLine(
        breakStart,
        breakSpan,
        radius,
        arcCenter,
        gapAngle
      );
      return {
        line: line,
        break: b,
        isFlipped: breakSpan > flipPercentage,
      };
    });
  }, [props.breaks]);

  const progressLine = getArcSegmentLine(
    0,
    props.progress,
    radius,
    arcCenter,
    gapAngle
  );

  return (
    <div className="relative">
      <svg
        viewBox={`${viewBoxBoundry.start.x} ${viewBoxBoundry.start.y} ${viewBoxBoundry.end.x} ${viewBoxBoundry.end.y}`}>
        <path
          d={`
          M ${arcStart.x} ${arcStart.y}
          A ${radius} ${radius} 0 1 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-600"
        />
        {breakLines.map(({ line: l, break: b, isFlipped: flipped }, i) => {
          return (
            <path
              key={i}
              d={`
              M ${l.start.x} ${l.start.y}
              A ${radius} ${radius} 0 ${flipped ? "1" : "0"} 1 ${l.end.x} ${
                l.end.y
              }`}
              fill="none"
              strokeWidth={strokeWidth}
              style={{ pointerEvents: "stroke" }}
              className="stroke-amber-400 hover:stroke-amber-200 cursor-pointer"
              onMouseEnter={() => setBreakHovered(b)}
              onMouseLeave={() => setBreakHovered(null)}
            />
          );
        })}
        <path
          d={`
          M ${arcStart.x} ${arcStart.y}
          A ${radius} ${radius} 0 ${
            props.progress > flipPercentage ? "1" : "0"
          } 1 ${progressLine.end.x} ${progressLine.end.y}`}
          fill="none"
          stroke="#63AD44"
          strokeWidth={strokeWidth}
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        {props.timeToShiftStart ? (
          <div>
            <p className="sm:text-lg">Shift starts in:</p>
            <p className="text-xl sm:text-2xl font-bold">
              {formatTime(props.timeToShiftStart)}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xl sm:text-2xl font-bold">
              {props.progress === 0
                ? "Set your shift"
                : props.progress === 1
                ? "Well done!"
                : `${(props.progress * 100).toFixed(1)}%`}
            </p>
            {props.earnings > 0 ? (
              <p className="text-lg mt-2">
                Earned: ${props.earnings.toFixed(2)}
              </p>
            ) : null}
          </div>
        )}
      </div>
      {props.children}
      <AnimatePresence>
        {breakTimer != null && (
          <motion.div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-40 px-2 py-1 sm:w-52 sm:py-2 bg-gray-600 rounded-md text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}>
            <span>
              {breakTimer < 0 ? "Break starts in:" : "Break ends in: "}
            </span>
            <h3 className="text-lg sm:text-xl">
              {formatTime(Math.abs(breakTimer))}
            </h3>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProgressArc;
