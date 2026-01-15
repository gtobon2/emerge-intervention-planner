/**
 * CaminoALaLectura Prepopulated Lesson Data
 *
 * This file contains all the prepopulated Spanish reading intervention elements
 * organized by unit and lesson, following the Despegando curriculum scope and sequence.
 */

import type {
  CaminoLessonElements,
  CaminoSoundCard,
  CaminoSyllable,
  CaminoWord,
  CaminoHighFrequencyWord,
  CaminoSentence,
  CaminoWordSort,
} from './camino-lesson-elements';
import { generateElementId, getLessonCode } from './camino-lesson-elements';
import { getWordSortsByUnit } from './camino-word-sorts';

// ============================================
// Unit 1: Vowels and Initial Consonants
// Letters: a, e, i, o, u, m, p, l, s, t, d
// ============================================

export const UNIT_1_SOUNDS: CaminoSoundCard[] = [
  // Vowels
  { id: generateElementId(), letter: 'a', sound: '/a/', keyword: 'abeja', type: 'vowel', isNew: true },
  { id: generateElementId(), letter: 'e', sound: '/e/', keyword: 'elefante', type: 'vowel', isNew: true },
  { id: generateElementId(), letter: 'i', sound: '/i/', keyword: 'iguana', type: 'vowel', isNew: true },
  { id: generateElementId(), letter: 'o', sound: '/o/', keyword: 'oso', type: 'vowel', isNew: true },
  { id: generateElementId(), letter: 'u', sound: '/u/', keyword: 'uva', type: 'vowel', isNew: true },
  // Consonants
  { id: generateElementId(), letter: 'm', sound: '/m/', keyword: 'mamá', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 'p', sound: '/p/', keyword: 'papá', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 'l', sound: '/l/', keyword: 'luna', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 's', sound: '/s/', keyword: 'sol', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 't', sound: '/t/', keyword: 'taza', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 'd', sound: '/d/', keyword: 'dedo', type: 'consonant', isNew: true },
];

export const UNIT_1_SYLLABLES: CaminoSyllable[] = [
  // M syllables
  { id: generateElementId(), syllable: 'ma', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'me', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'mi', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'mo', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'mu', structure: 'CV', isOpen: true },
  // P syllables
  { id: generateElementId(), syllable: 'pa', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'pe', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'pi', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'po', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'pu', structure: 'CV', isOpen: true },
  // L syllables
  { id: generateElementId(), syllable: 'la', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'le', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'li', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'lo', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'lu', structure: 'CV', isOpen: true },
  // S syllables
  { id: generateElementId(), syllable: 'sa', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'se', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'si', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'so', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'su', structure: 'CV', isOpen: true },
  // T syllables
  { id: generateElementId(), syllable: 'ta', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'te', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ti', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'to', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'tu', structure: 'CV', isOpen: true },
  // D syllables
  { id: generateElementId(), syllable: 'da', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'de', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'di', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'do', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'du', structure: 'CV', isOpen: true },
  // CVC syllables
  { id: generateElementId(), syllable: 'sol', structure: 'CVC', isOpen: false },
  { id: generateElementId(), syllable: 'sal', structure: 'CVC', isOpen: false },
  { id: generateElementId(), syllable: 'las', structure: 'CVC', isOpen: false },
  { id: generateElementId(), syllable: 'mal', structure: 'CVC', isOpen: false },
  { id: generateElementId(), syllable: 'tal', structure: 'CVC', isOpen: false },
];

export const UNIT_1_WORDS: CaminoWord[] = [
  // 2-syllable words
  { id: generateElementId(), word: 'mamá', syllables: ['ma', 'má'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'papá', syllables: ['pa', 'pá'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'mesa', syllables: ['me', 'sa'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'luna', syllables: ['lu', 'na'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'pato', syllables: ['pa', 'to'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'sapo', syllables: ['sa', 'po'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'sopa', syllables: ['so', 'pa'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'pala', syllables: ['pa', 'la'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'lata', syllables: ['la', 'ta'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'tapa', syllables: ['ta', 'pa'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'mapa', syllables: ['ma', 'pa'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'pelo', syllables: ['pe', 'lo'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'puma', syllables: ['pu', 'ma'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'dedo', syllables: ['de', 'do'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'dato', syllables: ['da', 'to'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'modo', syllables: ['mo', 'do'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: false },
  { id: generateElementId(), word: 'lado', syllables: ['la', 'do'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: false },
  { id: generateElementId(), word: 'todo', syllables: ['to', 'do'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: false },
  // 1-syllable words
  { id: generateElementId(), word: 'sol', syllables: ['sol'], syllableCount: 1, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'sal', syllables: ['sal'], syllableCount: 1, forDecoding: true, forSpelling: true, hasImage: true },
  // 3-syllable words
  { id: generateElementId(), word: 'pelota', syllables: ['pe', 'lo', 'ta'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'paleta', syllables: ['pa', 'le', 'ta'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'maleta', syllables: ['ma', 'le', 'ta'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'tomate', syllables: ['to', 'ma', 'te'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
];

export const UNIT_1_HF_WORDS: CaminoHighFrequencyWord[] = [
  { id: generateElementId(), word: 'el', isNew: true, isDecodable: true },
  { id: generateElementId(), word: 'la', isNew: true, isDecodable: true },
  { id: generateElementId(), word: 'de', isNew: true, isDecodable: true },
  { id: generateElementId(), word: 'es', isNew: true, isDecodable: true },
  { id: generateElementId(), word: 'un', isNew: true, isDecodable: true },
  { id: generateElementId(), word: 'una', isNew: true, isDecodable: true },
  { id: generateElementId(), word: 'en', isNew: true, isDecodable: true },
  { id: generateElementId(), word: 'y', isNew: true, isDecodable: false, teachingTip: 'Irregular spelling - teach as sight word' },
  { id: generateElementId(), word: 'que', isNew: true, isDecodable: false, teachingTip: 'Silent u - teach as sight word' },
  { id: generateElementId(), word: 'se', isNew: true, isDecodable: true },
  { id: generateElementId(), word: 'me', isNew: true, isDecodable: true },
  { id: generateElementId(), word: 'te', isNew: true, isDecodable: true },
];

export const UNIT_1_SENTENCES: CaminoSentence[] = [
  { id: generateElementId(), text: 'Mamá me ama.', forReading: true, forDictation: true, wordCount: 3, decodablePercentage: 100 },
  { id: generateElementId(), text: 'El pato está en el lago.', forReading: true, forDictation: false, wordCount: 6, decodablePercentage: 80 },
  { id: generateElementId(), text: 'La luna sale de noche.', forReading: true, forDictation: false, wordCount: 5, decodablePercentage: 85 },
  { id: generateElementId(), text: 'Mi papá toma sopa.', forReading: true, forDictation: true, wordCount: 4, decodablePercentage: 100 },
  { id: generateElementId(), text: 'El sol está alto.', forReading: true, forDictation: true, wordCount: 4, decodablePercentage: 95 },
  { id: generateElementId(), text: 'La mesa es de palo.', forReading: true, forDictation: true, wordCount: 5, decodablePercentage: 100 },
  { id: generateElementId(), text: 'Mi mamá pela la papa.', forReading: true, forDictation: true, wordCount: 5, decodablePercentage: 100 },
  { id: generateElementId(), text: 'El sapo salta.', forReading: true, forDictation: true, wordCount: 3, decodablePercentage: 100 },
];

// ============================================
// Unit 2: Additional Consonants
// Letters: n, r, c (hard), b, g (hard), f, v, z, j, ñ
// ============================================

export const UNIT_2_SOUNDS: CaminoSoundCard[] = [
  { id: generateElementId(), letter: 'n', sound: '/n/', keyword: 'nube', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 'r', sound: '/r/', keyword: 'rana', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 'c', sound: '/k/', keyword: 'casa', type: 'consonant', isNew: true, notes: 'Hard c (before a, o, u)' },
  { id: generateElementId(), letter: 'b', sound: '/b/', keyword: 'boca', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 'g', sound: '/g/', keyword: 'gato', type: 'consonant', isNew: true, notes: 'Hard g (before a, o, u)' },
  { id: generateElementId(), letter: 'f', sound: '/f/', keyword: 'foca', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 'v', sound: '/b/', keyword: 'vaca', type: 'consonant', isNew: true, notes: 'Same sound as b in Spanish' },
  { id: generateElementId(), letter: 'z', sound: '/s/', keyword: 'zapato', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 'j', sound: '/x/', keyword: 'jugo', type: 'consonant', isNew: true },
  { id: generateElementId(), letter: 'ñ', sound: '/ɲ/', keyword: 'niño', type: 'consonant', isNew: true },
];

export const UNIT_2_SYLLABLES: CaminoSyllable[] = [
  // N syllables
  { id: generateElementId(), syllable: 'na', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ne', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ni', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'no', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'nu', structure: 'CV', isOpen: true },
  // R syllables
  { id: generateElementId(), syllable: 'ra', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 're', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ri', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ro', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ru', structure: 'CV', isOpen: true },
  // C syllables (hard)
  { id: generateElementId(), syllable: 'ca', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'co', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'cu', structure: 'CV', isOpen: true },
  // B syllables
  { id: generateElementId(), syllable: 'ba', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'be', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'bi', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'bo', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'bu', structure: 'CV', isOpen: true },
  // G syllables (hard)
  { id: generateElementId(), syllable: 'ga', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'go', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'gu', structure: 'CV', isOpen: true },
  // F syllables
  { id: generateElementId(), syllable: 'fa', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'fe', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'fi', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'fo', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'fu', structure: 'CV', isOpen: true },
  // V syllables
  { id: generateElementId(), syllable: 'va', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 've', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'vi', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'vo', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'vu', structure: 'CV', isOpen: true },
  // Z syllables
  { id: generateElementId(), syllable: 'za', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ze', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'zi', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'zo', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'zu', structure: 'CV', isOpen: true },
  // J syllables
  { id: generateElementId(), syllable: 'ja', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'je', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ji', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'jo', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ju', structure: 'CV', isOpen: true },
  // Ñ syllables
  { id: generateElementId(), syllable: 'ña', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ñe', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ñi', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ño', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ñu', structure: 'CV', isOpen: true },
];

export const UNIT_2_WORDS: CaminoWord[] = [
  { id: generateElementId(), word: 'nube', syllables: ['nu', 'be'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'rana', syllables: ['ra', 'na'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'casa', syllables: ['ca', 'sa'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'boca', syllables: ['bo', 'ca'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'gato', syllables: ['ga', 'to'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'foca', syllables: ['fo', 'ca'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'vaca', syllables: ['va', 'ca'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'jugo', syllables: ['ju', 'go'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'niño', syllables: ['ni', 'ño'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'niña', syllables: ['ni', 'ña'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'perro', syllables: ['pe', 'rro'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'carro', syllables: ['ca', 'rro'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'torre', syllables: ['to', 'rre'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'burro', syllables: ['bu', 'rro'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'mano', syllables: ['ma', 'no'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'cuna', syllables: ['cu', 'na'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'nota', syllables: ['no', 'ta'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'ropa', syllables: ['ro', 'pa'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'rojo', syllables: ['ro', 'jo'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'copa', syllables: ['co', 'pa'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'bote', syllables: ['bo', 'te'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'lago', syllables: ['la', 'go'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'vida', syllables: ['vi', 'da'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: false },
  { id: generateElementId(), word: 'zapato', syllables: ['za', 'pa', 'to'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'banana', syllables: ['ba', 'na', 'na'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'camino', syllables: ['ca', 'mi', 'no'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
];

export const UNIT_2_SENTENCES: CaminoSentence[] = [
  { id: generateElementId(), text: 'El gato corre rápido.', forReading: true, forDictation: true, wordCount: 4, decodablePercentage: 90 },
  { id: generateElementId(), text: 'La rana salta en el lago.', forReading: true, forDictation: true, wordCount: 6, decodablePercentage: 95 },
  { id: generateElementId(), text: 'Mi casa es bonita.', forReading: true, forDictation: true, wordCount: 4, decodablePercentage: 100 },
  { id: generateElementId(), text: 'El niño juega con su perro.', forReading: true, forDictation: true, wordCount: 6, decodablePercentage: 90 },
  { id: generateElementId(), text: 'La vaca come pasto.', forReading: true, forDictation: true, wordCount: 4, decodablePercentage: 100 },
  { id: generateElementId(), text: 'Bebo jugo de naranja.', forReading: true, forDictation: true, wordCount: 4, decodablePercentage: 95 },
];

// ============================================
// Unit 3: Digraphs and Blends
// Letters: ch, ll, rr, qu, h, bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, tr
// ============================================

export const UNIT_3_SOUNDS: CaminoSoundCard[] = [
  { id: generateElementId(), letter: 'ch', sound: '/tʃ/', keyword: 'leche', type: 'digraph', isNew: true },
  { id: generateElementId(), letter: 'll', sound: '/ʎ/', keyword: 'pollo', type: 'digraph', isNew: true },
  { id: generateElementId(), letter: 'rr', sound: '/r/', keyword: 'perro', type: 'digraph', isNew: true, notes: 'Rolled r' },
  { id: generateElementId(), letter: 'qu', sound: '/k/', keyword: 'queso', type: 'digraph', isNew: true, notes: 'Before e, i' },
  { id: generateElementId(), letter: 'h', sound: 'silent', keyword: 'huevo', type: 'consonant', isNew: true, notes: 'Silent in Spanish' },
  { id: generateElementId(), letter: 'bl', sound: '/bl/', keyword: 'blanco', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'br', sound: '/br/', keyword: 'brazo', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'cl', sound: '/kl/', keyword: 'clase', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'cr', sound: '/kr/', keyword: 'crema', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'dr', sound: '/dr/', keyword: 'dragón', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'fl', sound: '/fl/', keyword: 'flor', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'fr', sound: '/fr/', keyword: 'fresa', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'gl', sound: '/gl/', keyword: 'globo', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'gr', sound: '/gr/', keyword: 'grande', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'pl', sound: '/pl/', keyword: 'plato', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'pr', sound: '/pr/', keyword: 'primo', type: 'blend', isNew: true },
  { id: generateElementId(), letter: 'tr', sound: '/tr/', keyword: 'tren', type: 'blend', isNew: true },
];

export const UNIT_3_SYLLABLES: CaminoSyllable[] = [
  // CH syllables
  { id: generateElementId(), syllable: 'cha', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'che', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'chi', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'cho', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'chu', structure: 'CV', isOpen: true },
  // LL syllables
  { id: generateElementId(), syllable: 'lla', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'lle', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'lli', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'llo', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'llu', structure: 'CV', isOpen: true },
  // QU syllables
  { id: generateElementId(), syllable: 'que', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'qui', structure: 'CV', isOpen: true },
  // Blend syllables
  { id: generateElementId(), syllable: 'bla', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'ble', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'bli', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'blo', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'blu', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'bra', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'bre', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'bri', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'bro', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'bru', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'cla', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'cle', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'cli', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'clo', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'clu', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'cra', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'cre', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'cri', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'cro', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'cru', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'fla', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'fle', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'fli', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'flo', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'flu', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'fra', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'fre', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'fri', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'fro', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'fru', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'gla', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'gle', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'glo', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'glu', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'gra', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'gre', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'gri', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'gro', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'gru', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'pla', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'ple', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'pli', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'plo', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'plu', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'pra', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'pre', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'pri', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'pro', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'pru', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'tra', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'tre', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'tri', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'tro', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'tru', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'dra', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'dre', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'dri', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'dro', structure: 'CCV', isOpen: true },
  { id: generateElementId(), syllable: 'dru', structure: 'CCV', isOpen: true },
];

export const UNIT_3_WORDS: CaminoWord[] = [
  { id: generateElementId(), word: 'leche', syllables: ['le', 'che'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'pollo', syllables: ['po', 'llo'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'queso', syllables: ['que', 'so'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'huevo', syllables: ['hue', 'vo'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'flor', syllables: ['flor'], syllableCount: 1, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'fresa', syllables: ['fre', 'sa'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'globo', syllables: ['glo', 'bo'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'tren', syllables: ['tren'], syllableCount: 1, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'blanco', syllables: ['blan', 'co'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'brazo', syllables: ['bra', 'zo'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'clase', syllables: ['cla', 'se'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'crema', syllables: ['cre', 'ma'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'grande', syllables: ['gran', 'de'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'plato', syllables: ['pla', 'to'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'primo', syllables: ['pri', 'mo'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'estrella', syllables: ['es', 'tre', 'lla'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'chancho', syllables: ['chan', 'cho'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'cuchara', syllables: ['cu', 'cha', 'ra'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'silla', syllables: ['si', 'lla'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'calle', syllables: ['ca', 'lle'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'dragón', syllables: ['dra', 'gón'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
];

export const UNIT_3_SENTENCES: CaminoSentence[] = [
  { id: generateElementId(), text: 'El tren pasa rápido.', forReading: true, forDictation: true, wordCount: 4, decodablePercentage: 100 },
  { id: generateElementId(), text: 'Me gusta el queso fresco.', forReading: true, forDictation: true, wordCount: 5, decodablePercentage: 95 },
  { id: generateElementId(), text: 'La flor es muy bonita.', forReading: true, forDictation: true, wordCount: 5, decodablePercentage: 95 },
  { id: generateElementId(), text: 'Mi primo tiene un globo grande.', forReading: true, forDictation: true, wordCount: 6, decodablePercentage: 90 },
  { id: generateElementId(), text: 'El pollo está en la granja.', forReading: true, forDictation: true, wordCount: 6, decodablePercentage: 95 },
];

// ============================================
// Unit 4: Complex Syllables
// gue, gui, güe, güi, ce, ci, ge, gi
// ============================================

export const UNIT_4_SOUNDS: CaminoSoundCard[] = [
  { id: generateElementId(), letter: 'gue', sound: '/ge/', keyword: 'juguete', type: 'digraph', isNew: true, notes: 'Silent u' },
  { id: generateElementId(), letter: 'gui', sound: '/gi/', keyword: 'guitarra', type: 'digraph', isNew: true, notes: 'Silent u' },
  { id: generateElementId(), letter: 'güe', sound: '/gwe/', keyword: 'pingüino', type: 'diphthong', isNew: true, notes: 'U is pronounced' },
  { id: generateElementId(), letter: 'güi', sound: '/gwi/', keyword: 'lingüística', type: 'diphthong', isNew: true, notes: 'U is pronounced' },
  { id: generateElementId(), letter: 'ce', sound: '/se/', keyword: 'cena', type: 'consonant', isNew: true, notes: 'Soft c' },
  { id: generateElementId(), letter: 'ci', sound: '/si/', keyword: 'cine', type: 'consonant', isNew: true, notes: 'Soft c' },
  { id: generateElementId(), letter: 'ge', sound: '/xe/', keyword: 'gente', type: 'consonant', isNew: true, notes: 'Soft g' },
  { id: generateElementId(), letter: 'gi', sound: '/xi/', keyword: 'girasol', type: 'consonant', isNew: true, notes: 'Soft g' },
];

export const UNIT_4_SYLLABLES: CaminoSyllable[] = [
  { id: generateElementId(), syllable: 'gue', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'gui', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'güe', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'güi', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ce', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ci', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'ge', structure: 'CV', isOpen: true },
  { id: generateElementId(), syllable: 'gi', structure: 'CV', isOpen: true },
];

export const UNIT_4_WORDS: CaminoWord[] = [
  { id: generateElementId(), word: 'juguete', syllables: ['ju', 'gue', 'te'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'guitarra', syllables: ['gui', 'ta', 'rra'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'pingüino', syllables: ['pin', 'güi', 'no'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'cena', syllables: ['ce', 'na'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'cielo', syllables: ['cie', 'lo'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'cine', syllables: ['ci', 'ne'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'gente', syllables: ['gen', 'te'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'girasol', syllables: ['gi', 'ra', 'sol'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'parque', syllables: ['par', 'que'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'tanque', syllables: ['tan', 'que'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'agua', syllables: ['a', 'gua'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'ciudad', syllables: ['ciu', 'dad'], syllableCount: 2, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'cigüeña', syllables: ['ci', 'güe', 'ña'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
];

export const UNIT_4_SENTENCES: CaminoSentence[] = [
  { id: generateElementId(), text: 'El cielo está muy bonito.', forReading: true, forDictation: true, wordCount: 5, decodablePercentage: 95 },
  { id: generateElementId(), text: 'Mi juguete es un carro.', forReading: true, forDictation: true, wordCount: 5, decodablePercentage: 100 },
  { id: generateElementId(), text: 'La guitarra suena bien.', forReading: true, forDictation: true, wordCount: 4, decodablePercentage: 95 },
  { id: generateElementId(), text: 'Voy al parque con mi mamá.', forReading: true, forDictation: true, wordCount: 6, decodablePercentage: 95 },
  { id: generateElementId(), text: 'El pingüino vive en el frío.', forReading: true, forDictation: true, wordCount: 6, decodablePercentage: 90 },
];

// ============================================
// Unit 5: Multisyllabic Words
// ============================================

export const UNIT_5_WORDS: CaminoWord[] = [
  { id: generateElementId(), word: 'mariposa', syllables: ['ma', 'ri', 'po', 'sa'], syllableCount: 4, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'elefante', syllables: ['e', 'le', 'fan', 'te'], syllableCount: 4, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'biblioteca', syllables: ['bi', 'blio', 'te', 'ca'], syllableCount: 4, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'computadora', syllables: ['com', 'pu', 'ta', 'do', 'ra'], syllableCount: 5, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'hipopótamo', syllables: ['hi', 'po', 'pó', 'ta', 'mo'], syllableCount: 5, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'chocolate', syllables: ['cho', 'co', 'la', 'te'], syllableCount: 4, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'dinosaurio', syllables: ['di', 'no', 'sau', 'rio'], syllableCount: 4, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'calendario', syllables: ['ca', 'len', 'da', 'rio'], syllableCount: 4, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'semáforo', syllables: ['se', 'má', 'fo', 'ro'], syllableCount: 4, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'supermercado', syllables: ['su', 'per', 'mer', 'ca', 'do'], syllableCount: 5, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'refrigerador', syllables: ['re', 'fri', 'ge', 'ra', 'dor'], syllableCount: 5, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'restaurante', syllables: ['res', 'tau', 'ran', 'te'], syllableCount: 4, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'televisión', syllables: ['te', 'le', 'vi', 'sión'], syllableCount: 4, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'ambulancia', syllables: ['am', 'bu', 'lan', 'cia'], syllableCount: 4, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'helicóptero', syllables: ['he', 'li', 'cóp', 'te', 'ro'], syllableCount: 5, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'semilla', syllables: ['se', 'mi', 'lla'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'cocina', syllables: ['co', 'ci', 'na'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'canela', syllables: ['ca', 'ne', 'la'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'perico', syllables: ['pe', 'ri', 'co'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
  { id: generateElementId(), word: 'corona', syllables: ['co', 'ro', 'na'], syllableCount: 3, forDecoding: true, forSpelling: true, hasImage: true },
];

export const UNIT_5_SENTENCES: CaminoSentence[] = [
  { id: generateElementId(), text: 'La mariposa vuela sobre las flores.', forReading: true, forDictation: true, wordCount: 6, decodablePercentage: 90 },
  { id: generateElementId(), text: 'El elefante es muy grande.', forReading: true, forDictation: true, wordCount: 5, decodablePercentage: 95 },
  { id: generateElementId(), text: 'Vamos a la biblioteca a leer.', forReading: true, forDictation: true, wordCount: 6, decodablePercentage: 90 },
  { id: generateElementId(), text: 'Me gusta el chocolate caliente.', forReading: true, forDictation: true, wordCount: 5, decodablePercentage: 95 },
  { id: generateElementId(), text: 'El dinosaurio vivió hace mucho tiempo.', forReading: true, forDictation: true, wordCount: 6, decodablePercentage: 85 },
];

// ============================================
// Helper to get all elements by unit
// ============================================

export function getElementsByUnit(unit: number): {
  sounds: CaminoSoundCard[];
  syllables: CaminoSyllable[];
  words: CaminoWord[];
  hfWords: CaminoHighFrequencyWord[];
  sentences: CaminoSentence[];
  wordSorts: CaminoWordSort[];
} {
  const wordSorts = getWordSortsByUnit(unit);

  switch (unit) {
    case 1:
      return {
        sounds: UNIT_1_SOUNDS,
        syllables: UNIT_1_SYLLABLES,
        words: UNIT_1_WORDS,
        hfWords: UNIT_1_HF_WORDS,
        sentences: UNIT_1_SENTENCES,
        wordSorts,
      };
    case 2:
      return {
        sounds: [...UNIT_1_SOUNDS, ...UNIT_2_SOUNDS], // Cumulative
        syllables: [...UNIT_1_SYLLABLES, ...UNIT_2_SYLLABLES],
        words: UNIT_2_WORDS,
        hfWords: UNIT_1_HF_WORDS,
        sentences: UNIT_2_SENTENCES,
        wordSorts,
      };
    case 3:
      return {
        sounds: [...UNIT_1_SOUNDS, ...UNIT_2_SOUNDS, ...UNIT_3_SOUNDS],
        syllables: [...UNIT_1_SYLLABLES, ...UNIT_2_SYLLABLES, ...UNIT_3_SYLLABLES],
        words: UNIT_3_WORDS,
        hfWords: UNIT_1_HF_WORDS,
        sentences: UNIT_3_SENTENCES,
        wordSorts,
      };
    case 4:
      return {
        sounds: [...UNIT_1_SOUNDS, ...UNIT_2_SOUNDS, ...UNIT_3_SOUNDS, ...UNIT_4_SOUNDS],
        syllables: [...UNIT_1_SYLLABLES, ...UNIT_2_SYLLABLES, ...UNIT_3_SYLLABLES, ...UNIT_4_SYLLABLES],
        words: UNIT_4_WORDS,
        hfWords: UNIT_1_HF_WORDS,
        sentences: UNIT_4_SENTENCES,
        wordSorts,
      };
    case 5:
      return {
        sounds: [...UNIT_1_SOUNDS, ...UNIT_2_SOUNDS, ...UNIT_3_SOUNDS, ...UNIT_4_SOUNDS],
        syllables: [...UNIT_1_SYLLABLES, ...UNIT_2_SYLLABLES, ...UNIT_3_SYLLABLES, ...UNIT_4_SYLLABLES],
        words: UNIT_5_WORDS,
        hfWords: UNIT_1_HF_WORDS,
        sentences: UNIT_5_SENTENCES,
        wordSorts,
      };
    default:
      return {
        sounds: [],
        syllables: [],
        words: [],
        hfWords: [],
        sentences: [],
        wordSorts: [],
      };
  }
}

// Export all for direct access
export const ALL_CAMINO_DATA = {
  unit1: {
    sounds: UNIT_1_SOUNDS,
    syllables: UNIT_1_SYLLABLES,
    words: UNIT_1_WORDS,
    hfWords: UNIT_1_HF_WORDS,
    sentences: UNIT_1_SENTENCES,
  },
  unit2: {
    sounds: UNIT_2_SOUNDS,
    syllables: UNIT_2_SYLLABLES,
    words: UNIT_2_WORDS,
    sentences: UNIT_2_SENTENCES,
  },
  unit3: {
    sounds: UNIT_3_SOUNDS,
    syllables: UNIT_3_SYLLABLES,
    words: UNIT_3_WORDS,
    sentences: UNIT_3_SENTENCES,
  },
  unit4: {
    sounds: UNIT_4_SOUNDS,
    syllables: UNIT_4_SYLLABLES,
    words: UNIT_4_WORDS,
    sentences: UNIT_4_SENTENCES,
  },
  unit5: {
    words: UNIT_5_WORDS,
    sentences: UNIT_5_SENTENCES,
  },
};
