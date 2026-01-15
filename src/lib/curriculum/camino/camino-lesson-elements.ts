/**
 * CaminoALaLectura / Despegando - Spanish Lesson Element Data Structures
 *
 * This file defines the schema for storing Spanish reading intervention lesson elements
 * (sounds, syllables, words, etc.) organized by unit and lesson.
 *
 * Based on the Wilson pattern but adapted for Spanish phonics instruction.
 */

// ============================================
// Core Types
// ============================================

export type SpanishSoundType = 'vowel' | 'consonant' | 'digraph' | 'blend' | 'diphthong';
export type SyllableStructure = 'CV' | 'CVC' | 'CVVC' | 'CCV' | 'CCVC' | 'V' | 'VC';

// ============================================
// Sound/Letter Card
// ============================================

export interface CaminoSoundCard {
  id: string;
  letter: string;        // The letter/grapheme (e.g., "m", "ch", "ll")
  sound: string;         // The sound it makes
  keyword: string;       // Keyword for the sound (e.g., "mamá" for m)
  keywordImage?: string; // Image filename
  type: SpanishSoundType;
  isNew: boolean;        // New at this lesson vs review
  notes?: string;        // Additional teaching notes
}

// ============================================
// Syllable Types
// ============================================

export interface CaminoSyllable {
  id: string;
  syllable: string;      // e.g., "ma", "pe", "sol"
  structure: SyllableStructure;
  isOpen: boolean;       // CV syllables are open
  notes?: string;
}

// ============================================
// Word Types
// ============================================

export interface CaminoWord {
  id: string;
  word: string;
  syllables: string[];   // Word broken into syllables ["ma", "má"]
  syllableCount: number;
  forDecoding: boolean;  // Can be used in reading practice
  forSpelling: boolean;  // Can be used in dictation
  hasImage: boolean;     // Has an accompanying image
  imageFile?: string;    // Image filename if hasImage
  notes?: string;
}

export interface CaminoHighFrequencyWord {
  id: string;
  word: string;
  isNew: boolean;        // New at this lesson vs review
  isDecodable: boolean;  // Can be decoded with current skills
  teachingTip?: string;  // How to teach if not fully decodable
}

// ============================================
// Text Elements
// ============================================

export interface CaminoSentence {
  id: string;
  text: string;
  forReading: boolean;   // For sentence reading practice
  forDictation: boolean; // For dictation practice
  wordCount: number;
  decodablePercentage: number;
}

export interface CaminoDecodableText {
  id: string;
  title: string;
  text: string;
  wordCount: number;
  targetSounds: string[];
  targetSyllables: string[];
  comprehensionQuestions?: string[];
}

// ============================================
// Word Sort Types
// ============================================

export type WordSortType =
  | 'initialSound'      // Sort by initial sound/letter
  | 'finalSound'        // Sort by final sound
  | 'syllableCount'     // Sort by number of syllables
  | 'syllableStructure' // Sort by CV, CVC, CCV patterns
  | 'vowelSound'        // Sort by vowel in first syllable
  | 'digraph'           // Sort words with/without digraphs
  | 'blend'             // Sort words with/without blends
  | 'rhymeFamily'       // Sort by rhyme patterns
  | 'open';             // Open sort (student decides categories)

export interface WordSortCategory {
  header: string;        // Category header (e.g., "/m/", "2 sílabas")
  headerEn?: string;     // English header
  words: string[];       // Words in this category
}

export interface WordSortOddOneOut {
  word: string;
  reason: string;        // Why it doesn't fit
  reasonEn?: string;     // English reason
}

export interface CaminoWordSort {
  id: string;
  sortType: WordSortType;
  difficulty: 1 | 2 | 3;  // 1=easy (2 columns), 2=medium (3 columns), 3=hard (4 columns)
  columns: number;        // Number of sorting columns
  title: string;          // Spanish title
  titleEn: string;        // English title
  instructions: string;   // Spanish instructions
  instructionsEn: string; // English instructions
  categories: WordSortCategory[];
  oddOneOut?: WordSortOddOneOut[]; // Optional words that don't fit any category
  unit: number;
  lesson: number;
}

// ============================================
// Main Lesson Elements Container
// ============================================

export interface CaminoLessonElements {
  id?: number;           // Auto-increment ID for IndexedDB
  unit: number;          // 1-5
  lesson: number;        // Lesson number within unit
  lessonCode: string;    // e.g., "L01", "L15"
  lessonName: string;    // e.g., "Vocales A, E, I"
  targetLetters: string[];  // Letters/sounds taught in this lesson

  // Sound/Letter Elements
  soundCards: CaminoSoundCard[];

  // Syllable Bank
  syllables: CaminoSyllable[];

  // Word Banks
  words: CaminoWord[];
  highFrequencyWords: CaminoHighFrequencyWord[];

  // Text Elements
  sentences: CaminoSentence[];
  decodableTexts: CaminoDecodableText[];

  // Lesson Focus
  concepts: string[];
  lessonFocus: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Lesson Plan Structure
// ============================================

export type CaminoLessonComponentType =
  // Warm-up
  | 'syllable-warmup'
  // Phonemic Awareness
  | 'phonemic-awareness'
  // Letter Sounds
  | 'letter-sounds'
  // Word Work
  | 'word-work'
  // Dictation
  | 'dictation'
  // High-Frequency Words
  | 'high-frequency'
  // Fluency
  | 'fluency-practice'
  // Decodable Text
  | 'decodable-text';

export interface CaminoLessonPlanElement {
  id: string;
  type: 'sound' | 'syllable' | 'word' | 'hf_word' | 'sentence' | 'text';
  value: string;
  sourceId: string;      // ID from the element bank
}

export interface CaminoLessonPlanSection {
  component: CaminoLessonComponentType;
  componentName: string; // Human-readable name (Spanish)
  componentNameEn: string; // English name
  duration: number;      // Minutes
  elements: CaminoLessonPlanElement[];
  activities: string[];  // User-added activities
  notes?: string;
}

export interface CaminoLessonPlan {
  id?: number;
  sessionId?: number;    // Link to session if saved
  unit: number;
  lesson: number;
  lessonCode: string;
  lessonName: string;
  sections: CaminoLessonPlanSection[];
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Camino Lesson Section Definitions
// ============================================

export type CaminoLessonBlock = 'warmup' | 'phonics' | 'reading' | 'writing';

export const CAMINO_LESSON_SECTIONS: {
  part: number;
  type: CaminoLessonComponentType;
  name: string;
  nameEn: string;
  block: CaminoLessonBlock;
  duration1to1: number;
  durationGroup: number;
  description: string;
  descriptionEn: string;
  acceptsElements: ('sound' | 'syllable' | 'word' | 'hf_word' | 'sentence' | 'text')[];
  strategies: string[];
}[] = [
  {
    part: 1,
    type: 'syllable-warmup',
    name: 'Calentamiento de Sílabas',
    nameEn: 'Syllable Warm-up',
    block: 'warmup',
    duration1to1: 3,
    durationGroup: 5,
    description: 'Práctica rápida de sílabas para automaticidad. Usar tarjetas o ruedas de sílabas.',
    descriptionEn: 'Quick syllable drill for automaticity. Use syllable cards or wheels.',
    acceptsElements: ['syllable'],
    strategies: ['Syllable cards', 'Syllable wheels', 'Choral response', 'Tap and say'],
  },
  {
    part: 2,
    type: 'phonemic-awareness',
    name: 'Conciencia Fonémica',
    nameEn: 'Phonemic Awareness',
    block: 'phonics',
    duration1to1: 5,
    durationGroup: 8,
    description: 'Segmentación y manipulación de sonidos. Usar cajas Elkonin y fichas.',
    descriptionEn: 'Sound segmentation and manipulation. Use Elkonin boxes and counters.',
    acceptsElements: ['sound', 'syllable', 'word'],
    strategies: ['Elkonin boxes', 'Sound counters', 'Phoneme isolation', 'Blending', 'Segmenting'],
  },
  {
    part: 3,
    type: 'letter-sounds',
    name: 'Sonidos de Letras',
    nameEn: 'Letter Sounds',
    block: 'phonics',
    duration1to1: 5,
    durationGroup: 8,
    description: 'Enseñanza explícita de correspondencias letra-sonido. Usar tarjetas de sonido.',
    descriptionEn: 'Explicit letter-sound correspondence instruction. Use sound cards.',
    acceptsElements: ['sound'],
    strategies: ['Sound cards', 'Keyword pictures', 'Air writing', 'Multisensory'],
  },
  {
    part: 4,
    type: 'word-work',
    name: 'Trabajo con Palabras',
    nameEn: 'Word Work',
    block: 'reading',
    duration1to1: 8,
    durationGroup: 12,
    description: 'Decodificación y construcción de palabras. Usar letras magnéticas y pizarras.',
    descriptionEn: 'Word decoding and building. Use magnetic letters and whiteboards.',
    acceptsElements: ['word', 'syllable'],
    strategies: ['Word building', 'Word chains', 'Syllable manipulation', 'Word sorts'],
  },
  {
    part: 5,
    type: 'high-frequency',
    name: 'Palabras de Alta Frecuencia',
    nameEn: 'High-Frequency Words',
    block: 'reading',
    duration1to1: 3,
    durationGroup: 5,
    description: 'Práctica de palabras de uso frecuente. Incluir palabras irregulares.',
    descriptionEn: 'High-frequency word practice. Include irregular words.',
    acceptsElements: ['hf_word'],
    strategies: ['Flash cards', 'Games', 'Sentence context', 'Heart word method'],
  },
  {
    part: 6,
    type: 'dictation',
    name: 'Dictado',
    nameEn: 'Dictation',
    block: 'writing',
    duration1to1: 8,
    durationGroup: 12,
    description: 'Dictado de sonidos, sílabas, palabras y oraciones. Énfasis en ortografía.',
    descriptionEn: 'Dictation of sounds, syllables, words, and sentences. Emphasis on spelling.',
    acceptsElements: ['sound', 'syllable', 'word', 'sentence'],
    strategies: ['Say it, finger spell, write', 'Sound boxes', 'Sentence dictation'],
  },
  {
    part: 7,
    type: 'fluency-practice',
    name: 'Práctica de Fluidez',
    nameEn: 'Fluency Practice',
    block: 'reading',
    duration1to1: 5,
    durationGroup: 8,
    description: 'Lectura repetida de frases y oraciones. Enfocarse en precisión y prosodia.',
    descriptionEn: 'Repeated reading of phrases and sentences. Focus on accuracy and prosody.',
    acceptsElements: ['sentence', 'word'],
    strategies: ['Choral reading', 'Echo reading', 'Partner reading', 'Phrase cards'],
  },
  {
    part: 8,
    type: 'decodable-text',
    name: 'Texto Decodificable',
    nameEn: 'Decodable Text',
    block: 'reading',
    duration1to1: 8,
    durationGroup: 12,
    description: 'Lectura de texto controlado alineado con patrones enseñados. Incluir comprensión.',
    descriptionEn: 'Reading controlled text aligned with taught patterns. Include comprehension.',
    acceptsElements: ['text'],
    strategies: ['Preview vocabulary', 'Picture walk', 'Reading', 'Comprehension questions'],
  },
];

// ============================================
// Unit Definitions
// ============================================

export const CAMINO_UNITS = [
  {
    unit: 1,
    name: 'Vocales y Consonantes Iniciales',
    nameEn: 'Vowels and Initial Consonants',
    letters: ['a', 'e', 'i', 'o', 'u', 'm', 'p', 'l', 's', 't', 'd'],
    lessons: 10,
  },
  {
    unit: 2,
    name: 'Consonantes Adicionales',
    nameEn: 'Additional Consonants',
    letters: ['n', 'r', 'c', 'b', 'g', 'f', 'v', 'z', 'j', 'ñ'],
    lessons: 10,
  },
  {
    unit: 3,
    name: 'Dígrafos y Grupos Consonánticos',
    nameEn: 'Digraphs and Consonant Clusters',
    letters: ['ch', 'll', 'rr', 'qu', 'h', 'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr'],
    lessons: 8,
  },
  {
    unit: 4,
    name: 'Sílabas Complejas',
    nameEn: 'Complex Syllables',
    letters: ['gue', 'gui', 'güe', 'güi', 'ce', 'ci', 'ge', 'gi'],
    lessons: 8,
  },
  {
    unit: 5,
    name: 'Palabras Multisílabas',
    nameEn: 'Multisyllabic Words',
    letters: [],
    lessons: 14,
  },
];

// ============================================
// Lesson Codes by Unit
// ============================================

export function getLessonCode(unit: number, lessonNum: number): string {
  let lessonOffset = 0;
  for (let u = 1; u < unit; u++) {
    const unitInfo = CAMINO_UNITS.find(cu => cu.unit === u);
    if (unitInfo) lessonOffset += unitInfo.lessons;
  }
  return `L${String(lessonOffset + lessonNum).padStart(2, '0')}`;
}

export function getLessonsForUnit(unit: number): { value: string; label: string }[] {
  const unitInfo = CAMINO_UNITS.find(u => u.unit === unit);
  if (!unitInfo) return [];

  const lessons: { value: string; label: string }[] = [];
  for (let i = 1; i <= unitInfo.lessons; i++) {
    const code = getLessonCode(unit, i);
    lessons.push({
      value: code,
      label: `${code} - Lección ${i}`,
    });
  }
  return lessons;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique ID for elements
 */
export function generateElementId(): string {
  return `cel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create an empty lesson elements structure
 */
export function createEmptyCaminoLessonElements(
  unit: number,
  lesson: number,
  lessonName: string
): CaminoLessonElements {
  return {
    unit,
    lesson,
    lessonCode: getLessonCode(unit, lesson),
    lessonName,
    targetLetters: [],
    soundCards: [],
    syllables: [],
    words: [],
    highFrequencyWords: [],
    sentences: [],
    decodableTexts: [],
    concepts: [],
    lessonFocus: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create an empty lesson plan
 */
export function createEmptyCaminoLessonPlan(
  unit: number,
  lesson: number,
  lessonName: string,
  isGroup: boolean = true
): CaminoLessonPlan {
  return {
    unit,
    lesson,
    lessonCode: getLessonCode(unit, lesson),
    lessonName,
    sections: CAMINO_LESSON_SECTIONS.map((section) => ({
      component: section.type,
      componentName: section.name,
      componentNameEn: section.nameEn,
      duration: isGroup ? section.durationGroup : section.duration1to1,
      elements: [],
      activities: [],
    })),
    totalDuration: CAMINO_LESSON_SECTIONS.reduce(
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
export function calculateCaminoLessonDuration(plan: CaminoLessonPlan): number {
  return plan.sections.reduce((sum, section) => sum + section.duration, 0);
}

/**
 * Get which element types a lesson component accepts
 */
export function getCaminoAcceptedElementTypes(
  componentType: CaminoLessonComponentType
): ('sound' | 'syllable' | 'word' | 'hf_word' | 'sentence' | 'text')[] {
  const section = CAMINO_LESSON_SECTIONS.find((s) => s.type === componentType);
  return section?.acceptsElements || [];
}
