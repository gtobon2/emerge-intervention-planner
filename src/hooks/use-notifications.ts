import { useNotificationsStore } from '@/stores/notifications';
import { useSessionsStore } from '@/stores/sessions';
import { useStudentsStore } from '@/stores/students';
import { useProgressStore } from '@/stores/progress';
import { useSettingsStore } from '@/stores/settings';
import { useEffect } from 'react';
import type { Notification } from '@/stores/notifications';

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

    // Generate reminders
    generateReminders(allSessions, studentsWithPMData, notificationPreferences.reminderTiming);

    // Set up interval to check for reminders every 5 minutes
    const interval = setInterval(() => {
      generateReminders(allSessions, studentsWithPMData, notificationPreferences.reminderTiming);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [
    allSessions,
    allStudents,
    progressData,
    notificationPreferences.sessionReminders,
    notificationPreferences.pmDataDueReminders,
    notificationPreferences.reminderTiming,
    generateReminders,
  ]);
}

// Hook to get filtered notifications
export function useFilteredNotifications(filter: 'all' | 'session_reminder' | 'pm_due' | 'session_completed' | 'info') {
  const { notifications } = useNotifications();

  if (filter === 'all') {
    return notifications;
  }

  return notifications.filter((n) => n.type === filter);
}
