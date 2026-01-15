/**
 * CaminoElementBank - Sidebar component showing available lesson elements
 *
 * Displays all elements for the current unit organized by type.
 * Elements can be dragged from here into lesson sections.
 *
 * Adapted for Spanish reading intervention curriculum (Camino/Despegando).
 */

'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  CaminoDraggableElement,
  CaminoDraggableElementData,
  CaminoElementType,
  caminoTypeIcons,
} from './CaminoDraggableElement';
import type {
  CaminoSoundCard,
  CaminoSyllable,
  CaminoWord,
  CaminoHighFrequencyWord,
  CaminoSentence,
  CaminoDecodableText,
} from '@/lib/curriculum/camino/camino-lesson-elements';

interface CaminoElementBankProps {
  sounds: CaminoSoundCard[];
  syllables: CaminoSyllable[];
  words: CaminoWord[];
  hfWords: CaminoHighFrequencyWord[];
  sentences: CaminoSentence[];
  decodableTexts?: CaminoDecodableText[];
  usedElementIds: Set<string>;
  onQuickAdd?: (element: CaminoDraggableElementData) => void;
}

type ElementCategory = {
  type: CaminoElementType;
  label: string;
  labelEn: string;
  icon: string;
  elements: CaminoDraggableElementData[];
};

export function CaminoElementBank({
  sounds,
  syllables,
  words,
  hfWords,
  sentences,
  decodableTexts = [],
  usedElementIds,
  onQuickAdd,
}: CaminoElementBankProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<CaminoElementType>>(
    new Set(['sound', 'syllable', 'word', 'hf_word', 'sentence'])
  );
  const [searchQuery, setSearchQuery] = useState('');

  const categories: ElementCategory[] = useMemo(() => {
    const cats: ElementCategory[] = [
      {
        type: 'sound',
        label: 'Tarjetas de Sonido',
        labelEn: 'Sound Cards',
        icon: caminoTypeIcons.sound,
        elements: sounds.map((card) => ({
          id: card.id,
          type: 'sound' as CaminoElementType,
          value: card.letter,
          sourceId: card.id,
          metadata: {
            keyword: card.keyword,
            sound: card.sound,
            isNew: card.isNew,
          },
        })),
      },
      {
        type: 'syllable',
        label: 'Sílabas',
        labelEn: 'Syllables',
        icon: caminoTypeIcons.syllable,
        elements: syllables.map((syl) => ({
          id: syl.id,
          type: 'syllable' as CaminoElementType,
          value: syl.syllable,
          sourceId: syl.id,
          metadata: {
            structure: syl.structure,
          },
        })),
      },
      {
        type: 'word',
        label: 'Palabras',
        labelEn: 'Words',
        icon: caminoTypeIcons.word,
        elements: words.map((word) => ({
          id: word.id,
          type: 'word' as CaminoElementType,
          value: word.word,
          sourceId: word.id,
          metadata: {
            syllables: word.syllables,
            syllableCount: word.syllableCount,
            forDecoding: word.forDecoding,
            forSpelling: word.forSpelling,
          },
        })),
      },
      {
        type: 'hf_word',
        label: 'Palabras de Alta Frecuencia',
        labelEn: 'High-Frequency Words',
        icon: caminoTypeIcons.hf_word,
        elements: hfWords.map((word) => ({
          id: word.id,
          type: 'hf_word' as CaminoElementType,
          value: word.word,
          sourceId: word.id,
          metadata: {
            isNew: word.isNew,
            isDecodable: word.isDecodable,
          },
        })),
      },
      {
        type: 'sentence',
        label: 'Oraciones',
        labelEn: 'Sentences',
        icon: caminoTypeIcons.sentence,
        elements: sentences.map((sentence) => ({
          id: sentence.id,
          type: 'sentence' as CaminoElementType,
          value: sentence.text,
          sourceId: sentence.id,
        })),
      },
      {
        type: 'text',
        label: 'Textos Decodificables',
        labelEn: 'Decodable Texts',
        icon: caminoTypeIcons.text,
        elements: decodableTexts.map((text) => ({
          id: text.id,
          type: 'text' as CaminoElementType,
          value: text.title,
          sourceId: text.id,
        })),
      },
    ];

    return cats.filter((cat) => cat.elements.length > 0);
  }, [sounds, syllables, words, hfWords, sentences, decodableTexts]);

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

  const toggleCategory = (type: CaminoElementType) => {
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

  const totalElements = categories.reduce((sum, cat) => sum + cat.elements.length, 0);

  if (totalElements === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Selecciona una unidad y lección para cargar elementos</p>
        <p className="text-xs mt-1 opacity-70">Select a unit and lesson to load elements</p>
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
          placeholder="Buscar elementos... / Search..."
          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No se encontraron elementos</p>
            <p className="text-xs mt-1 opacity-70">No elements found</p>
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
                        className={cn('relative', isUsed && 'opacity-50')}
                      >
                        <CaminoDraggableElement
                          data={element}
                          isInBank={true}
                          disabled={isUsed}
                        />
                        {onQuickAdd && !isUsed && (
                          <button
                            onClick={() => onQuickAdd(element)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center hover:bg-primary/80 transition-colors"
                            title="Agregar rápido / Quick add"
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
          <span>{totalElements} elementos</span>
          <span>{usedElementIds.size} en uso</span>
        </div>
      </div>
    </div>
  );
}
