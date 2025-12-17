'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Select } from '@/components/ui';
import { GroupCard, TodaySchedule, QuickStats } from '@/components/dashboard';
import { useGroupsStore, useFilteredGroups } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { useStudentsStore } from '@/stores/students';
import { db } from '@/lib/local-db';
import type { Curriculum, QuickStats as QuickStatsType } from '@/lib/supabase/types';

const curriculumOptions = [
  { value: 'all', label: 'All Curricula' },
  { value: 'wilson', label: 'Wilson Reading' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

/**
 * Get the start and end dates for the current week (Sunday to Saturday)
 */
function getCurrentWeekDates(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    start: startOfWeek.toISOString().split('T')[0],
    end: endOfWeek.toISOString().split('T')[0],
  };
}

export default function DashboardPage() {
  const { groups, fetchGroups, isLoading: groupsLoading, filter, setFilter } = useGroupsStore();
  const { fetchTodaySessions, fetchAllSessions, allSessions, todaySessions, isLoading: sessionsLoading } = useSessionsStore();
  const { allStudents, fetchAllStudents } = useStudentsStore();
  const filteredGroups = useFilteredGroups();

  // Stats state
  const [weekSessions, setWeekSessions] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });
  const [pmDataDue, setPmDataDue] = useState(0);

  useEffect(() => {
    fetchGroups();
    fetchTodaySessions();
    fetchAllSessions();
    fetchAllStudents();
  }, [fetchGroups, fetchTodaySessions, fetchAllSessions, fetchAllStudents]);

  // Calculate sessions this week from IndexedDB
  useEffect(() => {
    async function calculateWeekStats() {
      try {
        const { start, end } = getCurrentWeekDates();
        const sessions = await db.sessions
          .where('date')
          .between(start, end, true, true)
          .toArray();

        setWeekSessions({
          total: sessions.length,
          completed: sessions.filter(s => s.status === 'completed').length,
        });
      } catch (error) {
        console.error('Error calculating week stats:', error);
      }
    }
    calculateWeekStats();
  }, [allSessions]); // Re-calculate when sessions change

  // Calculate PM data points due (Tier 3 students need weekly PM, Tier 2 bi-weekly)
  useEffect(() => {
    async function calculatePMDue() {
      try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Get all students with their group info
        const students = await db.students.toArray();
        const groupsData = await db.groups.toArray();
        const pmRecords = await db.progressMonitoring.toArray();

        let dueCount = 0;

        for (const student of students) {
          const group = groupsData.find(g => g.id === student.group_id);
          if (!group) continue;

          // Get most recent PM for this student
          const studentPM = pmRecords
            .filter(pm => pm.student_id === student.id)
            .sort((a, b) => b.date.localeCompare(a.date))[0];

          const lastPMDate = studentPM?.date || '1970-01-01';

          // Tier 3 needs weekly PM, Tier 2 needs bi-weekly
          if (group.tier === 3 && lastPMDate < oneWeekAgo) {
            dueCount++;
          } else if (group.tier === 2 && lastPMDate < twoWeeksAgo) {
            dueCount++;
          }
        }

        setPmDataDue(dueCount);
      } catch (error) {
        console.error('Error calculating PM due:', error);
      }
    }
    calculatePMDue();
  }, [allStudents, groups]);

  // Calculate groups needing attention (no sessions in past 7 days or mastery = 'no')
  const groupsNeedingAttention = useMemo(() => {
    if (!allSessions || allSessions.length === 0) return 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const groupsWithRecentSessions = new Set<string>();
    const groupsWithNoMastery = new Set<string>();

    allSessions.forEach(session => {
      // Check for recent sessions
      if (session.date >= sevenDaysAgoStr) {
        groupsWithRecentSessions.add(session.group_id);
      }
      // Check for no mastery
      if (session.status === 'completed' && session.mastery_demonstrated === 'no') {
        groupsWithNoMastery.add(session.group_id);
      }
    });

    // Count groups without recent sessions
    const groupsWithoutRecentSessions = groups.filter(g => !groupsWithRecentSessions.has(g.id)).length;

    // Groups needing attention = no recent sessions OR recent session with no mastery
    return groupsWithoutRecentSessions + groupsWithNoMastery.size;
  }, [groups, allSessions]);

  /**
   * Dashboard Statistics
   *
   * - sessionsThisWeek: Total sessions scheduled for current week (Sun-Sat)
   * - sessionsCompleted: Sessions marked as completed this week
   * - groupsNeedingAttention: Groups with no sessions in 7 days OR recent 'no' mastery
   * - pmDataPointsDue: Students needing PM data (Tier 3: weekly, Tier 2: bi-weekly)
   */
  const stats: QuickStatsType = {
    sessionsThisWeek: weekSessions.total,
    sessionsCompleted: weekSessions.completed,
    groupsNeedingAttention,
    pmDataPointsDue: pmDataDue,
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
