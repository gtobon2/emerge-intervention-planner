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

// Wilson sound card classification sets
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const DIGRAPHS = new Set(['sh', 'ch', 'th', 'wh', 'ck', 'ph', 'kn', 'wr', 'gn', 'mb', 'ng', 'qu']);
const BLENDS = new Set([
  'bl', 'cl', 'fl', 'gl', 'pl', 'sl', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr',
  'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw', 'tw', 'ct',
  'scr', 'spr', 'str', 'squ', 'thr', 'shr',
]);
const WELDED_SOUNDS = new Set([
  'all', 'am', 'an',
  'ang', 'ing', 'ong', 'ung', 'ank', 'ink', 'onk', 'unk',
]);
const FLOSS = new Set(['ff', 'll', 'ss']);
const VCE_PATTERNS = new Set(['a-e', 'i-e', 'o-e', 'u-e', 'e-e']);
const EXCEPTION_PATTERNS = new Set(['ild', 'ind', 'old', 'ost', 'olt']);
const SUFFIXES = new Set([
  '-s', '-es', '-ed', '-ing', '-ive', '-ve',
  '-able', '-en', '-er', '-est', '-ish', '-or', '-y',
  '-ful', '-less', '-ly', '-ment', '-ness', '-ty',
]);
const CONSONANT_LE = new Set([
  '-ble', '-cle', '-dle', '-fle', '-gle', '-kle', '-ple', '-tle', '-zle', '-stle',
]);

const SOUND_KEYWORDS: Record<string, string> = {
  // Single letters
  a: 'apple', b: 'bat', c: 'cat', d: 'dog', e: 'echo',
  f: 'fish', g: 'gate', h: 'hat', i: 'itch', j: 'jug',
  k: 'kite', l: 'lamp', m: 'map', n: 'net', o: 'octopus',
  p: 'pig', q: 'queen', r: 'rat', s: 'sun', t: 'top',
  u: 'up', v: 'van', w: 'web', x: 'fox', y: 'yak', z: 'zip',
  // Digraphs
  sh: 'ship', ch: 'cherry', th: 'thumb', wh: 'whale', ck: 'duck',
  ph: 'phone', ng: 'ring', qu: 'queen',
  // FLoSS
  ff: 'off', ll: 'bill', ss: 'miss',
  // Welded sounds
  all: 'call', am: 'ham', an: 'fan',
  ang: 'bang', ing: 'king', ong: 'song', ung: 'lung',
  ank: 'bank', ink: 'pink', onk: 'honk', unk: 'junk',
  // Blends
  bl: 'black', cl: 'clap', fl: 'flag', gl: 'glad', pl: 'plan', sl: 'sled',
  br: 'bring', cr: 'crab', dr: 'drop', fr: 'frog', gr: 'grab', pr: 'press', tr: 'trip',
  sc: 'scan', sk: 'skip', sm: 'smog', sn: 'snap', sp: 'spot', st: 'stop', sw: 'swim',
  ct: 'act',
  scr: 'scrap', spr: 'spring', str: 'string', squ: 'squid', thr: 'throb', shr: 'shrimp',
  // Exception patterns
  ild: 'child', ind: 'find', old: 'cold', ost: 'most', olt: 'bolt',
  // VCe patterns
  'a-e': 'cake', 'i-e': 'kite', 'o-e': 'hope', 'u-e': 'cute', 'e-e': 'Pete',
  // Suffixes
  '-s': 'bugs', '-es': 'wishes', '-ed': 'shifted', '-ing': 'running',
  '-ive': 'olive', '-ve': 'twelve',
  '-able': 'comfortable', '-en': 'golden', '-er': 'smaller', '-est': 'biggest',
  '-ish': 'selfish', '-or': 'actor', '-y': 'sunny',
  '-ful': 'helpful', '-less': 'helpless', '-ly': 'suddenly', '-ment': 'moment',
  '-ness': 'sadness', '-ty': 'safety',
  // Consonant-le
  '-ble': 'table', '-cle': 'circle', '-dle': 'middle', '-fle': 'raffle',
  '-gle': 'single', '-kle': 'sparkle', '-ple': 'simple', '-tle': 'little',
  '-zle': 'puzzle', '-stle': 'whistle',
};

// Sounds introduced at each substep (first appearance = isNew)
const NEW_SOUNDS_BY_SUBSTEP: Record<string, string[]> = {
  '1.1': ['a', 'i', 'o', 'f', 'l', 'm', 'n', 'r', 's', 'd', 'g', 'p', 't'],
  '1.2': ['u', 'e', 'b', 'h', 'j', 'c', 'k', 'v', 'w', 'x', 'y', 'z', 'sh', 'ck', 'ch', 'th', 'wh', 'qu'],
  '1.3': [],
  '1.4': ['ff', 'll', 'ss', 'all'],
  '1.5': ['am', 'an'],
  '1.6': ['-s', '-es'],
  '2.1': ['ang', 'ing', 'ong', 'ung', 'ank', 'ink', 'onk', 'unk'],
  '2.2': ['bl', 'cl', 'fl', 'gl', 'pl', 'sl', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw'],
  '2.3': ['ild', 'ind', 'old', 'ost', 'olt'],
  '2.4': [],
  '2.5': ['scr', 'spr', 'str', 'squ', 'thr', 'shr'],
  '3.1': [],
  '3.2': [],
  '3.3': ['ct'],
  '3.4': [],
  '3.5': ['-ed', '-ing'],
  '4.1': ['a-e', 'i-e', 'o-e', 'u-e', 'e-e'],
  '4.2': [],
  '4.3': [],
  '4.4': ['-ive', '-ve'],
  '5.1': ['y'],
  '5.2': [],
  '5.3': [],
  '5.4': [],
  '5.5': [],
  '6.1': ['-able', '-en', '-er', '-est', '-ish', '-or', '-y', '-ful', '-less', '-ly', '-ment', '-ness', '-ty'],
  '6.2': ['-ed'],
  '6.3': [],
  '6.4': ['-ble', '-cle', '-dle', '-fle', '-gle', '-kle', '-ple', '-tle', '-zle', '-stle'],
};

function getSoundType(sound: string): 'vowel' | 'consonant' | 'digraph' | 'blend' {
  if (VOWELS.has(sound)) return 'vowel';
  if (VCE_PATTERNS.has(sound)) return 'vowel';
  if (DIGRAPHS.has(sound)) return 'digraph';
  if (FLOSS.has(sound)) return 'digraph';
  if (WELDED_SOUNDS.has(sound)) return 'digraph';
  if (BLENDS.has(sound)) return 'blend';
  if (EXCEPTION_PATTERNS.has(sound)) return 'blend';
  if (SUFFIXES.has(sound)) return 'consonant';
  if (CONSONANT_LE.has(sound)) return 'consonant';
  return 'consonant';
}

function isSoundNew(sound: string, substep: string): boolean {
  const newSounds = NEW_SOUNDS_BY_SUBSTEP[substep];
  if (!newSounds) return false;
  return newSounds.includes(sound);
}

const VALID_SUBSTEPS = new Set([
  '1.1', '1.2', '1.3', '1.4', '1.5', '1.6',
  '2.1', '2.2', '2.3', '2.4', '2.5',
  '3.1', '3.2', '3.3', '3.4',
  '4.1', '4.2', '4.3', '4.4',
  '5.1', '5.2', '5.3', '5.4',
  '6.1', '6.2', '6.3', '6.4',
]);

export async function loadWilsonData(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const data = wilsonData as RawWilsonData[];
    let count = 0;

    for (const item of data) {
      // Skip substeps not in the official Wilson scope & sequence
      if (!item.substep || !VALID_SUBSTEPS.has(item.substep)) continue;

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
          keyword: SOUND_KEYWORDS[s.sound] || '',
          type: getSoundType(s.sound),
          phoneme: s.phoneme || `/${s.sound}/`,
          isNew: isSoundNew(s.sound, item.substep),
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
