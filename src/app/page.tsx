'use client';

import { useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Select } from '@/components/ui';
import { GroupCard, TodaySchedule, QuickStats } from '@/components/dashboard';
import { useGroupsStore, useFilteredGroups } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import type { Curriculum, QuickStats as QuickStatsType } from '@/lib/supabase/types';

const curriculumOptions = [
  { value: 'all', label: 'All Curricula' },
  { value: 'wilson', label: 'Wilson Reading' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

export default function DashboardPage() {
  const { fetchGroups, isLoading: groupsLoading, filter, setFilter } = useGroupsStore();
  const { fetchTodaySessions, todaySessions, isLoading: sessionsLoading } = useSessionsStore();
  const filteredGroups = useFilteredGroups();

  useEffect(() => {
    fetchGroups();
    fetchTodaySessions();
  }, [fetchGroups, fetchTodaySessions]);

  // Calculate quick stats (would be fetched from API in production)
  const stats: QuickStatsType = {
    sessionsThisWeek: todaySessions.length * 5, // Placeholder
    sessionsCompleted: todaySessions.filter(s => s.status === 'completed').length,
    groupsNeedingAttention: 0,
    pmDataPointsDue: 3,
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-sm md:text-base text-text-muted mt-1">
              Welcome back! Here&apos;s your intervention overview.
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto min-h-[44px]">
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <QuickStats stats={stats} isLoading={groupsLoading} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Groups List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-text-primary">Your Groups</h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-muted hidden sm:block" />
                <Select
                  options={curriculumOptions}
                  value={filter.curriculum}
                  onChange={(e) => setFilter({ curriculum: e.target.value as Curriculum | 'all' })}
                  className="w-full sm:w-40"
                />
              </div>
            </div>

            {groupsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-surface rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-xl">
                <p className="text-text-muted mb-4">No groups found</p>
                <Button variant="secondary" className="min-h-[44px]">Create Your First Group</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    studentCount={0} // Would be fetched
                  />
                ))}
              </div>
            )}
          </div>

          {/* Today's Schedule */}
          <div className="order-first lg:order-last">
            <TodaySchedule
              sessions={todaySessions}
              isLoading={sessionsLoading}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
