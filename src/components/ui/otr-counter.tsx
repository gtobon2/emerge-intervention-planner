'use client';

import { Plus, Minus, RotateCcw } from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { Button } from './button';

export interface OTRCounterProps {
  target?: number;
  className?: string;
}

export function OTRCounter({ target, className = '' }: OTRCounterProps) {
  const { otrCount, incrementOTR, decrementOTR, resetOTR } = useUIStore();

  const progress = target ? Math.min((otrCount / target) * 100, 100) : 0;
  const isAtTarget = target && otrCount >= target;

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Main counter display */}
      <div className="flex items-center gap-3 sm:gap-6">
        <Button
          variant="ghost"
          size="lg"
          onClick={decrementOTR}
          className="p-4 rounded-full min-h-[56px] min-w-[56px]"
          disabled={otrCount === 0}
          aria-label="Decrease count"
        >
          <Minus className="w-6 h-6 sm:w-7 sm:h-7" />
        </Button>

        <button
          onClick={incrementOTR}
          className={`
            w-32 h-32 sm:w-40 sm:h-40 rounded-full
            flex items-center justify-center
            text-5xl sm:text-6xl font-bold
            transition-all active:scale-95
            shadow-lg
            ${isAtTarget
              ? 'bg-breakthrough text-foundation'
              : 'bg-movement text-white hover:bg-movement/90'
            }
          `}
          aria-label="Increment OTR count"
        >
          {otrCount}
        </button>

        <Button
          variant="ghost"
          size="lg"
          onClick={incrementOTR}
          className="p-4 rounded-full min-h-[56px] min-w-[56px]"
          aria-label="Increase count"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
        </Button>
      </div>

      {/* Target progress */}
      {target && (
        <div className="w-full max-w-sm px-4">
          <div className="flex justify-between text-xs sm:text-sm text-text-muted mb-2">
            <span>OTR Count</span>
            <span className="font-semibold">{otrCount} / {target}</span>
          </div>
          <div className="h-3 bg-foundation rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isAtTarget ? 'bg-breakthrough' : 'bg-movement'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Reset button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={resetOTR}
        className="text-text-muted min-h-[44px]"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>

      {/* Tap instructions */}
      <p className="text-xs sm:text-sm text-text-muted text-center px-4 max-w-md">
        Tap the large circle to count each Opportunity to Respond
      </p>
    </div>
  );
}
