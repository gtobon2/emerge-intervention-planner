'use client';

import { Card } from '@/components/ui';
import { BarChart3 } from 'lucide-react';

interface WeeklySnapshotProps {
  sessionsCompleted: number;
  sessionsPlanned: number;
  pmCollected: number;
  pmDue: number;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function WeeklySnapshot({ sessionsCompleted, sessionsPlanned, pmCollected, pmDue }: WeeklySnapshotProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-text-muted" />
        <h3 className="text-sm font-semibold text-text-primary">This Week</h3>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Sessions</span>
            <span>{sessionsCompleted}/{sessionsPlanned}</span>
          </div>
          <ProgressBar value={sessionsCompleted} max={sessionsPlanned} color="bg-emerald-500" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>PM Data</span>
            <span>{pmCollected}/{pmCollected + pmDue}</span>
          </div>
          <ProgressBar value={pmCollected} max={pmCollected + pmDue} color="bg-blue-500" />
        </div>
      </div>
    </Card>
  );
}
