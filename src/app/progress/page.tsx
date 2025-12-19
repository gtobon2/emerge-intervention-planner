'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Plus, Filter, Calendar, BarChart3 } from 'lucide-react';
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

export default function ProgressPage() {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch groups
  const { groups, fetchGroups } = useGroupsStore();
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Fetch progress data
  const { data, isLoading, addDataPoint, trendLine, dataWithStudents, refetch } = useProgress(
    selectedGroupId || undefined
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

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

    // Calculate weeks to goal
    let weeksToGoal: number | null = null;
    const goal = sortedData[0]?.goal;
    if (goal && trendLine && trendLine.slope > 0 && currentScore < goal) {
      const pointsNeeded = goal - currentScore;
      const weeksNeeded = pointsNeeded / trendLine.slope;
      weeksToGoal = Math.ceil(weeksNeeded);
    }

    return {
      currentScore,
      averageScore: Math.round(averageScore * 10) / 10,
      trend,
      weeksToGoal,
    };
  }, [filteredData, trendLine]);

  // Get benchmark and goal from most recent data point
  const benchmark = filteredData[0]?.benchmark || undefined;
  const goal = filteredData[0]?.goal || undefined;

  // Get students for the selected group
  const students = useMemo(() => {
    if (!selectedGroupId) return [];
    const groupData = dataWithStudents.filter((d) => d.student);
    const uniqueStudents = new Map();
    groupData.forEach((d) => {
      if (d.student && !uniqueStudents.has(d.student.id)) {
        uniqueStudents.set(d.student.id, d.student);
      }
    });
    return Array.from(uniqueStudents.values());
  }, [selectedGroupId, dataWithStudents]);

  const handleAddDataPoint = async (dataPoint: any) => {
    await addDataPoint(dataPoint);
    refetch();
  };

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
          <Button
            className="gap-2"
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedGroupId}
          >
            <Plus className="w-4 h-4" />
            Add Data Point
          </Button>
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
                    <DecisionRuleAlert data={filteredData} goal={goal} />
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
        defaultBenchmark={benchmark}
        defaultGoal={goal}
      />
    </AppLayout>
  );
}
