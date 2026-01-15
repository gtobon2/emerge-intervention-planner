'use client';

import React, { useState, useRef } from 'react';
import type { WilsonLessonPlan, LessonPlanSection } from '@/lib/curriculum/wilson-lesson-elements';
import type { WilsonLessonProgress } from '@/lib/supabase/types';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Clock,
  Printer,
  BookOpen,
  RotateCcw,
  Sparkles
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface WilsonLessonTrackerProps {
  sessionId: number;
  lessonPlan: WilsonLessonPlan | null;
  progress: WilsonLessonProgress;
  onProgressChange: (progress: WilsonLessonProgress) => void;
  isReadOnly?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getBlockColor = (block: string) => {
  switch (block) {
    case 'word-study':
      return 'bg-blue-500';
    case 'spelling':
      return 'bg-orange-500';
    case 'fluency-comprehension':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

const getBlockBgColor = (block: string) => {
  switch (block) {
    case 'word-study':
      return 'bg-blue-50 border-blue-200';
    case 'spelling':
      return 'bg-orange-50 border-orange-200';
    case 'fluency-comprehension':
      return 'bg-purple-50 border-purple-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const SECTION_BLOCKS: Record<string, string> = {
  'sounds-quick-drill': 'word-study',
  'teach-review-reading': 'word-study',
  'word-cards': 'word-study',
  'wordlist-reading': 'word-study',
  'sentence-reading': 'word-study',
  'quick-drill-reverse': 'spelling',
  'teach-review-spelling': 'spelling',
  'dictation': 'spelling',
  'passage-reading': 'fluency-comprehension',
  'listening-comprehension': 'fluency-comprehension',
};

// ============================================
// MAIN COMPONENT
// ============================================

export function WilsonLessonTracker({
  sessionId,
  lessonPlan,
  progress,
  onProgressChange,
  isReadOnly = false,
}: WilsonLessonTrackerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!lessonPlan) return 0;

    const totalSections = lessonPlan.sections.length;
    const completedSections = lessonPlan.sections.filter(
      (s) => progress[s.component]?.completed
    ).length;

    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  };

  const overallProgress = calculateOverallProgress();

  // Find first incomplete section for "continue where you left off"
  const findNextIncompleteSection = (): string | null => {
    if (!lessonPlan) return null;
    const incomplete = lessonPlan.sections.find(
      (s) => !progress[s.component]?.completed
    );
    return incomplete?.component || null;
  };

  // Toggle section expansion
  const toggleSection = (component: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(component)) {
      newExpanded.delete(component);
    } else {
      newExpanded.add(component);
    }
    setExpandedSections(newExpanded);
  };

  // Toggle element completion
  const toggleElement = (sectionComponent: string, elementId: string) => {
    if (isReadOnly) return;

    const sectionProgress = progress[sectionComponent] || {
      completed: false,
      elementsCompleted: [],
      activitiesCompleted: [],
    };

    const elementsCompleted = [...sectionProgress.elementsCompleted];
    const index = elementsCompleted.indexOf(elementId);

    if (index > -1) {
      elementsCompleted.splice(index, 1);
    } else {
      elementsCompleted.push(elementId);
    }

    onProgressChange({
      ...progress,
      [sectionComponent]: {
        ...sectionProgress,
        elementsCompleted,
      },
    });
  };

  // Toggle activity completion
  const toggleActivity = (sectionComponent: string, activityIndex: number) => {
    if (isReadOnly) return;

    const sectionProgress = progress[sectionComponent] || {
      completed: false,
      elementsCompleted: [],
      activitiesCompleted: [],
    };

    const activitiesCompleted = [...sectionProgress.activitiesCompleted];
    const index = activitiesCompleted.indexOf(activityIndex);

    if (index > -1) {
      activitiesCompleted.splice(index, 1);
    } else {
      activitiesCompleted.push(activityIndex);
    }

    onProgressChange({
      ...progress,
      [sectionComponent]: {
        ...sectionProgress,
        activitiesCompleted,
      },
    });
  };

  // Toggle entire section completion
  const toggleSectionComplete = (sectionComponent: string, section: LessonPlanSection) => {
    if (isReadOnly) return;

    const sectionProgress = progress[sectionComponent] || {
      completed: false,
      elementsCompleted: [],
      activitiesCompleted: [],
    };

    const newCompleted = !sectionProgress.completed;

    // If marking complete, mark all elements and activities as done
    const elementsCompleted = newCompleted
      ? section.elements.map(e => e.id)
      : [];
    const activitiesCompleted = newCompleted
      ? section.activities.map((_, i) => i)
      : [];

    onProgressChange({
      ...progress,
      [sectionComponent]: {
        completed: newCompleted,
        elementsCompleted,
        activitiesCompleted,
      },
    });
  };

  // Reset all progress
  const resetProgress = () => {
    if (isReadOnly) return;
    onProgressChange({});
  };

  // Jump to next incomplete section
  const jumpToNext = () => {
    const next = findNextIncompleteSection();
    if (next) {
      setExpandedSections(new Set([next]));
      // Scroll to section
      const element = document.getElementById(`section-${next}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Print functionality
  const handlePrint = () => {
    setIsPrinting(true);
    // Expand all sections for printing
    if (lessonPlan) {
      setExpandedSections(new Set(lessonPlan.sections.map(s => s.component)));
    }
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  if (!lessonPlan) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Lesson Plan</h3>
        <p className="text-sm text-gray-500">
          Create a Wilson lesson plan from the group page to track progress here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .wilson-lesson-tracker-print,
          .wilson-lesson-tracker-print * {
            visibility: visible;
          }
          .wilson-lesson-tracker-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-after: always;
          }
        }
      `}</style>

      <div
        ref={printRef}
        className={`wilson-lesson-tracker-print bg-white rounded-lg border border-gray-200 overflow-hidden ${isPrinting ? '' : 'shadow-sm'}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Wilson Lesson Plan
              </h3>
              <p className="text-blue-100 text-sm">
                Substep {lessonPlan.substep}: {lessonPlan.substepName}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 no-print">
              <button
                onClick={jumpToNext}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                Continue
              </button>
              <button
                onClick={resetProgress}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                title="Reset Progress"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                title="Print Lesson"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Session Progress</span>
              <span className="font-bold">{overallProgress}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="divide-y divide-gray-100">
          {lessonPlan.sections.map((section, sectionIndex) => {
            const sectionProgress = progress[section.component] || {
              completed: false,
              elementsCompleted: [],
              activitiesCompleted: [],
            };
            const isExpanded = expandedSections.has(section.component) || isPrinting;
            const block = SECTION_BLOCKS[section.component] || 'word-study';
            const hasContent = section.elements.length > 0 || section.activities.length > 0;

            // Calculate section-level progress
            const totalItems = section.elements.length + section.activities.length;
            const completedItems = sectionProgress.elementsCompleted.length + sectionProgress.activitiesCompleted.length;
            const sectionProgressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return (
              <div
                key={section.component}
                id={`section-${section.component}`}
                className={`${sectionProgress.completed ? 'bg-green-50' : ''}`}
              >
                {/* Section Header */}
                <div
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    sectionProgress.completed ? 'bg-green-50 hover:bg-green-100' : ''
                  }`}
                  onClick={() => toggleSection(section.component)}
                >
                  {/* Expand/Collapse Icon */}
                  <div className="no-print">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Block Color Indicator */}
                  <div className={`w-1 h-10 rounded-full ${getBlockColor(block)}`} />

                  {/* Section Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">
                        PART {sectionIndex + 1}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {section.componentName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {section.duration} min
                      </span>
                      {hasContent && (
                        <span>
                          {completedItems}/{totalItems} items
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Section Progress / Complete Button */}
                  <div className="flex items-center gap-2 no-print">
                    {hasContent && !sectionProgress.completed && (
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${sectionProgressPercent}%` }}
                        />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionComplete(section.component, section);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        sectionProgress.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={sectionProgress.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Section Content (Expanded) */}
                {isExpanded && hasContent && (
                  <div className={`px-4 pb-4 ml-9 border-l-2 ${getBlockBgColor(block)} mx-3 rounded-b-lg`}>
                    {/* Elements */}
                    {section.elements.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pt-3">
                          Elements
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {section.elements.map((element) => {
                            const isCompleted = sectionProgress.elementsCompleted.includes(element.id);
                            return (
                              <button
                                key={element.id}
                                onClick={() => toggleElement(section.component, element.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  isCompleted
                                    ? 'bg-green-500 text-white line-through opacity-75'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                                } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                disabled={isReadOnly}
                              >
                                {element.value}
                                {isCompleted && <Check className="w-3 h-3 inline ml-1" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {section.activities.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Activities
                        </h5>
                        <div className="space-y-2">
                          {section.activities.map((activity, actIndex) => {
                            const isCompleted = sectionProgress.activitiesCompleted.includes(actIndex);
                            return (
                              <button
                                key={actIndex}
                                onClick={() => toggleActivity(section.component, actIndex)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                                  isCompleted
                                    ? 'bg-green-100 text-green-700 line-through'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                                } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                disabled={isReadOnly}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                  isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                }`}>
                                  {isCompleted && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span>{activity}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {section.notes && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <strong>Note:</strong> {section.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
          <span>Total Duration: {lessonPlan.totalDuration} minutes</span>
          <span>
            {lessonPlan.sections.filter(s => progress[s.component]?.completed).length} of {lessonPlan.sections.length} sections complete
          </span>
        </div>
      </div>
    </>
  );
}

export default WilsonLessonTracker;
