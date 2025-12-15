import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionWithGroup } from '@/lib/supabase/types';

export type NotificationType = 'session_reminder' | 'pm_due' | 'session_completed' | 'info';

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
    reminderTiming: '15min' | '30min' | '1hour'
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

      generateReminders: (sessions, students, reminderTiming) => {
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

        // Generate PM due reminders for students without recent data
        const pmDueThresholdDays = 7; // Alert if no PM data in 7 days
        const pmDueDate = new Date(now.getTime() - pmDueThresholdDays * 24 * 60 * 60 * 1000);

        students.forEach((student) => {
          if (!student.lastPMDate) {
            // No PM data ever recorded
            get().addNotification({
              type: 'pm_due',
              title: 'PM Data Due',
              message: `PM data due for ${student.name} - no data recorded yet`,
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
                message: `PM data due for ${student.name} - last recorded ${daysSince} days ago`,
                link: `/groups/${student.group_id}`,
              });
            }
          }
        });
      },
    }),
    {
      name: 'emerge-notifications-store',
    }
  )
);
