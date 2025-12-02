'use client';

import { HTMLAttributes, forwardRef } from 'react';
import type { Curriculum, Tier } from '@/lib/supabase/types';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'curriculum' | 'tier' | 'status';
  curriculum?: Curriculum;
  tier?: Tier;
  status?: 'planned' | 'completed' | 'cancelled';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', curriculum, tier, status, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    const getVariantStyles = () => {
      if (variant === 'curriculum' && curriculum) {
        const curriculumColors: Record<Curriculum, string> = {
          wilson: 'bg-wilson/20 text-wilson border border-wilson/30',
          delta_math: 'bg-delta/20 text-delta border border-delta/30',
          camino: 'bg-camino/20 text-camino border border-camino/30',
          wordgen: 'bg-wordgen/20 text-wordgen border border-wordgen/30',
          amira: 'bg-amira/20 text-amira border border-amira/30'
        };
        return curriculumColors[curriculum];
      }

      if (variant === 'tier' && tier) {
        return tier === 2
          ? 'bg-tier2/20 text-tier2 border border-tier2/30'
          : 'bg-tier3/20 text-tier3 border border-tier3/30';
      }

      if (variant === 'status' && status) {
        const statusColors = {
          planned: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
          completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
          cancelled: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        };
        return statusColors[status];
      }

      return 'bg-surface text-text-muted border border-text-muted/20';
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${getVariantStyles()} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Convenience components
export const CurriculumBadge = ({ curriculum }: { curriculum: Curriculum }) => {
  const labels: Record<Curriculum, string> = {
    wilson: 'Wilson',
    delta_math: 'Delta Math',
    camino: 'Camino',
    wordgen: 'WordGen',
    amira: 'Amira'
  };

  return (
    <Badge variant="curriculum" curriculum={curriculum}>
      {labels[curriculum]}
    </Badge>
  );
};

export const TierBadge = ({ tier }: { tier: Tier }) => {
  return (
    <Badge variant="tier" tier={tier}>
      Tier {tier}
    </Badge>
  );
};

export const StatusBadge = ({ status }: { status: 'planned' | 'completed' | 'cancelled' }) => {
  const labels = {
    planned: 'Planned',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  return (
    <Badge variant="status" status={status}>
      {labels[status]}
    </Badge>
  );
};
