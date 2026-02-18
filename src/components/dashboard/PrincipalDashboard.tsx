'use client';

import Link from 'next/link';
import { BarChart3, Settings, RefreshCw, ArrowRight, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  SchoolwideStats,
  GroupHealthGrid,
  InterventionistRoster,
  PMCompliancePanel,
} from './principal';
import { RecentActivity } from './RecentActivity';
import type { Group, Session, Student, InterventionCycle, SchoolCalendarEvent, TodaySession } from '@/lib/supabase/types';

interface PrincipalDashboardProps {
  groups: Group[];
  allStudents: Student[];
  allSessions: Session[];
  todaySessions: TodaySession[];
  pmDataByTier: { tier2Due: number; tier3Due: number };
  pmCollectedThisWeek: number;
  weekSessions: { total: number; completed: number };
  currentCycle: InterventionCycle | null;
  groupsNeedingAttention: number;
  isLoading: boolean;
  upcomingNonStudentDays: SchoolCalendarEvent[];
}

export function PrincipalDashboard({
  groups,
  allStudents,
  allSessions,
  todaySessions,
  pmDataByTier,
  weekSessions,
  currentCycle,
  isLoading,
  upcomingNonStudentDays,
}: PrincipalDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Principal Overview
          </h1>
          {currentCycle && (
            <p className="text-sm text-text-muted mt-1">
              {currentCycle.name} &middot; Week{' '}
              {getCurrentWeek(currentCycle)} of {currentCycle.weeks_count}
            </p>
          )}
        </div>
        {upcomingNonStudentDays.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg">
            <Calendar className="w-4 h-4" />
            <span>
              Upcoming: {upcomingNonStudentDays[0].title} (
              {new Date(upcomingNonStudentDays[0].date).toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric' }
              )}
              )
            </span>
          </div>
        )}
      </div>

      {/* Schoolwide Stats */}
      <SchoolwideStats
        groups={groups}
        allStudents={allStudents}
        allSessions={allSessions}
        pmDataByTier={pmDataByTier}
        isLoading={isLoading}
      />

      {/* Main content: 2/3 + 1/3 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Group Health Grid */}
        <div className="lg:col-span-2">
          <GroupHealthGrid
            groups={groups}
            allSessions={allSessions}
            allStudents={allStudents}
            isLoading={isLoading}
          />
        </div>

        {/* Right column: Roster + PM + Quick Actions */}
        <div className="space-y-6">
          <InterventionistRoster />
          <PMCompliancePanel pmDataByTier={pmDataByTier} />

          {/* Quick Actions */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-text-muted mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href="/reports" className="block">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-foundation transition-colors">
                  <BarChart3 className="w-4 h-4 text-movement" />
                  <span className="text-sm text-text-primary">
                    View Reports
                  </span>
                  <ArrowRight className="w-3 h-3 text-text-muted ml-auto" />
                </div>
              </Link>
              <Link href="/admin" className="block">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-foundation transition-colors">
                  <Settings className="w-4 h-4 text-movement" />
                  <span className="text-sm text-text-primary">
                    Admin Settings
                  </span>
                  <ArrowRight className="w-3 h-3 text-text-muted ml-auto" />
                </div>
              </Link>
              <Link href="/admin/cycles" className="block">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-foundation transition-colors">
                  <RefreshCw className="w-4 h-4 text-movement" />
                  <span className="text-sm text-text-primary">
                    Manage Cycles
                  </span>
                  <ArrowRight className="w-3 h-3 text-text-muted ml-auto" />
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}

function getCurrentWeek(cycle: InterventionCycle): number {
  const now = new Date();
  const start = new Date(cycle.start_date);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(1, weekNumber), cycle.weeks_count);
}
