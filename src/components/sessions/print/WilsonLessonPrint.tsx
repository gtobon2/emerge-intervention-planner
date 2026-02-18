'use client';

import React from 'react';
import type { WilsonLessonPlan, LessonPlanSection, LessonBlock } from '@/lib/curriculum/wilson-lesson-elements';
import { WILSON_LESSON_SECTIONS } from '@/lib/curriculum/wilson-lesson-elements';

// ============================================
// Types
// ============================================

interface WilsonLessonPrintProps {
  lessonPlan: WilsonLessonPlan;
  /** If multi-day, which day to display (1-indexed). Null = show all. */
  dayFilter?: number | null;
}

interface BlockGroup {
  block: LessonBlock;
  label: string;
  sections: LessonPlanSection[];
}

// ============================================
// Constants
// ============================================

const BLOCK_LABELS: Record<LessonBlock, string> = {
  'word-study': 'Block 1: Word Study',
  'spelling': 'Block 2: Spelling',
  'fluency-comprehension': 'Block 3: Fluency & Comprehension',
};

const BLOCK_SCREEN_COLORS: Record<LessonBlock, string> = {
  'word-study': 'border-l-blue-600 bg-blue-50',
  'spelling': 'border-l-purple-600 bg-purple-50',
  'fluency-comprehension': 'border-l-green-600 bg-green-50',
};

const BLOCK_HEADER_COLORS: Record<LessonBlock, string> = {
  'word-study': 'bg-blue-100 border-blue-300',
  'spelling': 'bg-purple-100 border-purple-300',
  'fluency-comprehension': 'bg-green-100 border-green-300',
};

const BLOCK_PRINT_CLASS: Record<LessonBlock, string> = {
  'word-study': 'print-wilson-word-study',
  'spelling': 'print-wilson-spelling',
  'fluency-comprehension': 'print-wilson-fluency',
};

// ============================================
// Helpers
// ============================================

function getBlockForComponent(componentType: string): LessonBlock {
  const def = WILSON_LESSON_SECTIONS.find(s => s.type === componentType);
  return def?.block || 'word-study';
}

function getPartNumber(componentType: string): number {
  const def = WILSON_LESSON_SECTIONS.find(s => s.type === componentType);
  return def?.part || 0;
}

function groupSectionsByBlock(sections: LessonPlanSection[]): BlockGroup[] {
  const blockOrder: LessonBlock[] = ['word-study', 'spelling', 'fluency-comprehension'];
  const grouped = new Map<LessonBlock, LessonPlanSection[]>();

  for (const block of blockOrder) {
    grouped.set(block, []);
  }

  for (const section of sections) {
    const block = getBlockForComponent(section.component);
    const existing = grouped.get(block) || [];
    existing.push(section);
    grouped.set(block, existing);
  }

  return blockOrder
    .map(block => ({
      block,
      label: BLOCK_LABELS[block],
      sections: grouped.get(block) || [],
    }))
    .filter(g => g.sections.length > 0);
}

// ============================================
// Sub-components
// ============================================

function SectionRow({ section }: { section: LessonPlanSection }) {
  const part = getPartNumber(section.component);
  const block = getBlockForComponent(section.component);
  const hasElements = section.elements.length > 0;
  const hasActivities = section.activities.length > 0;
  const hasNotes = section.notes && section.notes.trim().length > 0;

  return (
    <div className={`print-section border-l-4 ${BLOCK_SCREEN_COLORS[block]} ${BLOCK_PRINT_CLASS[block]} print-break-avoid`}>
      {/* Section header row */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <span className="print-section-title text-sm font-semibold text-gray-900">
            Part {part}: {section.componentName}
          </span>
        </div>
        <span className="print-section-duration text-xs text-gray-500 whitespace-nowrap ml-4">
          {section.duration} min
        </span>
      </div>

      {/* Elements */}
      {hasElements && (
        <div className="print-section-elements mt-1.5">
          <span className="text-xs font-medium text-gray-600 mr-1">Items:</span>
          <div className="inline-flex flex-wrap gap-1 mt-0.5">
            {section.elements.map((el, i) => (
              <span
                key={el.id || i}
                className="print-element-tag inline-block border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-700 bg-white"
              >
                {el.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      {hasActivities && (
        <div className="print-section-activities mt-1.5">
          <span className="text-xs font-medium text-gray-600">Activities:</span>
          <ul className="list-disc pl-4 mt-0.5">
            {section.activities.map((activity, i) => (
              <li key={i} className="text-xs text-gray-700">{activity}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {hasNotes && (
        <div className="print-section-notes mt-1.5 border-l-2 border-gray-300 pl-2 italic text-xs text-gray-500">
          {section.notes}
        </div>
      )}

      {/* Empty state for sections with no content */}
      {!hasElements && !hasActivities && !hasNotes && (
        <div className="mt-1">
          <div className="print-notes-line border-b border-dashed border-gray-300 h-5" />
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function WilsonLessonPrint({ lessonPlan, dayFilter }: WilsonLessonPrintProps) {
  // Filter sections if dayFilter is provided (for multi-day wizard plans that use dayAssignment)
  // The WilsonLessonPlan from the DB stores sections as an array of LessonPlanSection.
  // The wizard stores dayAssignment in a different format. For print, we display all sections.
  const sections = lessonPlan.sections;
  const blockGroups = groupSectionsByBlock(sections);
  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="wilson-lesson-print">
      {/* Lesson Info Bar */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Wilson Reading System Lesson Plan
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Substep {lessonPlan.substep} &mdash; {lessonPlan.substepName}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-gray-500">
            Total: {totalDuration} min
          </span>
          {dayFilter && (
            <span className="ml-2 print-day-badge border border-gray-400 rounded px-1 py-0.5 text-xs font-semibold text-gray-700">
              Day {dayFilter}
            </span>
          )}
        </div>
      </div>

      {/* Block Sections */}
      <div className="space-y-3">
        {blockGroups.map(({ block, label, sections: blockSections }) => {
          const blockDuration = blockSections.reduce((sum, s) => sum + s.duration, 0);
          return (
            <div key={block} className="print-block-section print-break-avoid">
              {/* Block Header */}
              <div className={`print-block-header px-2 py-1.5 border rounded-t font-bold text-xs text-gray-800 flex items-center justify-between ${BLOCK_HEADER_COLORS[block]}`}>
                <span>{label}</span>
                <span className="text-xs font-normal text-gray-500">{blockDuration} min</span>
              </div>

              {/* Block Sections */}
              <div className="space-y-0 border border-t-0 border-gray-200 rounded-b overflow-hidden">
                {blockSections.map((section) => (
                  <SectionRow key={section.component} section={section} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Reference: 10-Part Lesson Structure */}
      <div className="mt-4 pt-3 border-t border-gray-200 print-break-avoid">
        <p className="text-xs text-gray-400 italic">
          Wilson 10-Part Lesson: Sound Cards / Teach &amp; Review / Word Cards / Wordlist Reading / Sentence Reading / Quick Drill Reverse / Teach &amp; Review Spelling / Dictation / Passage Reading / Listening Comprehension
        </p>
      </div>
    </div>
  );
}

export default WilsonLessonPrint;
