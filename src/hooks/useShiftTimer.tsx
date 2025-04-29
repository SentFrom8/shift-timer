import { useState, useEffect } from "react";

const useShiftTimer = (
  startTime: number | null,
  endTime: number | null,
  isTimerRunning: boolean,
  pausedDuration?: number
) => {
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    if ((!startTime || !endTime) && currentTime) {
      setCurrentTime(null);
      return;
    }

    if (!isTimerRunning) return;

    setCurrentTime(Date.now() - (pausedDuration ?? 0));

    const interval = setInterval(
      () => setCurrentTime(Date.now() - (pausedDuration ?? 0)),
      200
    );
    return () => clearInterval(interval);
  }, [isTimerRunning, pausedDuration]);

  if (startTime && endTime && currentTime) {
    const totalTime = endTime - startTime;

    const timer = currentTime - startTime;

    const progress = Math.min(Math.max(timer / totalTime, 0), 1);

    return {
      currentTime,
      timer,
      progress,
    };
  }
  return {
    currentTime: currentTime,
    timer: null,
    progress: 0,
  };
};

export default useShiftTimer;
