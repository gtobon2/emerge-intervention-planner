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
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Main counter display */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="lg"
          onClick={decrementOTR}
          className="p-3 rounded-full"
          disabled={otrCount === 0}
        >
          <Minus className="w-6 h-6" />
        </Button>

        <button
          onClick={incrementOTR}
          className={`
            w-24 h-24 rounded-full
            flex items-center justify-center
            text-4xl font-bold
            transition-all active:scale-95
            ${isAtTarget
              ? 'bg-breakthrough text-foundation'
              : 'bg-movement text-white hover:bg-movement/90'
            }
          `}
        >
          {otrCount}
        </button>

        <Button
          variant="ghost"
          size="lg"
          onClick={incrementOTR}
          className="p-3 rounded-full"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Target progress */}
      {target && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-sm text-text-muted mb-1">
            <span>OTR Count</span>
            <span>{otrCount} / {target}</span>
          </div>
          <div className="h-2 bg-foundation rounded-full overflow-hidden">
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
        className="text-text-muted"
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        Reset
      </Button>

      {/* Tap instructions */}
      <p className="text-sm text-text-muted text-center">
        Tap the circle to count each Opportunity to Respond
      </p>
    </div>
  );
}
