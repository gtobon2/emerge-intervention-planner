'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { useNotifications, useFilteredNotifications } from '@/hooks/use-notifications';
import { getTimeAgo } from '@/stores/notifications';
import { useRouter } from 'next/navigation';
import type { NotificationType } from '@/stores/notifications';

const notificationTypeConfig: Record<
  NotificationType,
  { icon: string; bgColor: string; textColor: string; label: string }
> = {
  session_reminder: {
    icon: '📅',
    bgColor: 'bg-movement/10',
    textColor: 'text-movement',
    label: 'Session Reminders',
  },
  pm_due: {
    icon: '📊',
    bgColor: 'bg-phonics/10',
    textColor: 'text-phonics',
    label: 'PM Data Due',
  },
  session_completed: {
    icon: '✅',
    bgColor: 'bg-comprehension/10',
    textColor: 'text-comprehension',
    label: 'Sessions',
  },
  info: {
    icon: 'ℹ️',
    bgColor: 'bg-text-muted/10',
    textColor: 'text-text-muted',
    label: 'Info',
  },
  pm_reminder: {
    icon: '⏰',
    bgColor: 'bg-phonics/10',
    textColor: 'text-phonics',
    label: 'PM Reminders',
  },
  decision_rule_alert: {
    icon: '⚠️',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    label: 'Decision Rules',
  },
  attendance_flag: {
    icon: '🚩',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-600',
    label: 'Attendance',
  },
  goal_not_set: {
    icon: '🎯',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-600',
    label: 'Goals',
  },
  error: {
    icon: '❌',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-500',
    label: 'Errors',
  },
  success: {
    icon: '✅',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
    label: 'Success',
  },
  warning: {
    icon: '⚠️',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    label: 'Warnings',
  },
};

type FilterType = NotificationType | 'all';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const { markAsRead, markAllAsRead, clearNotifications, deleteNotification } = useNotifications();
  const filteredNotifications = useFilteredNotifications(
    filter === 'all' ? 'all' : filter
  );
  const router = useRouter();

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId);
    if (link) {
      router.push(link);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      clearNotifications();
    }
  };

  const unreadNotifications = filteredNotifications.filter((n) => !n.read);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Notifications</h1>
          <p className="text-text-muted">
            Stay updated on upcoming sessions and PM data requirements
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-surface border border-text-muted/10 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-movement text-white'
                    : 'bg-foundation text-text-muted hover:text-text-primary'
                }`}
              >
                All ({filteredNotifications.length})
              </button>
              <button
                onClick={() => setFilter('session_reminder')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'session_reminder'
                    ? 'bg-movement text-white'
                    : 'bg-foundation text-text-muted hover:text-text-primary'
                }`}
              >
                Sessions
              </button>
              <button
                onClick={() => setFilter('pm_due')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pm_due'
                    ? 'bg-movement text-white'
                    : 'bg-foundation text-text-muted hover:text-text-primary'
                }`}
              >
                PM Data
              </button>
              <button
                onClick={() => setFilter('info')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'info'
                    ? 'bg-movement text-white'
                    : 'bg-foundation text-text-muted hover:text-text-primary'
                }`}
              >
                Info
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {unreadNotifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-foundation text-text-muted hover:text-text-primary rounded-lg text-sm transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              {filteredNotifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-4 py-2 bg-foundation text-text-muted hover:text-red-500 rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear all</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-surface border border-text-muted/10 rounded-lg overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-text-muted/30 mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No notifications
              </h3>
              <p className="text-text-muted">
                {filter === 'all'
                  ? "You're all caught up!"
                  : `No ${
                      filter === 'session_reminder'
                        ? 'session reminders'
                        : filter === 'pm_due'
                        ? 'PM data reminders'
                        : filter === 'session_completed'
                        ? 'session updates'
                        : 'info notifications'
                    } at the moment.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-text-muted/10">
              {filteredNotifications.map((notification) => {
                const config = notificationTypeConfig[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors ${
                      !notification.read ? 'bg-movement/5' : 'hover:bg-foundation'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-xl">{config.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-text-primary">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-movement rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-text-muted/70 mt-1">
                              {getTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>

                        <p className="text-text-muted mb-3">{notification.message}</p>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {notification.link && (
                            <button
                              onClick={() =>
                                handleNotificationClick(notification.id, notification.link)
                              }
                              className="px-3 py-1.5 bg-movement text-white text-sm rounded-lg hover:bg-movement/90 transition-colors"
                            >
                              View Details
                            </button>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="px-3 py-1.5 bg-foundation text-text-muted hover:text-text-primary text-sm rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="px-3 py-1.5 bg-foundation text-text-muted hover:text-red-500 text-sm rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unread Count Summary */}
        {unreadNotifications.length > 0 && (
          <div className="mt-4 text-center text-sm text-text-muted">
            {unreadNotifications.length} unread notification
            {unreadNotifications.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
