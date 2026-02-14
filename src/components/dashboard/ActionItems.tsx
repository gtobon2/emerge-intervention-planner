'use client';

import Link from 'next/link';
import { AlertTriangle, Target, UserX, ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui';

interface ActionItem {
  label: string;
  count: number;
  icon: React.ReactNode;
  href: string;
  color: string;
}

interface ActionItemsProps {
  pmDue: number;
  decisionAlerts: number;
  incompleteSessionsThisWeek: number;
  attendanceFlags: number;
}

export function ActionItems({ pmDue, decisionAlerts, incompleteSessionsThisWeek, attendanceFlags }: ActionItemsProps) {
  const items: ActionItem[] = [
    {
      label: 'students need PM data',
      count: pmDue,
      icon: <Target className="w-4 h-4" />,
      href: '/progress',
      color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20',
    },
    {
      label: 'decision rule alerts',
      count: decisionAlerts,
      icon: <AlertTriangle className="w-4 h-4" />,
      href: '/notifications',
      color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
    },
    {
      label: 'sessions this week incomplete',
      count: incompleteSessionsThisWeek,
      icon: <ClipboardList className="w-4 h-4" />,
      href: '/schedule',
      color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    },
    {
      label: 'students absent 2+ sessions',
      count: attendanceFlags,
      icon: <UserX className="w-4 h-4" />,
      href: '/notifications',
      color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
    },
  ];

  const activeItems = items.filter(item => item.count > 0);

  if (activeItems.length === 0) return null;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Action Items</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {activeItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 p-3 rounded-lg ${item.color} hover:opacity-80 transition-opacity`}
          >
            {item.icon}
            <span className="text-sm font-medium">
              {item.count} {item.label}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
