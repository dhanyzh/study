'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { POMODORO } from '@/lib/constants';

/**
 * useTimer Hook — Pomodoro timer with work/break cycles
 */
export function useTimer() {
  const [timeLeft, setTimeLeft] = useState(POMODORO.WORK_DURATION * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // work, shortBreak, longBreak
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);

    if (mode === 'work') {
      // Use functional update to avoid stale `sessions` closures.
      setSessions((prev) => {
        const newSessions = prev + 1;
        if (newSessions % POMODORO.SESSIONS_BEFORE_LONG_BREAK === 0) {
          setMode('longBreak');
          setTimeLeft(POMODORO.LONG_BREAK * 60);
        } else {
          setMode('shortBreak');
          setTimeLeft(POMODORO.SHORT_BREAK * 60);
        }
        return newSessions;
      });
    } else {
      setMode('work');
      setTimeLeft(POMODORO.WORK_DURATION * 60);
    }
  }, [mode]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Schedule state updates outside the current effect tick to avoid cascading renders.
      Promise.resolve().then(handleTimerComplete);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(POMODORO.WORK_DURATION * 60);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return {
    timeLeft, formattedTime: formatTime(timeLeft),
    isRunning, mode, sessions, start, pause, reset,
  };
}
