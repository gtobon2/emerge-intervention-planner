'use client';

import { useState, useEffect } from 'react';
import { Target, Save } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useGoalsStore } from '@/stores/goals';

export interface GoalSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  students: Array<{ id: number; name: string }>;
  curriculum: string;
}

interface StudentGoalRow {
  studentId: number;
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
    try {
      const goalsToSave = rows
        .filter((row) => row.goalScore !== '')
        .map((row) => ({
          student_id: row.studentId,
          group_id: groupId,
          goal_score: Number(row.goalScore),
          smart_goal_text: row.smartGoalText,
          goal_target_date: row.goalTargetDate,
          benchmark_score: row.benchmarkScore !== '' ? Number(row.benchmarkScore) : null,
          benchmark_date: row.benchmarkDate || null,
          measure_type: measureType,
          set_date: new Date().toISOString().split('T')[0],
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
            onChange={(e) => setMeasureType(e.target.value)}
          />
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
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
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
                          className="w-full px-2 py-1 rounded border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement"
                          placeholder="--"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={row.goalTargetDate}
                          onChange={(e) => handleRowChange(index, 'goalTargetDate', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={row.benchmarkScore}
                          onChange={(e) => handleRowChange(index, 'benchmarkScore', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement"
                          placeholder="--"
                        />
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
