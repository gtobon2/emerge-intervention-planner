'use client';

import { Calendar, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { QuickStats as QuickStatsType } from '@/lib/supabase/types';

interface QuickStatsProps {
  stats: QuickStatsType;
  isLoading?: boolean;
}

export function QuickStats({ stats, isLoading }: QuickStatsProps) {
  const statItems = [
    {
      label: 'Sessions This Week',
      value: stats.sessionsThisWeek,
      icon: Calendar,
      color: 'text-movement'
    },
    {
      label: 'Completed',
      value: stats.sessionsCompleted,
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      label: 'Needs Attention',
      value: stats.groupsNeedingAttention,
      icon: AlertTriangle,
      color: stats.groupsNeedingAttention > 0 ? 'text-tier3' : 'text-text-muted'
    },
    {
      label: 'PM Data Due',
      value: stats.pmDataPointsDue,
      icon: TrendingUp,
      color: stats.pmDataPointsDue > 0 ? 'text-tier2' : 'text-text-muted'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label} className="p-4">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 w-16 bg-foundation rounded mb-2" />
              <div className="h-4 w-24 bg-foundation rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className={`text-2xl font-bold ${item.color}`}>
                  {item.value}
                </span>
              </div>
              <p className="text-sm text-text-muted">{item.label}</p>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
