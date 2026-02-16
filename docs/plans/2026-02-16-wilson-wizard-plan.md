# Wilson Wizard Builder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the clunky drag-and-drop Wilson lesson builder with a guided 5-step wizard that pre-populates elements from the substep data bank.

**Architecture:** New wizard components in `src/components/wilson-planner/` replace the existing builder. Same output types (`WilsonLessonPlan` / `MultiDayWilsonLessonPlan`), same data source (IndexedDB `wilsonLessonElements`), same save flow. Standalone page at `/wilson-builder` + embedded in session planning modal.

**Tech Stack:** Next.js 14, React 18, TypeScript, Zustand, Dexie.js (IndexedDB), Tailwind CSS, Lucide icons

---

### Task 1: Create WizardSetup Component

The first step of the wizard: substep picker, days toggle, session type.

**Files:**
- Create: `src/components/wilson-planner/WizardSetup.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { WILSON_STEPS } from '@/lib/curriculum/wilson';

interface WizardSetupProps {
  selectedSubstep: string;
  onSubstepChange: (substep: string) => void;
  numDays: number;
  onNumDaysChange: (days: number) => void;
  isGroup: boolean;
  onIsGroupChange: (isGroup: boolean) => void;
}

export function WizardSetup({
  selectedSubstep,
  onSubstepChange,
  numDays,
  onNumDaysChange,
  isGroup,
  onIsGroupChange,
}: WizardSetupProps) {
  // Build grouped substep options
  const substepOptions = useMemo(() => {
    return WILSON_STEPS.map(step => ({
      step: step.step,
      name: step.name,
      substeps: step.substeps.map(ss => ({
        value: ss.substep,
        label: `${ss.substep}: ${ss.name}`,
      })),
    }));
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center">
        <BookOpen className="w-10 h-10 mx-auto mb-3 text-movement" />
        <h2 className="text-xl font-bold text-text-primary">Lesson Setup</h2>
        <p className="text-sm text-text-muted mt-1">
          Choose the substep and planning options
        </p>
      </div>

      {/* Substep Picker */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Wilson Substep
        </label>
        <select
          value={selectedSubstep}
          onChange={(e) => onSubstepChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {substepOptions.map(step => (
            <optgroup key={step.step} label={`Step ${step.step}: ${step.name}`}>
              {step.substeps.map(ss => (
                <option key={ss.value} value={ss.value}>
                  {ss.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Number of Days */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Number of Days
        </label>
        <div className="flex gap-3">
          {[1, 2, 3].map(d => (
            <button
              key={d}
              onClick={() => onNumDaysChange(d)}
              className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                numDays === d
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-text-muted hover:border-primary/50'
              }`}
            >
              {d} Day{d > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Session Type */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Session Type
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => onIsGroupChange(true)}
            className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              isGroup
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-text-muted hover:border-primary/50'
            }`}
          >
            Group
          </button>
          <button
            onClick={() => onIsGroupChange(false)}
            className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              !isGroup
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-text-muted hover:border-primary/50'
            }`}
          >
            1-on-1
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/wilson-planner/WizardSetup.tsx
git commit -m "feat(wilson): add WizardSetup component"
```

---

### Task 2: Create WizardSection Component

Reusable card for a single lesson component (e.g., "Part 1: Sounds Quick Drill"). Shows element checklist, day toggle, duration slider, notes.

**Files:**
- Create: `src/components/wilson-planner/WizardSection.tsx`

**Step 1: Create the component**

This component renders one of the 10 Wilson lesson parts as an expandable card. It takes the section's element bank items and renders them as checkboxes. Each element can be toggled on/off. If `numDays > 1`, day assignment buttons appear.

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkle } from 'lucide-react';
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
}: WizardSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [newActivity, setNewActivity] = useState('');

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

  return (
    <div className="border border-border rounded-lg bg-background overflow-hidden">
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
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-muted hover:bg-surface-hover'
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
              className="flex-1 h-1.5 accent-primary"
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
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
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
              <a href="/settings/wilson-data" className="text-primary hover:underline">
                Add via Settings &rarr; Wilson Data
              </a>
            </p>
          )}

          {/* Activities */}
          <div>
            <label className="text-xs text-text-muted block mb-1">Activities</label>
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
                className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
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
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/wilson-planner/WizardSection.tsx
git commit -m "feat(wilson): add WizardSection component"
```

---

### Task 3: Create WizardBlock Component

Renders all sections for one Wilson block (Word Study, Spelling, or Fluency). Used for wizard Steps 2-4.

**Files:**
- Create: `src/components/wilson-planner/WizardBlock.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { WizardSection } from './WizardSection';
import { WILSON_LESSON_SECTIONS, type LessonBlock, type LessonComponentType } from '@/lib/curriculum/wilson-lesson-elements';

// Re-export ElementOption for use by parent
export interface ElementOption {
  id: string;
  type: 'sound' | 'word' | 'nonsense' | 'hf_word' | 'sentence' | 'story' | 'element';
  label: string;
  sublabel?: string;
  isNew?: boolean;
  checked: boolean;
}

interface SectionState {
  elements: ElementOption[];
  duration: number;
  notes: string;
  dayAssignment: number;
  activities: string[];
}

interface WizardBlockProps {
  block: LessonBlock;
  blockLabel: string;
  blockDescription: string;
  sections: Record<LessonComponentType, SectionState>;
  onToggleElement: (component: LessonComponentType, elementId: string) => void;
  onDurationChange: (component: LessonComponentType, duration: number) => void;
  onNotesChange: (component: LessonComponentType, notes: string) => void;
  onDayChange: (component: LessonComponentType, day: number) => void;
  onActivitiesChange: (component: LessonComponentType, activities: string[]) => void;
  numDays: number;
}

export function WizardBlock({
  block,
  blockLabel,
  blockDescription,
  sections,
  onToggleElement,
  onDurationChange,
  onNotesChange,
  onDayChange,
  onActivitiesChange,
  numDays,
}: WizardBlockProps) {
  const blockSections = WILSON_LESSON_SECTIONS.filter(s => s.block === block);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">{blockLabel}</h2>
        <p className="text-sm text-text-muted mt-1">{blockDescription}</p>
      </div>

      <div className="space-y-3 max-w-2xl mx-auto">
        {blockSections.map(sectionDef => {
          const state = sections[sectionDef.type];
          if (!state) return null;

          return (
            <WizardSection
              key={sectionDef.type}
              component={sectionDef.type}
              elements={state.elements}
              onToggleElement={(id) => onToggleElement(sectionDef.type, id)}
              duration={state.duration}
              onDurationChange={(d) => onDurationChange(sectionDef.type, d)}
              notes={state.notes}
              onNotesChange={(n) => onNotesChange(sectionDef.type, n)}
              dayAssignment={state.dayAssignment}
              onDayChange={(d) => onDayChange(sectionDef.type, d)}
              numDays={numDays}
              activities={state.activities}
              onActivitiesChange={(a) => onActivitiesChange(sectionDef.type, a)}
            />
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/wilson-planner/WizardBlock.tsx
git commit -m "feat(wilson): add WizardBlock component"
```

---

### Task 4: Create WizardReview Component

Step 5 of the wizard: shows the complete plan organized by day, total durations, warnings, and save button.

**Files:**
- Create: `src/components/wilson-planner/WizardReview.tsx`

**Step 1: Create the component**

```tsx
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
                  ? 'border-primary text-primary'
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
          className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Lesson Plan'}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/wilson-planner/WizardReview.tsx
git commit -m "feat(wilson): add WizardReview component"
```

---

### Task 5: Create WilsonWizard Main Component

The main wizard that ties all steps together. Manages state, loads element data from IndexedDB, handles navigation between steps, and builds the final `WilsonLessonPlan` on save.

**Files:**
- Create: `src/components/wilson-planner/WilsonWizard.tsx`

**Step 1: Create the component**

This is the largest component. Key responsibilities:
- Step navigation (1-5) with progress bar
- Load `WilsonLessonElements` from IndexedDB when substep changes
- Convert element bank data into `ElementOption[]` for each section
- Build `WilsonLessonPlan` / `MultiDayWilsonLessonPlan` on save
- Keep same `onSave` callback signature as old builder

The component should:
1. Initialize section states from `WILSON_LESSON_SECTIONS` with default durations
2. When substep data loads, populate each section's elements based on `acceptsElements`
3. Apply default day distributions when `numDays` changes (same defaults as old builder)
4. On save, convert checked elements to `LessonPlanElement[]` and build the plan

```tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { db } from '@/lib/local-db';
import { WILSON_STEPS, getWilsonSubstep } from '@/lib/curriculum/wilson';
import {
  WILSON_LESSON_SECTIONS,
  createEmptyLessonPlan,
  generateElementId,
  type WilsonLessonElements,
  type WilsonLessonPlan,
  type LessonPlanElement,
  type LessonComponentType,
} from '@/lib/curriculum/wilson-lesson-elements';
import { WizardSetup } from './WizardSetup';
import { WizardBlock, type ElementOption } from './WizardBlock';
import { WizardReview } from './WizardReview';

// Re-export MultiDayWilsonLessonPlan from old builder for compatibility
export interface MultiDayWilsonLessonPlan {
  days: number;
  plans: WilsonLessonPlan[];
  dayAssignments: Record<LessonComponentType, number>;
}

interface SectionState {
  elements: ElementOption[];
  duration: number;
  notes: string;
  dayAssignment: number;
  activities: string[];
}

const STEPS = ['Setup', 'Word Study', 'Spelling', 'Fluency', 'Review'] as const;

const DEFAULT_2_DAY: Record<LessonComponentType, number> = {
  'sounds-quick-drill': 1, 'teach-review-reading': 1, 'word-cards': 1,
  'wordlist-reading': 1, 'sentence-reading': 1,
  'quick-drill-reverse': 1, 'teach-review-spelling': 1, 'dictation': 1,
  'passage-reading': 2, 'listening-comprehension': 2,
};

const DEFAULT_3_DAY: Record<LessonComponentType, number> = {
  'sounds-quick-drill': 1, 'teach-review-reading': 1, 'word-cards': 1,
  'wordlist-reading': 1, 'sentence-reading': 1,
  'quick-drill-reverse': 2, 'teach-review-spelling': 2, 'dictation': 2,
  'passage-reading': 3, 'listening-comprehension': 3,
};

interface WilsonWizardProps {
  initialSubstep?: string;
  sessionId?: number;
  onSave?: (plan: WilsonLessonPlan | MultiDayWilsonLessonPlan) => void;
  onClose?: () => void;
}

export function WilsonWizard({
  initialSubstep,
  sessionId,
  onSave,
  onClose,
}: WilsonWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSubstep, setSelectedSubstep] = useState(initialSubstep || '1.1');
  const [numDays, setNumDays] = useState(1);
  const [isGroup, setIsGroup] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lessonElements, setLessonElements] = useState<WilsonLessonElements | null>(null);

  // Section states keyed by LessonComponentType
  const [sections, setSections] = useState<Record<LessonComponentType, SectionState>>(() => {
    const initial: Record<string, SectionState> = {};
    for (const def of WILSON_LESSON_SECTIONS) {
      initial[def.type] = {
        elements: [],
        duration: def.durationGroup,
        notes: '',
        dayAssignment: 1,
        activities: [],
      };
    }
    return initial as Record<LessonComponentType, SectionState>;
  });

  // Load element bank from IndexedDB when substep changes
  useEffect(() => {
    const loadElements = async () => {
      setIsLoading(true);
      try {
        const elements = await db.wilsonLessonElements
          .where('substep')
          .equals(selectedSubstep)
          .first();
        setLessonElements(elements || null);
      } catch (error) {
        console.error('Error loading lesson elements:', error);
        setLessonElements(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadElements();
  }, [selectedSubstep]);

  // When element data or session type changes, populate section elements
  useEffect(() => {
    if (!lessonElements) return;

    setSections(prev => {
      const next = { ...prev };

      for (const def of WILSON_LESSON_SECTIONS) {
        const accepts = def.acceptsElements;
        const elems: ElementOption[] = [];

        if (accepts.includes('sound')) {
          for (const sc of lessonElements.soundCards) {
            elems.push({
              id: sc.id,
              type: 'sound',
              label: `${sc.sound} — "${sc.keyword}"`,
              sublabel: sc.type,
              isNew: sc.isNew,
              checked: true,
            });
          }
        }
        if (accepts.includes('word')) {
          for (const w of lessonElements.realWords) {
            // Only include words that match the section purpose
            const includeForReading = ['teach-review-reading', 'word-cards', 'wordlist-reading'].includes(def.type) && w.forDecoding;
            const includeForSpelling = ['teach-review-spelling', 'dictation'].includes(def.type) && w.forSpelling;
            if (includeForReading || includeForSpelling) {
              elems.push({
                id: w.id,
                type: 'word',
                label: w.word,
                sublabel: w.syllableType,
                checked: true,
              });
            }
          }
        }
        if (accepts.includes('nonsense')) {
          for (const nw of lessonElements.nonsenseWords) {
            elems.push({
              id: nw.id,
              type: 'nonsense',
              label: nw.word,
              sublabel: nw.pattern,
              checked: true,
            });
          }
        }
        if (accepts.includes('hf_word')) {
          for (const hf of lessonElements.highFrequencyWords) {
            elems.push({
              id: hf.id,
              type: 'hf_word',
              label: hf.word,
              isNew: hf.isNew,
              checked: true,
            });
          }
        }
        if (accepts.includes('sentence')) {
          for (const s of lessonElements.sentences) {
            const includeReading = def.type === 'sentence-reading' && s.forReading;
            const includeDictation = def.type === 'dictation' && s.forDictation;
            if (includeReading || includeDictation) {
              elems.push({
                id: s.id,
                type: 'sentence',
                label: s.text.length > 60 ? s.text.slice(0, 60) + '...' : s.text,
                sublabel: `${s.wordCount} words`,
                checked: true,
              });
            }
          }
        }
        if (accepts.includes('story')) {
          for (const st of lessonElements.stories) {
            elems.push({
              id: st.id,
              type: 'story',
              label: st.title,
              sublabel: `${st.wordCount} words`,
              checked: true,
            });
          }
        }
        if (accepts.includes('element')) {
          for (const we of lessonElements.wordElements) {
            elems.push({
              id: we.id,
              type: 'element',
              label: we.element,
              sublabel: we.type,
              checked: true,
            });
          }
        }

        next[def.type] = {
          ...next[def.type],
          elements: elems,
          duration: isGroup ? def.durationGroup : def.duration1to1,
        };
      }

      return next;
    });
  }, [lessonElements, isGroup]);

  // Handle numDays change — apply default day distributions
  const handleNumDaysChange = useCallback((days: number) => {
    setNumDays(days);
    setSections(prev => {
      const next = { ...prev };
      const defaults = days === 3 ? DEFAULT_3_DAY : days === 2 ? DEFAULT_2_DAY : null;

      for (const def of WILSON_LESSON_SECTIONS) {
        next[def.type] = {
          ...next[def.type],
          dayAssignment: defaults ? defaults[def.type] : 1,
        };
      }
      return next;
    });
  }, []);

  // Section update helpers
  const toggleElement = useCallback((component: LessonComponentType, elementId: string) => {
    setSections(prev => ({
      ...prev,
      [component]: {
        ...prev[component],
        elements: prev[component].elements.map(e =>
          e.id === elementId ? { ...e, checked: !e.checked } : e
        ),
      },
    }));
  }, []);

  const updateDuration = useCallback((component: LessonComponentType, duration: number) => {
    setSections(prev => ({
      ...prev,
      [component]: { ...prev[component], duration },
    }));
  }, []);

  const updateNotes = useCallback((component: LessonComponentType, notes: string) => {
    setSections(prev => ({
      ...prev,
      [component]: { ...prev[component], notes },
    }));
  }, []);

  const updateDay = useCallback((component: LessonComponentType, day: number) => {
    setSections(prev => ({
      ...prev,
      [component]: { ...prev[component], dayAssignment: day },
    }));
  }, []);

  const updateActivities = useCallback((component: LessonComponentType, activities: string[]) => {
    setSections(prev => ({
      ...prev,
      [component]: { ...prev[component], activities },
    }));
  }, []);

  // Build the substep label
  const substepLabel = useMemo(() => {
    const info = getWilsonSubstep(selectedSubstep);
    return info ? `${info.substep}: ${info.name}` : selectedSubstep;
  }, [selectedSubstep]);

  // Save handler — builds WilsonLessonPlan or MultiDayWilsonLessonPlan
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();

      // Build sections with checked elements converted to LessonPlanElement[]
      const buildPlanSections = (dayFilter?: number) => {
        return WILSON_LESSON_SECTIONS
          .filter(def => !dayFilter || sections[def.type].dayAssignment === dayFilter)
          .map(def => {
            const state = sections[def.type];
            const elements: LessonPlanElement[] = state.elements
              .filter(e => e.checked)
              .map(e => ({
                id: generateElementId(),
                type: e.type,
                value: e.label,
                sourceId: e.id,
              }));

            return {
              component: def.type,
              componentName: def.name,
              duration: state.duration,
              elements,
              activities: state.activities,
              notes: state.notes || undefined,
            };
          });
      };

      if (numDays === 1) {
        const plan: WilsonLessonPlan = {
          sessionId,
          substep: selectedSubstep,
          substepName: substepLabel,
          sections: buildPlanSections(),
          totalDuration: Object.values(sections).reduce((sum, s) => sum + s.duration, 0),
          createdAt: now,
          updatedAt: now,
        };

        // Save to IndexedDB
        const id = await db.wilsonLessonPlans.add(plan);
        plan.id = id;

        onSave?.(plan);
      } else {
        // Multi-day: build separate plans per day
        const plans: WilsonLessonPlan[] = [];
        const dayAssignments: Record<LessonComponentType, number> = {} as any;

        for (const def of WILSON_LESSON_SECTIONS) {
          dayAssignments[def.type] = sections[def.type].dayAssignment;
        }

        for (let d = 1; d <= numDays; d++) {
          const daySections = buildPlanSections(d);
          const plan: WilsonLessonPlan = {
            sessionId,
            substep: selectedSubstep,
            substepName: substepLabel,
            sections: daySections,
            totalDuration: daySections.reduce((sum, s) => sum + s.duration, 0),
            createdAt: now,
            updatedAt: now,
          };
          plans.push(plan);
        }

        const multiDayPlan: MultiDayWilsonLessonPlan = {
          days: numDays,
          plans,
          dayAssignments,
        };

        onSave?.(multiDayPlan);
      }
    } catch (error) {
      console.error('Error saving lesson plan:', error);
    } finally {
      setIsSaving(false);
    }
  }, [sections, numDays, selectedSubstep, substepLabel, sessionId, onSave]);

  // Navigation
  const canGoNext = currentStep < STEPS.length - 1;
  const canGoBack = currentStep > 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Progress Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <button
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  i === currentStep
                    ? 'bg-primary text-white'
                    : i < currentStep
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-surface text-text-muted'
                }`}
              >
                {i < currentStep ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span>{i + 1}</span>
                )}
                <span className="hidden sm:inline">{step}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-0.5 mx-0.5 ${
                  i < currentStep ? 'bg-emerald-400' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-text-muted hover:text-text-primary"
          >
            Close
          </button>
        )}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
          </div>
        ) : (
          <>
            {currentStep === 0 && (
              <WizardSetup
                selectedSubstep={selectedSubstep}
                onSubstepChange={setSelectedSubstep}
                numDays={numDays}
                onNumDaysChange={handleNumDaysChange}
                isGroup={isGroup}
                onIsGroupChange={setIsGroup}
              />
            )}
            {currentStep === 1 && (
              <WizardBlock
                block="word-study"
                blockLabel="Block 1: Word Study"
                blockDescription="Parts 1-5 — Sounds, reading concepts, word cards, wordlists, sentences"
                sections={sections}
                onToggleElement={toggleElement}
                onDurationChange={updateDuration}
                onNotesChange={updateNotes}
                onDayChange={updateDay}
                onActivitiesChange={updateActivities}
                numDays={numDays}
              />
            )}
            {currentStep === 2 && (
              <WizardBlock
                block="spelling"
                blockLabel="Block 2: Spelling"
                blockDescription="Parts 6-8 — Quick drill reverse, spelling concepts, dictation"
                sections={sections}
                onToggleElement={toggleElement}
                onDurationChange={updateDuration}
                onNotesChange={updateNotes}
                onDayChange={updateDay}
                onActivitiesChange={updateActivities}
                numDays={numDays}
              />
            )}
            {currentStep === 3 && (
              <WizardBlock
                block="fluency-comprehension"
                blockLabel="Block 3: Fluency & Comprehension"
                blockDescription="Parts 9-10 — Passage reading, listening comprehension"
                sections={sections}
                onToggleElement={toggleElement}
                onDurationChange={updateDuration}
                onNotesChange={updateNotes}
                onDayChange={updateDay}
                onActivitiesChange={updateActivities}
                numDays={numDays}
              />
            )}
            {currentStep === 4 && (
              <WizardReview
                numDays={numDays}
                substepLabel={substepLabel}
                sections={sections}
                onSave={handleSave}
                isSaving={isSaving}
              />
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface">
        <button
          onClick={() => setCurrentStep(s => s - 1)}
          disabled={!canGoBack}
          className="flex items-center gap-1 px-4 py-2 text-sm text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {canGoNext ? (
          <button
            onClick={() => setCurrentStep(s => s + 1)}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div /> // Save is in WizardReview
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/wilson-planner/WilsonWizard.tsx
git commit -m "feat(wilson): add WilsonWizard main component"
```

---

### Task 6: Update Barrel Exports

Update `src/components/wilson-planner/index.ts` to export the new wizard and keep backward compatibility.

**Files:**
- Modify: `src/components/wilson-planner/index.ts`

**Step 1: Update exports**

```tsx
/**
 * Wilson Lesson Planner Components
 *
 * Guided wizard for Wilson Reading System lesson planning
 */

export { WilsonWizard } from './WilsonWizard';
export type { MultiDayWilsonLessonPlan } from './WilsonWizard';

// Legacy exports — keep for backward compatibility until fully removed
export { WilsonLessonBuilder } from './WilsonLessonBuilder';
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/wilson-planner/index.ts
git commit -m "feat(wilson): update barrel exports for wizard"
```

---

### Task 7: Wire Wizard into Session Planning Modal

Replace the old `WilsonLessonBuilder` with `WilsonWizard` in `plan-session-modal.tsx`.

**Files:**
- Modify: `src/components/sessions/plan-session-modal.tsx:8,467-470`

**Step 1: Update import**

Change line 8 from:
```tsx
import { WilsonLessonBuilder, MultiDayWilsonLessonPlan } from '@/components/wilson-planner';
```
to:
```tsx
import { WilsonWizard, MultiDayWilsonLessonPlan } from '@/components/wilson-planner';
```

**Step 2: Replace component usage**

Change lines 467-470 from:
```tsx
<WilsonLessonBuilder
  initialSubstep={isWilsonPosition(group.current_position) ? group.current_position.substep : '1.1'}
  onSave={handleLessonPlanSave}
/>
```
to:
```tsx
<WilsonWizard
  initialSubstep={isWilsonPosition(group.current_position) ? group.current_position.substep : '1.1'}
  onSave={handleLessonPlanSave}
/>
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/sessions/plan-session-modal.tsx
git commit -m "feat(wilson): wire wizard into session planning modal"
```

---

### Task 8: Create Standalone Wilson Builder Page

Add a new route at `/wilson-builder` with the wizard in an `AppLayout`.

**Files:**
- Create: `src/app/wilson-builder/page.tsx`

**Step 1: Create the page**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { WilsonWizard } from '@/components/wilson-planner';

export default function WilsonBuilderPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)]">
        <WilsonWizard
          onSave={() => {
            router.push('/groups');
          }}
          onClose={() => {
            router.back();
          }}
        />
      </div>
    </AppLayout>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/wilson-builder/page.tsx
git commit -m "feat(wilson): add standalone /wilson-builder page"
```

---

### Task 9: Add to Sidebar Navigation

Add "Wilson Builder" to the navigation sidebar.

**Files:**
- Modify: `src/components/layout/sidebar.tsx:37-52`

**Step 1: Add import**

Add `Wand2` to the lucide-react import (line ~3-25).

**Step 2: Add nav item**

Add to the `navItems` array after the `materials` entry:

```tsx
{ href: '/wilson-builder', label: 'Wilson Builder', icon: Wand2 },
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(wilson): add Wilson Builder to sidebar navigation"
```

---

### Task 10: Type Check, Build, Push, Deploy

Full verification and deployment.

**Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit any remaining changes**

If there are any fixes needed from the build, commit them.

**Step 4: Push**

```bash
git push origin main
```

**Step 5: Deploy to NAS**

```bash
ssh Dr.Tobon@192.168.86.45 "cd /volume1/docker/emerge-intervention-planner && git pull origin main && npm run build && pm2 restart emerge-planner"
```

Expected: PM2 restarts successfully, app is live.
