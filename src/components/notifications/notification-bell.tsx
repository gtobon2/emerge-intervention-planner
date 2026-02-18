'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, BellRing, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/use-notifications';
import { getTimeAgo } from '@/stores/notifications';
import type { NotificationType } from '@/stores/notifications';

const notificationTypeConfig: Record<
  NotificationType,
  { icon: string; bgColor: string; textColor: string }
> = {
  session_reminder: {
    icon: '📅',
    bgColor: 'bg-movement/10',
    textColor: 'text-movement',
  },
  pm_due: {
    icon: '📊',
    bgColor: 'bg-phonics/10',
    textColor: 'text-phonics',
  },
  session_completed: {
    icon: '✅',
    bgColor: 'bg-comprehension/10',
    textColor: 'text-comprehension',
  },
  info: {
    icon: 'ℹ️',
    bgColor: 'bg-text-muted/10',
    textColor: 'text-text-muted',
  },
  pm_reminder: {
    icon: '⏰',
    bgColor: 'bg-phonics/10',
    textColor: 'text-phonics',
  },
  decision_rule_alert: {
    icon: '⚠️',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
  },
  attendance_flag: {
    icon: '🚩',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-600',
  },
  goal_not_set: {
    icon: '🎯',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-600',
  },
  error: {
    icon: '❌',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-500',
  },
  success: {
    icon: '✅',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-500',
  },
  warning: {
    icon: '⚠️',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
  },
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Get recent notifications (last 5)
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId);
    if (link) {
      router.push(link);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-foundation transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-text-primary" />
        ) : (
          <Bell className="w-5 h-5 text-text-muted" />
        )}

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-movement text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={dropdownRef}
            className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-surface border border-text-muted/10 rounded-lg shadow-lg z-50 max-h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-text-muted/10">
              <h3 className="font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-movement hover:text-movement/80 transition-colors flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-text-muted/30 mb-3" />
                  <p className="text-text-muted">No notifications</p>
                  <p className="text-sm text-text-muted/70 mt-1">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-text-muted/10">
                  {recentNotifications.map((notification) => {
                    const config = notificationTypeConfig[notification.type];
                    return (
                      <button
                        key={notification.id}
                        onClick={() =>
                          handleNotificationClick(notification.id, notification.link)
                        }
                        className={`w-full p-4 text-left hover:bg-foundation transition-colors ${
                          !notification.read ? 'bg-movement/5' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}
                          >
                            <span className="text-lg">{config.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-text-primary text-sm">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-movement rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-sm text-text-muted mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-text-muted/70 mt-2">
                              {getTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {recentNotifications.length > 0 && (
              <div className="border-t border-text-muted/10 p-3">
                <button
                  onClick={() => {
                    router.push('/notifications');
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm text-movement hover:text-movement/80 transition-colors py-2"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
