'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PMTrend } from '@/lib/supabase/types';

export interface TrendIndicatorProps {
  trend: PMTrend | null;
  slope?: number;
  className?: string;
}

export function TrendIndicator({ trend, slope, className = '' }: TrendIndicatorProps) {
  // Determine trend if not provided
  const determinedTrend = trend || (slope && slope > 0.1 ? 'improving' : slope && slope < -0.1 ? 'declining' : 'flat');

  const config = {
    improving: {
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      label: 'Improving',
      description: 'Student is making progress toward the goal',
    },
    declining: {
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      label: 'Declining',
      description: 'Student performance is decreasing',
    },
    flat: {
      icon: Minus,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      label: 'Flat',
      description: 'Student progress is stable',
    },
  };

  const { icon: Icon, color, bg, border, label, description } = config[determinedTrend];

  return (
    <div className={`p-4 rounded-lg border ${bg} ${border} ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold ${color}`}>{label}</h3>
            {slope !== undefined && (
              <span className="text-xs text-text-muted">
                (slope: {slope > 0 ? '+' : ''}{slope.toFixed(2)})
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
