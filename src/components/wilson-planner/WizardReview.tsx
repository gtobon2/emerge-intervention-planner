'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { WILSON_LESSON_SECTIONS, type LessonComponentType } from '@/lib/curriculum/wilson-lesson-elements';
import type { ElementOption } from './WizardBlock';

interface SectionSummary {
  component: LessonComponentType;
  name: string;
  part: number;
  duration: number;
  elementCount: number;
  totalElements: number;
  activityCount: number;
}

interface WizardReviewProps {
  numDays: number;
  substepLabel: string;
  sections: Record<LessonComponentType, {
    elements: ElementOption[];
    duration: number;
    notes: string;
    dayAssignment: number;
    activities: string[];
  }>;
  onSave: () => void;
  isSaving: boolean;
}

export function WizardReview({
  numDays,
  substepLabel,
  sections,
  onSave,
  isSaving,
}: WizardReviewProps) {
  const [activeDay, setActiveDay] = useState(1);

  // Build summaries per day
  const daySummaries = useMemo(() => {
    const result: Record<number, { sections: SectionSummary[]; totalDuration: number }> = {};

    for (let d = 1; d <= numDays; d++) {
      const daySections: SectionSummary[] = [];
      let totalDuration = 0;

      for (const def of WILSON_LESSON_SECTIONS) {
        const state = sections[def.type];
        if (!state || state.dayAssignment !== d) continue;

        const checkedCount = state.elements.filter(e => e.checked).length;
        daySections.push({
          component: def.type,
          name: def.name,
          part: def.part,
          duration: state.duration,
          elementCount: checkedCount,
          totalElements: state.elements.length,
          activityCount: state.activities.length,
        });
        totalDuration += state.duration;
      }

      result[d] = { sections: daySections, totalDuration };
    }

    return result;
  }, [sections, numDays]);

  // Warnings
  const warnings = useMemo(() => {
    const w: string[] = [];
    for (let d = 1; d <= numDays; d++) {
      const summary = daySummaries[d];
      if (!summary || summary.sections.length === 0) {
        w.push(`Day ${d} has no sections assigned`);
      }
      if (summary && summary.totalDuration > 90) {
        w.push(`Day ${d} is ${summary.totalDuration} min — may be too long`);
      }
    }
    return w;
  }, [daySummaries, numDays]);

  const currentDay = daySummaries[activeDay] || { sections: [], totalDuration: 0 };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
        <h2 className="text-xl font-bold text-text-primary">Review & Save</h2>
        <p className="text-sm text-text-muted mt-1">{substepLabel}</p>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Day Tabs */}
      {numDays > 1 && (
        <div className="flex gap-2 border-b border-border">
          {Array.from({ length: numDays }, (_, i) => i + 1).map(d => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeDay === d
                  ? 'border-movement text-movement'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Day {d}
              <span className="ml-2 text-xs text-text-muted">
                ({daySummaries[d]?.totalDuration || 0} min)
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Day Content */}
      {currentDay.sections.length === 0 ? (
        <div className="text-center py-8 text-text-muted text-sm">
          No sections assigned to this day
        </div>
      ) : (
        <div className="space-y-2">
          {currentDay.sections.map(s => (
            <div
              key={s.component}
              className="flex items-center justify-between px-4 py-3 bg-surface rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Part {s.part}: {s.name}
                </p>
                <p className="text-xs text-text-muted">
                  {s.elementCount} items{s.activityCount > 0 ? ` · ${s.activityCount} activities` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm text-text-muted">
                <Clock className="w-3.5 h-3.5" />
                {s.duration} min
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2 text-sm font-medium text-text-primary">
            Total: {currentDay.totalDuration} min
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-4 border-t border-border flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-movement text-white rounded-lg font-medium hover:bg-movement-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Lesson Plan'}
        </button>
      </div>
    </div>
  );
}
