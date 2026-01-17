/**
 * Wilson Data Loader
 *
 * Loads Wilson curriculum data from the JSON file into IndexedDB
 */

import { db } from '@/lib/local-db';
import {
  generateElementId,
  type WilsonLessonElements,
  type WilsonSoundCard,
  type WilsonWord,
  type WilsonNonsenseWord,
  type WilsonHighFrequencyWord,
  type WilsonSentence,
  type WilsonStory,
  type WilsonWordElement,
} from './wilson-lesson-elements';
import { getWilsonSubstep } from './wilson';

// Import the JSON data
import wilsonData from './wilson-data.json';

interface RawWilsonData {
  substep: string;
  realWords: { word: string; level?: string | null; source?: string | null; wordType?: string | null; purpose?: string | null }[];
  nonsenseWords: { word: string; level?: string | null }[];
  highFrequencyWords: { word: string; purpose?: string | null }[];
  sentences: { text: string; level?: string | null; source?: string | null; purpose?: string | null }[];
  phrases: { text: string; source?: string | null; purpose?: string | null }[];
  wordElements: { element: string; type?: string }[];
  soundCards: { sound: string; phoneme?: string | null; concept?: string | null }[];
  stories: { title: string; text: string; level?: string | null; source?: string | null; purpose?: string | null }[];
}

// Get substep name from the official Wilson scope & sequence
function getSubstepName(substep: string): string {
  const substepData = getWilsonSubstep(substep);
  return substepData?.name || `Substep ${substep}`;
}

function getStepNumber(substep: string): number {
  const match = substep.match(/^(\d+)\./);
  return match ? parseInt(match[1]) : 1;
}

function getSyllableType(substep: string): 'closed' | 'vce' | 'open' | 'r-controlled' | 'vowel-team' | 'consonant-le' {
  const step = getStepNumber(substep);
  if (step <= 3) return 'closed';
  if (step === 4) return 'vce';
  if (step === 5) return 'open';
  return 'closed';
}

export async function loadWilsonData(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const data = wilsonData as RawWilsonData[];
    let count = 0;

    for (const item of data) {
      // Skip invalid substeps
      if (!item.substep || item.substep.includes('48')) continue;

      const stepNumber = getStepNumber(item.substep);
      const substepName = getSubstepName(item.substep);
      const syllableType = getSyllableType(item.substep);

      // Check if this substep already exists
      const existing = await db.wilsonLessonElements
        .where('substep')
        .equals(item.substep)
        .first();

      const lessonElements: WilsonLessonElements = {
        id: existing?.id,
        substep: item.substep,
        stepNumber,
        substepName,
        soundCards: item.soundCards.map((s): WilsonSoundCard => ({
          id: generateElementId(),
          sound: s.sound,
          keyword: '',
          type: 'consonant',
          phoneme: s.phoneme || s.sound,
          isNew: true,
        })),
        realWords: item.realWords.map((w): WilsonWord => ({
          id: generateElementId(),
          word: w.word,
          forDecoding: true,
          forSpelling: true,
          syllableType,
          syllableCount: 1,
          isControlled: true,
          notes: w.source || undefined,
        })),
        nonsenseWords: item.nonsenseWords.map((w): WilsonNonsenseWord => ({
          id: generateElementId(),
          word: w.word,
          pattern: 'CVC',
        })),
        highFrequencyWords: item.highFrequencyWords.map((w): WilsonHighFrequencyWord => ({
          id: generateElementId(),
          word: w.word,
          isNew: true,
          isDecodable: false,
        })),
        sentences: [
          ...item.sentences.map((s): WilsonSentence => ({
            id: generateElementId(),
            text: s.text,
            forReading: true,
            forDictation: true,
            wordCount: s.text.split(' ').length,
            decodablePercentage: 90,
          })),
          ...item.phrases.map((p): WilsonSentence => ({
            id: generateElementId(),
            text: p.text,
            forReading: true,
            forDictation: false,
            wordCount: p.text.split(' ').length,
            decodablePercentage: 85,
          })),
        ],
        stories: item.stories.map((s): WilsonStory => ({
          id: generateElementId(),
          title: s.title,
          text: s.text,
          wordCount: s.text.split(' ').length,
          decodablePercentage: 95,
        })),
        wordElements: item.wordElements.map((e): WilsonWordElement => ({
          id: generateElementId(),
          element: e.element,
          type: (e.type?.toLowerCase() as 'prefix' | 'suffix' | 'root' | 'baseword') || 'baseword',
          examples: [],
        })),
        concepts: [],
        lessonFocus: substepName,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existing?.id) {
        // Delete and re-add to avoid Dexie UpdateSpec type issues
        await db.wilsonLessonElements.delete(existing.id);
        await db.wilsonLessonElements.add({ ...lessonElements, id: existing.id });
      } else {
        await db.wilsonLessonElements.add(lessonElements);
      }
      count++;
    }

    return {
      success: true,
      message: `Successfully loaded Wilson data for ${count} substeps`,
      count,
    };
  } catch (error) {
    console.error('Error loading Wilson data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      count: 0,
    };
  }
}

export async function getWilsonDataStats(): Promise<{
  substepCount: number;
  totalWords: number;
  totalSentences: number;
  totalStories: number;
}> {
  const elements = await db.wilsonLessonElements.toArray();

  return {
    substepCount: elements.length,
    totalWords: elements.reduce((sum, e) => sum + e.realWords.length + e.nonsenseWords.length, 0),
    totalSentences: elements.reduce((sum, e) => sum + e.sentences.length, 0),
    totalStories: elements.reduce((sum, e) => sum + e.stories.length, 0),
  };
}

export async function clearWilsonData(): Promise<void> {
  await db.wilsonLessonElements.clear();
}
