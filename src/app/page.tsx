'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Filter, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Select } from '@/components/ui';
import { GroupCard, TodaySchedule, QuickStats } from '@/components/dashboard';
import { CreateGroupModal } from '@/components/forms';
import { useGroupsStore, useFilteredGroups } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import type { Curriculum, QuickStats as QuickStatsType, Session } from '@/lib/supabase/types';

const curriculumOptions = [
  { value: 'all', label: 'All Curricula' },
  { value: 'wilson', label: 'Wilson Reading' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

// Helper to get week boundaries
function getWeekBoundaries() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return { weekStart, weekEnd };
}

export default function DashboardPage() {
  const { groups, fetchGroups, isLoading: groupsLoading, filter, setFilter } = useGroupsStore();
  const { fetchTodaySessions, todaySessions, isLoading: sessionsLoading } = useSessionsStore();
  const filteredGroups = useFilteredGroups();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchTodaySessions();
  }, [fetchGroups, fetchTodaySessions]);

  // Fetch all sessions from all groups for stats
  useEffect(() => {
    const fetchAllSessions = async () => {
      if (groups.length === 0) return;

      setLoadingSessions(true);
      const sessionsPromises = groups.map(async (group) => {
        const response = await fetch(`/api/sessions?groupId=${group.id}`);
        if (response.ok) {
          return response.json();
        }
        return [];
      });

      const results = await Promise.all(sessionsPromises);
      setAllSessions(results.flat());
      setLoadingSessions(false);
    };

    fetchAllSessions();
  }, [groups]);

  const handleGroupCreated = () => {
    fetchGroups(); // Refresh groups list
  };

  // Calculate quick stats
  const stats: QuickStatsType = useMemo(() => {
    const { weekStart, weekEnd } = getWeekBoundaries();

    const sessionsThisWeek = allSessions.filter((s) => {
      const sessionDate = new Date(s.date);
      return sessionDate >= weekStart && sessionDate < weekEnd;
    }).length;

    const completedThisWeek = allSessions.filter((s) => {
      const sessionDate = new Date(s.date);
      return (
        sessionDate >= weekStart &&
        sessionDate < weekEnd &&
        s.status === 'completed'
      );
    }).length;

    return {
      sessionsThisWeek,
      sessionsCompleted: completedThisWeek,
      groupsNeedingAttention: 0, // Could be calculated based on PM trends
      pmDataPointsDue: 0, // Could be calculated based on schedule
    };
  }, [allSessions]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-muted">
              Welcome back! Here&apos;s your intervention overview.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowCreateGroup(true)}>
            <Users className="w-4 h-4" />
            New Group
          </Button>
        </div>

        {/* Quick Stats */}
        <QuickStats stats={stats} isLoading={groupsLoading} />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Your Groups</h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-muted" />
                <Select
                  options={curriculumOptions}
                  value={filter.curriculum}
                  onChange={(e) => setFilter({ curriculum: e.target.value as Curriculum | 'all' })}
                  className="w-40"
                />
              </div>
            </div>

            {groupsLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-surface rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-12 bg-surface rounded-xl">
                <p className="text-text-muted mb-4">No groups found</p>
                <Button variant="secondary" onClick={() => setShowCreateGroup(true)}>
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    studentCount={group.students?.length || 0}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Today's Schedule */}
          <div>
            <TodaySchedule
              sessions={todaySessions}
              isLoading={sessionsLoading}
            />
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={handleGroupCreated}
      />
    </AppLayout>
  );
}
