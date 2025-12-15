'use client';

import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useUIStore, formatElapsedTime } from '@/stores/ui';
import { Button } from './button';

export interface TimerProps {
  component?: string;
  targetMinutes?: number;
  onComplete?: () => void;
  className?: string;
}

export function Timer({ component, targetMinutes, onComplete, className = '' }: TimerProps) {
  // Use selectors for stable references
  const isRunning = useUIStore((state) => state.sessionTimer.isRunning);
  const startTime = useUIStore((state) => state.sessionTimer.startTime);
  const elapsedTime = useUIStore((state) => state.sessionTimer.elapsedTime);
  const timerComponent = useUIStore((state) => state.sessionTimer.component);
  const startTimer = useUIStore((state) => state.startTimer);
  const stopTimer = useUIStore((state) => state.stopTimer);
  const resetTimer = useUIStore((state) => state.resetTimer);
  const updateElapsedTime = useUIStore((state) => state.updateElapsedTime);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Start new interval
      intervalRef.current = setInterval(() => {
        updateElapsedTime();
      }, 1000);
    } else {
      // Clear interval when stopped
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, updateElapsedTime]);

  // Check if target time reached
  useEffect(() => {
    if (targetMinutes && elapsedTime >= targetMinutes * 60 * 1000) {
      onComplete?.();
    }
  }, [elapsedTime, targetMinutes, onComplete]);

  const handleStartStop = () => {
    if (isRunning) {
      stopTimer();
    } else {
      startTimer(component || 'General');
    }
  };

  const elapsedMs = elapsedTime;
  const targetMs = targetMinutes ? targetMinutes * 60 * 1000 : null;
  const progress = targetMs ? Math.min((elapsedMs / targetMs) * 100, 100) : 0;
  const isOvertime = targetMs && elapsedMs > targetMs;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Timer display */}
      <div className={`
        font-mono text-2xl font-bold
        ${isOvertime ? 'text-red-500' : 'text-gray-900'}
      `}>
        {formatElapsedTime(elapsedMs)}
        {targetMinutes && (
          <span className="text-gray-400 text-sm font-normal ml-2">
            / {targetMinutes}:00
          </span>
        )}
      </div>

      {/* Progress bar (if target set) */}
      {targetMinutes && (
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isOvertime ? 'bg-red-500' : 'bg-pink-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStartStop}
          className="p-2"
        >
          {isRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetTimer}
          className="p-2"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Current component label */}
      {timerComponent && isRunning && (
        <span className="text-sm text-gray-500">
          {timerComponent}
        </span>
      )}
    </div>
  );
}

// Simple countdown timer
export function CountdownTimer({ seconds, onComplete }: { seconds: number; onComplete?: () => void }) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <span className="font-mono">
      {minutes}:{remainingSeconds.toString().padStart(2, '0')}
    </span>
  );
}
