'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Users, Lock } from 'lucide-react';
import type { Student, ProgressMonitoringInsert } from '@/lib/supabase/types';
import { validatePMDataPoint } from '@/lib/supabase/validation';

export interface AddDataPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dataPoint: ProgressMonitoringInsert) => Promise<void>;
  groupId: string;
  students?: Student[];
  /** Measure type locked by active goals (auto-filled + disabled) */
  lockedMeasureType?: string | null;
}

interface StudentScoreRow {
  studentId: string;
  studentName: string;
  score: string;
}

export function AddDataPointModal({
  isOpen,
  onClose,
  onSubmit,
  groupId,
  students = [],
  lockedMeasureType,
}: AddDataPointModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  // Shared fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [measureType, setMeasureType] = useState('');

  // Per-student score rows
  const [rows, setRows] = useState<StudentScoreRow[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-fill measure type from locked goal when modal opens
  useEffect(() => {
    if (isOpen && lockedMeasureType) {
      setMeasureType(lockedMeasureType);
    }
  }, [isOpen, lockedMeasureType]);

  // Initialize student rows when modal opens
  useEffect(() => {
    if (!isOpen || students.length === 0) return;
    setRows(students.map((s) => ({ studentId: s.id, studentName: s.name, score: '' })));
    setSavedCount(0);
    setError(null);
  }, [isOpen, students]);

  const updateRow = (index: number, field: keyof StudentScoreRow, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    // Clear row error on change
    if (rowErrors[index]) {
      setRowErrors((prev) => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setRowErrors({});
    setFieldErrors({});

    const newFieldErrors: Record<string, string> = {};

    // Validate date and measure type at the top level
    if (!date) {
      newFieldErrors.date = 'Date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      newFieldErrors.date = 'Invalid date format';
    }

    if (!measureType.trim()) {
      newFieldErrors.measure_type = 'Measure type is required';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    // Collect rows with scores entered
    const rowsWithScores = rows.filter((r) => r.score.trim() !== '');
    if (rowsWithScores.length === 0) {
      setError('Enter at least one score');
      return;
    }

    // Validate each row using validatePMDataPoint
    const newRowErrors: Record<number, string> = {};
    let hasRowErrors = false;

    for (const row of rowsWithScores) {
      const index = rows.indexOf(row);
      const scoreNum = parseFloat(row.score);
      const validation = validatePMDataPoint({
        score: isNaN(scoreNum) ? undefined : scoreNum,
        date,
        measure_type: measureType,
      });

      if (isNaN(scoreNum)) {
        newRowErrors[index] = `Invalid score`;
        hasRowErrors = true;
      } else if (!validation.isValid) {
        // Filter to score-specific errors only (date/measure validated above)
        const scoreErrors = validation.errors.filter(
          (err) => err.includes('Score') || err.includes('score')
        );
        if (scoreErrors.length > 0) {
          newRowErrors[index] = scoreErrors[0];
          hasRowErrors = true;
        }
      }
    }

    if (hasRowErrors) {
      setRowErrors(newRowErrors);
      return;
    }

    setIsLoading(true);
    let saved = 0;

    try {
      for (const row of rowsWithScores) {
        const dataPoint: ProgressMonitoringInsert = {
          group_id: groupId,
          student_id: row.studentId,
          date,
          measure_type: measureType.trim(),
          score: parseFloat(row.score),
          benchmark: null,
          goal: null,
          notes: null,
        };
        await onSubmit(dataPoint);
        saved++;
      }

      setSavedCount(saved);

      // Reset scores
      setRows((prev) => prev.map((row) => ({ ...row, score: '' })));

      // Close after brief delay so user sees success
      setTimeout(() => {
        onClose();
        setSavedCount(0);
      }, 800);
    } catch (err) {
      setError((err as Error).message || 'Failed to save data points');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      setSavedCount(0);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Progress Monitor — Batch Entry" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}
        {savedCount > 0 && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 dark:text-emerald-400">
            Saved {savedCount} data point{savedCount !== 1 ? 's' : ''} successfully!
          </div>
        )}

        {/* Shared fields: Date + Measure Type */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (fieldErrors.date) {
                setFieldErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.date;
                  return updated;
                });
              }
            }}
            error={fieldErrors.date}
            required
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Measure Type *
              {lockedMeasureType && (
                <span className="inline-flex items-center gap-1 ml-2 text-xs text-text-muted font-normal">
                  <Lock className="w-3 h-3" /> Locked by goal
                </span>
              )}
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
              onChange={(e) => {
                setMeasureType(e.target.value);
                if (fieldErrors.measure_type) {
                  setFieldErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.measure_type;
                    return updated;
                  });
                }
              }}
              required
              disabled={!!lockedMeasureType}
            />
            {fieldErrors.measure_type && <p className="mt-1 text-sm text-red-400">{fieldErrors.measure_type}</p>}
          </div>
        </div>

        {/* Per-student score table */}
        {rows.length > 0 ? (
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px] gap-2 px-4 py-2 bg-surface text-xs font-semibold text-text-muted uppercase tracking-wider">
              <div>Student</div>
              <div>Score *</div>
            </div>
            {/* Student rows */}
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {rows.map((row, index) => (
                <div
                  key={row.studentId}
                  className="grid grid-cols-[1fr_120px] gap-2 px-4 py-2 items-center hover:bg-surface/50"
                >
                  <div className="text-sm font-medium text-text-primary truncate">
                    {row.studentName}
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      value={row.score}
                      onChange={(e) => updateRow(index, 'score', e.target.value)}
                      placeholder="—"
                      className={`w-full px-2 py-1.5 text-sm bg-background border rounded-md text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 ${rowErrors[index] ? 'border-red-500' : 'border-border'}`}
                    />
                    {rowErrors[index] && <p className="mt-1 text-xs text-red-400">{rowErrors[index]}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No students found in this group.</p>
            <p className="text-xs mt-1">Add students to the group first.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-between items-center pt-4 border-t border-text-muted/10">
          <p className="text-xs text-text-muted">
            {rows.filter((r) => r.score.trim()).length} of {rows.length} scores entered
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={rows.filter((r) => r.score.trim()).length === 0}
            >
              Save All Scores
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
