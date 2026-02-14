'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, BarChart3, Users } from 'lucide-react';
import { Card } from '@/components/ui';
import { db } from '@/lib/local-db';

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  description: string;
  timeAgo: string;
  href: string;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    async function loadActivity() {
      try {
        const items: ActivityItem[] = [];

        // Recent completed sessions
        const recentSessions = await db.sessions
          .orderBy('updated_at')
          .reverse()
          .limit(10)
          .toArray();

        const groups = await db.groups.toArray();
        const groupMap = new Map(groups.map(g => [g.id, g.name]));

        for (const session of recentSessions) {
          if (session.status === 'completed') {
            items.push({
              id: `session-${session.id}`,
              icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
              description: `Completed session with ${groupMap.get(session.group_id) || 'Unknown Group'}`,
              timeAgo: getTimeAgo(session.updated_at),
              href: `/groups/${session.group_id}/session/${session.id}`,
            });
          }
        }

        // Recent PM entries
        const recentPM = await db.progressMonitoring
          .orderBy('created_at')
          .reverse()
          .limit(5)
          .toArray();

        const students = await db.students.toArray();
        const studentMap = new Map(students.map(s => [s.id, s.name]));

        for (const pm of recentPM) {
          items.push({
            id: `pm-${pm.id}`,
            icon: <BarChart3 className="w-4 h-4 text-blue-500" />,
            description: `PM data entered for ${studentMap.get(pm.student_id ?? 0) || 'Unknown'}: ${pm.score}`,
            timeAgo: getTimeAgo(pm.created_at),
            href: `/progress`,
          });
        }

        // Recent groups created
        const recentGroups = await db.groups
          .orderBy('created_at')
          .reverse()
          .limit(3)
          .toArray();

        for (const group of recentGroups) {
          items.push({
            id: `group-${group.id}`,
            icon: <Users className="w-4 h-4 text-purple-500" />,
            description: `Group "${group.name}" created`,
            timeAgo: getTimeAgo(group.created_at),
            href: `/groups/${group.id}`,
          });
        }

        // Sort by recency and take top 5
        items.sort((a, b) => {
          // Parse timeAgo roughly for sorting (not precise, but good enough)
          const order = { 'just now': 0, 'm ago': 1, 'h ago': 2, 'd ago': 3, 'w ago': 4 };
          const getOrder = (s: string) => {
            for (const [key, val] of Object.entries(order)) {
              if (s.includes(key)) return val;
            }
            return 5;
          };
          return getOrder(a.timeAgo) - getOrder(b.timeAgo);
        });

        setActivities(items.slice(0, 5));
      } catch {
        // Silently fail — activity feed is non-critical
      }
    }
    loadActivity();
  }, []);

  if (activities.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-text-muted" />
        <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
      </div>
      <div className="space-y-2">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={activity.href}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            {activity.icon}
            <span className="flex-1 text-sm text-text-primary truncate">{activity.description}</span>
            <span className="text-xs text-text-muted whitespace-nowrap">{activity.timeAgo}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
