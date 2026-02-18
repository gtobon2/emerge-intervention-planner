'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  TrendingUp,
  Plus,
  Filter,
  Calendar,
  BarChart3,
  Target,
  Users,
  Layers,
  User,
  Pencil,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent, Select, ConfirmModal } from '@/components/ui';
import {
  ProgressChart,
  TrendIndicator,
  DecisionRuleAlert,
  AddDataPointModal,
  IndividualPMEntry,
} from '@/components/progress';
import { useProgress } from '@/hooks/use-progress';
import { useGroupsStore } from '@/stores/groups';
import { useGoalsStore } from '@/stores/goals';
import { GoalSettingModal } from '@/components/goals/GoalSettingModal';
import type { ProgressMonitoring, ProgressMonitoringInsert } from '@/lib/supabase/types';

const PROGRESS_GROUP_KEY = 'emerge-progress-selected-group';

type EntryMode = 'batch' | 'individual';

export default function ProgressPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initializedRef = useRef(false);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Entry mode toggle
  const [entryMode, setEntryMode] = useState<EntryMode>('batch');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Edit/Delete state
  const [editingDataPoint, setEditingDataPoint] = useState<ProgressMonitoring | null>(null);
  const [deletingDataPoint, setDeletingDataPoint] = useState<ProgressMonitoring | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use individual selectors to avoid re-rendering on unrelated store changes
  const groups = useGroupsStore(s => s.groups);
  const fetchGroups = useGroupsStore(s => s.fetchGroups);
  const selectedGroup = useGroupsStore(s => s.selectedGroup);
  const fetchGroupById = useGroupsStore(s => s.fetchGroupById);

  const goals = useGoalsStore(s => s.goals);
  const fetchGoalsForGroup = useGoalsStore(s => s.fetchGoalsForGroup);

  // Fetch progress data
  const { data, isLoading, addDataPoint, deleteDataPoint, trendLine, refetch } = useProgress(
    selectedGroupId || undefined
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Restore selected group from URL searchParams or localStorage on mount
  useEffect(() => {
    if (initializedRef.current || groups.length === 0) return;
    initializedRef.current = true;

    const paramGroup = searchParams.get('group');
    const savedGroup = typeof window !== 'undefined'
      ? localStorage.getItem(PROGRESS_GROUP_KEY)
      : null;
    const restoredId = paramGroup || savedGroup || '';

    // Only restore if the group actually exists
    if (restoredId && groups.some(g => g.id === restoredId)) {
      setSelectedGroupId(restoredId);
    }
  }, [groups, searchParams]);

  // Persist group selection to URL and localStorage on change
  const handleGroupChange = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedStudentId('');
    setEditingDataPoint(null);
    if (groupId) {
      localStorage.setItem(PROGRESS_GROUP_KEY, groupId);
      router.replace(`?group=${groupId}`, { scroll: false });
    } else {
      localStorage.removeItem(PROGRESS_GROUP_KEY);
      router.replace('?', { scroll: false });
    }
  }, [router]);

  // Fetch group details (including students) and goals when selection changes
  useEffect(() => {
    setEditingDataPoint(null);
    if (selectedGroupId) {
      fetchGroupById(selectedGroupId);
      fetchGoalsForGroup(selectedGroupId);
    }
  }, [selectedGroupId, fetchGroupById, fetchGoalsForGroup]);

  // Filter data by date range
  const filteredData = useMemo(() => {
    if (dateRange === 'all') return data;

    const now = new Date();
    const cutoffDate = new Date();

    switch (dateRange) {
      case '30':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '60':
        cutoffDate.setDate(now.getDate() - 60);
        break;
      case '90':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        return data;
    }

    return data.filter((d) => new Date(d.date) >= cutoffDate);
  }, [data, dateRange]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        currentScore: null,
        averageScore: null,
        trend: null,
        weeksToGoal: null,
      };
    }

    const sortedData = [...filteredData].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const currentScore = sortedData[0]?.score;
    const averageScore =
      filteredData.reduce((sum, d) => sum + d.score, 0) / filteredData.length;

    // Calculate trend
    let trend: 'improving' | 'declining' | 'flat' = 'flat';
    if (trendLine && trendLine.slope > 0.1) {
      trend = 'improving';
    } else if (trendLine && trendLine.slope < -0.1) {
      trend = 'declining';
    }

    // Calculate weeks to goal (using first goal from goals store)
    let weeksToGoal: number | null = null;
    const goalScore = goals[0]?.goal_score;
    if (goalScore && trendLine && trendLine.slope > 0 && currentScore < goalScore) {
      const pointsNeeded = goalScore - currentScore;
      const weeksNeeded = pointsNeeded / trendLine.slope;
      weeksToGoal = Math.ceil(weeksNeeded);
    }

    return {
      currentScore,
      averageScore: Math.round(averageScore * 10) / 10,
      trend,
      weeksToGoal,
    };
  }, [filteredData, trendLine, goals]);

  // Stable students reference — avoid creating new [] on every render
  const students = useMemo(
    () => selectedGroup?.students ?? [],
    [selectedGroup]
  );

  // Stable students list for GoalSettingModal (memoized to prevent cascade)
  const goalModalStudents = useMemo(
    () => students.map(s => ({ id: s.id, name: s.name })),
    [students]
  );

  // Calculate ROI per student
  const roiData = useMemo(() => {
    if (!selectedGroupId || goals.length === 0) return [];

    return goals
      .filter(g => g.benchmark_score !== null && g.benchmark_date)
      .map(goal => {
        const studentData = data
          .filter(d => d.student_id === goal.student_id)
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

        const student = students.find(s => s.id === goal.student_id);

        return {
          studentName: student?.name || 'Unknown',
          actualROI: Math.round(actualROI * 100) / 100,
          expectedROI: expectedROI !== null ? Math.round(expectedROI * 100) / 100 : null,
          onTrack: expectedROI !== null ? actualROI >= expectedROI : null,
        };
      })
      .filter(Boolean) as { studentName: string; actualROI: number; expectedROI: number | null; onTrack: boolean | null }[];
  }, [goals, data, students, selectedGroupId]);

  const handleAddDataPoint = useCallback(async (dataPoint: any) => {
    await addDataPoint(dataPoint);
    refetch();
  }, [addDataPoint, refetch]);

  const handleGoalModalClose = useCallback(() => {
    setIsGoalModalOpen(false);
    if (selectedGroupId) {
      fetchGoalsForGroup(selectedGroupId);
    }
  }, [selectedGroupId, fetchGoalsForGroup]);

  // Lock measure type from active goals (before target date)
  const lockedMeasureType = useMemo(() => {
    if (goals.length === 0) return null;
    const today = new Date().toISOString().split('T')[0];
    const activeGoal = goals.find(
      g => g.measure_type && (!g.goal_target_date || g.goal_target_date >= today)
    );
    return activeGoal?.measure_type || null;
  }, [goals]);

  // Get recent scores for a specific student (last 5, ascending order)
  const getRecentScoresForStudent = useCallback((studentId: string): number[] => {
    return data
      .filter(d => d.student_id === studentId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-5)
      .map(d => d.score);
  }, [data]);

  // Get goal line for a specific student
  const getGoalLineForStudent = useCallback((studentId: string): number | undefined => {
    const goal = goals.find(g => g.student_id === studentId);
    return goal?.goal_score;
  }, [goals]);

  // Individual entry: save handler
  const handleIndividualSave = useCallback(async (saveData: { score: number; date: string; measure_type: string; notes?: string }) => {
    if (!selectedStudentId || !selectedGroupId) return;

    const dataPoint: ProgressMonitoringInsert = {
      group_id: selectedGroupId,
      student_id: selectedStudentId,
      date: saveData.date,
      measure_type: saveData.measure_type,
      score: saveData.score,
      benchmark: null,
      goal: null,
      notes: saveData.notes || null,
    };

    await addDataPoint(dataPoint);
    refetch();
    setSelectedStudentId('');
  }, [selectedStudentId, selectedGroupId, addDataPoint, refetch]);

  // Edit handler: delete old point, save new values
  const handleEditSave = useCallback(async (saveData: { score: number; date: string; measure_type: string; notes?: string }) => {
    if (!editingDataPoint) return;

    // Delete the old data point
    await deleteDataPoint(editingDataPoint.id);

    // Create a new one with updated values
    const dataPoint: ProgressMonitoringInsert = {
      group_id: editingDataPoint.group_id,
      student_id: editingDataPoint.student_id || '',
      date: saveData.date,
      measure_type: saveData.measure_type,
      score: saveData.score,
      benchmark: editingDataPoint.benchmark,
      goal: editingDataPoint.goal,
      notes: saveData.notes || null,
    };

    await addDataPoint(dataPoint);
    refetch();
    setEditingDataPoint(null);
  }, [editingDataPoint, deleteDataPoint, addDataPoint, refetch]);

  // Delete handler
  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingDataPoint) return;
    setIsDeleting(true);
    try {
      await deleteDataPoint(deletingDataPoint.id);
      refetch();
    } finally {
      setIsDeleting(false);
      setDeletingDataPoint(null);
    }
  }, [deletingDataPoint, deleteDataPoint, refetch]);

  // Data table: sorted by date descending, grouped by student
  const dataTableRows = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50); // Show last 50 points for performance
  }, [filteredData]);

  // Find student name helper
  const getStudentName = useCallback((studentId: string | null) => {
    if (!studentId) return 'Unknown';
    return students.find(s => s.id === studentId)?.name || 'Unknown';
  }, [students]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Progress Monitoring</h1>
            <p className="text-text-muted">
              Track student progress and make data-based decisions
            </p>
          </div>
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
              onClick={() => {
                if (entryMode === 'batch') {
                  setIsModalOpen(true);
                } else {
                  // For individual mode, just ensure a student is picked
                  if (!selectedStudentId && students.length > 0) {
                    setSelectedStudentId(students[0].id);
                  }
                }
              }}
              disabled={!selectedGroupId}
            >
              <Plus className="w-4 h-4" />
              Add Data Point
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-4 bg-surface rounded-xl flex-wrap">
          <Filter className="w-4 h-4 text-text-muted" />
          <Select
            options={[
              { value: '', label: 'Select a group' },
              ...groups.map((g) => ({
                value: g.id,
                label: g.name,
              })),
            ]}
            value={selectedGroupId}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-64"
          />

          {selectedGroupId && (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-muted" />
                <Select
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: '30', label: 'Last 30 Days' },
                    { value: '60', label: 'Last 60 Days' },
                    { value: '90', label: 'Last 90 Days' },
                  ]}
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-40"
                />
              </div>

              {/* Entry Mode Toggle */}
              <div className="flex items-center ml-auto">
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setEntryMode('batch'); setEditingDataPoint(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${
                      entryMode === 'batch'
                        ? 'bg-movement text-white'
                        : 'bg-surface text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEntryMode('individual'); setEditingDataPoint(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${
                      entryMode === 'individual'
                        ? 'bg-movement text-white'
                        : 'bg-surface text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Individual
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {selectedGroupId ? (
          <>
            {/* Individual Entry Panel (shown when in individual mode or editing) */}
            {(entryMode === 'individual' || editingDataPoint) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-movement" />
                    {editingDataPoint ? 'Edit Data Point' : 'Individual Entry'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editingDataPoint ? (
                    /* Editing an existing data point */
                    <IndividualPMEntry
                      studentId={editingDataPoint.student_id || ''}
                      studentName={getStudentName(editingDataPoint.student_id)}
                      groupId={selectedGroupId}
                      measureType={lockedMeasureType || undefined}
                      onSave={handleEditSave}
                      onCancel={() => setEditingDataPoint(null)}
                      recentScores={editingDataPoint.student_id ? getRecentScoresForStudent(editingDataPoint.student_id) : []}
                      goalLine={editingDataPoint.student_id ? getGoalLineForStudent(editingDataPoint.student_id) : undefined}
                      initialValues={{
                        score: editingDataPoint.score,
                        date: editingDataPoint.date,
                        measure_type: editingDataPoint.measure_type,
                        notes: editingDataPoint.notes || undefined,
                      }}
                    />
                  ) : (
                    /* New individual entry */
                    <>
                      {/* Student picker */}
                      <div className="mb-4">
                        <Select
                          label="Select Student"
                          options={[
                            { value: '', label: 'Choose a student...' },
                            ...students.map((s) => ({
                              value: s.id,
                              label: s.name,
                            })),
                          ]}
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                        />
                      </div>

                      {selectedStudentId ? (
                        <IndividualPMEntry
                          studentId={selectedStudentId}
                          studentName={
                            students.find(s => s.id === selectedStudentId)?.name || ''
                          }
                          groupId={selectedGroupId}
                          measureType={lockedMeasureType || undefined}
                          onSave={handleIndividualSave}
                          onCancel={() => setSelectedStudentId('')}
                          recentScores={getRecentScoresForStudent(selectedStudentId)}
                          goalLine={getGoalLineForStudent(selectedStudentId)}
                        />
                      ) : (
                        <div className="text-center py-6 text-text-muted">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Select a student above to enter a score</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Summary Stats */}
            {summaryStats.currentScore !== null && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-text-muted mb-1">Current Score</p>
                      <p className="text-3xl font-bold text-text-primary">
                        {summaryStats.currentScore}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-text-muted mb-1">Average Score</p>
                      <p className="text-3xl font-bold text-text-primary">
                        {summaryStats.averageScore}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-text-muted mb-1">Trend</p>
                      <p className="text-2xl font-bold text-text-primary capitalize">
                        {summaryStats.trend}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-text-muted mb-1">Weeks to Goal</p>
                      <p className="text-3xl font-bold text-text-primary">
                        {summaryStats.weeksToGoal !== null ? summaryStats.weeksToGoal : 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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
                    {roiData.map((roi) => (
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

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Chart Area */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-movement" />
                      Progress Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-[400px] flex items-center justify-center text-text-muted">
                        Loading progress data...
                      </div>
                    ) : (
                      <ProgressChart
                        students={students}
                        progressData={filteredData}
                        groupId={selectedGroupId}
                        studentGoals={goals}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Trend Indicator */}
                {trendLine && filteredData.length > 0 && (
                  <TrendIndicator trend={summaryStats.trend} slope={trendLine.slope} />
                )}

                {/* Data Points Table with Edit/Delete */}
                {dataTableRows.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-movement" />
                        Data Points
                        <span className="text-xs font-normal text-text-muted ml-auto">
                          Showing {dataTableRows.length} of {filteredData.length}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border border-border rounded-lg overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_100px_80px_60px] gap-2 px-4 py-2 bg-surface text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                          <div>Student</div>
                          <div>Date</div>
                          <div className="text-right">Score</div>
                          <div className="text-right">Actions</div>
                        </div>
                        {/* Rows */}
                        <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                          {dataTableRows.map((dp) => (
                            <div
                              key={dp.id}
                              className="grid grid-cols-[1fr_100px_80px_60px] gap-2 px-4 py-2 items-center hover:bg-surface/50 group"
                            >
                              <div className="text-sm text-text-primary truncate">
                                {getStudentName(dp.student_id)}
                              </div>
                              <div className="text-xs text-text-muted">
                                {new Date(dp.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              <div className="text-sm font-semibold text-text-primary text-right">
                                {dp.score}
                              </div>
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDataPoint(dp);
                                    setEntryMode('individual');
                                  }}
                                  className="p-1 rounded hover:bg-surface text-text-muted hover:text-text-primary transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                                  title="Edit data point"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingDataPoint(dp)}
                                  className="p-1 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                                  title="Delete data point"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Decision Rule Alert */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-movement" />
                      Decision Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DecisionRuleAlert data={filteredData} goal={goals[0]?.goal_score} />
                  </CardContent>
                </Card>

                {/* Group Info */}
                {selectedGroup && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Group Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-text-muted">Curriculum</p>
                          <p className="font-medium text-text-primary capitalize">
                            {selectedGroup.curriculum.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-text-muted">Tier</p>
                          <p className="font-medium text-text-primary">Tier {selectedGroup.tier}</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Grade</p>
                          <p className="font-medium text-text-primary">Grade {selectedGroup.grade}</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Data Points</p>
                          <p className="font-medium text-text-primary">{filteredData.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-text-muted">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Group Selected</p>
                <p className="text-sm">
                  Select a group from the dropdown above to view progress monitoring data
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Data Point Modal (Batch) */}
      <AddDataPointModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddDataPoint}
        groupId={selectedGroupId}
        students={students}
        lockedMeasureType={lockedMeasureType}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingDataPoint}
        onClose={() => setDeletingDataPoint(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Data Point"
        message={
          deletingDataPoint
            ? `Delete the score of ${deletingDataPoint.score} for ${getStudentName(deletingDataPoint.student_id)} on ${new Date(deletingDataPoint.date).toLocaleDateString()}? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Goal Setting Modal — only mount when open to avoid store subscription cascade */}
      {isGoalModalOpen && selectedGroup && (
        <GoalSettingModal
          isOpen={isGoalModalOpen}
          onClose={handleGoalModalClose}
          groupId={selectedGroupId}
          students={goalModalStudents}
          curriculum={selectedGroup.curriculum}
        />
      )}
    </AppLayout>
  );
}
