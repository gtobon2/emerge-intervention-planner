'use client';

import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { MasteryLevel } from '@/lib/supabase/types';

interface MasterySectionProps {
  mastery: MasteryLevel | null;
  onMasteryChange: (value: MasteryLevel) => void;
  exitTicketCorrect: number | null;
  exitTicketTotal: number | null;
  onExitTicketChange: (correct: number | null, total: number | null) => void;
  disabled?: boolean;
}

const MASTERY_OPTIONS: {
  value: MasteryLevel;
  label: string;
  color: string;
  selectedColor: string;
}[] = [
  {
    value: 'yes',
    label: 'Yes',
    color: 'border-border hover:border-green-400/50',
    selectedColor: 'border-green-500 bg-green-500/10 ring-1 ring-green-500/30',
  },
  {
    value: 'partial',
    label: 'Partial',
    color: 'border-border hover:border-amber-400/50',
    selectedColor: 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30',
  },
  {
    value: 'no',
    label: 'No',
    color: 'border-border hover:border-red-400/50',
    selectedColor: 'border-red-500 bg-red-500/10 ring-1 ring-red-500/30',
  },
];

/**
 * MasterySection - Mastery radio (Yes / No / Partial) and exit ticket score inputs.
 * Shows percentage calculated from correct/total.
 */
export function MasterySection({
  mastery,
  onMasteryChange,
  exitTicketCorrect,
  exitTicketTotal,
  onExitTicketChange,
  disabled = false,
}: MasterySectionProps) {
  const [correctStr, setCorrectStr] = useState(exitTicketCorrect?.toString() ?? '');
  const [totalStr, setTotalStr] = useState(exitTicketTotal?.toString() ?? '');

  // Sync external changes
  useEffect(() => {
    setCorrectStr(exitTicketCorrect?.toString() ?? '');
  }, [exitTicketCorrect]);

  useEffect(() => {
    setTotalStr(exitTicketTotal?.toString() ?? '');
  }, [exitTicketTotal]);

  const handleCorrectChange = (val: string) => {
    setCorrectStr(val);
    const num = val === '' ? null : parseInt(val, 10);
    const parsedTotal = totalStr === '' ? null : parseInt(totalStr, 10);
    if (num !== null && isNaN(num)) return;
    onExitTicketChange(num, parsedTotal);
  };

  const handleTotalChange = (val: string) => {
    setTotalStr(val);
    const num = val === '' ? null : parseInt(val, 10);
    const parsedCorrect = correctStr === '' ? null : parseInt(correctStr, 10);
    if (num !== null && isNaN(num)) return;
    onExitTicketChange(parsedCorrect, num);
  };

  const percentage =
    exitTicketCorrect !== null && exitTicketTotal !== null && exitTicketTotal > 0
      ? Math.round((exitTicketCorrect / exitTicketTotal) * 100)
      : null;

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return 'text-green-400';
    if (pct >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Mastery Demonstrated */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">Mastery Demonstrated</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MASTERY_OPTIONS.map((option) => {
            const isSelected = mastery === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onMasteryChange(option.value)}
                disabled={disabled}
                className={`
                  flex items-center justify-center
                  min-h-[44px] px-4 py-2.5 rounded-xl border-2 transition-all duration-200
                  text-sm font-semibold
                  ${isSelected ? option.selectedColor : option.color}
                  ${isSelected && option.value === 'yes' ? 'text-green-400' : ''}
                  ${isSelected && option.value === 'partial' ? 'text-amber-400' : ''}
                  ${isSelected && option.value === 'no' ? 'text-red-400' : ''}
                  ${!isSelected ? 'text-text-muted' : ''}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'}
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exit Ticket */}
      <div className="space-y-3">
        <span className="text-sm font-medium text-text-primary">Exit Ticket Score</span>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              type="number"
              min={0}
              placeholder="Correct"
              value={correctStr}
              onChange={(e) => handleCorrectChange(e.target.value)}
              disabled={disabled}
              className="text-center min-h-[44px]"
            />
          </div>
          <span className="text-text-muted font-medium text-lg">/</span>
          <div className="flex-1">
            <Input
              type="number"
              min={1}
              placeholder="Total"
              value={totalStr}
              onChange={(e) => handleTotalChange(e.target.value)}
              disabled={disabled}
              className="text-center min-h-[44px]"
            />
          </div>
          {percentage !== null && (
            <div className={`min-w-[60px] text-center font-bold text-lg ${getPercentageColor(percentage)}`}>
              {percentage}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
