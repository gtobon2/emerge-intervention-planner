'use client';

import { useEffect } from 'react';
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
  const { sessionTimer, startTimer, stopTimer, resetTimer, updateElapsedTime } = useUIStore();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (sessionTimer.isRunning) {
      interval = setInterval(() => {
        updateElapsedTime();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionTimer.isRunning, updateElapsedTime]);

  // Check if target time reached
  useEffect(() => {
    if (targetMinutes && sessionTimer.elapsedTime >= targetMinutes * 60 * 1000) {
      onComplete?.();
    }
  }, [sessionTimer.elapsedTime, targetMinutes, onComplete]);

  const handleStartStop = () => {
    if (sessionTimer.isRunning) {
      stopTimer();
    } else {
      startTimer(component || 'General');
    }
  };

  const elapsedMs = sessionTimer.elapsedTime;
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
        <div className="flex-1 h-2 bg-foundation rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isOvertime ? 'bg-tier3' : 'bg-movement'
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
          {sessionTimer.isRunning ? (
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
      {sessionTimer.component && sessionTimer.isRunning && (
        <span className="text-sm text-text-muted">
          {sessionTimer.component}
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
