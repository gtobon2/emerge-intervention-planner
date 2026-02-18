'use client';

import { useState, useMemo, FormEvent } from 'react';
import { Lock, Target, TrendingUp, TrendingDown, Minus, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export interface IndividualPMEntryProps {
  studentId: string;
  studentName: string;
  groupId: string;
  measureType?: string; // Pre-filled from active goal
  onSave: (data: { score: number; date: string; measure_type: string; notes?: string }) => Promise<void>;
  onCancel: () => void;
  recentScores?: number[]; // For showing trend context
  goalLine?: number; // For showing goal reference
  /** Pre-fill values for editing an existing data point */
  initialValues?: {
    score: number;
    date: string;
    measure_type: string;
    notes?: string;
  };
}

const MEASURE_TYPE_OPTIONS = [
  { value: '', label: 'Select measure type' },
  { value: 'CBM-R (WCPM)', label: 'CBM-R - Words Correct Per Minute' },
  { value: 'CBM-R (Accuracy)', label: 'CBM-R - Accuracy Percentage' },
  { value: 'CBM-M (Digits)', label: 'CBM-M - Digits Correct' },
  { value: 'CBM-M (Problems)', label: 'CBM-M - Problems Correct' },
  { value: 'Maze', label: 'Maze - Words Correct' },
  { value: 'DIBELS', label: 'DIBELS' },
  { value: 'Exit Ticket', label: 'Exit Ticket Score' },
  { value: 'Custom', label: 'Custom Measure' },
];

/** Mini sparkline showing the last N scores as inline dots */
function MiniTrend({ scores, goalLine }: { scores: number[]; goalLine?: number }) {
  if (scores.length === 0) return null;

  const maxScore = Math.max(...scores, goalLine ?? 0);
  const minScore = Math.min(...scores, goalLine ?? Infinity);
  const range = maxScore - minScore || 1;

  // SVG sparkline dimensions
  const width = 120;
  const height = 32;
  const padding = 4;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  const points = scores.map((score, i) => {
    const x = padding + (scores.length === 1 ? plotW / 2 : (i / (scores.length - 1)) * plotW);
    const y = padding + plotH - ((score - minScore) / range) * plotH;
    return { x, y, score };
  });

  const goalY = goalLine != null
    ? padding + plotH - ((goalLine - minScore) / range) * plotH
    : null;

  // Determine trend direction
  let trendIcon = <Minus className="w-3.5 h-3.5 text-text-muted" />;
  if (scores.length >= 2) {
    const last = scores[scores.length - 1];
    const prev = scores[scores.length - 2];
    if (last > prev) {
      trendIcon = <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    } else if (last < prev) {
      trendIcon = <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
    }
  }

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="shrink-0" role="img" aria-label="Score trend">
        {/* Goal line */}
        {goalY != null && (
          <line
            x1={padding}
            y1={goalY}
            x2={width - padding}
            y2={goalY}
            stroke="#E9FF7A"
            strokeWidth={1}
            strokeDasharray="3,3"
            opacity={0.6}
          />
        )}
        {/* Connecting line */}
        {points.length > 1 && (
          <polyline
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#FF006E"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={i === points.length - 1 ? '#FF006E' : '#FF006E80'}
            stroke={i === points.length - 1 ? '#fff' : 'none'}
            strokeWidth={1}
          />
        ))}
      </svg>
      {trendIcon}
    </div>
  );
}

export function IndividualPMEntry({
  studentId,
  studentName,
  groupId,
  measureType,
  onSave,
  onCancel,
  recentScores = [],
  goalLine,
  initialValues,
}: IndividualPMEntryProps) {
  const isEditing = !!initialValues;

  const [date, setDate] = useState(initialValues?.date || new Date().toISOString().split('T')[0]);
  const [selectedMeasureType, setSelectedMeasureType] = useState(
    initialValues?.measure_type || measureType || ''
  );
  const [score, setScore] = useState(initialValues?.score?.toString() || '');
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [showNotes, setShowNotes] = useState(!!initialValues?.notes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMeasureLocked = !!measureType && !isEditing;

  const scoreNum = useMemo(() => {
    const n = parseFloat(score);
    return isNaN(n) ? null : n;
  }, [score]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMeasureType.trim()) {
      setError('Measure type is required');
      return;
    }

    if (scoreNum === null) {
      setError('A valid score is required');
      return;
    }

    if (!date) {
      setError('Date is required');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        score: scoreNum,
        date,
        measure_type: selectedMeasureType.trim(),
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to save data point');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Student Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{studentName}</h3>
          <p className="text-xs text-text-muted">
            {isEditing ? 'Edit data point' : 'Individual PM entry'}
          </p>
        </div>
        {/* Mini trend + goal reference */}
        <div className="flex items-center gap-3">
          {recentScores.length > 0 && (
            <MiniTrend scores={recentScores} goalLine={goalLine} />
          )}
          {goalLine != null && (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Target className="w-3.5 h-3.5 text-breakthrough" />
              <span className="text-breakthrough font-medium">{goalLine}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Date + Measure Type row */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <div className="w-full">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Measure Type *
            {isMeasureLocked && (
              <span className="inline-flex items-center gap-1 ml-2 text-xs text-text-muted font-normal">
                <Lock className="w-3 h-3" /> Locked by goal
              </span>
            )}
          </label>
          <Select
            options={MEASURE_TYPE_OPTIONS}
            value={selectedMeasureType}
            onChange={(e) => setSelectedMeasureType(e.target.value)}
            required
            disabled={isMeasureLocked}
          />
        </div>
      </div>

      {/* Score input */}
      <div>
        <Input
          label="Score *"
          type="number"
          step="0.01"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Enter score"
          required
          className="text-lg font-semibold"
        />
        {scoreNum !== null && goalLine != null && (
          <p className={`mt-1 text-xs ${scoreNum >= goalLine ? 'text-emerald-500' : 'text-red-400'}`}>
            {scoreNum >= goalLine
              ? `At or above goal (${goalLine})`
              : `${goalLine - scoreNum} points below goal (${goalLine})`}
          </p>
        )}
      </div>

      {/* Notes toggle + field */}
      {!showNotes ? (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <StickyNote className="w-3.5 h-3.5" />
          Add notes
        </button>
      ) : (
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional observation notes..."
          className="min-h-[60px]"
        />
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2 border-t border-text-muted/10">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={scoreNum === null || !selectedMeasureType}
        >
          {isEditing ? 'Update Score' : 'Save Score'}
        </Button>
      </div>
    </form>
  );
}
