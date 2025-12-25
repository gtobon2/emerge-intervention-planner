/**
 * Wilson Reading System - Lesson Element Data Structures
 *
 * This file defines the schema for storing granular lesson elements
 * (sounds, words, sentences, etc.) organized by substep.
 *
 * Data is entered by interventionists via the Settings > Wilson Data page
 * and stored in IndexedDB for offline-first access.
 */

// ============================================
// Core Types
// ============================================

export type SoundType = 'vowel' | 'consonant' | 'digraph' | 'blend' | 'r-controlled' | 'vowel-team';
export type WordElementType = 'prefix' | 'suffix' | 'root' | 'baseword';
export type SyllableType = 'closed' | 'vce' | 'open' | 'r-controlled' | 'vowel-team' | 'consonant-le';

// ============================================
// Sound Card
// ============================================

export interface WilsonSoundCard {
  id: string;
  sound: string;           // The sound/grapheme (e.g., "ch", "a", "igh")
  keyword: string;         // Keyword for the sound (e.g., "cherry" for ch)
  type: SoundType;
  phoneme: string;         // IPA or description (e.g., "/ch/" or "short a")
  isNew: boolean;          // New at this substep vs review
}

// ============================================
// Word Types
// ============================================

export interface WilsonWord {
  id: string;
  word: string;
  forDecoding: boolean;    // Can be used in reading/decoding practice
  forSpelling: boolean;    // Can be used in spelling/dictation
  syllableType: SyllableType;
  syllableCount: number;
  isControlled: boolean;   // Is it a decodable/controlled word
  notes?: string;          // Optional teaching notes
}

export interface WilsonNonsenseWord {
  id: string;
  word: string;
  pattern: string;         // The pattern it demonstrates (e.g., "CVC", "CCVC")
}

export interface WilsonHighFrequencyWord {
  id: string;
  word: string;
  isNew: boolean;          // New at this substep vs review
  isDecodable: boolean;    // Can be decoded with current skills
  teachingTip?: string;    // How to teach if not fully decodable
}

// ============================================
// Text Elements
// ============================================

export interface WilsonSentence {
  id: string;
  text: string;
  forReading: boolean;     // For sentence reading practice
  forDictation: boolean;   // For dictation practice
  wordCount: number;
  decodablePercentage: number; // % of words that are decodable
}

export interface WilsonStory {
  id: string;
  title: string;
  text: string;
  wordCount: number;
  lexileLevel?: number;
  decodablePercentage: number;
  comprehensionQuestions?: string[];
}

// ============================================
// Word Elements (Morphology)
// ============================================

export interface WilsonWordElement {
  id: string;
  element: string;         // The affix/root (e.g., "-ed", "un-", "-tion")
  type: WordElementType;
  meaning?: string;        // Meaning of the element
  examples: string[];      // Example words using this element
  rules?: string;          // Any spelling rules (e.g., doubling rule for -ed)
}

// ============================================
// Main Lesson Elements Container
// ============================================

export interface WilsonLessonElements {
  id?: number;             // Auto-increment ID for IndexedDB
  substep: string;         // e.g., "1.1", "2.3"
  stepNumber: number;      // 1-6
  substepName: string;     // e.g., "Short Vowels in Closed Syllables"

  // Sound/Letter Elements
  soundCards: WilsonSoundCard[];

  // Word Banks
  realWords: WilsonWord[];
  nonsenseWords: WilsonNonsenseWord[];
  highFrequencyWords: WilsonHighFrequencyWord[];

  // Text Elements
  sentences: WilsonSentence[];
  stories: WilsonStory[];

  // Morphology Elements
  wordElements: WilsonWordElement[];

  // Concepts for this substep
  concepts: string[];
  lessonFocus: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Lesson Plan Structure
// ============================================

export type LessonComponentType =
  | 'sound-cards'
  | 'teach-review'
  | 'word-cards'
  | 'word-list-reading'
  | 'sentence-reading'
  | 'passage-reading'
  | 'quick-drill'
  | 'dictation-sounds'
  | 'dictation-words'
  | 'dictation-sentences';

export interface LessonPlanElement {
  id: string;
  type: 'sound' | 'word' | 'nonsense' | 'hf_word' | 'sentence' | 'story' | 'element';
  value: string;
  sourceId: string;        // ID from the element bank
}

export interface LessonPlanSection {
  component: LessonComponentType;
  componentName: string;   // Human-readable name
  duration: number;        // Minutes
  elements: LessonPlanElement[];
  activities: string[];    // AI-suggested or user-added activities
  notes?: string;
}

export interface WilsonLessonPlan {
  id?: number;
  sessionId?: number;      // Link to session if saved
  substep: string;
  substepName: string;
  sections: LessonPlanSection[];
  totalDuration: number;   // Sum of all section durations
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Wilson Lesson Component Definitions
// ============================================

export const WILSON_LESSON_SECTIONS: {
  type: LessonComponentType;
  name: string;
  duration: number;
  description: string;
  acceptsElements: ('sound' | 'word' | 'nonsense' | 'hf_word' | 'sentence' | 'story' | 'element')[];
}[] = [
  {
    type: 'sound-cards',
    name: 'Sound Cards',
    duration: 2,
    description: 'Review sound-symbol correspondences',
    acceptsElements: ['sound'],
  },
  {
    type: 'teach-review',
    name: 'Teach/Review Concepts',
    duration: 5,
    description: 'Introduce or review phonetic concepts',
    acceptsElements: ['sound', 'element'],
  },
  {
    type: 'word-cards',
    name: 'Word Cards',
    duration: 2,
    description: 'Practice reading real words',
    acceptsElements: ['word'],
  },
  {
    type: 'word-list-reading',
    name: 'Word List Reading',
    duration: 5,
    description: 'Read controlled word lists (real + nonsense)',
    acceptsElements: ['word', 'nonsense'],
  },
  {
    type: 'sentence-reading',
    name: 'Sentence Reading',
    duration: 3,
    description: 'Read controlled sentences',
    acceptsElements: ['sentence'],
  },
  {
    type: 'passage-reading',
    name: 'Passage Reading',
    duration: 8,
    description: 'Read connected text for fluency',
    acceptsElements: ['story'],
  },
  {
    type: 'quick-drill',
    name: 'Quick Drill',
    duration: 2,
    description: 'Rapid review of sounds for automaticity',
    acceptsElements: ['sound'],
  },
  {
    type: 'dictation-sounds',
    name: 'Dictation: Sounds',
    duration: 2,
    description: 'Write sounds from dictation',
    acceptsElements: ['sound'],
  },
  {
    type: 'dictation-words',
    name: 'Dictation: Words',
    duration: 3,
    description: 'Spell words from dictation',
    acceptsElements: ['word'],
  },
  {
    type: 'dictation-sentences',
    name: 'Dictation: Sentences',
    duration: 3,
    description: 'Write sentences from dictation',
    acceptsElements: ['sentence'],
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique ID for elements
 */
export function generateElementId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create an empty lesson elements structure for a substep
 */
export function createEmptyLessonElements(
  substep: string,
  stepNumber: number,
  substepName: string
): WilsonLessonElements {
  return {
    substep,
    stepNumber,
    substepName,
    soundCards: [],
    realWords: [],
    nonsenseWords: [],
    highFrequencyWords: [],
    sentences: [],
    stories: [],
    wordElements: [],
    concepts: [],
    lessonFocus: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create an empty lesson plan for a substep
 */
export function createEmptyLessonPlan(
  substep: string,
  substepName: string
): WilsonLessonPlan {
  return {
    substep,
    substepName,
    sections: WILSON_LESSON_SECTIONS.map((section) => ({
      component: section.type,
      componentName: section.name,
      duration: section.duration,
      elements: [],
      activities: [],
    })),
    totalDuration: WILSON_LESSON_SECTIONS.reduce((sum, s) => sum + s.duration, 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate total duration of a lesson plan
 */
export function calculateLessonDuration(plan: WilsonLessonPlan): number {
  return plan.sections.reduce((sum, section) => sum + section.duration, 0);
}

/**
 * Get which element types a lesson component accepts
 */
export function getAcceptedElementTypes(
  componentType: LessonComponentType
): ('sound' | 'word' | 'nonsense' | 'hf_word' | 'sentence' | 'story' | 'element')[] {
  const section = WILSON_LESSON_SECTIONS.find((s) => s.type === componentType);
  return section?.acceptsElements || [];
}
