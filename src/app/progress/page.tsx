'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { TrendingUp, Plus, Filter, Calendar, BarChart3, Target } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent, Select } from '@/components/ui';
import {
  ProgressChart,
  TrendIndicator,
  DecisionRuleAlert,
  AddDataPointModal,
} from '@/components/progress';
import { useProgress } from '@/hooks/use-progress';
import { useGroupsStore } from '@/stores/groups';
import { useGoalsStore } from '@/stores/goals';
import { GoalSettingModal } from '@/components/goals/GoalSettingModal';

export default function ProgressPage() {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Use individual selectors to avoid re-rendering on unrelated store changes
  const groups = useGroupsStore(s => s.groups);
  const fetchGroups = useGroupsStore(s => s.fetchGroups);
  const selectedGroup = useGroupsStore(s => s.selectedGroup);
  const fetchGroupById = useGroupsStore(s => s.fetchGroupById);

  const goals = useGoalsStore(s => s.goals);
  const fetchGoalsForGroup = useGoalsStore(s => s.fetchGoalsForGroup);

  // Fetch progress data
  const { data, isLoading, addDataPoint, trendLine, refetch } = useProgress(
    selectedGroupId || undefined
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Fetch group details (including students) and goals when selection changes
  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupById(selectedGroupId);
      const groupIdNum = parseInt(selectedGroupId);
      if (!isNaN(groupIdNum)) {
        fetchGoalsForGroup(groupIdNum);
      }
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
    () => students.map(s => ({ id: parseInt(s.id), name: s.name })),
    [students]
  );

  // Calculate ROI per student
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
      .filter(Boolean) as { studentName: string; actualROI: number; expectedROI: number | null; onTrack: boolean | null }[];
  }, [goals, data, students, selectedGroupId]);

  const handleAddDataPoint = useCallback(async (dataPoint: any) => {
    await addDataPoint(dataPoint);
    refetch();
  }, [addDataPoint, refetch]);

  const handleGoalModalClose = useCallback(() => {
    setIsGoalModalOpen(false);
    const groupIdNum = parseInt(selectedGroupId);
    if (!isNaN(groupIdNum)) {
      fetchGoalsForGroup(groupIdNum);
    }
  }, [selectedGroupId, fetchGoalsForGroup]);

  const groupIdNum = useMemo(() => parseInt(selectedGroupId), [selectedGroupId]);

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
              onClick={() => setIsModalOpen(true)}
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
            onChange={(e) => setSelectedGroupId(e.target.value)}
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
            </>
          )}
        </div>

        {selectedGroupId ? (
          <>
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

      {/* Add Data Point Modal */}
      <AddDataPointModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddDataPoint}
        groupId={selectedGroupId}
        students={students}
      />

      {/* Goal Setting Modal — only mount when open to avoid store subscription cascade */}
      {isGoalModalOpen && selectedGroup && (
        <GoalSettingModal
          isOpen={isGoalModalOpen}
          onClose={handleGoalModalClose}
          groupId={groupIdNum}
          students={goalModalStudents}
          curriculum={selectedGroup.curriculum}
        />
      )}
    </AppLayout>
  );
}
