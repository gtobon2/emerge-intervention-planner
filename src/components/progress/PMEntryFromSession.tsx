'use client';

import { useState, useMemo, useCallback, FormEvent } from 'react';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Student, ProgressMonitoring } from '@/lib/supabase/types';

export interface PMEntryFromSessionProps {
  sessionId: string;
  groupId: string;
  students: Student[];
  tier: number;
  date: string; // Session date
  onScoresSaved: (scores: Record<string, number>) => void;
  /** Existing PM data for this group — used to detect already-entered scores */
  existingData?: ProgressMonitoring[];
  /** Measure type from the active goal (auto-selected) */
  measureType?: string;
}

interface StudentScoreRow {
  studentId: string;
  studentName: string;
  score: string;
  hasExisting: boolean;
  existingScore?: number;
}

export function PMEntryFromSession({
  sessionId,
  groupId,
  students,
  tier,
  date,
  onScoresSaved,
  existingData = [],
  measureType,
}: PMEntryFromSessionProps) {
  // Only render for Tier 3 groups
  if (tier !== 3) return null;

  return (
    <PMEntryFromSessionInner
      sessionId={sessionId}
      groupId={groupId}
      students={students}
      date={date}
      onScoresSaved={onScoresSaved}
      existingData={existingData}
      measureType={measureType}
    />
  );
}

/** Inner component so that hooks are always called (not conditionally) */
function PMEntryFromSessionInner({
  sessionId,
  groupId,
  students,
  date,
  onScoresSaved,
  existingData,
  measureType,
}: Omit<PMEntryFromSessionProps, 'tier'> & { existingData: ProgressMonitoring[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  // Build row data — detect which students already have PM for this date
  const initialRows = useMemo(() => {
    return students.map((s): StudentScoreRow => {
      const existing = existingData.find(
        (d) => d.student_id === s.id && d.date === date
      );
      return {
        studentId: s.id,
        studentName: s.name,
        score: '',
        hasExisting: !!existing,
        existingScore: existing?.score,
      };
    });
  }, [students, existingData, date]);

  const [rows, setRows] = useState<StudentScoreRow[]>(initialRows);

  const updateScore = useCallback((studentId: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, score: value } : r))
    );
  }, []);

  const filledCount = useMemo(
    () => rows.filter((r) => r.score.trim() !== '').length,
    [rows]
  );

  const allHaveExisting = useMemo(
    () => rows.every((r) => r.hasExisting),
    [rows]
  );

  const handleSaveAll = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const rowsWithScores = rows.filter((r) => r.score.trim() !== '');
    if (rowsWithScores.length === 0) {
      setError('Enter at least one score');
      return;
    }

    // Validate
    for (const row of rowsWithScores) {
      const num = parseFloat(row.score);
      if (isNaN(num)) {
        setError(`Invalid score for ${row.studentName}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const scores: Record<string, number> = {};
      for (const row of rowsWithScores) {
        scores[row.studentId] = parseFloat(row.score);
      }
      onScoresSaved(scores);
      setSavedCount(Object.keys(scores).length);

      // Mark rows as existing after save
      setRows((prev) =>
        prev.map((r) => {
          if (scores[r.studentId] !== undefined) {
            return {
              ...r,
              score: '',
              hasExisting: true,
              existingScore: scores[r.studentId],
            };
          }
          return r;
        })
      );
    } catch (err) {
      setError((err as Error).message || 'Failed to save scores');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-movement" />
        <h4 className="text-sm font-semibold text-text-primary">
          Session PM Scores
        </h4>
        {measureType && (
          <span className="text-xs text-text-muted ml-auto">{measureType}</span>
        )}
      </div>

      <p className="text-xs text-text-muted">
        Tier 3 quick entry for {date}
      </p>

      {/* Success message */}
      {savedCount > 0 && (
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Saved {savedCount} score{savedCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {/* All entered indicator */}
      {allHaveExisting && (
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          All students have PM data for this session
        </div>
      )}

      {/* Student score rows */}
      <form onSubmit={handleSaveAll} className="space-y-2">
        <div className="divide-y divide-border/50">
          {rows.map((row) => (
            <div
              key={row.studentId}
              className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
            >
              {/* Student name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {row.studentName}
                </p>
                {row.hasExisting && (
                  <p className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Score: {row.existingScore}
                  </p>
                )}
              </div>

              {/* Score input */}
              <input
                type="number"
                step="0.01"
                value={row.score}
                onChange={(e) => updateScore(row.studentId, e.target.value)}
                placeholder={row.hasExisting ? `${row.existingScore}` : '--'}
                className="w-20 px-2 py-1.5 text-sm text-center bg-foundation border border-border rounded-lg text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-movement/50 min-h-[36px]"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-[10px] text-text-muted">
            {filledCount} of {rows.length} entered
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            disabled={filledCount === 0}
          >
            Save All
          </Button>
        </div>
      </form>
    </div>
  );
}
