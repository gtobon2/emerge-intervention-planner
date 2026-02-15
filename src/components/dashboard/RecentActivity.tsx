'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, BarChart3, Users } from 'lucide-react';
import { Card } from '@/components/ui';
import { useSessionsStore } from '@/stores/sessions';
import { useGroupsStore } from '@/stores/groups';
import { useStudentsStore } from '@/stores/students';
import { supabase } from '@/lib/supabase/client';

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  description: string;
  timeAgo: string;
  href: string;
  sortDate: string;
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
  const groups = useGroupsStore(s => s.groups);
  const allSessions = useSessionsStore(s => s.allSessions);
  const allStudents = useStudentsStore(s => s.allStudents);
  const [pmActivities, setPmActivities] = useState<ActivityItem[]>([]);

  // Fetch recent PM entries from Supabase
  useEffect(() => {
    async function fetchRecentPM() {
      const groupIds = groups.map(g => g.id);
      if (groupIds.length === 0) return;

      try {
        const { data: recentPM } = await supabase
          .from('progress_monitoring')
          .select('*')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!recentPM || recentPM.length === 0) {
          setPmActivities([]);
          return;
        }

        const studentMap = new Map(allStudents.map(s => [s.id, s.name]));

        setPmActivities(recentPM.map(pm => ({
          id: `pm-${pm.id}`,
          icon: <BarChart3 className="w-4 h-4 text-blue-500" />,
          description: `PM data entered for ${studentMap.get(pm.student_id ?? '') || 'Unknown'}: ${pm.score}`,
          timeAgo: getTimeAgo(pm.created_at),
          sortDate: pm.created_at,
          href: '/progress',
        })));
      } catch {
        // Non-critical — silently fail
      }
    }
    fetchRecentPM();
  }, [groups, allStudents]);

  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    const groupMap = new Map(groups.map(g => [g.id, g.name]));

    // Recent completed sessions
    const completedSessions = [...allSessions]
      .filter(s => s.status === 'completed')
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 10);

    for (const session of completedSessions) {
      items.push({
        id: `session-${session.id}`,
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        description: `Completed session with ${groupMap.get(session.group_id) || 'Unknown Group'}`,
        timeAgo: getTimeAgo(session.updated_at),
        sortDate: session.updated_at,
        href: `/groups/${session.group_id}/session/${session.id}`,
      });
    }

    // PM activities from Supabase
    items.push(...pmActivities);

    // Recent groups created
    const recentGroups = [...groups]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 3);

    for (const group of recentGroups) {
      items.push({
        id: `group-${group.id}`,
        icon: <Users className="w-4 h-4 text-purple-500" />,
        description: `Group "${group.name}" created`,
        timeAgo: getTimeAgo(group.created_at),
        sortDate: group.created_at,
        href: `/groups/${group.id}`,
      });
    }

    // Sort by actual date (most recent first) and take top 5
    items.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

    return items.slice(0, 5);
  }, [allSessions, groups, pmActivities]);

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
