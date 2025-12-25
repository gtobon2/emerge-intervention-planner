/**
 * LessonSection - Droppable area for a Wilson lesson component
 *
 * Represents one of the 10 parts of a Wilson lesson.
 * Elements can be dropped here from the Element Bank.
 */

'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DraggableElement, DraggableElementData, ElementType } from './DraggableElement';
import type { LessonComponentType, LessonPlanSection } from '@/lib/curriculum/wilson-lesson-elements';
import { WILSON_LESSON_SECTIONS } from '@/lib/curriculum/wilson-lesson-elements';

interface LessonSectionProps {
  section: LessonPlanSection;
  onRemoveElement: (elementId: string) => void;
  onUpdateDuration: (duration: number) => void;
  onAddActivity: (activity: string) => void;
  onRemoveActivity: (index: number) => void;
  onUpdateNotes: (notes: string) => void;
  onRequestAISuggestions?: () => void;
  isLoadingAI?: boolean;
}

const acceptedTypesMap: Record<LessonComponentType, ElementType[]> = {
  'sound-cards': ['sound'],
  'teach-review': ['sound', 'element'],
  'word-cards': ['word'],
  'word-list-reading': ['word', 'nonsense'],
  'sentence-reading': ['sentence'],
  'passage-reading': ['story'],
  'quick-drill': ['sound'],
  'dictation-sounds': ['sound'],
  'dictation-words': ['word'],
  'dictation-sentences': ['sentence'],
};

export function LessonSection({
  section,
  onRemoveElement,
  onUpdateDuration,
  onAddActivity,
  onRemoveActivity,
  onUpdateNotes,
  onRequestAISuggestions,
  isLoadingAI = false,
}: LessonSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newActivity, setNewActivity] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const sectionConfig = WILSON_LESSON_SECTIONS.find((s) => s.type === section.component);
  const acceptedTypes = acceptedTypesMap[section.component] || [];

  const { setNodeRef, isOver, active } = useDroppable({
    id: section.component,
    data: {
      accepts: acceptedTypes,
    },
  });

  const canDrop = active
    ? acceptedTypes.includes((active.data.current as DraggableElementData)?.type)
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
        isOver && canDrop && 'ring-2 ring-primary bg-primary/5',
        isOver && !canDrop && 'ring-2 ring-destructive bg-destructive/5'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <svg
            className={cn(
              'w-4 h-4 transition-transform text-muted-foreground',
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
          <h3 className="font-medium">{section.componentName}</h3>
          <span className="text-xs text-muted-foreground">
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
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Description */}
          {sectionConfig && (
            <p className="text-sm text-muted-foreground">{sectionConfig.description}</p>
          )}

          {/* Accepted Types */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Accepts:</span>
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
              !isOver && 'border-muted-foreground/30'
            )}
          >
            {section.elements.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Drag elements here
              </span>
            ) : (
              section.elements.map((element) => (
                <DraggableElement
                  key={element.id}
                  data={{
                    id: element.id,
                    type: element.type,
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
              <span className="text-sm font-medium">Activities</span>
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
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>AI Suggest</span>
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
                placeholder="Add an activity..."
                className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleAddActivity}
                disabled={!newActivity.trim()}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
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
              <span>Notes</span>
            </button>
            {showNotes && (
              <textarea
                value={section.notes || ''}
                onChange={(e) => onUpdateNotes(e.target.value)}
                placeholder="Add notes for this section..."
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
