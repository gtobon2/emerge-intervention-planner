import { useNotificationsStore } from '@/stores/notifications';
import { useSessionsStore } from '@/stores/sessions';
import { useStudentsStore } from '@/stores/students';
import { useProgressStore } from '@/stores/progress';
import { useSettingsStore } from '@/stores/settings';
import { useGroupsStore } from '@/stores/groups';
import { useEffect } from 'react';
import type { Notification, NotificationType } from '@/stores/notifications';

export function useNotifications() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const addNotification = useNotificationsStore((state) => state.addNotification);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const clearNotifications = useNotificationsStore((state) => state.clearNotifications);
  const deleteNotification = useNotificationsStore((state) => state.deleteNotification);
  const generateReminders = useNotificationsStore((state) => state.generateReminders);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
    generateReminders,
  };
}

// Hook to automatically generate reminders on app load or when data changes
export function useNotificationGenerator() {
  const { generateReminders } = useNotifications();
  const allSessions = useSessionsStore((state) => state.allSessions);
  const allStudents = useStudentsStore((state) => state.allStudents);
  const progressData = useProgressStore((state) => state.data);
  const notificationPreferences = useSettingsStore((state) => state.notificationPreferences);
  const groups = useGroupsStore((state) => state.groups);

  useEffect(() => {
    // Only generate reminders if enabled in settings
    if (!notificationPreferences.sessionReminders && !notificationPreferences.pmDataDueReminders) {
      return;
    }

    // Prepare student data with last PM date
    const studentsWithPMData = allStudents.map((student) => {
      const studentPMData = progressData
        .filter((pm) => pm.student_id === student.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        id: student.id,
        name: student.name,
        group_id: student.group_id,
        lastPMDate: studentPMData.length > 0 ? studentPMData[0].date : undefined,
      };
    });

    // Prepare groups data with tier info for tier-aware PM thresholds
    const groupsWithTier = groups.map((g) => ({ id: g.id, tier: g.tier }));

    // Generate reminders with tier-aware PM thresholds
    generateReminders(allSessions, studentsWithPMData, notificationPreferences.reminderTiming, groupsWithTier);

    // Set up interval to check for reminders every 5 minutes
    const interval = setInterval(() => {
      generateReminders(allSessions, studentsWithPMData, notificationPreferences.reminderTiming, groupsWithTier);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [
    allSessions,
    allStudents,
    progressData,
    groups,
    notificationPreferences.sessionReminders,
    notificationPreferences.pmDataDueReminders,
    notificationPreferences.reminderTiming,
    generateReminders,
  ]);
}

// Hook to get filtered notifications
export function useFilteredNotifications(filter: 'all' | NotificationType) {
  const { notifications } = useNotifications();

  if (filter === 'all') {
    return notifications;
  }

  return notifications.filter((n) => n.type === filter);
}
