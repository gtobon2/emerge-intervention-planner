'use client';

import { useState, FormEvent } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Student, ProgressMonitoringInsert } from '@/lib/supabase/types';

export interface AddDataPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dataPoint: ProgressMonitoringInsert) => Promise<void>;
  groupId: string;
  students?: Student[];
  defaultBenchmark?: number;
  defaultGoal?: number;
}

export function AddDataPointModal({
  isOpen,
  onClose,
  onSubmit,
  groupId,
  students = [],
  defaultBenchmark,
  defaultGoal,
}: AddDataPointModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [studentId, setStudentId] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [measureType, setMeasureType] = useState('');
  const [score, setScore] = useState('');
  const [benchmark, setBenchmark] = useState(defaultBenchmark?.toString() || '');
  const [goal, setGoal] = useState(defaultGoal?.toString() || '');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!measureType.trim()) {
      setError('Measure type is required');
      return;
    }

    if (!score.trim()) {
      setError('Score is required');
      return;
    }

    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum)) {
      setError('Score must be a valid number');
      return;
    }

    const benchmarkNum = benchmark ? parseFloat(benchmark) : null;
    if (benchmark && isNaN(benchmarkNum as number)) {
      setError('Benchmark must be a valid number');
      return;
    }

    const goalNum = goal ? parseFloat(goal) : null;
    if (goal && isNaN(goalNum as number)) {
      setError('Goal must be a valid number');
      return;
    }

    setIsLoading(true);

    try {
      const dataPoint: ProgressMonitoringInsert = {
        group_id: groupId,
        student_id: studentId || null,
        date,
        measure_type: measureType.trim(),
        score: scoreNum,
        benchmark: benchmarkNum,
        goal: goalNum,
        notes: notes.trim() || null,
      };

      await onSubmit(dataPoint);

      // Reset form
      setStudentId('');
      setDate(new Date().toISOString().split('T')[0]);
      setMeasureType('');
      setScore('');
      setBenchmark(defaultBenchmark?.toString() || '');
      setGoal(defaultGoal?.toString() || '');
      setNotes('');

      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to add data point');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Progress Data Point" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Date */}
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          {/* Student (optional for group-level) */}
          {students.length > 0 && (
            <div className="w-full">
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Student (Optional)
              </label>
              <Select
                options={[
                  { value: '', label: 'Group-level data' },
                  ...students.map((s) => ({ value: s.id, label: s.name })),
                ]}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
              <p className="mt-1 text-sm text-text-muted">
                Leave blank for group-level progress monitoring
              </p>
            </div>
          )}
        </div>

        {/* Measure Type */}
        <div className="w-full">
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Measure Type *
          </label>
          <Select
            options={[
              { value: '', label: 'Select measure type' },
              { value: 'CBM-R (WCPM)', label: 'CBM-R - Words Correct Per Minute' },
              { value: 'CBM-R (Accuracy)', label: 'CBM-R - Accuracy Percentage' },
              { value: 'CBM-M (Digits)', label: 'CBM-M - Digits Correct' },
              { value: 'CBM-M (Problems)', label: 'CBM-M - Problems Correct' },
              { value: 'Maze', label: 'Maze - Words Correct' },
              { value: 'DIBELS', label: 'DIBELS' },
              { value: 'Exit Ticket', label: 'Exit Ticket Score' },
              { value: 'Custom', label: 'Custom Measure' },
            ]}
            value={measureType}
            onChange={(e) => setMeasureType(e.target.value)}
            required
          />
        </div>

        {/* Score, Benchmark, Goal */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Score *"
            type="number"
            step="0.01"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="e.g., 45"
            required
          />

          <Input
            label="Benchmark"
            type="number"
            step="0.01"
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value)}
            placeholder="e.g., 50"
            helperText="Grade-level expectation"
          />

          <Input
            label="Goal"
            type="number"
            step="0.01"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., 60"
            helperText="Target by end date"
          />
        </div>

        {/* Notes */}
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this data point (e.g., student was tired, new passage difficulty)"
          rows={3}
        />

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-text-muted/10">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Add Data Point
          </Button>
        </div>
      </form>
    </Modal>
  );
}
