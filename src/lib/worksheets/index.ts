/**
 * Worksheet Generator Module
 *
 * Exports all worksheet generation utilities for Wilson and Despegando.
 */

// Wilson (English) worksheets
export * from './types';
export * from './generators';
export * from './word-utils';
export * from './pdf-export';

// Despegando (Spanish) worksheets
// Note: spanish-word-utils has its own shuffleArray and getRandomItems
// Import explicitly to avoid conflicts with word-utils
export {
  SPANISH_DIGRAPHS,
  SPANISH_VOWELS,
  WEAK_VOWELS,
  STRONG_VOWELS,
  L_BLENDS,
  R_BLENDS,
  CONSONANT_BLENDS,
  isSpanishVowel,
  startsWithDigraph,
  startsWithBlend,
  segmentSpanishWord,
  divideSpanishSyllables,
  createSpanishSoundBoxes,
  getSpanishSyllablePattern,
  generateCVSyllables,
  generateCCVSyllables,
  createBlankedSpanishWord,
  isWordDecodable,
  countSpanishSyllables,
  formatSyllables,
  type SpanishSoundBox,
} from './spanish-word-utils';

export * from './despegando-generators';
