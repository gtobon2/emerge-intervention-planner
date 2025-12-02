'use client';

import Link from 'next/link';
import { Calendar, Users, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CurriculumBadge, TierBadge } from '@/components/ui/badge';
import type { Group } from '@/lib/supabase/types';
import { formatCurriculumPosition } from '@/lib/supabase/types';

interface GroupCardProps {
  group: Group;
  studentCount?: number;
  nextSessionDate?: string;
}

export function GroupCard({ group, studentCount = 0, nextSessionDate }: GroupCardProps) {
  const positionLabel = formatCurriculumPosition(group.curriculum, group.current_position);

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="card-hover cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-text-primary mb-1">
              {group.name}
            </h3>
            <div className="flex items-center gap-2">
              <CurriculumBadge curriculum={group.curriculum} />
              <TierBadge tier={group.tier} />
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted" />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-text-muted">
            <span className="text-text-primary font-medium">Grade {group.grade}</span>
            <span>•</span>
            <span>{positionLabel}</span>
          </div>

          <div className="flex items-center gap-4 text-text-muted">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{studentCount} students</span>
            </div>
            {nextSessionDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Next: {new Date(nextSessionDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
