'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import type { ProgressMonitoring } from '@/lib/supabase/types';

export interface ProgressChartProps {
  data: ProgressMonitoring[];
  benchmark?: number;
  goal?: number;
  showAimline?: boolean;
}

interface ChartDataPoint {
  date: string;
  score: number;
  benchmark?: number;
  aimline?: number;
  formattedDate: string;
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload as ChartDataPoint;

  return (
    <div className="bg-surface border border-text-muted/20 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-text-primary mb-2">{data.formattedDate}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-muted">{entry.name}:</span>
            <span className="font-medium text-text-primary">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressChart({ data, benchmark, goal, showAimline = true }: ProgressChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Sort data by date
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate aimline if goal is provided and we have data
    let aimlineData: number[] = [];
    if (goal && sortedData.length > 0 && showAimline) {
      const firstScore = sortedData[0].score;
      const increment = (goal - firstScore) / (sortedData.length - 1 || 1);
      aimlineData = sortedData.map((_, index) => firstScore + increment * index);
    }

    return sortedData.map((point, index) => {
      const date = new Date(point.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        date: point.date,
        score: point.score,
        benchmark: benchmark,
        aimline: aimlineData[index],
        formattedDate,
      };
    });
  }, [data, benchmark, goal, showAimline]);

  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-text-muted">
        No progress data available. Add data points to see the chart.
      </div>
    );
  }

  // Calculate Y-axis domain
  const scores = chartData.map((d) => d.score);
  const minScore = Math.min(...scores, benchmark || 0, goal || 0);
  const maxScore = Math.max(...scores, benchmark || 0, goal || 0);
  const padding = (maxScore - minScore) * 0.1 || 5;
  const yMin = Math.max(0, Math.floor(minScore - padding));
  const yMax = Math.ceil(maxScore + padding);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="formattedDate"
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          domain={[yMin, yMax]}
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
          formatter={(value) => (
            <span className="text-text-primary text-sm">{value}</span>
          )}
        />

        {/* Benchmark line */}
        {benchmark && (
          <ReferenceLine
            y={benchmark}
            stroke="#6B7280"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: 'Benchmark',
              position: 'right',
              style: { fill: '#6B7280', fontSize: '12px' },
            }}
          />
        )}

        {/* Goal line */}
        {goal && (
          <ReferenceLine
            y={goal}
            stroke="#10B981"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: 'Goal',
              position: 'right',
              style: { fill: '#10B981', fontSize: '12px' },
            }}
          />
        )}

        {/* Aimline (projected path to goal) */}
        {showAimline && goal && chartData.some((d) => d.aimline !== undefined) && (
          <Line
            type="monotone"
            dataKey="aimline"
            stroke="#22C55E"
            strokeDasharray="3 3"
            strokeWidth={2}
            dot={false}
            name="Aimline"
          />
        )}

        {/* Actual progress line */}
        <Line
          type="monotone"
          dataKey="score"
          stroke="#FF006E"
          strokeWidth={3}
          dot={{ r: 5, fill: '#FF006E', strokeWidth: 2, stroke: '#1F2937' }}
          activeDot={{ r: 7 }}
          name="Score"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
