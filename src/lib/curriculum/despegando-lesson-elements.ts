/**
 * Despegando Lesson Elements
 *
 * Data structures for Spanish reading intervention lesson content.
 * Parallel to Wilson's lesson elements but adapted for Spanish phonics.
 */

import { nanoid } from 'nanoid';

// Generate unique element IDs
export function generateElementId(): string {
  return nanoid(8);
}

// Sound card for Spanish letters and digraphs
export interface SpanishSoundCard {
  id: string;
  letter: string;           // 'm', 'ch', 'll'
  letterUpper: string;      // 'M', 'CH', 'LL'
  sound: string;            // '/m/', '/ch/', '/y/'
  keyword: string;          // 'mamá', 'chico', 'llama'
  keywordImage?: string;    // Image reference
  type: 'vowel' | 'consonant' | 'digraph' | 'blend';
  isNew: boolean;           // New at this lesson vs review
}

// CV Syllable for Spanish
export interface SpanishSyllable {
  id: string;
  syllable: string;         // 'ma', 'che', 'bla'
  consonant: string;        // 'm', 'ch', 'bl'
  vowel: string;            // 'a', 'e', 'i', 'o', 'u'
  syllableType: 'cv' | 'ccv' | 'cvc' | 'cvv';  // CV pattern
  isNew: boolean;
}

// Spanish word with syllable breakdown
export interface SpanishWord {
  id: string;
  word: string;             // 'mamá'
  syllables: string[];      // ['ma', 'má']
  syllableCount: number;    // 2
  isDecodable: boolean;     // Can be decoded with current skills
  forReading: boolean;      // Include in reading lists
  forSpelling: boolean;     // Include in spelling/dictation
  hasAccent: boolean;       // Contains accent mark
  notes?: string;
}

// Nonsense word for Spanish (pseudowords)
export interface SpanishNonsenseWord {
  id: string;
  word: string;             // 'mapi'
  syllables: string[];      // ['ma', 'pi']
  pattern: string;          // 'CVCV'
}

// High-frequency/sight words (irregular)
export interface SpanishHighFrequencyWord {
  id: string;
  word: string;
  isIrregular: boolean;     // Spelling doesn't match typical patterns
  frequency: 'high' | 'medium';
  teachingTip?: string;
}

// Elkonin box item for sound segmentation
export interface ElkoninBoxItem {
  id: string;
  word: string;             // 'amo'
  sounds: string[];         // ['a', 'm', 'o']
  soundCount: number;       // 3
  boxCount: number;         // 3 (may differ if digraphs)
}

// Spanish sentence for reading/dictation
export interface SpanishSentence {
  id: string;
  text: string;             // 'Mi mamá me ama.'
  wordCount: number;
  decodablePercentage: number;  // % of words decodable
  forReading: boolean;
  forDictation: boolean;
  targetWords?: string[];   // Words being practiced
}

// Spanish story/decodable text
export interface SpanishStory {
  id: string;
  title: string;
  titleSpanish: string;
  text: string;
  wordCount: number;
  sentenceCount: number;
  decodablePercentage: number;
  bookNumber?: number;      // Aligned decodable book
}

// Syllable clapping activity
export interface SyllableClappingItem {
  id: string;
  word: string;
  split: string;            // 'ma-má'
  syllableCount: number;
  image?: string;
}

// Initial sound identification item
export interface InitialSoundItem {
  id: string;
  image: string;
  targetSound: string;
  correctAnswer: boolean;
}

// Matching activity item
export interface MatchingItem {
  id: string;
  image: string;
  word: string;
  matchType: 'image-word' | 'image-vowel' | 'syllable-word';
}

// Letter formation guide
export interface LetterFormation {
  id: string;
  letter: string;
  letterUpper: string;
  letterLower: string;
  strokes: string;          // Formation instructions
  skyGrassDirt: boolean;    // Use sky-grass-dirt lines
}

// Knowledge/comprehension section
export interface KnowledgeSection {
  title: string;
  titleSpanish: string;
  paragraphs: string[];
  questions: string[];
  drawPrompt?: string;
}

// Reflection section with EMERGE value
export interface ReflectionSection {
  emergeValue: string;
  emergeValueSpanish: string;
  valueExplanation: string;
  prompt: string;
  affirmation: string;
}

// Main container for lesson elements
export interface DespegandoLessonElements {
  id?: number;
  lesson: number;
  unit: number;
  lessonType: string;
  letterUpper?: string;
  letterLower?: string;
  sound?: string;
  theme: string;
  themeSpanish: string;
  emergeValue: string;

  // Sound cards
  soundCards: SpanishSoundCard[];

  // Syllables
  syllables: SpanishSyllable[];

  // Words
  realWords: SpanishWord[];
  nonsenseWords: SpanishNonsenseWord[];
  highFrequencyWords: SpanishHighFrequencyWord[];

  // Sound segmentation
  elkoninBoxes: ElkoninBoxItem[];

  // Syllable awareness
  syllableClapping: SyllableClappingItem[];

  // Initial sound activities
  initialSoundItems: InitialSoundItem[];

  // Letter formation
  letterFormation?: LetterFormation;

  // Reading materials
  sentences: SpanishSentence[];
  stories: SpanishStory[];

  // Matching activities
  matchingItems: MatchingItem[];

  // Mixed syllable reading rows
  mixedSyllableRows: string[][];

  // Dictation words
  dictationWords: string[];

  // Knowledge section
  knowledge?: KnowledgeSection;

  // Reflection
  reflection?: ReflectionSection;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Lesson plan section for drag-and-drop builder
export interface DespegandoLessonPlanSection {
  component: DespegandoLessonComponentType;
  componentName: string;
  componentNameSpanish: string;
  duration: number;
  elements: DespegandoLessonPlanElement[];
  activities: string[];
  notes?: string;
}

// Element that can be placed in lesson plan
export interface DespegandoLessonPlanElement {
  id: string;
  type: 'sound_card' | 'syllable' | 'word' | 'nonsense_word' | 'sentence' | 'story' | 'elkonin' | 'matching';
  content: string;
  data: SpanishSoundCard | SpanishSyllable | SpanishWord | SpanishNonsenseWord | SpanishSentence | SpanishStory | ElkoninBoxItem | MatchingItem;
}

// Lesson component types for Despegando
export type DespegandoLessonComponentType =
  | 'syllable-warmup'
  | 'sound-letter-review'
  | 'elkonin-boxes'
  | 'syllable-reading'
  | 'word-reading'
  | 'sentence-reading'
  | 'dictation'
  | 'decodable-text';

// Complete lesson plan
export interface DespegandoLessonPlan {
  id?: number;
  lesson: number;
  lessonName: string;
  lessonNameSpanish: string;
  sections: DespegandoLessonPlanSection[];
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
}

// Default durations for 1:1 vs group (in minutes)
export const DESPEGANDO_COMPONENT_DURATIONS = {
  'syllable-warmup': { oneOnOne: 2, group: 3 },
  'sound-letter-review': { oneOnOne: 5, group: 7 },
  'elkonin-boxes': { oneOnOne: 5, group: 7 },
  'syllable-reading': { oneOnOne: 5, group: 7 },
  'word-reading': { oneOnOne: 5, group: 7 },
  'sentence-reading': { oneOnOne: 5, group: 7 },
  'dictation': { oneOnOne: 8, group: 10 },
  'decodable-text': { oneOnOne: 10, group: 12 }
};

// Create empty lesson elements for a new lesson
export function createEmptyDespegandoLessonElements(lesson: number, unit: number): DespegandoLessonElements {
  return {
    lesson,
    unit,
    lessonType: 'new_letter',
    theme: '',
    themeSpanish: '',
    emergeValue: '',
    soundCards: [],
    syllables: [],
    realWords: [],
    nonsenseWords: [],
    highFrequencyWords: [],
    elkoninBoxes: [],
    syllableClapping: [],
    initialSoundItems: [],
    sentences: [],
    stories: [],
    matchingItems: [],
    mixedSyllableRows: [],
    dictationWords: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Create empty lesson plan
export function createEmptyDespegandoLessonPlan(lesson: number): DespegandoLessonPlan {
  return {
    lesson,
    lessonName: '',
    lessonNameSpanish: '',
    sections: [
      { component: 'syllable-warmup', componentName: 'Syllable Warm-up', componentNameSpanish: 'Calentamiento de Sílabas', duration: 2, elements: [], activities: [] },
      { component: 'sound-letter-review', componentName: 'Sound/Letter Review', componentNameSpanish: 'Repaso de Sonido/Letra', duration: 5, elements: [], activities: [] },
      { component: 'elkonin-boxes', componentName: 'Elkonin Boxes', componentNameSpanish: 'Cajas de Sonidos', duration: 5, elements: [], activities: [] },
      { component: 'syllable-reading', componentName: 'Syllable Reading', componentNameSpanish: 'Lectura de Sílabas', duration: 5, elements: [], activities: [] },
      { component: 'word-reading', componentName: 'Word Reading', componentNameSpanish: 'Lectura de Palabras', duration: 5, elements: [], activities: [] },
      { component: 'sentence-reading', componentName: 'Sentence Reading', componentNameSpanish: 'Lectura de Oraciones', duration: 5, elements: [], activities: [] },
      { component: 'dictation', componentName: 'Dictation', componentNameSpanish: 'Dictado', duration: 8, elements: [], activities: [] },
      { component: 'decodable-text', componentName: 'Decodable Text', componentNameSpanish: 'Texto Decodificable', duration: 10, elements: [], activities: [] }
    ],
    totalDuration: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
