import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionWithGroup } from '@/lib/supabase/types';
import { getPMFrequencyDays } from '@/lib/supabase/validation';

export type NotificationType = 'session_reminder' | 'pm_due' | 'session_completed' | 'info' | 'pm_reminder' | 'decision_rule_alert' | 'attendance_flag' | 'goal_not_set' | 'error' | 'success' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  deleteNotification: (id: string) => void;
  generateReminders: (
    sessions: SessionWithGroup[],
    students: Array<{ id: string; name: string; group_id: string; lastPMDate?: string }>,
    reminderTiming: '15min' | '30min' | '1hour',
    groups?: Array<{ id: string; tier: number }>
  ) => void;
  generateDecisionAlerts: (
    pmData: Array<{
      student_id: string;
      student_name: string;
      group_id: string;
      group_name: string;
      scores: number[];
      goal: number | null;
    }>
  ) => void;
  generateAttendanceFlags: (
    studentAbsences: Array<{
      student_name: string;
      group_name: string;
      consecutive_absences: number;
      group_id: string;
    }>
  ) => void;
  generateGoalAlerts: (
    studentsWithoutGoals: Array<{
      student_name: string;
      group_name: string;
      group_id: string;
    }>
  ) => void;
}

// Helper to get minutes before session based on reminder timing
function getReminderMinutes(timing: '15min' | '30min' | '1hour'): number {
  switch (timing) {
    case '15min':
      return 15;
    case '30min':
      return 30;
    case '1hour':
      return 60;
    default:
      return 15;
  }
}

// Helper to format time ago
export function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          read: false,
        };

        set((state) => {
          // Check if similar notification already exists (prevent duplicates)
          const exists = state.notifications.some(
            (n) =>
              n.title === newNotification.title &&
              n.message === newNotification.message &&
              !n.read
          );

          if (exists) return state;

          return {
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          };
        });
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) return state;

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      deleteNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      generateReminders: (sessions, students, reminderTiming, groups) => {
        const now = new Date();
        const reminderMinutes = getReminderMinutes(reminderTiming);
        const reminderWindowStart = new Date(now.getTime() + reminderMinutes * 60000);
        const reminderWindowEnd = new Date(now.getTime() + (reminderMinutes + 5) * 60000); // 5 min window

        // Generate session reminders for upcoming sessions
        sessions.forEach((session) => {
          if (session.status !== 'planned') return;

          const sessionDate = new Date(session.date);

          // If session has a time, use it; otherwise assume it's during the day
          if (session.time) {
            const [hours, minutes] = session.time.split(':').map(Number);
            sessionDate.setHours(hours, minutes, 0, 0);

            // Check if session is within the reminder window
            if (sessionDate >= reminderWindowStart && sessionDate <= reminderWindowEnd) {
              get().addNotification({
                type: 'session_reminder',
                title: 'Upcoming Session',
                message: `Session with ${session.group.name} in ${reminderMinutes} minutes`,
                link: `/sessions/${session.id}`,
              });
            }
          }
        });

        // Build a map of group_id -> tier for tier-aware PM thresholds
        const groupTierMap = new Map<string, number>();
        if (groups) {
          groups.forEach((g) => groupTierMap.set(g.id, g.tier));
        }

        // Generate PM due reminders for students without recent data
        // Tier 3 = weekly (7 days), Tier 2 = bi-weekly (14 days), fallback = 7 days
        students.forEach((student) => {
          const tier = groupTierMap.get(student.group_id);
          const thresholdDays = tier ? getPMFrequencyDays(tier as 2 | 3) : 7;
          const pmDueDate = new Date(now.getTime() - thresholdDays * 24 * 60 * 60 * 1000);
          const frequencyLabel = thresholdDays === 7 ? 'weekly' : 'bi-weekly';

          if (!student.lastPMDate) {
            // No PM data ever recorded
            get().addNotification({
              type: 'pm_due',
              title: 'PM Data Due',
              message: `PM data due for ${student.name} (${frequencyLabel}) - no data recorded yet`,
              link: `/groups/${student.group_id}`,
            });
          } else {
            const lastPMDate = new Date(student.lastPMDate);
            if (lastPMDate < pmDueDate) {
              const daysSince = Math.floor(
                (now.getTime() - lastPMDate.getTime()) / (24 * 60 * 60 * 1000)
              );
              get().addNotification({
                type: 'pm_due',
                title: 'PM Data Due',
                message: `PM data due for ${student.name} (${frequencyLabel}) - last recorded ${daysSince} days ago`,
                link: `/groups/${student.group_id}`,
              });
            }
          }
        });
      },

      generateDecisionAlerts: (pmData) => {
        pmData.forEach((student) => {
          if (student.goal === null || student.scores.length < 4) return;

          const lastFour = student.scores.slice(-4);
          const allBelow = lastFour.every((score) => score < student.goal!);
          const allAbove = lastFour.every((score) => score > student.goal!);

          if (allBelow) {
            get().addNotification({
              type: 'decision_rule_alert',
              title: 'Decision Rule Alert',
              message: `4 consecutive PM points below goal for ${student.student_name} in ${student.group_name} - consider adjusting intervention`,
              link: `/groups/${student.group_id}`,
            });
          } else if (allAbove) {
            get().addNotification({
              type: 'decision_rule_alert',
              title: 'Decision Rule Alert',
              message: `4 consecutive PM points above goal for ${student.student_name} in ${student.group_name} - consider raising goal`,
              link: `/groups/${student.group_id}`,
            });
          }
        });
      },

      generateAttendanceFlags: (studentAbsences) => {
        studentAbsences.forEach((student) => {
          if (student.consecutive_absences >= 2) {
            get().addNotification({
              type: 'attendance_flag',
              title: 'Attendance Flag',
              message: `${student.student_name} in ${student.group_name} has ${student.consecutive_absences} consecutive absences`,
              link: `/groups/${student.group_id}`,
            });
          }
        });
      },

      generateGoalAlerts: (studentsWithoutGoals) => {
        studentsWithoutGoals.forEach((student) => {
          get().addNotification({
            type: 'goal_not_set',
            title: 'Goal Not Set',
            message: `No goal set for ${student.student_name} in ${student.group_name}`,
            link: `/groups/${student.group_id}`,
          });
        });
      },
    }),
    {
      name: 'emerge-notifications-store',
    }
  )
);
