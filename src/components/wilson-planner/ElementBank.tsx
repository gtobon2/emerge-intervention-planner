/**
 * ElementBank - Sidebar component showing available lesson elements
 *
 * Displays all elements for the current substep organized by type.
 * Elements can be dragged from here into lesson sections.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DraggableElement, DraggableElementData, ElementType } from './DraggableElement';
import type { WilsonLessonElements } from '@/lib/curriculum/wilson-lesson-elements';

interface ElementBankProps {
  lessonElements: WilsonLessonElements | null;
  usedElementIds: Set<string>;
  onQuickAdd?: (element: DraggableElementData) => void;
}

type ElementCategory = {
  type: ElementType;
  label: string;
  icon: string;
  elements: DraggableElementData[];
};

export function ElementBank({ lessonElements, usedElementIds, onQuickAdd }: ElementBankProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<ElementType>>(
    new Set(['sound', 'word', 'nonsense', 'hf_word', 'sentence'])
  );
  const [searchQuery, setSearchQuery] = useState('');

  const categories: ElementCategory[] = useMemo(() => {
    if (!lessonElements) return [];

    const cats: ElementCategory[] = [
      {
        type: 'sound',
        label: 'Sound Cards',
        icon: '🔊',
        elements: lessonElements.soundCards.map((card) => ({
          id: card.id,
          type: 'sound' as ElementType,
          value: card.sound,
          sourceId: card.id,
          metadata: {
            keyword: card.keyword,
            phoneme: card.phoneme,
            isNew: card.isNew,
          },
        })),
      },
      {
        type: 'word',
        label: 'Real Words',
        icon: '📖',
        elements: lessonElements.realWords.map((word) => ({
          id: word.id,
          type: 'word' as ElementType,
          value: word.word,
          sourceId: word.id,
          metadata: {
            syllableType: word.syllableType,
            forDecoding: word.forDecoding,
            forSpelling: word.forSpelling,
          },
        })),
      },
      {
        type: 'nonsense',
        label: 'Nonsense Words',
        icon: '🎲',
        elements: lessonElements.nonsenseWords.map((word) => ({
          id: word.id,
          type: 'nonsense' as ElementType,
          value: word.word,
          sourceId: word.id,
        })),
      },
      {
        type: 'hf_word',
        label: 'High Frequency Words',
        icon: '⭐',
        elements: lessonElements.highFrequencyWords.map((word) => ({
          id: word.id,
          type: 'hf_word' as ElementType,
          value: word.word,
          sourceId: word.id,
          metadata: {
            isNew: word.isNew,
          },
        })),
      },
      {
        type: 'sentence',
        label: 'Sentences',
        icon: '📝',
        elements: lessonElements.sentences.map((sentence) => ({
          id: sentence.id,
          type: 'sentence' as ElementType,
          value: sentence.text,
          sourceId: sentence.id,
        })),
      },
      {
        type: 'story',
        label: 'Stories',
        icon: '📚',
        elements: lessonElements.stories.map((story) => ({
          id: story.id,
          type: 'story' as ElementType,
          value: story.title,
          sourceId: story.id,
        })),
      },
      {
        type: 'element',
        label: 'Word Elements',
        icon: '🧩',
        elements: lessonElements.wordElements.map((el) => ({
          id: el.id,
          type: 'element' as ElementType,
          value: el.element,
          sourceId: el.id,
        })),
      },
    ];

    return cats.filter((cat) => cat.elements.length > 0);
  }, [lessonElements]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        elements: cat.elements.filter(
          (el) =>
            el.value.toLowerCase().includes(query) ||
            el.metadata?.keyword?.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.elements.length > 0);
  }, [categories, searchQuery]);

  const toggleCategory = (type: ElementType) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  if (!lessonElements) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Select a substep to load elements</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search elements..."
          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No elements found</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.type} className="border-b border-border">
              <button
                onClick={() => toggleCategory(category.type)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({category.elements.length})
                  </span>
                </span>
                <svg
                  className={cn(
                    'w-4 h-4 transition-transform',
                    expandedCategories.has(category.type) && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {expandedCategories.has(category.type) && (
                <div className="px-3 pb-3 flex flex-wrap gap-2">
                  {category.elements.map((element) => {
                    const isUsed = usedElementIds.has(element.id);
                    return (
                      <div
                        key={element.id}
                        className={cn(
                          'relative',
                          isUsed && 'opacity-50'
                        )}
                      >
                        <DraggableElement
                          data={element}
                          isInBank={true}
                          disabled={isUsed}
                        />
                        {onQuickAdd && !isUsed && (
                          <button
                            onClick={() => onQuickAdd(element)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center hover:bg-primary/80 transition-colors"
                            title="Quick add to lesson"
                          >
                            +
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {categories.reduce((sum, cat) => sum + cat.elements.length, 0)} elements
          </span>
          <span>{usedElementIds.size} in use</span>
        </div>
      </div>
    </div>
  );
}
