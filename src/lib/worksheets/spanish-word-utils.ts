/**
 * Spanish Word Utilities
 *
 * Functions for segmenting, dividing, and manipulating Spanish words
 * for worksheet generation and phonics instruction.
 */

import { DESPEGANDO_PHASES } from '@/lib/curriculum/despegando';

// Spanish digraphs (treated as single units)
export const SPANISH_DIGRAPHS = ['ch', 'll', 'rr', 'qu', 'gu', 'gü'];

// Spanish vowels
export const SPANISH_VOWELS = ['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú', 'ü'];

// Weak vowels (can form diphthongs)
export const WEAK_VOWELS = ['i', 'u', 'í', 'ú'];

// Strong vowels
export const STRONG_VOWELS = ['a', 'e', 'o', 'á', 'é', 'ó'];

// L-blends
export const L_BLENDS = ['bl', 'cl', 'fl', 'gl', 'pl'];

// R-blends
export const R_BLENDS = ['br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr'];

// All consonant blends
export const CONSONANT_BLENDS = [...L_BLENDS, ...R_BLENDS];

/**
 * Check if a character is a Spanish vowel
 */
export function isSpanishVowel(char: string): boolean {
  return SPANISH_VOWELS.includes(char.toLowerCase());
}

/**
 * Check if a string starts with a digraph
 */
export function startsWithDigraph(str: string): string | null {
  const lower = str.toLowerCase();
  for (const digraph of SPANISH_DIGRAPHS) {
    if (lower.startsWith(digraph)) {
      return digraph;
    }
  }
  return null;
}

/**
 * Check if a string starts with a consonant blend
 */
export function startsWithBlend(str: string): string | null {
  const lower = str.toLowerCase();
  for (const blend of CONSONANT_BLENDS) {
    if (lower.startsWith(blend)) {
      return blend;
    }
  }
  return null;
}

/**
 * Segment a Spanish word into individual sounds/phonemes
 * Treats digraphs as single units
 *
 * Example: 'chico' -> ['ch', 'i', 'c', 'o']
 * Example: 'perro' -> ['p', 'e', 'rr', 'o']
 */
export function segmentSpanishWord(word: string): string[] {
  const sounds: string[] = [];
  let i = 0;
  const lower = word.toLowerCase();

  while (i < lower.length) {
    // Check for digraphs first (2 chars)
    if (i < lower.length - 1) {
      const twoChar = lower.slice(i, i + 2);
      if (SPANISH_DIGRAPHS.includes(twoChar)) {
        sounds.push(twoChar);
        i += 2;
        continue;
      }
    }

    // Single character
    sounds.push(lower[i]);
    i++;
  }

  return sounds;
}

/**
 * Divide a Spanish word into syllables
 * Uses Spanish syllabification rules
 *
 * Rules:
 * 1. Every syllable must have a vowel
 * 2. Consonant clusters split between syllables (except blends)
 * 3. Single consonant between vowels goes with second syllable
 * 4. Digraphs stay together
 * 5. Blends stay together
 */
export function divideSpanishSyllables(word: string): string[] {
  const lower = word.toLowerCase();
  const syllables: string[] = [];
  let current = '';

  let i = 0;
  while (i < lower.length) {
    // Check for digraph
    const digraph = startsWithDigraph(lower.slice(i));
    if (digraph) {
      current += digraph;
      i += digraph.length;
      continue;
    }

    const char = lower[i];

    if (isSpanishVowel(char)) {
      current += char;

      // Check if next char is a weak vowel forming diphthong
      if (i + 1 < lower.length) {
        const next = lower[i + 1];
        // Diphthong: strong + weak or weak + strong
        if (WEAK_VOWELS.includes(char) && STRONG_VOWELS.includes(next)) {
          // Weak before strong - continues current syllable
        } else if (STRONG_VOWELS.includes(char) && WEAK_VOWELS.includes(next)) {
          // Strong before weak - diphthong, add weak to current
          current += next;
          i++;
        }
      }

      // After vowel(s), check what's next
      if (i + 1 < lower.length) {
        const remaining = lower.slice(i + 1);
        const nextDigraph = startsWithDigraph(remaining);
        const nextBlend = startsWithBlend(remaining);

        // Count upcoming consonants
        let consonantCount = 0;
        let j = 0;
        while (j < remaining.length && !isSpanishVowel(remaining[j])) {
          if (startsWithDigraph(remaining.slice(j))) {
            consonantCount++;
            j += 2;
          } else {
            consonantCount++;
            j++;
          }
        }

        if (consonantCount === 0) {
          // No consonants, syllable ends
          syllables.push(current);
          current = '';
        } else if (consonantCount === 1 || nextDigraph) {
          // Single consonant or digraph goes to next syllable
          syllables.push(current);
          current = '';
        } else if (nextBlend) {
          // Blend goes to next syllable
          syllables.push(current);
          current = '';
        } else if (consonantCount >= 2) {
          // Multiple consonants - check for blend
          const possibleBlend = remaining.slice(0, 2);
          if (CONSONANT_BLENDS.includes(possibleBlend)) {
            // Blend, split before it
            syllables.push(current);
            current = '';
          } else {
            // Not a blend, first consonant stays with current syllable
            if (nextDigraph) {
              syllables.push(current);
              current = '';
            } else {
              current += remaining[0];
              syllables.push(current);
              current = '';
              i++;
            }
          }
        }
      } else {
        // End of word
        syllables.push(current);
        current = '';
      }
    } else {
      // Consonant
      current += char;
    }

    i++;
  }

  // Add remaining
  if (current) {
    if (syllables.length > 0) {
      // Append to last syllable if no vowel
      const hasVowel = [...current].some(c => isSpanishVowel(c));
      if (!hasVowel) {
        syllables[syllables.length - 1] += current;
      } else {
        syllables.push(current);
      }
    } else {
      syllables.push(current);
    }
  }

  return syllables;
}

/**
 * Create Elkonin (sound) boxes for a Spanish word
 * Each box represents one phoneme/sound
 */
export interface SpanishSoundBox {
  sound: string;
  filled: boolean;
}

export function createSpanishSoundBoxes(word: string, fillSome: boolean = false): SpanishSoundBox[] {
  const sounds = segmentSpanishWord(word);
  return sounds.map((sound, index) => ({
    sound,
    filled: fillSome ? index % 2 === 0 : false
  }));
}

/**
 * Get the syllable pattern for a word (CV, CVC, CVCV, etc.)
 */
export function getSpanishSyllablePattern(word: string): string {
  const lower = word.toLowerCase();
  let pattern = '';
  let i = 0;

  while (i < lower.length) {
    // Check for digraph
    const digraph = startsWithDigraph(lower.slice(i));
    if (digraph) {
      pattern += 'C';
      i += digraph.length;
      continue;
    }

    if (isSpanishVowel(lower[i])) {
      pattern += 'V';
    } else {
      pattern += 'C';
    }
    i++;
  }

  return pattern;
}

/**
 * Generate CV syllables for a given consonant
 * Example: 'm' -> ['ma', 'me', 'mi', 'mo', 'mu']
 */
export function generateCVSyllables(consonant: string): string[] {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  return vowels.map(v => consonant.toLowerCase() + v);
}

/**
 * Generate CCV syllables for a given blend
 * Example: 'bl' -> ['bla', 'ble', 'bli', 'blo', 'blu']
 */
export function generateCCVSyllables(blend: string): string[] {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  return vowels.map(v => blend.toLowerCase() + v);
}

/**
 * Create a blanked version of a word for fill-in exercises
 */
export function createBlankedSpanishWord(
  word: string,
  blankType: 'vowels' | 'initial' | 'final' | 'random' | 'syllable'
): { display: string; answer: string } {
  const lower = word.toLowerCase();

  switch (blankType) {
    case 'vowels':
      // Blank all vowels
      return {
        display: [...lower].map(c => isSpanishVowel(c) ? '_' : c).join(''),
        answer: word
      };

    case 'initial':
      // Blank first sound (could be digraph)
      const digraph = startsWithDigraph(lower);
      if (digraph) {
        return {
          display: '__' + lower.slice(digraph.length),
          answer: word
        };
      }
      return {
        display: '_' + lower.slice(1),
        answer: word
      };

    case 'final':
      // Blank last character
      return {
        display: lower.slice(0, -1) + '_',
        answer: word
      };

    case 'random':
      // Blank a random position
      const pos = Math.floor(Math.random() * lower.length);
      return {
        display: lower.slice(0, pos) + '_' + lower.slice(pos + 1),
        answer: word
      };

    case 'syllable':
      // Blank one syllable
      const syllables = divideSpanishSyllables(lower);
      if (syllables.length > 1) {
        const blankIdx = Math.floor(Math.random() * syllables.length);
        const blankedSyllables = syllables.map((s, i) =>
          i === blankIdx ? '_'.repeat(s.length) : s
        );
        return {
          display: blankedSyllables.join('-'),
          answer: syllables.join('-')
        };
      }
      return { display: '_'.repeat(lower.length), answer: word };

    default:
      return { display: word, answer: word };
  }
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
 * Get random items from array
 */
export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Check if a word is decodable given a set of known letters/patterns
 */
export function isWordDecodable(word: string, knownPatterns: string[]): boolean {
  const sounds = segmentSpanishWord(word);
  const knownSet = new Set(knownPatterns.map(p => p.toLowerCase()));

  // Check vowels (always needed)
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  vowels.forEach(v => knownSet.add(v));

  return sounds.every(sound => knownSet.has(sound));
}

/**
 * Count syllables in a Spanish word
 */
export function countSpanishSyllables(word: string): number {
  return divideSpanishSyllables(word).length;
}

/**
 * Format syllables with hyphen separation
 * Example: 'mamá' -> 'ma-má'
 */
export function formatSyllables(word: string): string {
  return divideSpanishSyllables(word).join('-');
}

/**
 * Get cumulative decodable words for Spanish (Despegando)
 * Returns all words from lesson 1 up to and including the target lesson
 */
export function getCumulativeSpanishWords(targetLesson: number): string[] {
  const allWords: string[] = [];

  for (const phase of DESPEGANDO_PHASES) {
    for (const lesson of phase.lessons) {
      allWords.push(...lesson.sampleWords);
      if (lesson.lesson === targetLesson) {
        return allWords;
      }
    }
  }

  return allWords;
}
