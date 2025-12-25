/**
 * DraggableElement - Draggable element for Wilson Lesson Builder
 *
 * Represents a single draggable item (sound, word, sentence, etc.)
 * that can be dragged from the Element Bank into lesson sections.
 */

'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

export type ElementType = 'sound' | 'word' | 'nonsense' | 'hf_word' | 'sentence' | 'story' | 'element';

export interface DraggableElementData {
  id: string;
  type: ElementType;
  value: string;
  sourceId: string;
  metadata?: {
    keyword?: string;
    phoneme?: string;
    syllableType?: string;
    isNew?: boolean;
    forDecoding?: boolean;
    forSpelling?: boolean;
  };
}

interface DraggableElementProps {
  data: DraggableElementData;
  isInBank?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
}

const typeColors: Record<ElementType, { bg: string; border: string; text: string }> = {
  sound: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300' },
  word: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300' },
  nonsense: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300' },
  hf_word: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-300' },
  sentence: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700', text: 'text-green-700 dark:text-green-300' },
  story: { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-700', text: 'text-teal-700 dark:text-teal-300' },
  element: { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-700', text: 'text-pink-700 dark:text-pink-300' },
};

const typeIcons: Record<ElementType, string> = {
  sound: '🔊',
  word: '📖',
  nonsense: '🎲',
  hf_word: '⭐',
  sentence: '📝',
  story: '📚',
  element: '🧩',
};

export function DraggableElement({ data, isInBank = true, onRemove, disabled = false }: DraggableElementProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: data.id,
    data,
    disabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const colors = typeColors[data.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-sm font-medium',
        'cursor-grab active:cursor-grabbing transition-all',
        colors.bg,
        colors.border,
        colors.text,
        isDragging && 'shadow-lg ring-2 ring-primary/50',
        disabled && 'opacity-50 cursor-not-allowed',
        !isInBank && 'pr-1'
      )}
    >
      <span className="text-xs">{typeIcons[data.type]}</span>
      <span className="max-w-[150px] truncate">{data.value}</span>
      {data.metadata?.keyword && (
        <span className="text-xs opacity-60">({data.metadata.keyword})</span>
      )}
      {!isInBank && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
          aria-label="Remove element"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function DraggableElementPlaceholder({ type, value }: { type: ElementType; value: string }) {
  const colors = typeColors[type];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-sm font-medium',
        'border-dashed opacity-60',
        colors.bg,
        colors.border,
        colors.text
      )}
    >
      <span className="text-xs">{typeIcons[type]}</span>
      <span className="max-w-[150px] truncate">{value}</span>
    </div>
  );
}
