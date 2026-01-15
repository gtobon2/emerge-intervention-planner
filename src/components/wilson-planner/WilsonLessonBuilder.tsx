/**
 * WilsonLessonBuilder - Main drag-and-drop lesson plan builder
 *
 * Allows interventionists to:
 * 1. Select a substep
 * 2. Drag elements from the Element Bank into lesson sections
 * 3. Get AI-powered activity suggestions
 * 4. Save the lesson plan
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { Sparkles, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ElementBank } from './ElementBank';
import { LessonSection } from './LessonSection';
import { DraggableElement, DraggableElementData, DraggableElementPlaceholder } from './DraggableElement';
import { db } from '@/lib/local-db';
import type {
  WilsonLessonElements,
  WilsonLessonPlan,
  LessonPlanSection,
  LessonComponentType,
} from '@/lib/curriculum/wilson-lesson-elements';
import {
  createEmptyLessonPlan,
  calculateLessonDuration,
  generateElementId,
} from '@/lib/curriculum/wilson-lesson-elements';

// Wilson substep definitions
const WILSON_SUBSTEPS = [
  { value: '1.1', label: '1.1 - Short Vowels a, i', step: 1 },
  { value: '1.2', label: '1.2 - Short Vowels o, u, e', step: 1 },
  { value: '1.3', label: '1.3 - Digraphs sh, th, wh, ch, ck', step: 1 },
  { value: '1.4', label: '1.4 - Blends', step: 1 },
  { value: '1.5', label: '1.5 - Three-Sound Review', step: 1 },
  { value: '1.6', label: '1.6 - Glued Sounds ang, ing, ong, ung, ank, ink, onk, unk', step: 1 },
  { value: '2.1', label: '2.1 - Closed Syllable Exceptions', step: 2 },
  { value: '2.2', label: '2.2 - Suffix -s, Plurals', step: 2 },
  { value: '2.3', label: '2.3 - Suffix -es', step: 2 },
  { value: '2.4', label: '2.4 - Suffix -ed', step: 2 },
  { value: '2.5', label: '2.5 - Suffix -ing', step: 2 },
  { value: '2.6', label: '2.6 - Suffix Review', step: 2 },
  { value: '3.1', label: '3.1 - Closed Syllable Division', step: 3 },
  { value: '3.2', label: '3.2 - Vowel-Consonant-e Syllable', step: 3 },
  { value: '3.3', label: '3.3 - Open Syllable', step: 3 },
  { value: '3.4', label: '3.4 - Syllable Division Review', step: 3 },
  { value: '4.1', label: '4.1 - R-Controlled ar', step: 4 },
  { value: '4.2', label: '4.2 - R-Controlled or', step: 4 },
  { value: '4.3', label: '4.3 - R-Controlled er, ir, ur', step: 4 },
  { value: '4.4', label: '4.4 - R-Controlled Review', step: 4 },
  { value: '5.1', label: '5.1 - Vowel Team ai, ay', step: 5 },
  { value: '5.2', label: '5.2 - Vowel Team ee, ea', step: 5 },
  { value: '5.3', label: '5.3 - Vowel Team oi, oy', step: 5 },
  { value: '5.4', label: '5.4 - Vowel Team oa, ow, oe', step: 5 },
  { value: '5.5', label: '5.5 - Vowel Team ou, oo, ew, au, aw', step: 5 },
  { value: '5.6', label: '5.6 - Vowel Team Review', step: 5 },
  { value: '6.1', label: '6.1 - Consonant-le Syllable', step: 6 },
  { value: '6.2', label: '6.2 - Advanced Suffixes -tion, -sion', step: 6 },
  { value: '6.3', label: '6.3 - Prefixes', step: 6 },
  { value: '6.4', label: '6.4 - Multisyllable Review', step: 6 },
];

// Multi-day lesson plan with day assignments
export interface MultiDayWilsonLessonPlan {
  days: number;  // 1, 2, or 3
  plans: WilsonLessonPlan[];  // One plan per day
  dayAssignments: Record<LessonComponentType, number>;  // Component -> day number
}

interface WilsonLessonBuilderProps {
  initialSubstep?: string;
  sessionId?: number;
  onSave?: (plan: WilsonLessonPlan | MultiDayWilsonLessonPlan) => void;
  onClose?: () => void;
}

export function WilsonLessonBuilder({
  initialSubstep,
  sessionId,
  onSave,
  onClose,
}: WilsonLessonBuilderProps) {
  const [selectedSubstep, setSelectedSubstep] = useState(initialSubstep || '1.1');
  const [lessonElements, setLessonElements] = useState<WilsonLessonElements | null>(null);
  const [lessonPlan, setLessonPlan] = useState<WilsonLessonPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [activeElement, setActiveElement] = useState<DraggableElementData | null>(null);
  const [loadingAISection, setLoadingAISection] = useState<LessonComponentType | null>(null);

  // Multi-day state
  const [numDays, setNumDays] = useState(1);
  const [dayAssignments, setDayAssignments] = useState<Record<LessonComponentType, number>>({
    // Default: all components on day 1
    'sounds-quick-drill': 1,
    'teach-review-reading': 1,
    'word-cards': 1,
    'wordlist-reading': 1,
    'sentence-reading': 1,
    'quick-drill-reverse': 1,
    'teach-review-spelling': 1,
    'dictation': 1,
    'passage-reading': 1,
    'listening-comprehension': 1,
  });

  // Default day distributions
  const DEFAULT_2_DAY: Record<LessonComponentType, number> = {
    // Day 1: Blocks 1 & 2 (Word Study + Spelling)
    'sounds-quick-drill': 1,
    'teach-review-reading': 1,
    'word-cards': 1,
    'wordlist-reading': 1,
    'sentence-reading': 1,
    'quick-drill-reverse': 1,
    'teach-review-spelling': 1,
    'dictation': 1,
    // Day 2: Block 3 (Comprehension)
    'passage-reading': 2,
    'listening-comprehension': 2,
  };

  const DEFAULT_3_DAY: Record<LessonComponentType, number> = {
    // Day 1: Block 1 (Word Study)
    'sounds-quick-drill': 1,
    'teach-review-reading': 1,
    'word-cards': 1,
    'wordlist-reading': 1,
    'sentence-reading': 1,
    // Day 2: Block 2 (Spelling)
    'quick-drill-reverse': 2,
    'teach-review-spelling': 2,
    'dictation': 2,
    // Day 3: Block 3 (Comprehension)
    'passage-reading': 3,
    'listening-comprehension': 3,
  };

  // Handle numDays change - apply default distribution
  const handleNumDaysChange = (days: number) => {
    setNumDays(days);
    if (days === 1) {
      // Reset all to day 1
      const allDay1: Record<LessonComponentType, number> = {} as any;
      Object.keys(dayAssignments).forEach(key => {
        allDay1[key as LessonComponentType] = 1;
      });
      setDayAssignments(allDay1);
    } else if (days === 2) {
      setDayAssignments(DEFAULT_2_DAY);
    } else if (days === 3) {
      setDayAssignments(DEFAULT_3_DAY);
    }
  };

  // Handle day assignment change for a component
  const handleDayAssignmentChange = (component: LessonComponentType, day: number) => {
    setDayAssignments(prev => ({
      ...prev,
      [component]: day,
    }));
  };

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Load lesson elements for selected substep
  useEffect(() => {
    const loadElements = async () => {
      setIsLoading(true);
      try {
        const elements = await db.wilsonLessonElements
          .where('substep')
          .equals(selectedSubstep)
          .first();

        setLessonElements(elements || null);

        // Initialize empty lesson plan
        const substepInfo = WILSON_SUBSTEPS.find((s) => s.value === selectedSubstep);
        const newPlan = createEmptyLessonPlan(
          selectedSubstep,
          substepInfo?.label.split(' - ')[1] || ''
        );
        if (sessionId) {
          newPlan.sessionId = sessionId;
        }
        setLessonPlan(newPlan);
      } catch (error) {
        console.error('Error loading lesson elements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadElements();
  }, [selectedSubstep, sessionId]);

  // Get set of used element IDs
  const usedElementIds = useMemo(() => {
    if (!lessonPlan) return new Set<string>();
    const ids = new Set<string>();
    lessonPlan.sections.forEach((section) => {
      section.elements.forEach((el) => ids.add(el.sourceId));
    });
    return ids;
  }, [lessonPlan]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveElement(event.active.data.current as DraggableElementData);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveElement(null);

    const { active, over } = event;
    if (!over || !lessonPlan) return;

    const draggedElement = active.data.current as DraggableElementData;
    const targetSection = over.id as LessonComponentType;
    const targetAccepts = over.data.current?.accepts as string[] | undefined;

    // Check if the target section accepts this element type
    if (!targetAccepts || !targetAccepts.includes(draggedElement.type)) {
      return;
    }

    // Check if already in this section
    const section = lessonPlan.sections.find((s) => s.component === targetSection);
    if (section?.elements.some((el) => el.sourceId === draggedElement.sourceId)) {
      return;
    }

    // Add element to section
    setLessonPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.component === targetSection
            ? {
                ...s,
                elements: [
                  ...s.elements,
                  {
                    id: generateElementId(),
                    type: draggedElement.type,
                    value: draggedElement.value,
                    sourceId: draggedElement.sourceId,
                  },
                ],
              }
            : s
        ),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Remove element from section
  const handleRemoveElement = useCallback((sectionComponent: LessonComponentType, elementId: string) => {
    setLessonPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.component === sectionComponent
            ? {
                ...s,
                elements: s.elements.filter((el) => el.id !== elementId),
              }
            : s
        ),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  // Update section duration
  const handleUpdateDuration = useCallback((sectionComponent: LessonComponentType, duration: number) => {
    setLessonPlan((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        sections: prev.sections.map((s) =>
          s.component === sectionComponent ? { ...s, duration } : s
        ),
        updatedAt: new Date().toISOString(),
      };
      updated.totalDuration = calculateLessonDuration(updated);
      return updated;
    });
  }, []);

  // Add activity to section
  const handleAddActivity = useCallback((sectionComponent: LessonComponentType, activity: string) => {
    setLessonPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.component === sectionComponent
            ? { ...s, activities: [...s.activities, activity] }
            : s
        ),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  // Remove activity from section
  const handleRemoveActivity = useCallback((sectionComponent: LessonComponentType, index: number) => {
    setLessonPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.component === sectionComponent
            ? { ...s, activities: s.activities.filter((_, i) => i !== index) }
            : s
        ),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  // Update section notes
  const handleUpdateNotes = useCallback((sectionComponent: LessonComponentType, notes: string) => {
    setLessonPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.component === sectionComponent ? { ...s, notes } : s
        ),
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  // Request AI suggestions for a section
  const handleRequestAISuggestions = useCallback(async (section: LessonPlanSection) => {
    if (!lessonPlan) return;

    setLoadingAISection(section.component);
    try {
      const response = await fetch('/api/ai/suggest-wilson-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          substep: selectedSubstep,
          component: section.component,
          componentName: section.componentName,
          elements: section.elements,
          currentActivities: section.activities,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.suggestions && Array.isArray(data.suggestions)) {
          // Add AI suggestions as activities
          setLessonPlan((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              sections: prev.sections.map((s) =>
                s.component === section.component
                  ? { ...s, activities: [...s.activities, ...data.suggestions] }
                  : s
              ),
              updatedAt: new Date().toISOString(),
            };
          });
        }
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setLoadingAISection(null);
    }
  }, [lessonPlan, selectedSubstep]);

  // Quick add element from bank
  const handleQuickAdd = useCallback((element: DraggableElementData) => {
    if (!lessonPlan) return;

    // Find first matching section that accepts this type
    const targetSection = lessonPlan.sections.find((s) => {
      const acceptedTypes: Record<LessonComponentType, string[]> = {
        // Block 1: Word Study
        'sounds-quick-drill': ['sound'],
        'teach-review-reading': ['sound', 'word', 'element'],
        'word-cards': ['word', 'hf_word'],
        'wordlist-reading': ['word', 'nonsense'],
        'sentence-reading': ['sentence'],
        // Block 2: Spelling
        'quick-drill-reverse': ['sound'],
        'teach-review-spelling': ['word', 'element', 'hf_word'],
        'dictation': ['sound', 'word', 'nonsense', 'sentence', 'element', 'hf_word'],
        // Block 3: Fluency/Comprehension
        'passage-reading': ['story'],
        'listening-comprehension': ['story'],
      };
      return acceptedTypes[s.component]?.includes(element.type);
    });

    if (targetSection) {
      setLessonPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.component === targetSection.component
              ? {
                  ...s,
                  elements: [
                    ...s.elements,
                    {
                      id: generateElementId(),
                      type: element.type,
                      value: element.value,
                      sourceId: element.sourceId,
                    },
                  ],
                }
              : s
          ),
          updatedAt: new Date().toISOString(),
        };
      });
    }
  }, [lessonPlan]);

  // Save lesson plan
  const handleSave = async () => {
    if (!lessonPlan) return;

    setIsSaving(true);
    try {
      if (numDays === 1) {
        // Single day - save as before
        const planToSave = {
          ...lessonPlan,
          updatedAt: new Date().toISOString(),
        };

        if (planToSave.id) {
          await db.wilsonLessonPlans.update(planToSave.id, planToSave);
        } else {
          const id = await db.wilsonLessonPlans.add(planToSave);
          setLessonPlan({ ...planToSave, id });
        }

        if (onSave) {
          onSave(planToSave);
        }
      } else {
        // Multi-day - create separate plans for each day
        const plans: WilsonLessonPlan[] = [];

        for (let day = 1; day <= numDays; day++) {
          // Get sections assigned to this day
          const daySections = lessonPlan.sections.filter(
            section => dayAssignments[section.component] === day
          );

          if (daySections.length > 0) {
            const dayPlan: WilsonLessonPlan = {
              substep: lessonPlan.substep,
              substepName: `${lessonPlan.substepName} (Day ${day}/${numDays})`,
              sections: daySections,
              totalDuration: daySections.reduce((sum, s) => sum + s.duration, 0),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            if (sessionId) {
              dayPlan.sessionId = sessionId;
            }

            plans.push(dayPlan);
          }
        }

        // Save multi-day plan
        if (onSave) {
          const multiDayPlan: MultiDayWilsonLessonPlan = {
            days: numDays,
            plans,
            dayAssignments,
          };
          onSave(multiDayPlan);
        }
      }
    } catch (error) {
      console.error('Error saving lesson plan:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-generate entire lesson with AI
  const handleAutoGenerateWithAI = async () => {
    if (!lessonPlan) return;

    setIsGeneratingAI(true);
    try {
      const substepInfo = WILSON_SUBSTEPS.find((s) => s.value === selectedSubstep);
      const substepName = substepInfo?.label.split(' - ')[1] || '';

      const response = await fetch('/api/ai/generate-wilson-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          substep: selectedSubstep,
          substepName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.lessonPlan) {
          // Update the lesson plan with AI-generated content
          setLessonPlan((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              sections: data.lessonPlan.sections,
              totalDuration: data.lessonPlan.totalDuration,
              updatedAt: new Date().toISOString(),
            };
          });
        }
      } else {
        console.error('Failed to generate AI lesson:', await response.text());
      }
    } catch (error) {
      console.error('Error generating AI lesson:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Wilson Lesson Builder</h2>
          <select
            value={selectedSubstep}
            onChange={(e) => setSelectedSubstep(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {WILSON_SUBSTEPS.map((substep) => (
              <option key={substep.value} value={substep.value}>
                {substep.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 border-l pl-4">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Days:</span>
            <select
              value={numDays}
              onChange={(e) => handleNumDaysChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={1}>1 Day</option>
              <option value={2}>2 Days</option>
              <option value={3}>3 Days</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lessonPlan && (
            <span className="text-sm text-muted-foreground">
              Total: {lessonPlan.totalDuration} min
            </span>
          )}
          <button
            onClick={handleAutoGenerateWithAI}
            disabled={isGeneratingAI || !lessonPlan}
            className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-md hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Auto-Plan with AI</span>
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !lessonPlan}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Plan'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Element Bank Sidebar */}
          <div className="w-72 border-r bg-muted/10 flex-shrink-0 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b bg-muted/30">
              <h3 className="text-sm font-medium">Element Bank</h3>
              {!lessonElements && !isLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  No data for this substep.{' '}
                  <a
                    href="/settings/wilson-data"
                    className="text-primary hover:underline"
                  >
                    Add data
                  </a>
                </p>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <ElementBank
                lessonElements={lessonElements}
                usedElementIds={usedElementIds}
                onQuickAdd={handleQuickAdd}
              />
            </div>
          </div>

          {/* Lesson Plan Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            ) : lessonPlan ? (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold">
                    Substep {lessonPlan.substep}: {lessonPlan.substepName}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {numDays > 1
                      ? `Assign each section to Day 1-${numDays}, then drag elements into sections`
                      : 'Drag elements from the bank into each lesson section'
                    }
                  </p>
                  {numDays > 1 && (
                    <div className="flex justify-center gap-2 mt-2">
                      {Array.from({ length: numDays }, (_, i) => i + 1).map(day => {
                        const dayDuration = lessonPlan.sections
                          .filter(s => dayAssignments[s.component] === day)
                          .reduce((sum, s) => sum + s.duration, 0);
                        return (
                          <span
                            key={day}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              day === 1 && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                              day === 2 && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                              day === 3 && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            )}
                          >
                            Day {day}: {dayDuration} min
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Block 1: Word Study */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">1</div>
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300">Block 1: Word Study</h4>
                  </div>
                  {lessonPlan.sections.slice(0, 5).map((section, idx) => (
                    <div key={section.component} className="relative">
                      {numDays > 1 && (
                        <div className="absolute -top-1 right-2 z-10">
                          <select
                            value={dayAssignments[section.component]}
                            onChange={(e) => handleDayAssignmentChange(section.component, Number(e.target.value))}
                            className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded border-0 cursor-pointer",
                              dayAssignments[section.component] === 1 && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                              dayAssignments[section.component] === 2 && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
                              dayAssignments[section.component] === 3 && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                            )}
                          >
                            {Array.from({ length: numDays }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>Day {day}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <LessonSection
                        section={{ ...section, componentName: `${idx + 1}. ${section.componentName}` }}
                        onRemoveElement={(elementId) =>
                          handleRemoveElement(section.component, elementId)
                        }
                        onUpdateDuration={(duration) =>
                          handleUpdateDuration(section.component, duration)
                        }
                        onAddActivity={(activity) =>
                          handleAddActivity(section.component, activity)
                        }
                        onRemoveActivity={(index) =>
                          handleRemoveActivity(section.component, index)
                        }
                        onUpdateNotes={(notes) =>
                          handleUpdateNotes(section.component, notes)
                        }
                        onRequestAISuggestions={() =>
                          handleRequestAISuggestions(section)
                        }
                        isLoadingAI={loadingAISection === section.component}
                      />
                    </div>
                  ))}
                </div>

                {/* Block 2: Spelling */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">2</div>
                    <h4 className="font-semibold text-green-700 dark:text-green-300">Block 2: Spelling</h4>
                  </div>
                  {lessonPlan.sections.slice(5, 8).map((section, idx) => (
                    <div key={section.component} className="relative">
                      {numDays > 1 && (
                        <div className="absolute -top-1 right-2 z-10">
                          <select
                            value={dayAssignments[section.component]}
                            onChange={(e) => handleDayAssignmentChange(section.component, Number(e.target.value))}
                            className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded border-0 cursor-pointer",
                              dayAssignments[section.component] === 1 && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                              dayAssignments[section.component] === 2 && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
                              dayAssignments[section.component] === 3 && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                            )}
                          >
                            {Array.from({ length: numDays }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>Day {day}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <LessonSection
                        section={{ ...section, componentName: `${idx + 6}. ${section.componentName}` }}
                        onRemoveElement={(elementId) =>
                          handleRemoveElement(section.component, elementId)
                        }
                        onUpdateDuration={(duration) =>
                          handleUpdateDuration(section.component, duration)
                        }
                        onAddActivity={(activity) =>
                          handleAddActivity(section.component, activity)
                        }
                        onRemoveActivity={(index) =>
                          handleRemoveActivity(section.component, index)
                        }
                        onUpdateNotes={(notes) =>
                          handleUpdateNotes(section.component, notes)
                        }
                        onRequestAISuggestions={() =>
                          handleRequestAISuggestions(section)
                        }
                        isLoadingAI={loadingAISection === section.component}
                      />
                    </div>
                  ))}
                </div>

                {/* Block 3: Fluency/Comprehension */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">3</div>
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300">Block 3: Fluency/Comprehension</h4>
                  </div>
                  {lessonPlan.sections.slice(8, 10).map((section, idx) => (
                    <div key={section.component} className="relative">
                      {numDays > 1 && (
                        <div className="absolute -top-1 right-2 z-10">
                          <select
                            value={dayAssignments[section.component]}
                            onChange={(e) => handleDayAssignmentChange(section.component, Number(e.target.value))}
                            className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded border-0 cursor-pointer",
                              dayAssignments[section.component] === 1 && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                              dayAssignments[section.component] === 2 && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
                              dayAssignments[section.component] === 3 && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                            )}
                          >
                            {Array.from({ length: numDays }, (_, i) => i + 1).map(day => (
                              <option key={day} value={day}>Day {day}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <LessonSection
                        section={{ ...section, componentName: `${idx + 9}. ${section.componentName}` }}
                        onRemoveElement={(elementId) =>
                          handleRemoveElement(section.component, elementId)
                        }
                        onUpdateDuration={(duration) =>
                          handleUpdateDuration(section.component, duration)
                        }
                        onAddActivity={(activity) =>
                          handleAddActivity(section.component, activity)
                        }
                        onRemoveActivity={(index) =>
                          handleRemoveActivity(section.component, index)
                        }
                        onUpdateNotes={(notes) =>
                          handleUpdateNotes(section.component, notes)
                        }
                        onRequestAISuggestions={() =>
                          handleRequestAISuggestions(section)
                        }
                        isLoadingAI={loadingAISection === section.component}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a substep to start building</p>
              </div>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeElement && (
            <DraggableElementPlaceholder
              type={activeElement.type}
              value={activeElement.value}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
