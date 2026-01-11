/**
 * Word Utilities for Wilson Worksheet Generation
 *
 * Utilities for manipulating words, creating sound boxes, and syllable division.
 */

import { WILSON_STEPS, getWilsonSubstep, type WilsonSubstep } from '@/lib/curriculum/wilson';

// Common digraphs that count as single sounds
const DIGRAPHS = ['sh', 'ch', 'th', 'wh', 'ck', 'ng', 'nk', 'qu'];

// Welded sounds that stay together
const WELDED_SOUNDS = [
  'all', 'am', 'an',
  'ang', 'ing', 'ong', 'ung',
  'ank', 'ink', 'onk', 'unk',
];

// Consonant blends
const INITIAL_BLENDS = [
  'bl', 'cl', 'fl', 'gl', 'pl', 'sl',
  'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr',
  'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw',
  'scr', 'spl', 'spr', 'str', 'thr', 'shr',
];

const FINAL_BLENDS = [
  'ft', 'lt', 'mp', 'nd', 'nt', 'pt',
  'sk', 'sp', 'st', 'ct',
];

/**
 * Break a word into its phoneme units for sound boxes
 */
export function segmentWordToSounds(word: string): string[] {
  const sounds: string[] = [];
  let i = 0;
  const lowerWord = word.toLowerCase();

  while (i < lowerWord.length) {
    // Check for welded sounds (3 letters)
    if (i <= lowerWord.length - 3) {
      const three = lowerWord.slice(i, i + 3);
      if (WELDED_SOUNDS.includes(three)) {
        sounds.push(three);
        i += 3;
        continue;
      }
    }

    // Check for digraphs (2 letters)
    if (i <= lowerWord.length - 2) {
      const two = lowerWord.slice(i, i + 2);
      if (DIGRAPHS.includes(two)) {
        sounds.push(two);
        i += 2;
        continue;
      }
    }

    // Single letter
    sounds.push(lowerWord[i]);
    i++;
  }

  return sounds;
}

/**
 * Count the number of sounds in a word
 */
export function countSounds(word: string): number {
  return segmentWordToSounds(word).length;
}

/**
 * Divide a word into syllables (basic VCCV pattern)
 */
export function divideSyllables(word: string): string[] {
  const vowels = 'aeiou';
  const lowerWord = word.toLowerCase();
  const syllables: string[] = [];

  // Simple approach: find vowel-consonant-consonant-vowel patterns
  let currentSyllable = '';
  let i = 0;

  while (i < lowerWord.length) {
    currentSyllable += lowerWord[i];

    // Check for VCCV pattern
    if (i < lowerWord.length - 3) {
      const isVowel1 = vowels.includes(lowerWord[i]);
      const isCons1 = !vowels.includes(lowerWord[i + 1]);
      const isCons2 = !vowels.includes(lowerWord[i + 2]);
      const isVowel2 = vowels.includes(lowerWord[i + 3]);

      if (isVowel1 && isCons1 && isCons2 && isVowel2) {
        // Check if the two consonants are a blend to keep together
        const twoConsonants = lowerWord.slice(i + 1, i + 3);
        const isBlend = [...INITIAL_BLENDS, ...FINAL_BLENDS].includes(twoConsonants);

        if (!isBlend && !DIGRAPHS.includes(twoConsonants)) {
          // Divide between the consonants
          currentSyllable += lowerWord[i + 1];
          syllables.push(currentSyllable);
          currentSyllable = '';
          i += 2;
          continue;
        }
      }
    }

    i++;
  }

  if (currentSyllable) {
    syllables.push(currentSyllable);
  }

  // If we couldn't divide, return the whole word
  return syllables.length > 0 ? syllables : [word];
}

/**
 * Create sound boxes for a word
 */
export function createSoundBoxes(word: string, fillSome: boolean = false): Array<{ sound: string; filled: boolean }> {
  const sounds = segmentWordToSounds(word);
  return sounds.map((sound, index) => ({
    sound,
    filled: fillSome ? index % 2 === 0 : false,
  }));
}

/**
 * Generate a sentence using target words
 */
export function generateSentence(targetWords: string[], template: string): { sentence: string; blanks: string[] } {
  const blanks: string[] = [];
  let sentence = template;
  let wordIndex = 0;

  while (sentence.includes('___') && wordIndex < targetWords.length) {
    const word = targetWords[wordIndex];
    blanks.push(word);
    sentence = sentence.replace('___', word);
    wordIndex++;
  }

  // Replace remaining blanks with generic words
  while (sentence.includes('___')) {
    sentence = sentence.replace('___', 'thing');
  }

  return { sentence, blanks };
}

/**
 * Shuffle an array (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get random items from an array
 */
export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get words from a substep, mixing real and nonsense words
 */
export function getWordsForSubstep(
  substepKey: string,
  count: number,
  includeNonsense: boolean = true,
  nonsenseRatio: number = 0.3
): { realWords: string[]; nonsenseWords: string[] } {
  const substep = getWilsonSubstep(substepKey);
  if (!substep) {
    return { realWords: [], nonsenseWords: [] };
  }

  const realWordCount = includeNonsense
    ? Math.ceil(count * (1 - nonsenseRatio))
    : count;
  const nonsenseCount = includeNonsense
    ? count - realWordCount
    : 0;

  return {
    realWords: getRandomItems(substep.sample_words, realWordCount),
    nonsenseWords: substep.nonsense_words
      ? getRandomItems(substep.nonsense_words, nonsenseCount)
      : [],
  };
}

/**
 * Get cumulative words from all substeps up to and including the target
 */
export function getCumulativeWords(targetSubstep: string): string[] {
  const allWords: string[] = [];

  for (const step of WILSON_STEPS) {
    for (const substep of step.substeps) {
      allWords.push(...substep.sample_words);
      if (substep.substep === targetSubstep) {
        return allWords;
      }
    }
  }

  return allWords;
}

/**
 * Check if a word fits the pattern for a substep
 */
export function wordFitsSubstep(word: string, substepKey: string): boolean {
  const substep = getWilsonSubstep(substepKey);
  if (!substep) return false;

  // Check if word is in sample_words or nonsense_words
  const inSample = substep.sample_words.includes(word.toLowerCase());
  const inNonsense = substep.nonsense_words?.includes(word.toLowerCase()) ?? false;

  return inSample || inNonsense;
}

/**
 * Mark vowels in a word for visual emphasis
 */
export function markVowels(word: string): string {
  const vowels = 'aeiouAEIOU';
  return word.split('').map(char =>
    vowels.includes(char) ? `[${char}]` : char
  ).join('');
}

/**
 * Create a word with blanks for fill-in-the-blank exercises
 */
export function createBlankedWord(word: string, blankType: 'vowels' | 'initial' | 'final' | 'random'): { display: string; answer: string } {
  const lowerWord = word.toLowerCase();

  switch (blankType) {
    case 'vowels': {
      const vowels = 'aeiou';
      const display = lowerWord.split('').map(char =>
        vowels.includes(char) ? '_' : char
      ).join('');
      return { display, answer: word };
    }
    case 'initial': {
      return { display: '_' + lowerWord.slice(1), answer: word };
    }
    case 'final': {
      return { display: lowerWord.slice(0, -1) + '_', answer: word };
    }
    case 'random': {
      const index = Math.floor(Math.random() * lowerWord.length);
      const display = lowerWord.slice(0, index) + '_' + lowerWord.slice(index + 1);
      return { display, answer: word };
    }
    default:
      return { display: word, answer: word };
  }
}
