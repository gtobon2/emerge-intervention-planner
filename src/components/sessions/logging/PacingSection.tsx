'use client';

import { Gauge } from 'lucide-react';
import type { Pacing } from '@/lib/supabase/types';

interface PacingSectionProps {
  value: Pacing | null;
  onChange: (value: Pacing) => void;
  disabled?: boolean;
}

const PACING_OPTIONS: { value: Pacing; label: string; color: string; selectedColor: string; icon: string }[] = [
  {
    value: 'too_slow',
    label: 'Too Slow',
    color: 'border-border hover:border-red-400/50',
    selectedColor: 'border-red-500 bg-red-500/10 ring-1 ring-red-500/30',
    icon: '<<',
  },
  {
    value: 'just_right',
    label: 'Just Right',
    color: 'border-border hover:border-green-400/50',
    selectedColor: 'border-green-500 bg-green-500/10 ring-1 ring-green-500/30',
    icon: '=',
  },
  {
    value: 'too_fast',
    label: 'Too Fast',
    color: 'border-border hover:border-amber-400/50',
    selectedColor: 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30',
    icon: '>>',
  },
];

/**
 * PacingSection - Three radio buttons for pacing feedback: Too Slow, Just Right, Too Fast.
 * Uses colored indicators (red / green / amber).
 */
export function PacingSection({ value, onChange, disabled = false }: PacingSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Gauge className="w-4 h-4 text-text-muted" />
        <span className="text-sm font-medium text-text-primary">Session Pacing</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {PACING_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={`
                flex flex-col items-center justify-center gap-1.5
                min-h-[44px] p-3 rounded-xl border-2 transition-all duration-200
                ${isSelected ? option.selectedColor : option.color}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'}
              `}
            >
              <span className={`
                text-lg font-bold
                ${isSelected && option.value === 'too_slow' ? 'text-red-400' : ''}
                ${isSelected && option.value === 'just_right' ? 'text-green-400' : ''}
                ${isSelected && option.value === 'too_fast' ? 'text-amber-400' : ''}
                ${!isSelected ? 'text-text-muted' : ''}
              `}>
                {option.icon}
              </span>
              <span className={`text-sm font-medium ${isSelected ? 'text-text-primary' : 'text-text-muted'}`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
