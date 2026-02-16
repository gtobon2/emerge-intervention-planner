'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkle, Sparkles, Loader2 } from 'lucide-react';
import type { LessonComponentType, LessonPlanElement } from '@/lib/curriculum/wilson-lesson-elements';
import { WILSON_LESSON_SECTIONS } from '@/lib/curriculum/wilson-lesson-elements';

interface ElementOption {
  id: string;
  type: 'sound' | 'word' | 'nonsense' | 'hf_word' | 'sentence' | 'story' | 'element';
  label: string;
  sublabel?: string;
  isNew?: boolean;
  checked: boolean;
}

interface WizardSectionProps {
  component: LessonComponentType;
  elements: ElementOption[];
  onToggleElement: (elementId: string) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  dayAssignment: number;
  onDayChange: (day: number) => void;
  numDays: number;
  activities: string[];
  onActivitiesChange: (activities: string[]) => void;
  substep?: string;
}

export function WizardSection({
  component,
  elements,
  onToggleElement,
  duration,
  onDurationChange,
  notes,
  onNotesChange,
  dayAssignment,
  onDayChange,
  numDays,
  activities,
  onActivitiesChange,
  substep,
}: WizardSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [newActivity, setNewActivity] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const sectionDef = WILSON_LESSON_SECTIONS.find(s => s.type === component);
  if (!sectionDef) return null;

  const checkedCount = elements.filter(e => e.checked).length;

  const addActivity = () => {
    const trimmed = newActivity.trim();
    if (trimmed) {
      onActivitiesChange([...activities, trimmed]);
      setNewActivity('');
    }
  };

  const removeActivity = (index: number) => {
    onActivitiesChange(activities.filter((_, i) => i !== index));
  };

  const suggestActivities = async () => {
    if (!substep) return;
    setIsSuggesting(true);
    try {
      const checkedElements: LessonPlanElement[] = elements
        .filter(e => e.checked)
        .map(e => ({
          id: e.id,
          type: e.type,
          value: e.label,
          sourceId: e.id,
        }));

      const res = await fetch('/api/ai/suggest-wilson-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          substep,
          component,
          componentName: sectionDef.name,
          elements: checkedElements,
          currentActivities: activities,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestions && Array.isArray(data.suggestions)) {
          onActivitiesChange([...activities, ...data.suggestions]);
        }
      }
    } catch (error) {
      console.error('Error suggesting activities:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded
            ? <ChevronDown className="w-4 h-4 text-text-muted" />
            : <ChevronRight className="w-4 h-4 text-text-muted" />
          }
          <div className="text-left">
            <span className="text-sm font-medium text-text-primary">
              Part {sectionDef.part}: {sectionDef.name}
            </span>
            <span className="text-xs text-text-muted ml-2">
              {checkedCount}/{elements.length} items &middot; {duration} min
            </span>
          </div>
        </div>

        {/* Day Assignment (inline in header) */}
        {numDays > 1 && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-text-muted mr-1">Day</span>
            {Array.from({ length: numDays }, (_, i) => i + 1).map(d => (
              <button
                key={d}
                onClick={() => onDayChange(d)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  dayAssignment === d
                    ? 'bg-movement text-white'
                    : 'bg-surface-elevated text-text-muted hover:bg-border'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border">
          {/* Duration Slider */}
          <div className="flex items-center gap-3 pt-3">
            <label className="text-xs text-text-muted whitespace-nowrap">Duration</label>
            <input
              type="range"
              min={1}
              max={Math.max(sectionDef.durationGroup * 2, 30)}
              value={duration}
              onChange={(e) => onDurationChange(parseInt(e.target.value))}
              className="flex-1 h-1.5 accent-movement"
            />
            <span className="text-xs font-medium text-text-primary w-12 text-right">
              {duration} min
            </span>
          </div>

          {/* Element Checklist */}
          {elements.length > 0 ? (
            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {elements.map(el => (
                <label
                  key={el.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={el.checked}
                    onChange={() => onToggleElement(el.id)}
                    className="w-4 h-4 rounded border-border text-movement focus:ring-movement/50"
                  />
                  <span className="text-sm text-text-primary flex-1">{el.label}</span>
                  {el.sublabel && (
                    <span className="text-xs text-text-muted">{el.sublabel}</span>
                  )}
                  {el.isNew && (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">
                      <Sparkle className="w-3 h-3" />
                      NEW
                    </span>
                  )}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted py-2">
              No data for this substep.{' '}
              <a href="/settings/wilson-data" className="text-movement hover:underline">
                Add via Settings &rarr; Wilson Data
              </a>
            </p>
          )}

          {/* Activities */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-text-muted">Activities</label>
              {substep && (
                <button
                  onClick={suggestActivities}
                  disabled={isSuggesting}
                  className="flex items-center gap-1 text-xs text-movement hover:text-movement/80 disabled:opacity-50"
                >
                  {isSuggesting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {isSuggesting ? 'Suggesting...' : 'Suggest'}
                </button>
              )}
            </div>
            {activities.map((act, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <span className="text-sm text-text-primary flex-1">{act}</span>
                <button
                  onClick={() => removeActivity(i)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addActivity()}
                placeholder="Add an activity..."
                className="flex-1 text-sm px-2 py-1 bg-surface border border-border rounded"
              />
              <button
                onClick={addActivity}
                disabled={!newActivity.trim()}
                className="text-xs text-movement hover:text-movement/80 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-text-muted block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Section notes..."
              className="w-full text-sm px-2 py-1.5 bg-surface border border-border rounded resize-none h-14"
            />
          </div>
        </div>
      )}
    </div>
  );
}
