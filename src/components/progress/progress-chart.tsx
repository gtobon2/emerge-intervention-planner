'use client';

import { useMemo } from 'react';
import type { Student, ProgressMonitoring, StudentGoal } from '@/lib/supabase/types';

export interface ProgressChartProps {
  students: Student[];
  progressData: ProgressMonitoring[];
  groupId: string;
  title?: string;
  studentGoals?: StudentGoal[];
}

interface DataPoint {
  date: string;
  score: number;
  formattedDate: string;
}

interface StudentLine {
  studentId: string;
  studentName: string;
  color: string;
  dataPoints: DataPoint[];
}

// Color palette for student lines - using EMERGE brand colors and variations
const STUDENT_COLORS = [
  '#FF006E', // movement (hot magenta)
  '#059669', // delta (emerald)
  '#E9FF7A', // breakthrough (citrus yellow)
  '#4F46E5', // wilson (indigo)
  '#7C3AED', // wordgen (violet)
  '#0891B2', // amira (cyan)
  '#F59E0B', // tier2 (amber)
  '#DC2626', // camino (red)
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ProgressChart({ students, progressData, groupId, title, studentGoals }: ProgressChartProps) {
  const chartData = useMemo(() => {
    // Filter progress data for this group
    const groupProgress = progressData.filter(p => p.group_id === groupId);

    // Create a line for each student
    const studentLines: StudentLine[] = students.map((student, index) => {
      const studentProgress = groupProgress
        .filter(p => p.student_id === student.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        studentId: student.id,
        studentName: student.name,
        color: STUDENT_COLORS[index % STUDENT_COLORS.length],
        dataPoints: studentProgress.map(p => ({
          date: p.date,
          score: p.score,
          formattedDate: formatDate(p.date),
        })),
      };
    }).filter(line => line.dataPoints.length > 0); // Only include students with data

    return studentLines;
  }, [students, progressData, groupId]);

  // Build goal lookup by student_id
  const goalMap = useMemo(() => {
    const map = new Map<string, StudentGoal>();
    if (studentGoals) {
      studentGoals.forEach(g => map.set(g.student_id, g));
    }
    return map;
  }, [studentGoals]);

  // Get all dates across all students for X-axis
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

  // Calculate Y-axis domain
  const { minScore, maxScore } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    chartData.forEach(line => {
      line.dataPoints.forEach(point => {
        min = Math.min(min, point.score);
        max = Math.max(max, point.score);
      });
    });

    // Include benchmark and goal scores in domain
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

    // Add padding
    const padding = (max - min) * 0.1 || 5;
    return {
      minScore: Math.max(0, Math.floor(min - padding)),
      maxScore: Math.ceil(max + padding),
    };
  }, [chartData, studentGoals]);

  if (chartData.length === 0) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
        )}
        <div className="h-[400px] flex items-center justify-center bg-surface rounded-lg border border-text-muted/20">
          <p className="text-text-muted">No progress data available. Add data points to see the chart.</p>
        </div>
      </div>
    );
  }

  // Chart dimensions (in viewBox units)
  const width = 800;
  const height = 400;
  const padding = { top: 20, right: 30, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (dateIndex: number) => {
    return (dateIndex / Math.max(1, allDates.length - 1)) * chartWidth;
  };

  const yScale = (score: number) => {
    const range = maxScore - minScore;
    return chartHeight - ((score - minScore) / range) * chartHeight;
  };

  // Generate Y-axis ticks
  const yTicks = useMemo(() => {
    const tickCount = 5;
    const range = maxScore - minScore;
    const step = Math.ceil(range / (tickCount - 1));
    const ticks: number[] = [];

    for (let i = 0; i < tickCount; i++) {
      ticks.push(minScore + step * i);
    }

    return ticks;
  }, [minScore, maxScore]);

  // Generate path for each student line
  const generatePath = (line: StudentLine): string => {
    if (line.dataPoints.length === 0) return '';

    const points = line.dataPoints.map(point => {
      const dateIndex = allDates.indexOf(point.date);
      const x = xScale(dateIndex);
      const y = yScale(point.score);
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
      )}

      {/* Chart Container */}
      <div className="bg-surface rounded-lg border border-text-muted/20 p-4">
        {/* SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full max-w-4xl mx-auto"
            style={{ minWidth: '400px', height: 'auto', maxHeight: '450px' }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Horizontal grid lines */}
              {yTicks.map((tick, i) => (
                <line
                  key={`grid-h-${i}`}
                  x1={0}
                  y1={yScale(tick)}
                  x2={chartWidth}
                  y2={yScale(tick)}
                  stroke="#374151"
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                  opacity={0.3}
                />
              ))}

              {/* Vertical grid lines */}
              {allDates.map((date, i) => (
                <line
                  key={`grid-v-${i}`}
                  x1={xScale(i)}
                  y1={0}
                  x2={xScale(i)}
                  y2={chartHeight}
                  stroke="#374151"
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                  opacity={0.3}
                />
              ))}

              {/* Y-axis */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={chartHeight}
                stroke="#9CA3AF"
                strokeWidth="2"
              />

              {/* X-axis */}
              <line
                x1={0}
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="#9CA3AF"
                strokeWidth="2"
              />

              {/* Y-axis ticks and labels */}
              {yTicks.map((tick, i) => (
                <g key={`y-tick-${i}`}>
                  <line
                    x1={-5}
                    y1={yScale(tick)}
                    x2={0}
                    y2={yScale(tick)}
                    stroke="#9CA3AF"
                    strokeWidth="2"
                  />
                  <text
                    x={-10}
                    y={yScale(tick)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="text-xs fill-text-muted"
                  >
                    {tick}
                  </text>
                </g>
              ))}

              {/* Y-axis label */}
              <text
                x={-padding.left + 15}
                y={chartHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(-90, ${-padding.left + 15}, ${chartHeight / 2})`}
                className="text-sm fill-text-muted font-medium"
              >
                Score
              </text>

              {/* X-axis ticks and labels */}
              {allDates.map((date, i) => (
                <g key={`x-tick-${i}`}>
                  <line
                    x1={xScale(i)}
                    y1={chartHeight}
                    x2={xScale(i)}
                    y2={chartHeight + 5}
                    stroke="#9CA3AF"
                    strokeWidth="2"
                  />
                  <text
                    x={xScale(i)}
                    y={chartHeight + 20}
                    textAnchor="end"
                    dominantBaseline="middle"
                    transform={`rotate(-45, ${xScale(i)}, ${chartHeight + 20})`}
                    className="text-xs fill-text-muted"
                  >
                    {formatDate(date)}
                  </text>
                </g>
              ))}

              {/* X-axis label */}
              <text
                x={chartWidth / 2}
                y={chartHeight + padding.bottom - 5}
                textAnchor="middle"
                className="text-sm fill-text-muted font-medium"
              >
                Date
              </text>

              {/* Plot lines for each student */}
              {chartData.map((line) => (
                <g key={line.studentId}>
                  {/* Line path */}
                  <path
                    d={generatePath(line)}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data point dots */}
                  {line.dataPoints.map((point, i) => {
                    const dateIndex = allDates.indexOf(point.date);
                    return (
                      <g key={`${line.studentId}-point-${i}`}>
                        <circle
                          cx={xScale(dateIndex)}
                          cy={yScale(point.score)}
                          r="5"
                          fill={line.color}
                          stroke="#1F2937"
                          strokeWidth="2"
                        />
                        {/* Tooltip group - shown on hover */}
                        <g className="opacity-0 hover:opacity-100 transition-opacity">
                          <rect
                            x={xScale(dateIndex) - 60}
                            y={yScale(point.score) - 35}
                            width="120"
                            height="30"
                            fill="#2D2D30"
                            stroke={line.color}
                            strokeWidth="1"
                            rx="4"
                          />
                          <text
                            x={xScale(dateIndex)}
                            y={yScale(point.score) - 25}
                            textAnchor="middle"
                            className="text-xs fill-text-primary font-medium"
                          >
                            {line.studentName}
                          </text>
                          <text
                            x={xScale(dateIndex)}
                            y={yScale(point.score) - 12}
                            textAnchor="middle"
                            className="text-xs fill-text-muted"
                          >
                            {point.formattedDate}: {point.score}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>
              ))}

              {/* Goal lines, aimlines, and benchmark points per student */}
              {chartData.map((line) => {
                const goal = goalMap.get(line.studentId);
                if (!goal || !goal.benchmark_date || goal.benchmark_score === null) return null;

                const benchmarkDateIndex = allDates.indexOf(goal.benchmark_date);
                const goalDateIndex = goal.goal_target_date ? allDates.indexOf(goal.goal_target_date) : -1;

                return (
                  <g key={`goal-${line.studentId}`}>
                    {/* Benchmark point (diamond) */}
                    {benchmarkDateIndex >= 0 && (
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
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-text-muted/20">
          <div className="flex flex-wrap gap-4">
            {chartData.map((line) => (
              <div key={line.studentId} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-foundation"
                  style={{ backgroundColor: line.color }}
                />
                <span className="text-sm text-text-primary">
                  {line.studentName}
                  <span className="text-text-muted ml-1">
                    ({line.dataPoints.length} data points)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
