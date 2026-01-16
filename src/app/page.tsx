'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Filter, AlertCircle, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Select, Card, CardContent } from '@/components/ui';
import { GroupCard, TodaySchedule, QuickStats } from '@/components/dashboard';
import { useGroupsStore, useFilteredGroups } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { useStudentsStore } from '@/stores/students';
import { useAuthStore } from '@/stores/auth';
import { db } from '@/lib/local-db';
import { fetchAssignedStudentsWithGroupInfo, type StudentWithGroupInfo } from '@/lib/supabase/student-assignments';
import { isMockMode } from '@/lib/supabase/config';
import type { Curriculum, QuickStats as QuickStatsType, Session as SessionType } from '@/lib/supabase/types';

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
  const { groups, fetchGroupsWithVisibility, isLoading: groupsLoading, filter, setFilter } = useGroupsStore();
  const { fetchTodaySessions, fetchAllSessions, allSessions, todaySessions, isLoading: sessionsLoading } = useSessionsStore();
  const { allStudents, fetchAllStudents } = useStudentsStore();
  const { user, userRole, userProfile } = useAuthStore();
  const filteredGroups = useFilteredGroups();

  // Role-based students data for interventionists
  const [assignedStudents, setAssignedStudents] = useState<StudentWithGroupInfo[]>([]);
  const [assignedStudentsLoading, setAssignedStudentsLoading] = useState(false);

  // Stats state
  const [weekSessions, setWeekSessions] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });
  const [pmDataDue, setPmDataDue] = useState(0);

  // Fetch assigned students for interventionists
  const fetchAssignedStudentsData = useCallback(async () => {
    if (!user || userRole !== 'interventionist' || isMockMode()) return;

    setAssignedStudentsLoading(true);
    try {
      const students = await fetchAssignedStudentsWithGroupInfo(user.id);
      setAssignedStudents(students);
    } catch (err) {
      console.error('Error fetching assigned students:', err);
    } finally {
      setAssignedStudentsLoading(false);
    }
  }, [user, userRole]);

  // Fetch groups based on user role
  useEffect(() => {
    if (user && userRole) {
      fetchGroupsWithVisibility(userRole as 'admin' | 'interventionist' | 'teacher', user.id);
    }
  }, [fetchGroupsWithVisibility, user, userRole]);

  // Fetch sessions and students
  useEffect(() => {
    fetchTodaySessions();
    fetchAllSessions();
    fetchAllStudents();

    if (userRole === 'interventionist') {
      fetchAssignedStudentsData();
    }
  }, [fetchTodaySessions, fetchAllSessions, fetchAllStudents, userRole, fetchAssignedStudentsData]);

  // Get the set of group IDs the user owns
  const userGroupIds = useMemo(() => {
    return new Set(groups.map(g => g.id));
  }, [groups]);

  // Filter sessions to only include sessions from user's groups
  const filteredAllSessions = useMemo(() => {
    if (userRole === 'admin') {
      return allSessions;
    }
    // For non-admins, filter to only sessions from groups they own
    return allSessions.filter(session => userGroupIds.has(session.group_id));
  }, [allSessions, userGroupIds, userRole]);

  // Filter today's sessions to only include sessions from user's groups
  const filteredTodaySessions = useMemo(() => {
    if (userRole === 'admin') {
      return todaySessions;
    }
    // For non-admins, filter to only sessions from groups they own
    return todaySessions.filter(session => userGroupIds.has(session.groupId));
  }, [todaySessions, userGroupIds, userRole]);

  // Calculate the number of students the user has access to
  const displayStudentsCount = useMemo(() => {
    if (userRole === 'admin') {
      return allStudents.length;
    }
    if (userRole === 'teacher' && userProfile?.grade_level) {
      return allStudents.filter(s => s.grade_level === userProfile.grade_level).length;
    }
    if (userRole === 'interventionist') {
      return assignedStudents.length;
    }
    return 0;
  }, [userRole, userProfile, allStudents, assignedStudents]);

  // Calculate sessions this week from IndexedDB - filtered by user's groups
  useEffect(() => {
    async function calculateWeekStats() {
      try {
        const { start, end } = getCurrentWeekDates();
        let sessions = await db.sessions
          .where('date')
          .between(start, end, true, true)
          .toArray();

        // Filter by user's groups if not admin
        // Note: IndexedDB uses numeric IDs, Supabase uses string IDs, so we convert
        if (userRole !== 'admin' && userGroupIds.size > 0) {
          sessions = sessions.filter(s => userGroupIds.has(String(s.group_id)));
        } else if (userRole !== 'admin' && userGroupIds.size === 0) {
          sessions = [];
        }

        setWeekSessions({
          total: sessions.length,
          completed: sessions.filter(s => s.status === 'completed').length,
        });
      } catch (error) {
        console.error('Error calculating week stats:', error);
      }
    }
    calculateWeekStats();
  }, [allSessions, userRole, userGroupIds]); // Re-calculate when sessions or user groups change

  // Calculate PM data points due (Tier 3 students need weekly PM, Tier 2 bi-weekly)
  // Filtered by user's groups
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

          // For non-admins, only count students in their groups
          // Note: IndexedDB uses numeric IDs, Supabase uses string IDs, so we convert
          if (userRole !== 'admin' && !userGroupIds.has(String(group.id))) {
            continue;
          }

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
  }, [allStudents, groups, userRole, userGroupIds]);

  // Calculate groups needing attention (no sessions in past 7 days or mastery = 'no')
  // Filtered by user's groups
  const groupsNeedingAttention = useMemo(() => {
    // Use filtered sessions based on user role
    if (!filteredAllSessions || filteredAllSessions.length === 0) {
      // If no sessions, all groups need attention
      return groups.length;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const groupsWithRecentSessions = new Set<string>();
    const groupsWithNoMastery = new Set<string>();

    filteredAllSessions.forEach(session => {
      // Check for recent sessions
      if (session.date >= sevenDaysAgoStr) {
        groupsWithRecentSessions.add(session.group_id);
      }
      // Check for no mastery
      if (session.status === 'completed' && session.mastery_demonstrated === 'no') {
        groupsWithNoMastery.add(session.group_id);
      }
    });

    // Count groups without recent sessions (only from user's groups)
    const groupsWithoutRecentSessions = groups.filter(g => !groupsWithRecentSessions.has(g.id)).length;

    // Groups needing attention = no recent sessions OR recent session with no mastery
    return groupsWithoutRecentSessions + groupsWithNoMastery.size;
  }, [groups, filteredAllSessions]);

  /**
   * Dashboard Statistics
   *
   * - totalStudents: Total students visible to the user
   * - totalGroups: Total groups visible to the user
   * - totalSessions: Total sessions from user's groups
   * - sessionsThisWeek: Total sessions scheduled for current week (Sun-Sat)
   * - sessionsCompleted: Sessions marked as completed this week
   * - groupsNeedingAttention: Groups with no sessions in 7 days OR recent 'no' mastery
   * - pmDataPointsDue: Students needing PM data (Tier 3: weekly, Tier 2: bi-weekly)
   */
  const stats: QuickStatsType = {
    totalStudents: displayStudentsCount,
    totalGroups: groups.length,
    totalSessions: filteredAllSessions.length,
    sessionsThisWeek: weekSessions.total,
    sessionsCompleted: weekSessions.completed,
    groupsNeedingAttention,
    pmDataPointsDue: pmDataDue,
  };

  // Check if user has no data (new user state)
  const isNewUser = !groupsLoading && groups.length === 0 && userRole !== 'admin';
  const isAdmin = userRole === 'admin';

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-sm md:text-base text-text-muted mt-1">
              {isAdmin
                ? 'Welcome back! Here\'s your system-wide overview.'
                : 'Welcome back! Here\'s your intervention overview.'}
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto min-h-[44px]">
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </Button>
        </div>

        {/* New User State - No assignments yet */}
        {isNewUser ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No Data Yet</h3>
                <p className="text-text-muted max-w-md mx-auto">
                  {userRole === 'interventionist'
                    ? 'You don\'t have any students assigned or groups created yet. Contact your administrator to get students assigned, then create intervention groups.'
                    : userRole === 'teacher'
                    ? 'You don\'t have any groups created yet. Create a group using students from your grade level.'
                    : 'Your account hasn\'t been fully configured yet. Please contact your administrator to get started.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quick Stats */}
            <QuickStats stats={stats} isLoading={groupsLoading} isAdmin={isAdmin} />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Groups List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base sm:text-lg font-semibold text-text-primary">
                    {isAdmin ? 'All Groups' : 'Your Groups'}
                  </h2>
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
                    <p className="text-text-muted mb-4">
                      {filter.curriculum !== 'all' || filter.tier !== 'all'
                        ? 'No groups match your filters'
                        : 'No groups found'}
                    </p>
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
                  sessions={filteredTodaySessions}
                  isLoading={sessionsLoading}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
