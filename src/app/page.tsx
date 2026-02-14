'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Filter, AlertCircle, Users, CalendarDays, Ban, Calendar } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Select, Card, CardContent } from '@/components/ui';
import { GroupCard, TodaySchedule, QuickStats, ActionItems, WeeklySnapshot, RecentActivity } from '@/components/dashboard';
import { useGroupsStore, useFilteredGroups } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { useStudentsStore } from '@/stores/students';
import { useAuthStore } from '@/stores/auth';
import { useCyclesStore, getWeekOfCycle, getCycleProgress } from '@/stores/cycles';
import { useSchoolCalendarStore } from '@/stores/school-calendar';
import { db } from '@/lib/local-db';
import { fetchAssignedStudentsWithGroupInfo, type StudentWithGroupInfo } from '@/lib/supabase/student-assignments';
import { isMockMode } from '@/lib/supabase/config';
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';
import { useGoalsStore } from '@/stores/goals';
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
  const { fetchTodaySessionsByRole, fetchSessionsByRole, allSessions, todaySessions, isLoading: sessionsLoading } = useSessionsStore();
  const { allStudents, fetchAllStudents } = useStudentsStore();
  const { user, userRole, userProfile } = useAuthStore();
  const { currentCycle, fetchCurrentCycle } = useCyclesStore();
  const { events: calendarEvents, fetchAllEvents, getUpcomingNonStudentDays } = useSchoolCalendarStore();
  const filteredGroups = useFilteredGroups();

  // Upcoming non-student days for display
  const upcomingNonStudentDays = useMemo(() => {
    return getUpcomingNonStudentDays(7); // Next 7 days
  }, [calendarEvents, getUpcomingNonStudentDays]);

  // Role-based students data for interventionists
  const [assignedStudents, setAssignedStudents] = useState<StudentWithGroupInfo[]>([]);
  const [assignedStudentsLoading, setAssignedStudentsLoading] = useState(false);

  // Stats state
  const [weekSessions, setWeekSessions] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });
  const [pmDataDue, setPmDataDue] = useState(0);

  // Notification & action items state
  const { generateReminders, generateDecisionAlerts, generateAttendanceFlags, generateGoalAlerts } = useNotificationsStore();
  const { notificationPreferences } = useSettingsStore();
  const { goals, fetchGoalsForGroup } = useGoalsStore();
  const [decisionAlertCount, setDecisionAlertCount] = useState(0);
  const [attendanceFlagCount, setAttendanceFlagCount] = useState(0);
  const [pmCollectedThisWeek, setPmCollectedThisWeek] = useState(0);

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

  // Fetch cycle and calendar data
  useEffect(() => {
    fetchCurrentCycle();
    fetchAllEvents();
  }, [fetchCurrentCycle, fetchAllEvents]);

  // Fetch sessions and students based on user role
  useEffect(() => {
    if (user && userRole) {
      // Fetch sessions filtered by role at the database level
      const role = userRole as 'admin' | 'interventionist' | 'teacher';
      fetchSessionsByRole(role, user.id);
      fetchTodaySessionsByRole(role, user.id);

      // Fetch students based on role
      // Admins get all students, teachers need all students to filter by grade level
      if (role === 'admin' || role === 'teacher') {
        fetchAllStudents();
      }

      // Interventionists fetch their assigned students
      if (role === 'interventionist') {
        fetchAssignedStudentsData();
      }
    }
  }, [fetchSessionsByRole, fetchTodaySessionsByRole, fetchAllStudents, user, userRole, fetchAssignedStudentsData]);

  // Get the set of group IDs the user owns
  // This is used for IndexedDB filtering and other client-side operations
  const userGroupIds = useMemo(() => {
    return new Set(groups.map(g => g.id));
  }, [groups]);

  // Sessions are now fetched filtered by role at the database level
  // These values come directly from the store (already role-filtered)
  // We just need to handle the case where data hasn't loaded yet
  const filteredAllSessions = useMemo(() => {
    // If no user role yet, don't show any sessions (security default)
    if (!userRole) {
      return [];
    }
    // Sessions are already filtered by role from fetchSessionsByRole
    return allSessions;
  }, [allSessions, userRole]);

  // Today's sessions are also fetched filtered by role at the database level
  const filteredTodaySessions = useMemo(() => {
    // If no user role yet, don't show any sessions (security default)
    if (!userRole) {
      return [];
    }
    // Sessions are already filtered by role from fetchTodaySessionsByRole
    return todaySessions;
  }, [todaySessions, userRole]);

  // Calculate the number of students the user has access to
  // IMPORTANT: Non-admins should ONLY see students they have access to
  const displayStudentsCount = useMemo(() => {
    // If no user role yet, show 0 (security default)
    if (!userRole) {
      return 0;
    }
    // Admins see all students
    if (userRole === 'admin') {
      return allStudents.length;
    }
    // Teachers see students in their grade level only
    if (userRole === 'teacher' && userProfile?.grade_level) {
      return allStudents.filter(s => s.grade_level === userProfile.grade_level).length;
    }
    // Interventionists see only their assigned students
    if (userRole === 'interventionist') {
      return assignedStudents.length;
    }
    // Default: show 0 for users without proper role
    return 0;
  }, [userRole, userProfile, allStudents, assignedStudents]);

  // Calculate sessions this week from the role-filtered allSessions
  // allSessions is already filtered by role at the database level
  useEffect(() => {
    const { start, end } = getCurrentWeekDates();

    // Filter to sessions this week (allSessions is already role-filtered)
    const weekSessionsData = filteredAllSessions.filter(session => {
      return session.date >= start && session.date <= end;
    });

    setWeekSessions({
      total: weekSessionsData.length,
      completed: weekSessionsData.filter(s => s.status === 'completed').length,
    });
  }, [filteredAllSessions]); // Re-calculate when role-filtered sessions change

  // Calculate PM data points due (Tier 3 students need weekly PM, Tier 2 bi-weekly)
  // Uses groups from the store (already role-filtered)
  useEffect(() => {
    async function calculatePMDue() {
      try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Get PM records from IndexedDB
        const pmRecords = await db.progressMonitoring.toArray();
        // Get students from IndexedDB
        const allStudentsData = await db.students.toArray();

        let dueCount = 0;

        // Use the groups from store which are already role-filtered
        for (const group of groups) {
          // Find students in this group
          const groupStudents = allStudentsData.filter(s => String(s.group_id) === group.id);

          for (const student of groupStudents) {
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
        }

        setPmDataDue(dueCount);
      } catch (error) {
        console.error('Error calculating PM due:', error);
      }
    }
    calculatePMDue();
  }, [groups]); // groups is already role-filtered from fetchGroupsWithVisibility

  // Auto-generate notifications and calculate action item counts
  useEffect(() => {
    async function generateNotifications() {
      try {
        const allStudentsData = await db.students.toArray();
        const pmRecords = await db.progressMonitoring.toArray();
        const allGoals = await db.studentGoals.toArray();
        const allSess = await db.sessions.toArray();

        // Decision rule alerts
        if (notificationPreferences.decisionRuleAlerts) {
          const pmData = allStudentsData.map(student => {
            const studentPMs = pmRecords
              .filter(pm => pm.student_id === student.id)
              .sort((a, b) => a.date.localeCompare(b.date));
            const studentGoal = allGoals.find(g => g.student_id === student.id);
            const group = groups.find(g => String(g.id) === String(student.group_id));
            return {
              student_id: student.id!,
              student_name: student.name,
              group_id: student.group_id,
              group_name: group?.name || 'Unknown',
              scores: studentPMs.map(pm => pm.score),
              goal: studentGoal?.goal_score ?? null,
            };
          }).filter(d => d.goal !== null && d.scores.length >= 4);

          let alertCount = 0;
          for (const d of pmData) {
            const last4 = d.scores.slice(-4);
            if (last4.every(s => s < d.goal!) || last4.every(s => s >= d.goal!)) {
              alertCount++;
            }
          }
          setDecisionAlertCount(alertCount);
          generateDecisionAlerts(pmData);
        }

        // Attendance flags
        if (notificationPreferences.attendanceFlags) {
          const completedSessions = allSess
            .filter(s => s.status === 'completed')
            .sort((a, b) => a.date.localeCompare(b.date));

          // Simple heuristic: students in groups with sessions but no tracking data
          // (Full attendance tracking would need the attendance store)
          setAttendanceFlagCount(0);
        }

        // Goal not set alerts
        if (notificationPreferences.goalNotSetAlerts) {
          const studentsWithoutGoals = allStudentsData.filter(student => {
            return !allGoals.some(g => g.student_id === student.id);
          }).map(student => {
            const group = groups.find(g => String(g.id) === String(student.group_id));
            return {
              student_name: student.name,
              group_name: group?.name || 'Unknown',
              group_id: student.group_id,
            };
          });
          generateGoalAlerts(studentsWithoutGoals);
        }

        // PM collected this week
        const { start, end } = getCurrentWeekDates();
        const pmThisWeek = pmRecords.filter(pm => pm.date >= start && pm.date <= end);
        setPmCollectedThisWeek(pmThisWeek.length);

      } catch {
        // Non-critical — silently fail
      }
    }

    if (groups.length > 0) {
      generateNotifications();
    }
  }, [groups, notificationPreferences, generateDecisionAlerts, generateAttendanceFlags, generateGoalAlerts]);

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
            {/* Cycle & Calendar Info Banner */}
            {(currentCycle || upcomingNonStudentDays.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Cycle Info */}
                {currentCycle && (
                  <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-text-primary">{currentCycle.name}</div>
                        <div className="text-sm text-text-muted mt-1">
                          Week {getWeekOfCycle(currentCycle, new Date())} • {getCycleProgress(currentCycle)}% complete
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          {new Date(currentCycle.start_date).toLocaleDateString()} - {new Date(currentCycle.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Upcoming Non-Student Days */}
                {upcomingNonStudentDays.length > 0 && (
                  <Card className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <Ban className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-amber-800 dark:text-amber-200">
                          Upcoming Non-Student Days
                        </div>
                        <div className="mt-2 space-y-1">
                          {upcomingNonStudentDays.slice(0, 3).map((event) => (
                            <div key={event.id} className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {' - '}
                                {event.title}
                              </span>
                            </div>
                          ))}
                          {upcomingNonStudentDays.length > 3 && (
                            <div className="text-xs text-amber-600 dark:text-amber-400">
                              +{upcomingNonStudentDays.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <QuickStats stats={stats} isLoading={groupsLoading} isAdmin={isAdmin} />

            {/* Action Items */}
            <ActionItems
              pmDue={pmDataDue}
              decisionAlerts={decisionAlertCount}
              incompleteSessionsThisWeek={weekSessions.total - weekSessions.completed}
              attendanceFlags={attendanceFlagCount}
            />

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

              {/* Today's Schedule & Weekly Snapshot */}
              <div className="order-first lg:order-last space-y-4">
                <TodaySchedule
                  sessions={filteredTodaySessions}
                  isLoading={sessionsLoading}
                />
                <WeeklySnapshot
                  sessionsCompleted={weekSessions.completed}
                  sessionsPlanned={weekSessions.total}
                  pmCollected={pmCollectedThisWeek}
                  pmDue={pmDataDue}
                />
              </div>
            </div>

            {/* Recent Activity */}
            <RecentActivity />
          </>
        )}
      </div>
    </AppLayout>
  );
}
