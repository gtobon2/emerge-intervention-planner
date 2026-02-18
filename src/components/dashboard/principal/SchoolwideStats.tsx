'use client';

import { useMemo } from 'react';
import { Users, Folders, UserCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Group, Session, Student } from '@/lib/supabase/types';

interface SchoolwideStatsProps {
  groups: Group[];
  allStudents: Student[];
  allSessions: Session[];
  pmDataByTier: { tier2Due: number; tier3Due: number };
  isLoading?: boolean;
}

export function SchoolwideStats({
  groups,
  allStudents,
  allSessions,
  pmDataByTier,
  isLoading,
}: SchoolwideStatsProps) {
  const stats = useMemo(() => {
    const totalStudents = allStudents.length;
    const activeGroups = groups.length;

    // Unique owner_ids with at least one group
    const interventionistIds = new Set(
      groups.map((g) => g.owner_id).filter(Boolean)
    );
    const interventionistsActive = interventionistIds.size;

    // Session compliance: completed / total this week
    const totalWeekSessions = allSessions.length;
    const completedWeekSessions = allSessions.filter(
      (s) => s.status === 'completed'
    ).length;
    const complianceRate =
      totalWeekSessions > 0
        ? Math.round((completedWeekSessions / totalWeekSessions) * 100)
        : 0;

    const pmOverdue = pmDataByTier.tier2Due + pmDataByTier.tier3Due;

    return { totalStudents, activeGroups, interventionistsActive, complianceRate, pmOverdue, totalWeekSessions };
  }, [groups, allStudents, allSessions, pmDataByTier]);

  const complianceColor =
    stats.complianceRate >= 80
      ? 'text-green-500'
      : stats.complianceRate >= 50
        ? 'text-amber-500'
        : 'text-red-500';

  const statCards = [
    {
      label: 'Students in Intervention',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-movement',
    },
    {
      label: 'Active Groups',
      value: stats.activeGroups,
      icon: Folders,
      color: 'text-indigo-500',
    },
    {
      label: 'Interventionists Active',
      value: stats.interventionistsActive,
      icon: UserCheck,
      color: 'text-cyan-500',
    },
    {
      label: 'Session Compliance',
      value: stats.totalWeekSessions > 0 ? `${stats.complianceRate}%` : 'N/A',
      icon: CheckCircle,
      color: stats.totalWeekSessions > 0 ? complianceColor : 'text-text-muted',
    },
    {
      label: 'PM Overdue',
      value: stats.pmOverdue,
      icon: AlertTriangle,
      color: stats.pmOverdue > 0 ? 'text-red-500' : 'text-text-muted',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {statCards.map((item) => (
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
