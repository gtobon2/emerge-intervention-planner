'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { PMTrend } from '@/lib/supabase/types';

interface PMSectionProps {
  score: number | null;
  onChange: (score: number | null) => void;
  previousScores?: number[];
  trend?: PMTrend | null;
  disabled?: boolean;
}

/**
 * PMSection - Progress monitoring score input for Tier 3 groups.
 * Shows a single numeric input and a trend indicator if previous scores exist.
 */
export function PMSection({
  score,
  onChange,
  previousScores = [],
  trend,
  disabled = false,
}: PMSectionProps) {
  const [scoreStr, setScoreStr] = useState(score?.toString() ?? '');

  useEffect(() => {
    setScoreStr(score?.toString() ?? '');
  }, [score]);

  const handleChange = (val: string) => {
    setScoreStr(val);
    if (val === '') {
      onChange(null);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'flat':
        return <Minus className="w-4 h-4 text-amber-400" />;
    }
  };

  const getTrendLabel = () => {
    if (!trend) return null;
    switch (trend) {
      case 'improving':
        return <span className="text-green-400 text-xs font-medium">Improving</span>;
      case 'declining':
        return <span className="text-red-400 text-xs font-medium">Declining</span>;
      case 'flat':
        return <span className="text-amber-400 text-xs font-medium">Flat</span>;
    }
  };

  // Calculate a simple visual sparkline from previous scores
  const hasHistory = previousScores.length > 0;
  const allScores = hasHistory
    ? [...previousScores, ...(score !== null ? [score] : [])]
    : [];
  const maxScore = allScores.length > 0 ? Math.max(...allScores) : 0;
  const minScore = allScores.length > 0 ? Math.min(...allScores) : 0;
  const range = maxScore - minScore || 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-text-muted" />
        <span className="text-sm font-medium text-text-primary">Progress Monitoring Score</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-tier3/20 text-tier3 border border-tier3/30 font-medium">
          Tier 3
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-[200px]">
          <Input
            type="number"
            min={0}
            step="any"
            placeholder="Score"
            value={scoreStr}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className="text-center min-h-[44px] text-lg font-semibold"
          />
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated">
            {getTrendIcon()}
            {getTrendLabel()}
          </div>
        )}
      </div>

      {/* Sparkline from previous scores */}
      {hasHistory && (
        <div className="space-y-1.5">
          <span className="text-xs text-text-muted">Recent scores</span>
          <div className="flex items-end gap-1 h-10">
            {allScores.map((s, i) => {
              const height = Math.max(((s - minScore) / range) * 100, 10);
              const isCurrent = i === allScores.length - 1 && score !== null;
              return (
                <div
                  key={i}
                  className={`
                    flex-1 max-w-[24px] rounded-t transition-all
                    ${isCurrent ? 'bg-movement' : 'bg-text-muted/20'}
                  `}
                  style={{ height: `${height}%` }}
                  title={`${s}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
