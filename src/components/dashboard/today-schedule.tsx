'use client';

import Link from 'next/link';
import { Clock, Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurriculumBadge, TierBadge, StatusBadge } from '@/components/ui/badge';
import type { TodaySession } from '@/lib/supabase/types';
import { formatCurriculumPosition } from '@/lib/supabase/types';

interface TodayScheduleProps {
  sessions: TodaySession[];
  isLoading?: boolean;
}

export function TodaySchedule({ sessions, isLoading }: TodayScheduleProps) {
  const sortedSessions = [...sessions].sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-movement" />
          Today&apos;s Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-foundation rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No sessions scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 bg-foundation rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/groups/${session.groupId}`}
                      className="font-medium text-text-primary hover:text-movement transition-colors"
                    >
                      {session.groupName}
                    </Link>
                    <StatusBadge status={session.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CurriculumBadge curriculum={session.curriculum} />
                    <TierBadge tier={session.tier} />
                    <span className="text-text-muted">
                      {session.time || 'No time set'}
                    </span>
                  </div>
                </div>

                {session.status === 'planned' && (
                  <Link href={`/groups/${session.groupId}/session/${session.id}`}>
                    <Button variant="primary" size="sm" className="gap-1">
                      <Play className="w-4 h-4" />
                      Start
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
