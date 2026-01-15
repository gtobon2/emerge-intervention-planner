/**
 * Wilson Worksheet Generator Types
 *
 * TypeScript interfaces for worksheet generation, templates, and PDF export.
 */

import type { WilsonSubstep } from '@/lib/curriculum/wilson';

export type WorksheetTemplate =
  | 'word_list'
  | 'sentence_dictation'
  | 'sound_mapping'
  | 'syllable_division'
  | 'hf_words'
  | 'combined'
  | 'sentence_completion'
  | 'draw_and_write';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface WorksheetConfig {
  template: WorksheetTemplate;
  substep: string; // e.g., "1.1", "2.3"
  difficulty: DifficultyLevel;
  wordCount: number;
  includeNonsenseWords: boolean;
  includeAnswerKey: boolean;
  studentName?: string;
  date?: string;
}

export interface GeneratedWorksheet {
  id: string;
  config: WorksheetConfig;
  substepData: WilsonSubstep;
  stepNumber: number;
  stepName: string;
  title: string;
  instructions: string;
  content: WorksheetContent;
  answerKey?: AnswerKeyContent;
  createdAt: Date;
}

export interface WorksheetContent {
  sections: WorksheetSection[];
}

export interface WorksheetSection {
  title: string;
  type: 'word_list' | 'sentences' | 'sound_boxes' | 'syllable_split' | 'fill_blank' | 'matching' | 'sentence_choice' | 'draw_area';
  items: WorksheetItem[];
}

export interface WordAnalysis {
  word: string;
  status: 'decodable' | 'hf' | 'advanced';
}

export interface WorksheetItem {
  id: number;
  prompt: string;
  answer?: string;
  blanks?: string[];
  options?: string[];
  soundBoxes?: SoundBox[];
  syllables?: string[];
  wordAnalysis?: WordAnalysis[];
  decodablePercent?: number;
}

export interface SoundBox {
  sound: string;
  filled: boolean;
}

export interface AnswerKeyContent {
  sections: AnswerKeySection[];
}

export interface AnswerKeySection {
  title: string;
  answers: string[];
}

// Template descriptions for UI
export const WORKSHEET_TEMPLATES: Record<WorksheetTemplate, {
  name: string;
  description: string;
  icon: string;
  suitableFor: string[];
}> = {
  word_list: {
    name: 'Word List Practice',
    description: 'Read and write lists of words with the current pattern',
    icon: '📝',
    suitableFor: ['reading', 'spelling', 'homework'],
  },
  sentence_dictation: {
    name: 'Sentence Dictation',
    description: 'Practice spelling words in sentence context',
    icon: '✍️',
    suitableFor: ['dictation', 'writing', 'homework'],
  },
  sound_mapping: {
    name: 'Sound-Symbol Mapping',
    description: 'Map sounds to letters with tapping boxes',
    icon: '🔤',
    suitableFor: ['phonemic awareness', 'encoding', 'centers'],
  },
  syllable_division: {
    name: 'Syllable Division',
    description: 'Practice dividing multisyllabic words (Step 3+)',
    icon: '➗',
    suitableFor: ['decoding', 'multisyllabic', 'homework'],
  },
  hf_words: {
    name: 'High-Frequency Words',
    description: 'Practice reading and spelling irregular words',
    icon: '⭐',
    suitableFor: ['sight words', 'fluency', 'homework'],
  },
  combined: {
    name: 'Combined Practice',
    description: 'Mixed worksheet with multiple activity types',
    icon: '📚',
    suitableFor: ['review', 'assessment', 'homework'],
  },
  sentence_completion: {
    name: 'Finish the Sentence',
    description: 'Choose the correct word to complete the sentence',
    icon: '✅',
    suitableFor: ['comprehension', 'vocabulary', 'centers'],
  },
  draw_and_write: {
    name: 'Draw & Write',
    description: 'Read a decodable sentence and draw a picture',
    icon: '🎨',
    suitableFor: ['comprehension', 'creativity', 'centers'],
  },
};

// Difficulty settings
export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, {
  wordCount: { min: number; max: number };
  includeBlends: boolean;
  includeDigraphs: boolean;
  sentenceLength: 'short' | 'medium' | 'long';
  nonsenseWordRatio: number;
}> = {
  easy: {
    wordCount: { min: 6, max: 10 },
    includeBlends: false,
    includeDigraphs: true,
    sentenceLength: 'short',
    nonsenseWordRatio: 0.2,
  },
  medium: {
    wordCount: { min: 10, max: 15 },
    includeBlends: true,
    includeDigraphs: true,
    sentenceLength: 'medium',
    nonsenseWordRatio: 0.3,
  },
  hard: {
    wordCount: { min: 15, max: 20 },
    includeBlends: true,
    includeDigraphs: true,
    sentenceLength: 'long',
    nonsenseWordRatio: 0.4,
  },
};

// Sentence frames for dictation practice
export const SENTENCE_FRAMES: string[] = [
  'The ___ is in the ___.',
  'I can see a ___.',
  'We went to the ___.',
  'She has a ___ and a ___.',
  'The ___ ran to the ___.',
  'He put the ___ on the ___.',
  'Can you find the ___?',
  'I like to ___ with my ___.',
  'The big ___ sat on the ___.',
  'Look at the ___ in the ___.',
];
