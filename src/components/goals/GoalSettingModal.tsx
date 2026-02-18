'use client';

import { useState, useEffect } from 'react';
import { Target, Save } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useGoalsStore } from '@/stores/goals';
import type { StudentGoalInsert } from '@/lib/supabase/types';
import { validateGoalSetting } from '@/lib/supabase/validation';

export interface GoalSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  students: Array<{ id: string; name: string }>;
  curriculum: string;
}

interface StudentGoalRow {
  studentId: string;
  studentName: string;
  smartGoalText: string;
  goalScore: string;
  goalTargetDate: string;
  benchmarkScore: string;
  benchmarkDate: string;
}

export function GoalSettingModal({
  isOpen,
  onClose,
  groupId,
  students,
  curriculum,
}: GoalSettingModalProps) {
  const { goals, fetchGoalsForGroup, setBulkGoals, isLoading } = useGoalsStore();
  const [measureType, setMeasureType] = useState(curriculum);
  const [rows, setRows] = useState<StudentGoalRow[]>([]);
  const [applyAllGoal, setApplyAllGoal] = useState('');
  const [applyAllBenchmark, setApplyAllBenchmark] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGoalsForGroup(groupId);
    }
  }, [isOpen, groupId, fetchGoalsForGroup]);

  useEffect(() => {
    if (!isOpen) return;

    const newRows: StudentGoalRow[] = students.map((student) => {
      const existing = goals.find(
        (g) => g.student_id === student.id && g.group_id === groupId
      );
      return {
        studentId: student.id,
        studentName: student.name,
        smartGoalText: existing?.smart_goal_text || '',
        goalScore: existing ? String(existing.goal_score) : '',
        goalTargetDate: existing?.goal_target_date || '',
        benchmarkScore:
          existing && existing.benchmark_score !== null
            ? String(existing.benchmark_score)
            : '',
        benchmarkDate: existing?.benchmark_date || '',
      };
    });
    setRows(newRows);

    const firstGoal = goals.find((g) => g.group_id === groupId);
    if (firstGoal) {
      setMeasureType(firstGoal.measure_type);
    } else {
      setMeasureType(curriculum);
    }
  }, [isOpen, students, goals, groupId, curriculum]);

  const handleRowChange = (
    index: number,
    field: keyof Omit<StudentGoalRow, 'studentId' | 'studentName'>,
    value: string
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Clear field-level error for this row/field on change
    const errorKey = `${index}_${field}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[errorKey];
        return updated;
      });
    }
  };

  const handleApplyToAll = () => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        goalScore: applyAllGoal || row.goalScore,
        benchmarkScore: applyAllBenchmark || row.benchmarkScore,
      }))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setFieldErrors({});

    // Validate measure type at the top level
    const newFieldErrors: Record<string, string> = {};
    if (!measureType.trim()) {
      newFieldErrors.measure_type = 'Measure type is required';
    }

    // Validate each row that has a goal score
    const rowsWithGoals = rows.filter((row) => row.goalScore !== '');

    rowsWithGoals.forEach((row) => {
      const index = rows.indexOf(row);
      const goalScore = Number(row.goalScore);
      const benchmarkScore = row.benchmarkScore !== '' ? Number(row.benchmarkScore) : undefined;

      const validation = validateGoalSetting({
        measure_type: measureType,
        goal_score: goalScore,
        benchmark_score: benchmarkScore,
        goal_target_date: row.goalTargetDate || undefined,
        benchmark_date: row.benchmarkDate || undefined,
      });

      if (!validation.isValid) {
        validation.errors.forEach((err) => {
          if (err.includes('Goal score must be positive') || err.includes('Goal score seems too high')) {
            newFieldErrors[`${index}_goalScore`] = err;
          } else if (err.includes('higher than benchmark')) {
            newFieldErrors[`${index}_benchmarkScore`] = err;
          } else if (err.includes('goal target date')) {
            newFieldErrors[`${index}_goalTargetDate`] = err;
          }
        });
      }
    });

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setIsSaving(false);
      return;
    }

    try {
      const goalsToSave: StudentGoalInsert[] = rowsWithGoals.map((row) => ({
          student_id: row.studentId,
          group_id: groupId,
          goal_score: Number(row.goalScore),
          smart_goal_text: row.smartGoalText,
          goal_target_date: row.goalTargetDate || null,
          benchmark_score: row.benchmarkScore !== '' ? Number(row.benchmarkScore) : null,
          benchmark_date: row.benchmarkDate || null,
          measure_type: measureType,
          set_date: new Date().toISOString().split('T')[0],
          created_by: null,
        }));

      if (goalsToSave.length > 0) {
        await setBulkGoals(goalsToSave);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save goals');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Goals & Benchmarks" size="full">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Measure Type */}
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Measure Type
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
          />
          {fieldErrors.measure_type && <p className="mt-1 text-sm text-red-400">{fieldErrors.measure_type}</p>}
        </div>

        {/* Apply to All */}
        <div className="p-3 bg-foundation rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-movement" />
            <span className="text-sm font-medium text-text-primary">
              Apply same values to all students
            </span>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1">Goal Score</label>
              <input
                type="number"
                value={applyAllGoal}
                onChange={(e) => setApplyAllGoal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement"
                placeholder="Goal"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1">Benchmark</label>
              <input
                type="number"
                value={applyAllBenchmark}
                onChange={(e) => setApplyAllBenchmark(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement"
                placeholder="Benchmark"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="min-h-[38px]"
              onClick={handleApplyToAll}
            >
              Apply
            </Button>
          </div>
        </div>

        {/* Students Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-foundation rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="space-y-4 sm:hidden">
              {rows.map((row, index) => (
                <div key={row.studentId} className="border border-border rounded-lg p-3 bg-surface/30 space-y-3">
                  <div className="text-sm font-semibold text-text-primary">{row.studentName}</div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">SMART Goal</label>
                    <textarea
                      value={row.smartGoalText}
                      onChange={(e) => handleRowChange(index, 'smartGoalText', e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement resize-none min-h-[44px]"
                      rows={2}
                      placeholder="By [date], [student] will [skill] at [level]..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Goal Score</label>
                      <input
                        type="number"
                        value={row.goalScore}
                        onChange={(e) => handleRowChange(index, 'goalScore', e.target.value)}
                        className={`w-full px-2 py-1.5 rounded border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement min-h-[44px] ${fieldErrors[`${index}_goalScore`] ? 'border-red-500' : 'border-border'}`}
                        placeholder="--"
                      />
                      {fieldErrors[`${index}_goalScore`] && <p className="mt-1 text-sm text-red-400">{fieldErrors[`${index}_goalScore`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Target Date</label>
                      <input
                        type="date"
                        value={row.goalTargetDate}
                        onChange={(e) => handleRowChange(index, 'goalTargetDate', e.target.value)}
                        className={`w-full px-2 py-1.5 rounded border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement min-h-[44px] ${fieldErrors[`${index}_goalTargetDate`] ? 'border-red-500' : 'border-border'}`}
                      />
                      {fieldErrors[`${index}_goalTargetDate`] && <p className="mt-1 text-sm text-red-400">{fieldErrors[`${index}_goalTargetDate`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Benchmark</label>
                      <input
                        type="number"
                        value={row.benchmarkScore}
                        onChange={(e) => handleRowChange(index, 'benchmarkScore', e.target.value)}
                        className={`w-full px-2 py-1.5 rounded border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement min-h-[44px] ${fieldErrors[`${index}_benchmarkScore`] ? 'border-red-500' : 'border-border'}`}
                        placeholder="--"
                      />
                      {fieldErrors[`${index}_benchmarkScore`] && <p className="mt-1 text-sm text-red-400">{fieldErrors[`${index}_benchmarkScore`]}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Benchmark Date</label>
                      <input
                        type="date"
                        value={row.benchmarkDate}
                        onChange={(e) => handleRowChange(index, 'benchmarkDate', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-text-muted">
                  No students in this group
                </div>
              )}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden sm:block border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-foundation">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-text-muted uppercase">Student</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-text-muted uppercase">SMART Goal</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-text-muted uppercase w-24">Goal Score</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-text-muted uppercase w-32">Target Date</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-text-muted uppercase w-24">Benchmark</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-text-muted uppercase w-32">Benchmark Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.studentId} className="border-t border-border">
                        <td className="px-3 py-2 text-sm font-medium text-text-primary whitespace-nowrap">
                          {row.studentName}
                        </td>
                        <td className="px-3 py-2">
                          <textarea
                            value={row.smartGoalText}
                            onChange={(e) => handleRowChange(index, 'smartGoalText', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement resize-none"
                            rows={2}
                            placeholder="By [date], [student] will [skill] at [level]..."
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={row.goalScore}
                            onChange={(e) => handleRowChange(index, 'goalScore', e.target.value)}
                            className={`w-full px-2 py-1 rounded border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement ${fieldErrors[`${index}_goalScore`] ? 'border-red-500' : 'border-border'}`}
                            placeholder="--"
                          />
                          {fieldErrors[`${index}_goalScore`] && <p className="mt-1 text-xs text-red-400">{fieldErrors[`${index}_goalScore`]}</p>}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={row.goalTargetDate}
                            onChange={(e) => handleRowChange(index, 'goalTargetDate', e.target.value)}
                            className={`w-full px-2 py-1 rounded border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement ${fieldErrors[`${index}_goalTargetDate`] ? 'border-red-500' : 'border-border'}`}
                          />
                          {fieldErrors[`${index}_goalTargetDate`] && <p className="mt-1 text-xs text-red-400">{fieldErrors[`${index}_goalTargetDate`]}</p>}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={row.benchmarkScore}
                            onChange={(e) => handleRowChange(index, 'benchmarkScore', e.target.value)}
                            className={`w-full px-2 py-1 rounded border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement ${fieldErrors[`${index}_benchmarkScore`] ? 'border-red-500' : 'border-border'}`}
                            placeholder="--"
                          />
                          {fieldErrors[`${index}_benchmarkScore`] && <p className="mt-1 text-xs text-red-400">{fieldErrors[`${index}_benchmarkScore`]}</p>}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={row.benchmarkDate}
                            onChange={(e) => handleRowChange(index, 'benchmarkDate', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement"
                          />
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-text-muted">
                          No students in this group
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            Save Goals & Benchmarks
          </Button>
        </div>
      </div>
    </Modal>
  );
}
