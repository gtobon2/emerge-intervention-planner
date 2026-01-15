/**
 * CaminoLessonSection - Droppable area for a Camino lesson component
 *
 * Represents one of the 8 parts of a Camino/Despegando lesson.
 * Elements can be dropped here from the Element Bank.
 *
 * Adapted for Spanish reading intervention curriculum.
 */

'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import {
  CaminoDraggableElement,
  CaminoDraggableElementData,
  CaminoElementType,
} from './CaminoDraggableElement';
import type {
  CaminoLessonComponentType,
  CaminoLessonPlanSection,
} from '@/lib/curriculum/camino/camino-lesson-elements';
import { CAMINO_LESSON_SECTIONS } from '@/lib/curriculum/camino/camino-lesson-elements';

interface CaminoLessonSectionProps {
  section: CaminoLessonPlanSection;
  onRemoveElement: (elementId: string) => void;
  onUpdateDuration: (duration: number) => void;
  onAddActivity: (activity: string) => void;
  onRemoveActivity: (index: number) => void;
  onUpdateNotes: (notes: string) => void;
  onRequestAISuggestions?: () => void;
  isLoadingAI?: boolean;
}

// Map section types to accepted element types
const acceptedTypesMap: Record<CaminoLessonComponentType, CaminoElementType[]> = {
  'syllable-warmup': ['syllable'],
  'phonemic-awareness': ['sound', 'syllable', 'word'],
  'letter-sounds': ['sound'],
  'word-work': ['word', 'syllable'],
  'high-frequency': ['hf_word'],
  'dictation': ['sound', 'syllable', 'word', 'sentence'],
  'fluency-practice': ['sentence', 'word'],
  'decodable-text': ['text'],
};

// Block colors for visual grouping
const blockColors: Record<string, { bg: string; border: string; header: string }> = {
  warmup: {
    bg: 'bg-amber-50/50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-800',
    header: 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200',
  },
  phonics: {
    bg: 'bg-purple-50/50 dark:bg-purple-900/10',
    border: 'border-purple-200 dark:border-purple-800',
    header: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
  },
  reading: {
    bg: 'bg-blue-50/50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800',
    header: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  },
  writing: {
    bg: 'bg-green-50/50 dark:bg-green-900/10',
    border: 'border-green-200 dark:border-green-800',
    header: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
  },
};

export function CaminoLessonSection({
  section,
  onRemoveElement,
  onUpdateDuration,
  onAddActivity,
  onRemoveActivity,
  onUpdateNotes,
  onRequestAISuggestions,
  isLoadingAI = false,
}: CaminoLessonSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newActivity, setNewActivity] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const sectionConfig = CAMINO_LESSON_SECTIONS.find((s) => s.type === section.component);
  const acceptedTypes = acceptedTypesMap[section.component] || [];
  const blockStyle = blockColors[sectionConfig?.block || 'warmup'];

  const { setNodeRef, isOver, active } = useDroppable({
    id: section.component,
    data: {
      accepts: acceptedTypes,
    },
  });

  const canDrop = active
    ? acceptedTypes.includes((active.data.current as CaminoDraggableElementData)?.type)
    : false;

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      onAddActivity(newActivity.trim());
      setNewActivity('');
    }
  };

  return (
    <div
      className={cn(
        'border rounded-lg transition-all',
        blockStyle.border,
        isOver && canDrop && 'ring-2 ring-primary bg-primary/5',
        isOver && !canDrop && 'ring-2 ring-destructive bg-destructive/5'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 cursor-pointer rounded-t-lg transition-colors',
          blockStyle.header,
          'hover:opacity-90'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <svg
            className={cn(
              'w-4 h-4 transition-transform',
              isExpanded && 'rotate-90'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <div>
            <h3 className="font-medium">{section.componentName}</h3>
            <p className="text-xs opacity-70">{section.componentNameEn}</p>
          </div>
          <span className="text-xs opacity-70">
            ({section.elements.length} items)
          </span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            min={1}
            max={60}
            value={section.duration}
            onChange={(e) => onUpdateDuration(parseInt(e.target.value) || 1)}
            className="w-12 px-2 py-1 text-sm text-center border rounded-md bg-background"
          />
          <span className="text-sm opacity-70">min</span>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={cn('px-4 pb-4 space-y-3', blockStyle.bg)}>
          {/* Description */}
          {sectionConfig && (
            <div className="pt-3">
              <p className="text-sm text-muted-foreground">{sectionConfig.description}</p>
              <p className="text-xs text-muted-foreground opacity-70 mt-1">
                {sectionConfig.descriptionEn}
              </p>
            </div>
          )}

          {/* Strategies Chips */}
          {sectionConfig?.strategies && sectionConfig.strategies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sectionConfig.strategies.map((strategy, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                >
                  {strategy}
                </span>
              ))}
            </div>
          )}

          {/* Accepted Types */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Acepta / Accepts:</span>
            {acceptedTypes.map((type) => (
              <span
                key={type}
                className="px-2 py-0.5 bg-muted rounded-full capitalize"
              >
                {type.replace('_', ' ')}
              </span>
            ))}
          </div>

          {/* Drop Zone */}
          <div
            ref={setNodeRef}
            className={cn(
              'min-h-[60px] p-3 border-2 border-dashed rounded-lg transition-colors',
              'flex flex-wrap gap-2 items-start',
              section.elements.length === 0 && 'items-center justify-center',
              isOver && canDrop && 'border-primary bg-primary/5',
              isOver && !canDrop && 'border-destructive bg-destructive/5',
              !isOver && 'border-muted-foreground/30 bg-background/50'
            )}
          >
            {section.elements.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Arrastra elementos aquí / Drag elements here
              </span>
            ) : (
              section.elements.map((element) => (
                <CaminoDraggableElement
                  key={element.id}
                  data={{
                    id: element.id,
                    type: element.type as CaminoElementType,
                    value: element.value,
                    sourceId: element.sourceId,
                  }}
                  isInBank={false}
                  onRemove={() => onRemoveElement(element.id)}
                />
              ))
            )}
          </div>

          {/* Activities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Actividades / Activities</span>
              {onRequestAISuggestions && (
                <button
                  onClick={onRequestAISuggestions}
                  disabled={isLoadingAI}
                  className={cn(
                    'text-xs px-2 py-1 rounded-md transition-colors',
                    'bg-purple-100 text-purple-700 hover:bg-purple-200',
                    'dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center gap-1'
                  )}
                >
                  {isLoadingAI ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>IA Sugerir</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {section.activities.length > 0 && (
              <ul className="space-y-1">
                {section.activities.map((activity, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded-md"
                  >
                    <span className="flex-1">{activity}</span>
                    <button
                      onClick={() => onRemoveActivity(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                placeholder="Agregar actividad... / Add activity..."
                className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleAddActivity}
                disabled={!newActivity.trim()}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <svg
                className={cn('w-4 h-4 transition-transform', showNotes && 'rotate-90')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span>Notas / Notes</span>
            </button>
            {showNotes && (
              <textarea
                value={section.notes || ''}
                onChange={(e) => onUpdateNotes(e.target.value)}
                placeholder="Agregar notas para esta sección... / Add notes for this section..."
                rows={2}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { acceptedTypesMap as caminoAcceptedTypesMap };
