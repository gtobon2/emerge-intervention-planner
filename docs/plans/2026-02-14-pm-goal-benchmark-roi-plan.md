# PM Goal, Benchmark & ROI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure PM so goals/benchmarks are set once per student, then display benchmark points, goal lines, aimlines, and ROI on the progress chart.

**Architecture:** Expand the `LocalStudentGoal` IndexedDB schema (v8) with SMART goal text, benchmark date, and goal target date. Rewrite the GoalSettingModal for the new fields and move it to the PM page. Simplify the batch entry modal to score-only. Enhance the SVG chart with benchmark markers, goal lines, aimlines. Add ROI stat cards.

**Tech Stack:** Next.js 14, React 18, TypeScript, Dexie.js (IndexedDB), Zustand, SVG (custom chart)

---

### Task 1: Expand LocalStudentGoal schema (DB v8)

**Files:**
- Modify: `src/lib/local-db/index.ts:218-228` (LocalStudentGoal interface)
- Modify: `src/lib/local-db/index.ts:335-345` (add v8 schema)

**Step 1: Update the LocalStudentGoal interface**

Add three new fields to the interface at line 218:

```typescript
export interface LocalStudentGoal {
  id?: number;
  student_id: number;
  group_id: number;
  goal_score: number;
  smart_goal_text: string;
  goal_target_date: string;
  benchmark_score: number | null;
  benchmark_date: string | null;
  measure_type: string;
  set_date: string;
  created_at: string;
  updated_at: string;
}
```

**Step 2: Add version 8 schema**

After the version 7 block (around line 345), add version 8. The schema string for `studentGoals` stays the same (indexes unchanged — the new fields are non-indexed):

```typescript
// Version 8: Add SMART goal text, benchmark date, goal target date to student goals
this.version(8).stores({
  groups: '++id, name, curriculum, tier, grade, interventionist_id, created_at, updated_at',
  students: '++id, name, group_id, created_at',
  sessions: '++id, group_id, date, status, series_id, created_at, updated_at',
  progressMonitoring: '++id, student_id, group_id, date, created_at',
  errorBank: '++id, curriculum, error_pattern, created_at',
  studentSessionTracking: '++id, session_id, student_id, created_at',
  wilsonLessonElements: '++id, substep, stepNumber, createdAt, updatedAt',
  wilsonLessonPlans: '++id, sessionId, substep, createdAt, updatedAt',
  caminoLessonElements: '++id, unit, lesson, lessonCode, createdAt, updatedAt',
  caminoLessonPlans: '++id, sessionId, unit, lesson, lessonCode, createdAt, updatedAt',
  interventionists: '++id, name, email, created_at, updated_at',
  gradeLevelConstraints: '++id, grade, type, created_at',
  studentConstraints: '++id, student_id, type, created_at',
  studentGoals: '++id, student_id, group_id, set_date, created_at, updated_at',
}).upgrade(tx => {
  // Backfill new fields with defaults for existing records
  return tx.table('studentGoals').toCollection().modify(goal => {
    if (!goal.smart_goal_text) goal.smart_goal_text = '';
    if (!goal.goal_target_date) goal.goal_target_date = '';
    if (!goal.benchmark_date) goal.benchmark_date = null;
  });
});
```

Also update `LocalStudentGoalInsert` to include the new fields:

```typescript
export type LocalStudentGoalInsert = Omit<LocalStudentGoal, 'id' | 'created_at' | 'updated_at'>;
```

**Step 3: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/local-db/index.ts
git commit -m "feat: expand student goals schema with SMART goal, benchmark date, target date (v8)"
```

---

### Task 2: Update goals store for new fields

**Files:**
- Modify: `src/stores/goals.ts`

**Step 1: Update the store**

The `setGoal` and `setBulkGoals` methods already accept `LocalStudentGoalInsert`. Since we expanded the interface, callers will now pass the new fields. No store logic changes needed, but verify the insert type flows through correctly.

Check that `LocalStudentGoalInsert` is imported and that the `setGoal`/`setBulkGoals` methods don't strip any fields. Currently they spread `...goal` so new fields pass through automatically.

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors (the store accepts the full insert type)

**Step 3: Commit**

```bash
git add src/stores/goals.ts
git commit -m "chore: verify goals store compatibility with expanded schema"
```

---

### Task 3: Rewrite GoalSettingModal with SMART goal + benchmark fields

**Files:**
- Modify: `src/components/goals/GoalSettingModal.tsx`

**Step 1: Rewrite the modal**

Replace the entire file content. The new modal has per-student rows with:
- SMART goal text (textarea)
- Goal score (number)
- Target date (date picker)
- Benchmark score (number)
- Benchmark date (date picker)

Keep the "Apply same to all" feature for goal score and benchmark score.

```tsx
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
```

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/goals/GoalSettingModal.tsx
git commit -m "feat: rewrite GoalSettingModal with SMART goal, benchmark date, target date"
```

---

### Task 4: Simplify batch entry modal (remove goal/benchmark columns)

**Files:**
- Modify: `src/components/progress/add-data-point-modal.tsx`

**Step 1: Remove goal and benchmark from the modal**

Remove the `goal` and `benchmark` fields from `StudentScoreRow`. Remove the `defaultBenchmark` and `defaultGoal` props. Remove the goal/benchmark columns from the table. Remove the goal lookup from IndexedDB. The modal now only has: student name, score.

The submit handler should pass `benchmark: null, goal: null` to `onSubmit` since these are no longer entered per data point.

Update `AddDataPointModalProps`:

```typescript
export interface AddDataPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dataPoint: ProgressMonitoringInsert) => Promise<void>;
  groupId: string;
  students?: Student[];
}
```

Update `StudentScoreRow`:

```typescript
interface StudentScoreRow {
  studentId: string;
  studentName: string;
  score: string;
}
```

Remove the `loadGoals` async function in the useEffect — just set rows from students directly:

```typescript
useEffect(() => {
  if (!isOpen || students.length === 0) return;
  setRows(students.map((s) => ({ studentId: s.id, studentName: s.name, score: '' })));
  setSavedCount(0);
  setError(null);
}, [isOpen, students]);
```

Update the submit handler to pass `benchmark: null, goal: null`.

Update the table grid to `grid-cols-[1fr_120px]` (student + score only). Remove the goal/benchmark input columns.

**Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/progress/add-data-point-modal.tsx
git commit -m "feat: simplify batch entry modal to score-only (goal/benchmark set separately)"
```

---

### Task 5: Enhance progress chart with benchmark, goal line, aimline

**Files:**
- Modify: `src/components/progress/progress-chart.tsx`

**Step 1: Add goal data to chart props**

Add a new prop for student goals:

```typescript
import type { LocalStudentGoal } from '@/lib/local-db';

export interface ProgressChartProps {
  students: Student[];
  progressData: ProgressMonitoring[];
  groupId: string;
  title?: string;
  studentGoals?: LocalStudentGoal[];
}
```

**Step 2: Build goal lookup inside the component**

Inside the `ProgressChart` component, create a map from student_id to their goal:

```typescript
const goalMap = useMemo(() => {
  const map = new Map<number, LocalStudentGoal>();
  if (studentGoals) {
    studentGoals.forEach(g => map.set(g.student_id, g));
  }
  return map;
}, [studentGoals]);
```

**Step 3: Include benchmark and goal dates in allDates**

When computing `allDates`, also include `benchmark_date` and `goal_target_date` from goals so they appear on the X-axis:

```typescript
const allDates = useMemo(() => {
  const dates = new Set<string>();
  chartData.forEach(line => {
    line.dataPoints.forEach(point => dates.add(point.date));
  });
  // Include benchmark and goal target dates
  if (studentGoals) {
    studentGoals.forEach(g => {
      if (g.benchmark_date) dates.add(g.benchmark_date);
      if (g.goal_target_date) dates.add(g.goal_target_date);
    });
  }
  return Array.from(dates).sort();
}, [chartData, studentGoals]);
```

**Step 4: Include benchmark and goal scores in Y-axis domain**

When computing `minScore`/`maxScore`, also consider benchmark and goal scores:

```typescript
if (studentGoals) {
  studentGoals.forEach(g => {
    if (g.benchmark_score !== null) {
      min = Math.min(min, g.benchmark_score);
      max = Math.max(max, g.benchmark_score);
    }
    min = Math.min(min, g.goal_score);
    max = Math.max(max, g.goal_score);
  });
}
```

**Step 5: Render benchmark point, goal line, and aimline per student**

After the existing student line rendering (`{chartData.map(...)}`), add a new block that renders for each student who has a goal:

```tsx
{/* Goal lines, aimlines, and benchmark points per student */}
{chartData.map((line) => {
  const studentIdNum = typeof line.studentId === 'string' ? parseInt(line.studentId) : line.studentId;
  const goal = goalMap.get(studentIdNum);
  if (!goal || !goal.benchmark_date || goal.benchmark_score === null) return null;

  const benchmarkDateIndex = allDates.indexOf(goal.benchmark_date);
  const goalDateIndex = goal.goal_target_date ? allDates.indexOf(goal.goal_target_date) : -1;

  return (
    <g key={`goal-${line.studentId}`}>
      {/* Benchmark point (diamond) */}
      {benchmarkDateIndex >= 0 && (
        <g>
          <rect
            x={xScale(benchmarkDateIndex) - 6}
            y={yScale(goal.benchmark_score) - 6}
            width={12}
            height={12}
            fill={line.color}
            stroke="#1F2937"
            strokeWidth={2}
            transform={`rotate(45, ${xScale(benchmarkDateIndex)}, ${yScale(goal.benchmark_score)})`}
          />
        </g>
      )}

      {/* Goal horizontal dashed line */}
      <line
        x1={benchmarkDateIndex >= 0 ? xScale(benchmarkDateIndex) : 0}
        y1={yScale(goal.goal_score)}
        x2={goalDateIndex >= 0 ? xScale(goalDateIndex) : chartWidth}
        y2={yScale(goal.goal_score)}
        stroke={line.color}
        strokeWidth={1.5}
        strokeDasharray="6 4"
        opacity={0.5}
      />

      {/* Goal label */}
      <text
        x={goalDateIndex >= 0 ? xScale(goalDateIndex) + 5 : chartWidth + 5}
        y={yScale(goal.goal_score) + 4}
        className="text-xs fill-text-muted"
        fontSize={10}
      >
        Goal: {goal.goal_score}
      </text>

      {/* Aimline: dashed line from benchmark to goal */}
      {benchmarkDateIndex >= 0 && goalDateIndex >= 0 && (
        <line
          x1={xScale(benchmarkDateIndex)}
          y1={yScale(goal.benchmark_score)}
          x2={xScale(goalDateIndex)}
          y2={yScale(goal.goal_score)}
          stroke={line.color}
          strokeWidth={2}
          strokeDasharray="8 4"
          opacity={0.6}
        />
      )}
    </g>
  );
})}
```

**Step 6: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/components/progress/progress-chart.tsx
git commit -m "feat: add benchmark points, goal lines, and aimlines to progress chart"
```

---

### Task 6: Wire goals to the Progress Monitoring page + ROI stat cards

**Files:**
- Modify: `src/app/progress/page.tsx`

**Step 1: Import goals store and add state**

Add imports at the top:

```typescript
import { Target } from 'lucide-react';
import { useGoalsStore } from '@/stores/goals';
import { GoalSettingModal } from '@/components/goals/GoalSettingModal';
import type { LocalStudentGoal } from '@/lib/local-db';
```

Add state for the goal setting modal:

```typescript
const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
```

Fetch goals when group changes:

```typescript
const { goals, fetchGoalsForGroup } = useGoalsStore();

useEffect(() => {
  if (selectedGroupId) {
    const groupIdNum = parseInt(selectedGroupId);
    if (!isNaN(groupIdNum)) {
      fetchGoalsForGroup(groupIdNum);
    }
  }
}, [selectedGroupId, fetchGoalsForGroup]);
```

**Step 2: Add "Set Goals & Benchmarks" button**

Next to the existing "Add Data Point" button in the header:

```tsx
<div className="flex gap-2">
  <Button
    variant="ghost"
    className="gap-2"
    onClick={() => setIsGoalModalOpen(true)}
    disabled={!selectedGroupId}
  >
    <Target className="w-4 h-4" />
    Set Goals & Benchmarks
  </Button>
  <Button
    className="gap-2"
    onClick={() => setIsModalOpen(true)}
    disabled={!selectedGroupId}
  >
    <Plus className="w-4 h-4" />
    Add Data Point
  </Button>
</div>
```

**Step 3: Calculate ROI per student**

Add a `useMemo` that computes ROI for each student who has a benchmark:

```typescript
const roiData = useMemo(() => {
  if (!selectedGroupId || goals.length === 0) return [];

  return goals
    .filter(g => g.benchmark_score !== null && g.benchmark_date)
    .map(goal => {
      const studentData = data
        .filter(d => d.student_id && parseInt(d.student_id) === goal.student_id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const latestScore = studentData[0]?.score;
      if (latestScore === undefined || !goal.benchmark_date) return null;

      const weeksElapsed = (new Date(studentData[0].date).getTime() - new Date(goal.benchmark_date).getTime()) / (7 * 24 * 60 * 60 * 1000);

      if (weeksElapsed <= 0) return null;

      const actualROI = (latestScore - (goal.benchmark_score ?? 0)) / weeksElapsed;

      let expectedROI: number | null = null;
      if (goal.goal_target_date && goal.benchmark_score !== null) {
        const totalWeeks = (new Date(goal.goal_target_date).getTime() - new Date(goal.benchmark_date).getTime()) / (7 * 24 * 60 * 60 * 1000);
        if (totalWeeks > 0) {
          expectedROI = (goal.goal_score - goal.benchmark_score) / totalWeeks;
        }
      }

      const student = students.find(s => parseInt(s.id) === goal.student_id);

      return {
        studentName: student?.name || 'Unknown',
        actualROI: Math.round(actualROI * 100) / 100,
        expectedROI: expectedROI !== null ? Math.round(expectedROI * 100) / 100 : null,
        onTrack: expectedROI !== null ? actualROI >= expectedROI : null,
      };
    })
    .filter(Boolean);
}, [goals, data, students, selectedGroupId]);
```

**Step 4: Add ROI stat cards**

After the existing summary stats section, add an ROI section:

```tsx
{/* ROI Cards */}
{roiData.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-movement" />
        Rate of Improvement (ROI)
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {roiData.map((roi: any) => (
          <div key={roi.studentName} className="p-3 rounded-lg border border-border bg-surface">
            <p className="text-sm font-medium text-text-primary mb-1">{roi.studentName}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-text-primary">
                {roi.actualROI > 0 ? '+' : ''}{roi.actualROI}
              </span>
              <span className="text-xs text-text-muted">/week</span>
            </div>
            {roi.expectedROI !== null && (
              <p className={`text-xs mt-1 ${roi.onTrack ? 'text-emerald-500' : 'text-red-400'}`}>
                {roi.onTrack ? 'On track' : 'Below expected'} (need {roi.expectedROI > 0 ? '+' : ''}{roi.expectedROI}/week)
              </p>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

**Step 5: Pass goals to chart and remove old props from modal**

Update ProgressChart call:

```tsx
<ProgressChart
  students={students}
  progressData={filteredData}
  groupId={selectedGroupId}
  studentGoals={goals}
/>
```

Update AddDataPointModal call (remove `defaultBenchmark` and `defaultGoal` props):

```tsx
<AddDataPointModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleAddDataPoint}
  groupId={selectedGroupId}
  students={students}
/>
```

Add the GoalSettingModal:

```tsx
{selectedGroup && (
  <GoalSettingModal
    isOpen={isGoalModalOpen}
    onClose={() => {
      setIsGoalModalOpen(false);
      // Refetch goals to reflect changes
      const groupIdNum = parseInt(selectedGroupId);
      if (!isNaN(groupIdNum)) {
        fetchGoalsForGroup(groupIdNum);
      }
    }}
    groupId={parseInt(selectedGroupId)}
    students={students.map(s => ({ id: parseInt(s.id), name: s.name }))}
    curriculum={selectedGroup.curriculum}
  />
)}
```

**Step 6: Remove unused imports**

Remove `benchmark` and `goal` variables that were derived from `filteredData[0]`.

**Step 7: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 8: Build**

Run: `npx next build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add src/app/progress/page.tsx
git commit -m "feat: add goals/benchmarks button, ROI stat cards, wire goal data to chart"
```

---

### Task 7: Push and deploy

**Step 1: Push**

```bash
git push origin main
```

**Step 2: Deploy to NAS**

```bash
ssh Dr.Tobon@192.168.86.45 "cd /volume1/docker/emerge-intervention-planner && git pull origin main && npm run build && pm2 restart emerge-planner"
```

Expected: Build succeeds, PM2 restarts.
