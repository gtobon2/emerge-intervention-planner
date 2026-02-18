'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PMCompliancePanelProps {
  pmDataByTier: { tier2Due: number; tier3Due: number };
}

export function PMCompliancePanel({ pmDataByTier }: PMCompliancePanelProps) {
  const total = pmDataByTier.tier2Due + pmDataByTier.tier3Due;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 pb-3 border-b border-border flex items-center gap-2">
        <AlertTriangle
          className={`w-5 h-5 ${total > 0 ? 'text-amber-500' : 'text-text-muted'}`}
        />
        <h3 className="text-lg font-semibold text-text-primary">
          PM Compliance
        </h3>
      </div>

      <div className="p-4 space-y-3">
        {total === 0 ? (
          <p className="text-sm text-green-500 font-medium text-center py-2">
            All PM data is up to date!
          </p>
        ) : (
          <>
            {pmDataByTier.tier3Due > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                <div>
                  <span className="text-sm font-semibold text-red-500">
                    Tier 3
                  </span>
                  <span className="text-sm text-text-muted ml-2">
                    {pmDataByTier.tier3Due} overdue
                  </span>
                </div>
                <span className="text-2xl font-bold text-red-500">
                  {pmDataByTier.tier3Due}
                </span>
              </div>
            )}

            {pmDataByTier.tier2Due > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                <div>
                  <span className="text-sm font-semibold text-amber-500">
                    Tier 2
                  </span>
                  <span className="text-sm text-text-muted ml-2">
                    {pmDataByTier.tier2Due} overdue
                  </span>
                </div>
                <span className="text-2xl font-bold text-amber-500">
                  {pmDataByTier.tier2Due}
                </span>
              </div>
            )}
          </>
        )}

        <Link
          href="/progress"
          className="flex items-center justify-center gap-2 text-sm text-movement hover:text-movement-hover font-medium pt-2 transition-colors"
        >
          View Progress Monitoring
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
}
