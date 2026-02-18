'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CurriculumBadge, TierBadge } from '@/components/ui/badge';
import type { Group, Session, Student } from '@/lib/supabase/types';

type HealthStatus = 'on_track' | 'needs_attention' | 'no_sessions' | 'critical';

interface GroupHealthGridProps {
  groups: Group[];
  allSessions: Session[];
  allStudents: Student[];
  isLoading?: boolean;
}

function computeHealth(
  group: Group,
  sessions: Session[]
): HealthStatus {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groupSessions = sessions.filter((s) => s.group_id === group.id);
  const completedSessions = groupSessions.filter(
    (s) => s.status === 'completed'
  );

  // Most recent completed session
  const recentCompleted = completedSessions
    .filter((s) => new Date(s.date) >= sevenDaysAgo)
    .sort((a, b) => b.date.localeCompare(a.date));

  const hasRecentSession = recentCompleted.length > 0;

  // Check mastery from most recent completed session
  const lastCompleted = completedSessions.sort((a, b) =>
    b.date.localeCompare(a.date)
  )[0];
  const masteryResult = lastCompleted?.mastery_demonstrated;
  const hasMasteryIssue = masteryResult === 'no';

  if (!hasRecentSession && hasMasteryIssue) return 'critical';
  if (!hasRecentSession) return 'no_sessions';
  if (hasMasteryIssue) return 'needs_attention';
  return 'on_track';
}

const healthConfig: Record<
  HealthStatus,
  { label: string; bg: string; text: string }
> = {
  on_track: {
    label: 'On Track',
    bg: 'bg-green-500/15',
    text: 'text-green-500',
  },
  needs_attention: {
    label: 'Needs Attention',
    bg: 'bg-amber-500/15',
    text: 'text-amber-500',
  },
  no_sessions: {
    label: 'No Sessions',
    bg: 'bg-gray-500/15',
    text: 'text-gray-400',
  },
  critical: {
    label: 'Critical',
    bg: 'bg-red-500/15',
    text: 'text-red-500',
  },
};

type FilterOption = 'all' | 'needs_attention';

export function GroupHealthGrid({
  groups,
  allSessions,
  allStudents,
  isLoading,
}: GroupHealthGridProps) {
  const [filter, setFilter] = useState<FilterOption>('all');

  const groupHealthData = useMemo(() => {
    return groups.map((group) => {
      const health = computeHealth(group, allSessions);
      const studentCount = allStudents.filter(
        (s) => s.group_id === group.id
      ).length;

      const completedSessions = allSessions
        .filter((s) => s.group_id === group.id && s.status === 'completed')
        .sort((a, b) => b.date.localeCompare(a.date));
      const lastSessionDate = completedSessions[0]?.date || null;

      return { group, health, studentCount, lastSessionDate };
    });
  }, [groups, allSessions, allStudents]);

  const filtered =
    filter === 'needs_attention'
      ? groupHealthData.filter(
          (g) => g.health === 'needs_attention' || g.health === 'critical'
        )
      : groupHealthData;

  const needsAttentionCount = groupHealthData.filter(
    (g) => g.health === 'needs_attention' || g.health === 'critical'
  ).length;

  if (isLoading) {
    return (
      <Card>
        <div className="p-4 space-y-3">
          <div className="h-6 w-40 bg-foundation rounded animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-foundation rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 pb-3 flex items-center justify-between border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary">
          Group Health
        </h3>
        <div className="flex gap-1 rounded-lg bg-foundation p-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            All ({groups.length})
          </button>
          <button
            onClick={() => setFilter('needs_attention')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'needs_attention'
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Needs Attention ({needsAttentionCount})
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">
            {filter === 'needs_attention'
              ? 'All groups are on track!'
              : 'No groups found.'}
          </p>
        ) : (
          filtered.map(({ group, health, studentCount, lastSessionDate }) => {
            const cfg = healthConfig[health];
            return (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block"
              >
                <div className="p-3 rounded-lg bg-foundation hover:bg-surface-elevated transition-colors flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-text-primary truncate">
                        {group.name}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CurriculumBadge curriculum={group.curriculum} />
                      <TierBadge tier={group.tier} />
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Users className="w-3 h-3" />
                        {studentCount}
                      </span>
                      {lastSessionDate && (
                        <span className="text-xs text-text-muted">
                          Last:{' '}
                          {new Date(lastSessionDate).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric' }
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </Card>
  );
}
