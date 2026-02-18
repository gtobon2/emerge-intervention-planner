'use client';

import React from 'react';
import type {
  CaminoLessonPlan,
  CaminoLessonPlanSection,
  CaminoLessonBlock,
} from '@/lib/curriculum/camino/camino-lesson-elements';
import { CAMINO_LESSON_SECTIONS } from '@/lib/curriculum/camino/camino-lesson-elements';

// ============================================
// Types
// ============================================

interface CaminoLessonPrintProps {
  lessonPlan: CaminoLessonPlan;
}

interface BlockGroup {
  block: CaminoLessonBlock;
  label: string;
  labelEn: string;
  sections: CaminoLessonPlanSection[];
}

// ============================================
// Constants
// ============================================

const BLOCK_LABELS: Record<CaminoLessonBlock, { es: string; en: string }> = {
  warmup: { es: 'Calentamiento', en: 'Warm-up' },
  phonics: { es: 'Fonemas y Sonidos', en: 'Phonics & Sounds' },
  reading: { es: 'Lectura y Palabras', en: 'Reading & Words' },
  writing: { es: 'Escritura y Dictado', en: 'Writing & Dictation' },
};

const BLOCK_SCREEN_COLORS: Record<CaminoLessonBlock, string> = {
  warmup: 'border-l-amber-500 bg-amber-50',
  phonics: 'border-l-purple-500 bg-purple-50',
  reading: 'border-l-blue-500 bg-blue-50',
  writing: 'border-l-green-500 bg-green-50',
};

const BLOCK_HEADER_COLORS: Record<CaminoLessonBlock, string> = {
  warmup: 'bg-amber-100 border-amber-300',
  phonics: 'bg-purple-100 border-purple-300',
  reading: 'bg-blue-100 border-blue-300',
  writing: 'bg-green-100 border-green-300',
};

const BLOCK_PRINT_CLASS: Record<CaminoLessonBlock, string> = {
  warmup: 'print-camino-warmup',
  phonics: 'print-camino-phonics',
  reading: 'print-camino-reading',
  writing: 'print-camino-writing',
};

// ============================================
// Helpers
// ============================================

function getBlockForComponent(componentType: string): CaminoLessonBlock {
  const def = CAMINO_LESSON_SECTIONS.find(s => s.type === componentType);
  return def?.block || 'warmup';
}

function getPartNumber(componentType: string): number {
  const def = CAMINO_LESSON_SECTIONS.find(s => s.type === componentType);
  return def?.part || 0;
}

function groupSectionsByBlock(sections: CaminoLessonPlanSection[]): BlockGroup[] {
  const blockOrder: CaminoLessonBlock[] = ['warmup', 'phonics', 'reading', 'writing'];
  const grouped = new Map<CaminoLessonBlock, CaminoLessonPlanSection[]>();

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
      label: BLOCK_LABELS[block].es,
      labelEn: BLOCK_LABELS[block].en,
      sections: grouped.get(block) || [],
    }))
    .filter(g => g.sections.length > 0);
}

// ============================================
// Sub-components
// ============================================

function SectionRow({ section }: { section: CaminoLessonPlanSection }) {
  const part = getPartNumber(section.component);
  const block = getBlockForComponent(section.component);
  const hasElements = section.elements.length > 0;
  const hasActivities = section.activities.length > 0;
  const hasNotes = section.notes && section.notes.trim().length > 0;

  return (
    <div className={`print-section border-l-4 ${BLOCK_SCREEN_COLORS[block]} ${BLOCK_PRINT_CLASS[block]} p-2 print-break-avoid`}>
      {/* Section header row */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <span className="print-section-title text-sm font-semibold text-gray-900">
            Parte {part}: {section.componentName}
          </span>
          <span className="text-xs text-gray-400 ml-2">
            ({section.componentNameEn})
          </span>
        </div>
        <span className="print-section-duration text-xs text-gray-500 whitespace-nowrap ml-4">
          {section.duration} min
        </span>
      </div>

      {/* Elements */}
      {hasElements && (
        <div className="print-section-elements mt-1.5">
          <span className="text-xs font-medium text-gray-600 mr-1">Elementos:</span>
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
          <span className="text-xs font-medium text-gray-600">Actividades:</span>
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

      {/* Empty state */}
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

export function CaminoLessonPrint({ lessonPlan }: CaminoLessonPrintProps) {
  const blockGroups = groupSectionsByBlock(lessonPlan.sections);
  const totalDuration = lessonPlan.sections.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="camino-lesson-print">
      {/* Lesson Info Bar */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Plan de Lecci&oacute;n &mdash; Camino a la Lectura
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Unidad {lessonPlan.unit}, Lecci&oacute;n {lessonPlan.lesson} &mdash; {lessonPlan.lessonName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            C&oacute;digo: {lessonPlan.lessonCode}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-gray-500">
            Total: {totalDuration} min
          </span>
        </div>
      </div>

      {/* Block Sections */}
      <div className="space-y-3">
        {blockGroups.map(({ block, label, labelEn, sections: blockSections }) => {
          const blockDuration = blockSections.reduce((sum, s) => sum + s.duration, 0);
          return (
            <div key={block} className="print-block-section print-break-avoid">
              {/* Block Header */}
              <div className={`print-block-header px-2 py-1.5 border rounded-t font-bold text-xs text-gray-800 flex items-center justify-between ${BLOCK_HEADER_COLORS[block]}`}>
                <span>
                  {label}
                  <span className="font-normal text-gray-500 ml-1.5">({labelEn})</span>
                </span>
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

      {/* Quick Reference */}
      <div className="mt-4 pt-3 border-t border-gray-200 print-break-avoid">
        <p className="text-xs text-gray-400 italic">
          Camino a la Lectura: Calentamiento de S&iacute;labas / Conciencia Fon&eacute;mica / Sonidos de Letras / Trabajo con Palabras / Palabras de Alta Frecuencia / Dictado / Pr&aacute;ctica de Fluidez / Texto Decodificable
        </p>
      </div>
    </div>
  );
}

export default CaminoLessonPrint;
