'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, Save } from 'lucide-react';
import { db } from '@/lib/local-db';
import { WILSON_STEPS, getWilsonSubstep } from '@/lib/curriculum/wilson';
import { ensureWilsonDataSeeded } from '@/lib/curriculum/wilson-data-seeder';
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

interface WizardDraft {
  currentStep: number;
  selectedSubstep: string;
  numDays: number;
  isGroup: boolean;
  sections: Record<string, SectionState>;
  savedAt: string;
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

  // --- Draft persistence ---
  const storageKey = sessionId
    ? `wilson_wizard_session_${sessionId}`
    : `wilson_wizard_new_${initialSubstep || 'default'}`;

  const [hasDraft, setHasDraft] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftDate, setDraftDate] = useState<string>('');

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const draft: WizardDraft = JSON.parse(raw);
        if (draft.savedAt) {
          setHasDraft(true);
          setDraftDate(draft.savedAt);
        }
      }
    } catch {
      // Corrupt or missing draft — ignore
    }
  }, [storageKey]);

  const restoreDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const draft: WizardDraft = JSON.parse(raw);
      setCurrentStep(draft.currentStep);
      setSelectedSubstep(draft.selectedSubstep);
      setNumDays(draft.numDays);
      setIsGroup(draft.isGroup);
      setSections(draft.sections as Record<LessonComponentType, SectionState>);
      setDraftRestored(true);
      setHasDraft(false);
    } catch {
      // Corrupt draft — discard
      localStorage.removeItem(storageKey);
      setHasDraft(false);
    }
  }, [storageKey]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
  }, [storageKey]);

  // Auto-save draft with 1-second debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft: WizardDraft = {
        currentStep,
        selectedSubstep,
        numDays,
        isGroup,
        sections,
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentStep, selectedSubstep, numDays, isGroup, sections, storageKey]);

  // Load element bank from IndexedDB when substep changes
  useEffect(() => {
    const loadElements = async () => {
      setIsLoading(true);
      try {
        await ensureWilsonDataSeeded();
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
              label: sc.keyword ? `${sc.sound} — "${sc.keyword}"` : sc.sound,
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

      // Clear draft on successful save
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error saving lesson plan:', error);
    } finally {
      setIsSaving(false);
    }
  }, [sections, numDays, selectedSubstep, substepLabel, sessionId, onSave, storageKey]);

  // Navigation
  const canGoNext = currentStep < STEPS.length - 1;
  const canGoBack = currentStep > 0;

  return (
    <div className="flex flex-col h-full bg-foundation">
      {/* Progress Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <button
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  i === currentStep
                    ? 'bg-movement text-white'
                    : i < currentStep
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-surface-elevated text-text-muted'
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
            {hasDraft && !draftRestored && (
              <div className="flex items-center justify-between p-3 mb-4 bg-breakthrough/10 border border-breakthrough/20 rounded-xl text-sm">
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-breakthrough" />
                  <span className="text-text-primary">
                    Draft saved {formatTimeAgo(draftDate)} — restore your progress?
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={restoreDraft} className="px-3 py-1 rounded-lg text-xs font-medium bg-breakthrough text-foundation">
                    Restore
                  </button>
                  <button onClick={discardDraft} className="px-3 py-1 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary">
                    Discard
                  </button>
                </div>
              </div>
            )}
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
                substep={selectedSubstep}
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
                substep={selectedSubstep}
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
                substep={selectedSubstep}
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
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface z-10 relative">
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
            className="flex items-center gap-1 px-4 py-2 text-sm bg-movement text-white rounded-lg hover:bg-movement-hover transition-colors"
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
