// EMERGE Intervention Planner - Error Bank Seed Data
// Pre-populated based on NCII, Wilson Language Training, IES Practice Guides, and Spanish literacy research

import type { Curriculum, CurriculumPosition } from '@/lib/supabase/types';

export interface ErrorBankSeedEntry {
  curriculum: Curriculum;
  position: CurriculumPosition | null;
  error_pattern: string;
  underlying_gap: string;
  correction_protocol: string;
  correction_prompts: string[];
  visual_cues: string | null;
  kinesthetic_cues: string | null;
}

// Wilson Reading System Errors
export const WILSON_ERRORS: ErrorBankSeedEntry[] = [
  // Step 1: Closed Syllables & Foundational Skills
  {
    curriculum: 'wilson',
    position: { step: 1, substep: '1.1' },
    error_pattern: 'Reverses b and d',
    underlying_gap: 'Visual discrimination difficulty with mirror-image letters',
    correction_protocol: 'Use "bed" trick: make fists with thumbs up - left hand is b, right hand is d, together they make a bed.',
    correction_prompts: ['Make your hands into a bed. Which side is b?', 'B has its belly in front. D has its diaper in back.'],
    visual_cues: 'Bed hand trick, directional arrows on letter cards',
    kinesthetic_cues: 'Trace letter in sand/salt while saying sound'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: '1.1' },
    error_pattern: 'Does not tap sounds correctly (skips sounds or taps extra)',
    underlying_gap: 'Phonemic awareness gap - cannot segment words into individual phonemes',
    correction_protocol: 'Model tapping slowly. Use Elkonin boxes for visual support.',
    correction_prompts: ['Watch my fingers. One tap for each sound.', 'How many sounds do you hear in this word?'],
    visual_cues: 'Elkonin boxes, sound-by-sound finger tapping visual',
    kinesthetic_cues: 'Thumb to each finger for each phoneme'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: '1.2' },
    error_pattern: 'Confuses short vowel sounds (especially e/i and o/u)',
    underlying_gap: 'Vowel sounds are acoustically similar; may need more explicit mouth position training',
    correction_protocol: 'Use keyword pictures and mirror. Short e - Ed, mouth open. Short i - itch, mouth is smiling.',
    correction_prompts: ['Look in the mirror. What is your mouth doing?', 'Is your mouth open wide or in a smile?'],
    visual_cues: 'Keyword pictures, mouth position photos',
    kinesthetic_cues: 'Feel jaw position with hand'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: '1.3' },
    error_pattern: 'Reads digraph as two separate sounds (ch as /k/-/h/)',
    underlying_gap: 'Not recognizing that two letters can represent one sound',
    correction_protocol: 'Emphasize "glued together" concept. Use one finger tap for digraph.',
    correction_prompts: ['These two letters are glued together. They make ONE sound.', 'We tap once because it\'s one sound.'],
    visual_cues: 'Underline or box digraph as unit, digraph cards',
    kinesthetic_cues: 'Single finger tap, "glue" gesture'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: '1.3' },
    error_pattern: 'Adds schwa after digraph (says "chuh" instead of /ch/)',
    underlying_gap: 'Tendency to add vowel sound to isolated consonants',
    correction_protocol: 'Model crisp, clipped sound. "Just the sound, no extra."',
    correction_prompts: ['Clip it! Just the sound, no extra.', 'Make it short and crisp.'],
    visual_cues: 'Scissors gesture for "clip it"',
    kinesthetic_cues: 'Quick hand chop motion for crisp sounds'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: '1.4' },
    error_pattern: 'Spells with single letter instead of double (stuf instead of stuff)',
    underlying_gap: 'Not applying FLOSS rule consistently',
    correction_protocol: 'Review FLOSS rule: after a short vowel at the end of a one-syllable word, double f, l, s, or z.',
    correction_prompts: ['Is this a FLOSS word?', 'Check your rules notebook. What does FLOSS tell us?'],
    visual_cues: 'FLOSS rule chart, highlighter on vowel and final letter',
    kinesthetic_cues: 'Still one tap - double letters make one sound'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: '1.5' },
    error_pattern: 'Segments glued sounds into individual phonemes',
    underlying_gap: 'Not recognizing welded/glued sound units',
    correction_protocol: 'Teach as units. Tap with two fingers stuck together.',
    correction_prompts: ['These sounds are glued together. We keep them as a team.', 'Use your glued fingers.'],
    visual_cues: 'Glued sound cards, fingers stuck together visual',
    kinesthetic_cues: 'Two fingers pressed together for tap'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: '1.6' },
    error_pattern: 'Pronounces -ed as /ed/ in all words',
    underlying_gap: 'Not recognizing the three sounds of -ed suffix',
    correction_protocol: 'Teach 3 sounds: /id/ after t/d, /d/ after voiced sounds, /t/ after unvoiced. Use throat check.',
    correction_prompts: ['The -ed ending has 3 sounds. Which one fits this word?', 'Is it voiced or unvoiced?'],
    visual_cues: '-ed three sounds chart, sorting mat',
    kinesthetic_cues: 'Hand on throat to check voicing'
  },
  {
    curriculum: 'wilson',
    position: { step: 2, substep: '2.1' },
    error_pattern: 'Uses short vowel in VCe words (reads "hope" as "hop")',
    underlying_gap: 'Not recognizing VCe syllable type',
    correction_protocol: 'Mark syllable type. "VCe! When there\'s an e at the end, the vowel says its name."',
    correction_prompts: ['Is there an e at the end? Then the vowel says its name.', 'This is a VCe syllable.'],
    visual_cues: 'VCe syllable type marking, rainbow arc from e to vowel',
    kinesthetic_cues: 'Arc hand motion from e to vowel'
  },
  {
    curriculum: 'wilson',
    position: { step: 3, substep: '3.2' },
    error_pattern: 'Divides syllables incorrectly in VCCV words',
    underlying_gap: 'Not applying syllable division rules correctly',
    correction_protocol: 'Teach "spot and dot" - mark all vowels first. For VCCV, divide between the consonants.',
    correction_prompts: ['First, spot and dot the vowels. How many syllables?', 'Two consonants in the middle - where do we divide?'],
    visual_cues: 'Spot and dot notation, division line between consonants',
    kinesthetic_cues: 'Scoop each syllable with finger'
  },
  {
    curriculum: 'wilson',
    position: { step: 4, substep: '4.2' },
    error_pattern: 'Confuses er, ir, ur (all make /er/ sound)',
    underlying_gap: 'Three spellings for same sound creates confusion',
    correction_protocol: 'Teach that er, ir, ur all say /er/. Use keywords: her, bird, fur.',
    correction_prompts: ['Er, ir, and ur are spelling cousins - they all say /er/.', 'What\'s your keyword?'],
    visual_cues: 'er/ir/ur chart with keywords',
    kinesthetic_cues: null
  },
  {
    curriculum: 'wilson',
    position: { step: 5, substep: '5.1' },
    error_pattern: 'Reads vowel team as two separate sounds',
    underlying_gap: 'Not recognizing vowel teams as single sound units',
    correction_protocol: 'Teach "when two vowels go walking, the first one does the talking" for some teams. Box the vowel team as a unit.',
    correction_prompts: ['These vowels are a team. What one sound do they make?', 'Box the vowel team.'],
    visual_cues: 'Box vowel teams, vowel team cards',
    kinesthetic_cues: null
  }
];

// Mathematics Errors
export const MATH_ERRORS: ErrorBankSeedEntry[] = [
  {
    curriculum: 'delta_math',
    position: { standard: '3.NBT.1' },
    error_pattern: 'Treats digits as individual numbers (327 as "3, 2, 7" not 300+20+7)',
    underlying_gap: 'Does not understand that position determines value',
    correction_protocol: 'Use base-10 blocks on place value mat. Build the number physically.',
    correction_prompts: ['What is the VALUE of this digit? Not its name, its value.', 'Show me with blocks.'],
    visual_cues: 'Place value chart, expanded form notation',
    kinesthetic_cues: 'Base-10 blocks manipulation'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '3.NBT.2' },
    error_pattern: 'Subtracts smaller digit from larger regardless of position',
    underlying_gap: 'Applies faulty algorithm to avoid regrouping (52-28=36)',
    correction_protocol: 'Always check: can I subtract the bottom from the top in each place? If not, regroup.',
    correction_prompts: ['Can you take 8 ones from 2 ones? No? What do we need to do?', 'Show me with blocks.'],
    visual_cues: 'Regrouping notation with arrows',
    kinesthetic_cues: 'Base-10 blocks with trading'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '4.NF.2' },
    error_pattern: 'Believes larger denominator = larger fraction (1/8 > 1/4)',
    underlying_gap: 'Applies whole number thinking: 8 > 4 so 1/8 > 1/4',
    correction_protocol: 'Use fraction bars side by side. More parts means SMALLER pieces.',
    correction_prompts: ['Would you rather have 1/2 of a pizza or 1/8?', 'More pieces means each piece is... bigger or smaller?'],
    visual_cues: 'Fraction bars side by side, pizza visual',
    kinesthetic_cues: 'Fraction tiles, fraction circles'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '4.NF.3c' },
    error_pattern: 'Adds both numerators AND denominators (2/5 + 1/5 = 3/10)',
    underlying_gap: 'Treats fraction as two separate whole numbers',
    correction_protocol: 'Use fraction bars physically. The denominator tells us what SIZE pieces.',
    correction_prompts: ['Read this as "two-fifths plus one-fifth." How many fifths total?', 'The denominator is the NAME of the pieces.'],
    visual_cues: 'Fraction bars showing same-sized pieces being combined',
    kinesthetic_cues: 'Fraction bars, pattern blocks'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '5.NBT.3' },
    error_pattern: 'Longer decimal = larger number (0.36 > 0.5 because 36 > 5)',
    underlying_gap: 'Treating decimals as whole numbers after the point',
    correction_protocol: 'Use decimats (10x10 grids). Shade 0.5 and 0.36. Or use money: 50 cents or 36 cents?',
    correction_prompts: ['Let\'s shade these on our decimat. Which covers more of the grid?', 'Would you rather have 50 cents or 36 cents?'],
    visual_cues: 'Decimat grids, money comparison',
    kinesthetic_cues: 'Decimats (10x10 grids), coins'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '5.NF.1' },
    error_pattern: 'Adds fractions with unlike denominators without finding common denominator',
    underlying_gap: 'Does not understand fractions must represent same-sized pieces to add',
    correction_protocol: 'Use fraction bars. "Can we add thirds and sixths directly? They don\'t line up!"',
    correction_prompts: ['Can we count thirds and sixths together? They\'re different sizes!', 'We need a common denominator.'],
    visual_cues: 'Fraction bars showing need for common denominator',
    kinesthetic_cues: 'Fraction bars'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '5.NBT.7' },
    error_pattern: 'Ignores decimal point when computing (2.5 x 3 = 75)',
    underlying_gap: 'Treating decimal as whole number, not understanding place value',
    correction_protocol: 'Estimate first: "2.5 is about 2 or 3. Times 3 is about 6 to 9. Can the answer be 75?"',
    correction_prompts: ['Before we calculate, estimate: about what should the answer be?', '2.5 is between 2 and 3. Times 3 is...'],
    visual_cues: 'Estimation number line, place value chart',
    kinesthetic_cues: 'Decimats'
  }
];

// Spanish/Camino Errors
export const SPANISH_ERRORS: ErrorBankSeedEntry[] = [
  {
    curriculum: 'camino',
    position: null, // Universal - all lessons
    error_pattern: 'Applies English vowel reduction (schwa) to unstressed syllables',
    underlying_gap: 'English is stress-timed; Spanish is syllable-timed with full vowels',
    correction_protocol: 'Emphasize that every Spanish vowel is pronounced fully. Use syllable clapping.',
    correction_prompts: ['En espanol, cada vocal se pronuncia completamente.', 'Di cada silaba con fuerza.'],
    visual_cues: 'Syllable boxes with equal sizing',
    kinesthetic_cues: 'Clap or tap each syllable with equal stress'
  },
  {
    curriculum: 'camino',
    position: { lesson: 1 },
    error_pattern: 'Substitutes English short vowel for Spanish vowel',
    underlying_gap: 'English has multiple vowel sounds per letter; Spanish has one',
    correction_protocol: 'Spanish vowels never change. A is always /a/ like "papa".',
    correction_prompts: ['La A espanola siempre dice /a/. No cambia nunca.', 'En espanol: A-E-I-O-U, siempre igual.'],
    visual_cues: 'Spanish vowel chart with consistent mouth position photos',
    kinesthetic_cues: 'Feel consistent mouth position for each vowel'
  },
  {
    curriculum: 'camino',
    position: { lesson: 11 },
    error_pattern: 'Confuses n and m in final position',
    underlying_gap: 'Both are nasal sounds; English speakers may not distinguish clearly',
    correction_protocol: 'Lip closure cue: For /m/, lips come together. For /n/, mouth stays open.',
    correction_prompts: ['Tus labios se cierran o se quedan abiertos?', 'Mirame: /m/ - labios juntos. /n/ - boca abierta.'],
    visual_cues: 'Mirror for lip position, side-view diagram',
    kinesthetic_cues: 'Feel lips: together for m, apart for n'
  },
  {
    curriculum: 'camino',
    position: null, // Universal
    error_pattern: 'Pronounces B and V differently',
    underlying_gap: 'English distinguishes B/V; Spanish B and V are the same phoneme /b/',
    correction_protocol: 'Explicit instruction: In Spanish, B and V make the SAME sound.',
    correction_prompts: ['En espanol, la B y la V suenan exactamente igual.', 'B y V son gemelas - mismo sonido.'],
    visual_cues: 'B=V visual showing same sound',
    kinesthetic_cues: null
  },
  {
    curriculum: 'camino',
    position: { lesson: 12 },
    error_pattern: 'Cannot produce Spanish tap r',
    underlying_gap: 'English has no equivalent; closest is flapped t in "butter"',
    correction_protocol: 'Start with English "butter" or "ladder" - that middle sound is close to Spanish r.',
    correction_prompts: ['Di "butter" rapido. Ese sonido del medio es como la R.', 'Pon tu lengua donde dices "d" pero solo tocala una vez.'],
    visual_cues: 'Tongue position diagram - alveolar tap',
    kinesthetic_cues: 'Feel single quick tap of tongue on ridge'
  },
  {
    curriculum: 'camino',
    position: { lesson: 23 },
    error_pattern: 'Cannot produce Spanish trill rr',
    underlying_gap: 'English has no trilled sounds; requires relaxed tongue vibration',
    correction_protocol: 'Tongue must be RELAXED to vibrate. Start with "drrr" motor sound.',
    correction_prompts: ['Relaja tu lengua. Si esta tensa, no puede vibrar.', 'Haz el sonido de un motor: drrrrr.'],
    visual_cues: 'Relaxed tongue diagram, motor/purring cat visual',
    kinesthetic_cues: 'Feel tongue vibration when relaxed'
  },
  {
    curriculum: 'camino',
    position: { lesson: 26 },
    error_pattern: 'Pronounces H with aspiration (as in English)',
    underlying_gap: 'English H is pronounced; Spanish H is always silent',
    correction_protocol: 'Spanish H is ALWAYS silent - "H muda."',
    correction_prompts: ['La H es muda. No dice nada.', 'Hora se dice /ora/. La H esta dormida.'],
    visual_cues: 'Sleeping H visual',
    kinesthetic_cues: null
  },
  {
    curriculum: 'camino',
    position: null, // Universal
    error_pattern: 'Divides syllables incorrectly (splits consonant blends)',
    underlying_gap: 'Spanish keeps certain blends together; English patterns differ',
    correction_protocol: 'Teach "grupos inseparables": bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, tr always stay together.',
    correction_prompts: ['BL, BR, CL, CR... son grupos inseparables. No los separamos.', 'Libro = li-bro, no lib-ro.'],
    visual_cues: 'Inseparable blends chart with "friends holding hands" visual',
    kinesthetic_cues: null
  },
  {
    curriculum: 'camino',
    position: { lesson: 34 },
    error_pattern: 'Ignores written accent marks (reads "papa" as "papa")',
    underlying_gap: 'Not recognizing that accent marks indicate stress position',
    correction_protocol: 'Accent mark = stress that syllable stronger. It can change meaning.',
    correction_prompts: ['El acento te dice donde poner la fuerza.', 'Papa tiene acento en la segunda A. Pa-PA.'],
    visual_cues: 'Minimal pairs with/without accent: papa/papa, mama/mama',
    kinesthetic_cues: 'Clap louder on accented syllable'
  }
];

// Combined error bank
export const ALL_ERRORS: ErrorBankSeedEntry[] = [
  ...WILSON_ERRORS,
  ...MATH_ERRORS,
  ...SPANISH_ERRORS
];

// Helper function to get errors for a curriculum and position
export function getErrorsForPosition(
  curriculum: Curriculum,
  position: CurriculumPosition
): ErrorBankSeedEntry[] {
  return ALL_ERRORS.filter(error => {
    if (error.curriculum !== curriculum) return false;
    if (!error.position) return true; // Universal errors for this curriculum

    // Match position based on curriculum type
    if (curriculum === 'wilson') {
      const errPos = error.position as { step: number; substep: string };
      const curPos = position as { step: number; substep: string };
      return errPos.step === curPos.step;
    }

    if (curriculum === 'delta_math') {
      const errPos = error.position as { standard: string };
      const curPos = position as { standard: string };
      return errPos.standard === curPos.standard;
    }

    if (curriculum === 'camino') {
      const errPos = error.position as { lesson: number };
      const curPos = position as { lesson: number };
      return errPos.lesson === curPos.lesson;
    }

    return false;
  });
}

// Get all errors for a curriculum (for initial loading)
export function getErrorsForCurriculum(curriculum: Curriculum): ErrorBankSeedEntry[] {
  return ALL_ERRORS.filter(error => error.curriculum === curriculum);
}
