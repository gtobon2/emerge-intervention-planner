'use client';

import { useState, useEffect } from 'react';
import { Target, X, Save } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
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
  goalScore: string;
  benchmarkScore: string;
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

  // Fetch existing goals on mount
  useEffect(() => {
    if (isOpen && groupId) {
      fetchGoalsForGroup(groupId);
    }
  }, [isOpen, groupId, fetchGoalsForGroup]);

  // Build rows from students + existing goals
  useEffect(() => {
    if (!isOpen) return;

    const newRows: StudentGoalRow[] = students.map((student) => {
      const existingGoal = goals.find(
        (g) => g.student_id === student.id && g.group_id === groupId
      );
      return {
        studentId: student.id,
        studentName: student.name,
        goalScore: existingGoal ? String(existingGoal.goal_score) : '',
        benchmarkScore:
          existingGoal && existingGoal.benchmark_score !== null
            ? String(existingGoal.benchmark_score)
            : '',
      };
    });
    setRows(newRows);

    // Set measure type from first existing goal, or default to curriculum
    const firstGoal = goals.find((g) => g.group_id === groupId);
    if (firstGoal) {
      setMeasureType(firstGoal.measure_type);
    } else {
      setMeasureType(curriculum);
    }
  }, [isOpen, students, goals, groupId, curriculum]);

  const handleRowChange = (
    index: number,
    field: 'goalScore' | 'benchmarkScore',
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
    try {
      const goalsToSave = rows
        .filter((row) => row.goalScore !== '')
        .map((row) => ({
          student_id: row.studentId,
          group_id: groupId,
          goal_score: Number(row.goalScore),
          benchmark_score: row.benchmarkScore !== '' ? Number(row.benchmarkScore) : null,
          measure_type: measureType,
          set_date: new Date().toISOString().split('T')[0],
        }));

      if (goalsToSave.length > 0) {
        await setBulkGoals(goalsToSave);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save goals:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Student Goals" size="full">
      <div className="space-y-4">
        {/* Measure Type */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Measure Type
          </label>
          <input
            type="text"
            value={measureType}
            onChange={(e) => setMeasureType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement"
            placeholder="e.g., ORF, MAZE, NWF"
          />
        </div>

        {/* Apply to All Row */}
        <div className="p-3 bg-foundation rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-movement" />
            <span className="text-sm font-medium text-text-primary">
              Apply same goal to all students
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
              <div key={i} className="h-12 bg-foundation rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-foundation">
                  <th className="text-left px-4 py-2 text-sm font-medium text-text-primary">
                    Student Name
                  </th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-text-primary">
                    Goal Score
                  </th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-text-primary">
                    Benchmark
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.studentId} className="border-t border-border">
                    <td className="px-4 py-2 text-sm text-text-primary">{row.studentName}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={row.goalScore}
                        onChange={(e) => handleRowChange(index, 'goalScore', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement"
                        placeholder="--"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={row.benchmarkScore}
                        onChange={(e) =>
                          handleRowChange(index, 'benchmarkScore', e.target.value)
                        }
                        className="w-full px-2 py-1 rounded border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-movement"
                        placeholder="--"
                      />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-text-muted">
                      No students in this group
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            Save Goals
          </Button>
        </div>
      </div>
    </Modal>
  );
}
