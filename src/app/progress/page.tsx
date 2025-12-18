'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Plus, Filter, AlertTriangle, CheckCircle, MinusCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { AppLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent, Select, Modal, Input } from '@/components/ui';
import { useGroupsStore } from '@/stores/groups';
import { useProgressStore, checkDecisionRules, calculateTrendLine } from '@/stores/progress';

export default function ProgressPage() {
  const { groups, fetchGroups } = useGroupsStore();
  const { data, fetchProgressForGroup, addDataPoint, isLoading } = useProgressStore();

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [goal, setGoal] = useState<number>(100);

  // Form state for adding data point
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newScore, setNewScore] = useState('');
  const [newMeasureType, setNewMeasureType] = useState('ORF');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchProgressForGroup(selectedGroupId);
    }
  }, [selectedGroupId, fetchProgressForGroup]);

  // Format data for chart
  const chartData = useMemo(() => {
    return data.map((point) => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rawDate: point.date,
      score: point.score,
      goal: point.goal || goal,
      benchmark: point.benchmark,
    }));
  }, [data, goal]);

  // Calculate trend line points
  const trendLineData = useMemo(() => {
    const trend = calculateTrendLine(data);
    if (!trend || data.length < 2) return null;

    return chartData.map((_, i) => ({
      date: chartData[i].date,
      trend: trend.intercept + trend.slope * i,
    }));
  }, [data, chartData]);

  // Merge trend data with chart data
  const mergedChartData = useMemo(() => {
    if (!trendLineData) return chartData;
    return chartData.map((point, i) => ({
      ...point,
      trend: trendLineData[i]?.trend,
    }));
  }, [chartData, trendLineData]);

  // Check decision rules
  const decisionResult = useMemo(() => {
    if (data.length < 4) return null;
    const avgGoal = data.reduce((sum, p) => sum + (p.goal || goal), 0) / data.length;
    return checkDecisionRules(data, avgGoal);
  }, [data, goal]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const handleAddDataPoint = async () => {
    if (!selectedGroupId || !newScore || !newDate) return;

    await addDataPoint({
      group_id: selectedGroupId,
      student_id: null,
      date: newDate,
      measure_type: newMeasureType,
      score: parseFloat(newScore),
      goal: goal,
      benchmark: null,
      notes: newNotes || null,
    });

    // Reset form and close modal
    setNewScore('');
    setNewNotes('');
    setShowAddModal(false);

    // Refresh data
    fetchProgressForGroup(selectedGroupId);
  };

  const groupOptions = [
    { value: '', label: 'Select a group' },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

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
            onClick={() => setShowAddModal(true)}
            disabled={!selectedGroupId}
          >
            <Plus className="w-4 h-4" />
            Add Data Point
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
          <Filter className="w-4 h-4 text-text-muted" />
          <Select
            options={groupOptions}
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-64"
          />
          {selectedGroupId && (
            <div className="flex items-center gap-2 ml-4">
              <label className="text-sm text-text-muted">Goal:</label>
              <Input
                type="number"
                value={goal}
                onChange={(e) => setGoal(parseInt(e.target.value) || 0)}
                className="w-24"
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-movement" />
                  Progress Chart
                  {selectedGroup && (
                    <span className="text-sm font-normal text-text-muted ml-2">
                      - {selectedGroup.name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedGroupId ? (
                  <div className="h-80 flex items-center justify-center text-text-muted">
                    <p>Select a group to view progress data</p>
                  </div>
                ) : isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-pulse text-text-muted">Loading data...</div>
                  </div>
                ) : data.length === 0 ? (
                  <div className="h-80 flex flex-col items-center justify-center text-text-muted">
                    <p className="mb-4">No progress data for this group yet</p>
                    <Button onClick={() => setShowAddModal(true)}>
                      Add First Data Point
                    </Button>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={mergedChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          fontSize={12}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend />
                        {/* Goal line */}
                        <ReferenceLine
                          y={goal}
                          stroke="#10B981"
                          strokeDasharray="5 5"
                          label={{ value: 'Goal', fill: '#10B981', fontSize: 12 }}
                        />
                        {/* Score line */}
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Score"
                        />
                        {/* Trend line */}
                        {trendLineData && (
                          <Line
                            type="monotone"
                            dataKey="trend"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            name="Trend"
                          />
                        )}
                        {/* Benchmark line */}
                        {chartData.some((d) => d.benchmark) && (
                          <Line
                            type="monotone"
                            dataKey="benchmark"
                            stroke="#8B5CF6"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            dot={false}
                            name="Benchmark"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Points Table */}
            {data.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Data Points ({data.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-text-muted">Date</th>
                          <th className="text-left py-2 px-3 text-text-muted">Measure</th>
                          <th className="text-right py-2 px-3 text-text-muted">Score</th>
                          <th className="text-right py-2 px-3 text-text-muted">Goal</th>
                          <th className="text-left py-2 px-3 text-text-muted">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.slice().reverse().map((point) => (
                          <tr key={point.id} className="border-b border-border/50">
                            <td className="py-2 px-3 text-text-primary">
                              {new Date(point.date).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 text-text-primary">{point.measure_type}</td>
                            <td className="py-2 px-3 text-right font-medium text-text-primary">
                              {point.score}
                            </td>
                            <td className="py-2 px-3 text-right text-text-muted">
                              {point.goal || '-'}
                            </td>
                            <td className="py-2 px-3 text-text-muted text-xs">
                              {point.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Decision Rules */}
          <div className="space-y-6">
            {/* Active Decision Alert */}
            {decisionResult && (
              <Card className={`border-2 ${
                decisionResult.type === 'positive'
                  ? 'border-green-500/50 bg-green-500/10'
                  : decisionResult.type === 'negative'
                  ? 'border-red-500/50 bg-red-500/10'
                  : 'border-yellow-500/50 bg-yellow-500/10'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {decisionResult.type === 'positive' ? (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    ) : decisionResult.type === 'negative' ? (
                      <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    ) : (
                      <MinusCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-text-primary">Decision Point Reached</p>
                      <p className="text-sm text-text-muted mt-1">{decisionResult.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Decision Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="font-medium text-green-400 mb-1">4+ points above goal</p>
                    <p className="text-text-muted">Consider raising the goal or advancing in curriculum</p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="font-medium text-yellow-400 mb-1">Variable performance</p>
                    <p className="text-text-muted">Continue monitoring, maintain current intervention</p>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="font-medium text-red-400 mb-1">4+ points below goal</p>
                    <p className="text-text-muted">Consider adjusting intervention intensity or approach</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            {data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Data Points</span>
                      <span className="font-medium text-text-primary">{data.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Average Score</span>
                      <span className="font-medium text-text-primary">
                        {(data.reduce((sum, p) => sum + p.score, 0) / data.length).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Highest Score</span>
                      <span className="font-medium text-text-primary">
                        {Math.max(...data.map((p) => p.score))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Lowest Score</span>
                      <span className="font-medium text-text-primary">
                        {Math.min(...data.map((p) => p.score))}
                      </span>
                    </div>
                    {data.length >= 2 && (
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="text-text-muted">Trend</span>
                        <span className={`font-medium ${
                          (calculateTrendLine(data)?.slope || 0) > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {(calculateTrendLine(data)?.slope || 0) > 0 ? '↑ Improving' : '↓ Declining'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Data Point Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Progress Data Point"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Date *</label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Measure Type</label>
            <Select
              options={[
                { value: 'ORF', label: 'Oral Reading Fluency (ORF)' },
                { value: 'MAZE', label: 'MAZE Comprehension' },
                { value: 'CBM-Math', label: 'CBM Math' },
                { value: 'Spelling', label: 'Spelling' },
                { value: 'Other', label: 'Other' },
              ]}
              value={newMeasureType}
              onChange={(e) => setNewMeasureType(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Score *</label>
            <Input
              type="number"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              placeholder="e.g., 85"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Notes</label>
            <Input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDataPoint} disabled={!newScore || !newDate}>
              Add Data Point
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
