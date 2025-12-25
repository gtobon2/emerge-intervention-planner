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
  // Block 1: Word Study
  | 'sounds-quick-drill'
  | 'teach-review-reading'
  | 'word-cards'
  | 'wordlist-reading'
  | 'sentence-reading'
  // Block 2: Spelling
  | 'quick-drill-reverse'
  | 'teach-review-spelling'
  | 'dictation'
  // Block 3: Fluency/Comprehension
  | 'passage-reading'
  | 'listening-comprehension';

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

export type LessonBlock = 'word-study' | 'spelling' | 'fluency-comprehension';

export const WILSON_LESSON_SECTIONS: {
  part: number;
  type: LessonComponentType;
  name: string;
  block: LessonBlock;
  duration1to1: number;
  durationGroup: number;
  description: string;
  acceptsElements: ('sound' | 'word' | 'nonsense' | 'hf_word' | 'sentence' | 'story' | 'element')[];
  fields?: string[];
}[] = [
  // ============================================
  // BLOCK 1: Word Study
  // ============================================
  {
    part: 1,
    type: 'sounds-quick-drill',
    name: 'Sounds Quick Drill',
    block: 'word-study',
    duration1to1: 3,
    durationGroup: 3,
    description: 'Establish quick and automatic letter naming and production of sounds for decoding.',
    acceptsElements: ['sound'],
    fields: ['vowels', 'consonants', 'welded', 'drillLeader'],
  },
  {
    part: 2,
    type: 'teach-review-reading',
    name: 'Teach & Review Concepts for Reading',
    block: 'word-study',
    duration1to1: 5,
    durationGroup: 5,
    description: 'Teach word structure by presenting words in segmented form, and practice decoding words with specific taught patterns.',
    acceptsElements: ['sound', 'word', 'element'],
    fields: ['reviewConcepts', 'reviewWords', 'currentConcepts', 'currentWords'],
  },
  {
    part: 3,
    type: 'word-cards',
    name: 'Word Cards',
    block: 'word-study',
    duration1to1: 5,
    durationGroup: 10,
    description: 'Present word examples as a whole to solidify conceptual understanding of word structure, establish automaticity, and develop vocabulary.',
    acceptsElements: ['word', 'hf_word'],
    fields: ['substeps', 'activity', 'vocabularyWords', 'highFrequencyWords'],
  },
  {
    part: 4,
    type: 'wordlist-reading',
    name: 'Wordlist Reading',
    block: 'word-study',
    duration1to1: 5,
    durationGroup: 10,
    description: 'Determine independent application and automaticity of single word decoding skills. Chart progress to determine subsequent lessons/progression.',
    acceptsElements: ['word', 'nonsense'],
    fields: ['studentReader', 'practicePageTop', 'practicePageBottom', 'chartingPageTop', 'chartingPageBottom', 'errors', 'activity'],
  },
  {
    part: 5,
    type: 'sentence-reading',
    name: 'Sentence Reading',
    block: 'word-study',
    duration1to1: 5,
    durationGroup: 5,
    description: 'Determine independent skills within context. Emphasize vocabulary and fluency with reading in meaningful phrases to support comprehension.',
    acceptsElements: ['sentence'],
    fields: ['studentReader', 'page', 'errors', 'notes'],
  },
  // ============================================
  // BLOCK 2: Spelling
  // ============================================
  {
    part: 6,
    type: 'quick-drill-reverse',
    name: 'Quick Drill in Reverse',
    block: 'spelling',
    duration1to1: 2,
    durationGroup: 3,
    description: 'Establish quick and automatic letter naming and production of sounds for encoding.',
    acceptsElements: ['sound'],
    fields: ['vowels', 'consonants', 'welded', 'wordElements'],
  },
  {
    part: 7,
    type: 'teach-review-spelling',
    name: 'Teach & Review Concepts for Spelling',
    block: 'spelling',
    duration1to1: 5,
    durationGroup: 10,
    description: 'Establish process to spell words by breaking them into parts (word elements, syllables, sounds).',
    acceptsElements: ['word', 'element', 'hf_word'],
    fields: ['reviewConcepts', 'reviewWordsElements', 'currentConcepts', 'currentWordsElements', 'highFrequencyWords'],
  },
  {
    part: 8,
    type: 'dictation',
    name: 'Written Work Dictation',
    block: 'spelling',
    duration1to1: 15,
    durationGroup: 20,
    description: 'Develop independent spelling and proofreading skills with word structure elements directly taught thus far.',
    acceptsElements: ['sound', 'word', 'nonsense', 'sentence', 'element', 'hf_word'],
    fields: ['sounds', 'wordElements', 'realWords', 'nonsenseWords', 'hfPhrases', 'sentences'],
  },
  // ============================================
  // BLOCK 3: Fluency/Comprehension
  // ============================================
  {
    part: 9,
    type: 'passage-reading',
    name: 'Controlled Text Passage Reading',
    block: 'fluency-comprehension',
    duration1to1: 15,
    durationGroup: 15,
    description: 'Increase reading fluency with controlled text, and develop silent reading skill including mental representation for comprehension using visualization.',
    acceptsElements: ['story'],
    fields: ['titlePage', 'source', 'comprehensionSOS', 'vocabulary', 'oralFluency', 'followUpQuestions'],
  },
  {
    part: 10,
    type: 'listening-comprehension',
    name: 'Listening/Reading Fluency and Comprehension',
    block: 'fluency-comprehension',
    duration1to1: 30,
    durationGroup: 30,
    description: 'Develop auditory processing of language and comprehension of age-appropriate literature and informational text.',
    acceptsElements: ['story'],
    fields: ['source', 'title', 'pages', 'tasks', 'notes'],
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
 * @param isGroup - Whether this is for a group (true) or 1:1 (false) session
 */
export function createEmptyLessonPlan(
  substep: string,
  substepName: string,
  isGroup: boolean = true
): WilsonLessonPlan {
  return {
    substep,
    substepName,
    sections: WILSON_LESSON_SECTIONS.map((section) => ({
      component: section.type,
      componentName: section.name,
      duration: isGroup ? section.durationGroup : section.duration1to1,
      elements: [],
      activities: [],
    })),
    totalDuration: WILSON_LESSON_SECTIONS.reduce(
      (sum, s) => sum + (isGroup ? s.durationGroup : s.duration1to1),
      0
    ),
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
