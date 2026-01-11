// Wilson Reading System - Steps 1-6 (Official Scope & Sequence)
// Based on Wilson Language Training official curriculum
// Note: Steps 7-12 cover R-Controlled, Vowel Teams, and advanced concepts
// Updated: January 2025 - Corrected to match official Wilson sequence

export interface WilsonSubstep {
  substep: string;
  name: string;
  skills: string[];
  sample_words: string[];
  nonsense_words?: string[];
  concepts: string[];
  lesson_focus: string;
}

export interface WilsonStep {
  step: number;
  name: string;
  substeps: WilsonSubstep[];
}

export interface WilsonSyllableType {
  type: string;
  description: string;
  example: string;
  marker: string;
  introduced_step: number;
}

export const WILSON_STEPS: WilsonStep[] = [
  {
    step: 1,
    name: 'Closed Syllables (3 Sounds)',
    substeps: [
      {
        substep: '1.1',
        name: 'Basic Consonants & Short Vowels a, i, o',
        skills: [
          'Consonants: f, l, m, n, r, s (initial); d, g, p, t (final)',
          'Short vowels: a, i, o',
          'Sound tapping',
          'Blending CVC words'
        ],
        sample_words: ['sat', 'sit', 'lot', 'fan', 'rim', 'top', 'fin', 'dog', 'map', 'rag'],
        nonsense_words: ['dit', 'fom', 'nas', 'lig', 'mot'],
        concepts: [
          'Closed syllable: vowel is "closed in" by consonant, making it short',
          'Every syllable has one vowel sound',
          'Tap each sound, then blend'
        ],
        lesson_focus: 'Sound-symbol correspondence for basic consonants and short a, i, o'
      },
      {
        substep: '1.2',
        name: 'Additional Consonants, Digraphs & Short Vowels u, e',
        skills: [
          'Consonants: b, h, j, c, k, ck, v, w, x, y, z',
          'Digraphs: sh, ch, th, wh, qu',
          'Short vowels: u, e',
          'Digraphs as single sound units'
        ],
        sample_words: ['bed', 'cup', 'ship', 'chop', 'thin', 'when', 'quit', 'back', 'yes', 'box'],
        nonsense_words: ['sheb', 'thup', 'chod', 'whem', 'quiv'],
        concepts: [
          'Digraph: two letters that make ONE sound',
          'Tap once for digraphs',
          'ck used after short vowel at end of one-syllable word'
        ],
        lesson_focus: 'Introducing digraphs and completing short vowel sounds'
      },
      {
        substep: '1.3',
        name: 'Three-Sound Words with Digraphs',
        skills: [
          'Reading and spelling CVC words with digraphs',
          'All five short vowels',
          'Initial and final digraph positions'
        ],
        sample_words: ['wish', 'chop', 'wet', 'them', 'such', 'with', 'shed', 'chest', 'whip', 'shut'],
        nonsense_words: ['chib', 'shum', 'thock', 'whep', 'chud'],
        concepts: [
          'Apply digraph knowledge in full word reading',
          'Digraphs can appear at beginning or end of words',
          'Continue tapping with digraphs as single units'
        ],
        lesson_focus: 'Fluent reading and spelling of three-sound words including digraphs'
      },
      {
        substep: '1.4',
        name: 'Bonus Letters (FLOSS Rule) & Welded Sound /all/',
        skills: [
          'FLOSS rule: double f, l, s, z after short vowel',
          'Bonus letters in one-syllable words',
          'Welded sound /all/'
        ],
        sample_words: ['off', 'bill', 'miss', 'buzz', 'call', 'cliff', 'smell', 'dress', 'fuzz', 'stall'],
        nonsense_words: ['beff', 'woss', 'glill', 'tuzz', 'chall'],
        concepts: [
          'FLOSS rule: f, l, s, z double after short vowel in one-syllable word',
          'Bonus letters make one sound, tap once',
          'Welded /all/ - tap with fingers together'
        ],
        lesson_focus: 'Applying FLOSS rule and introducing first welded sound'
      },
      {
        substep: '1.5',
        name: 'Welded Sounds /am/ and /an/',
        skills: [
          'Welded sound /am/',
          'Welded sound /an/',
          'Nasalized vowel sounds'
        ],
        sample_words: ['ham', 'fan', 'jam', 'man', 'clam', 'plan', 'slam', 'than', 'swam', 'scan'],
        nonsense_words: ['blam', 'stran', 'glam', 'thran'],
        concepts: [
          'Welded sounds stay together as a unit',
          'Tap with two fingers stuck together for welded sounds',
          'Vowel sound changes slightly before m and n'
        ],
        lesson_focus: 'Reading and spelling welded /am/ and /an/ patterns'
      },
      {
        substep: '1.6',
        name: 'Suffixes -s and -es',
        skills: [
          'Suffix -s with unchanging base words',
          'Suffix -es after s, x, z, ch, sh',
          'Identifying base word + suffix'
        ],
        sample_words: ['cats', 'dogs', 'bugs', 'dishes', 'foxes', 'wishes', 'boxes', 'chills', 'quizzes', 'brushes'],
        concepts: [
          'Suffix: word part added to end of base word',
          'Base word + suffix = new word',
          'Add -es when word ends in s, x, z, ch, sh'
        ],
        lesson_focus: 'Reading and spelling words with -s and -es suffixes'
      }
    ]
  },
  {
    step: 2,
    name: 'Closed Syllables (4-6 Sounds with Blends)',
    substeps: [
      {
        substep: '2.1',
        name: 'Welded Sounds with -ng and -nk',
        skills: [
          'Welded sounds: ang, ing, ong, ung',
          'Welded sounds: ank, ink, onk, unk',
          'Nasalized vowel + velar sounds'
        ],
        sample_words: ['bang', 'ring', 'song', 'hung', 'bank', 'pink', 'honk', 'bunk', 'clang', 'drink'],
        nonsense_words: ['glang', 'prink', 'blonk', 'stunk', 'thring'],
        concepts: [
          'ng and nk are welded to the vowel before them',
          'Tap these as welded units (2-3 fingers together)',
          'The vowel sound changes before ng and nk'
        ],
        lesson_focus: 'Mastering all welded sound patterns'
      },
      {
        substep: '2.2',
        name: 'Closed Syllables with 4 Sounds (Initial Blends)',
        skills: [
          'Initial blends: bl, cl, fl, gl, pl, sl',
          'Initial blends: br, cr, dr, fr, gr, pr, tr',
          'Initial blends: sc, sk, sm, sn, sp, st, sw'
        ],
        sample_words: ['stop', 'clap', 'blast', 'from', 'step', 'grab', 'swim', 'plan', 'trip', 'sled'],
        nonsense_words: ['blom', 'stup', 'frap', 'glin', 'swem'],
        concepts: [
          'Blend: each consonant sound is heard',
          'Tap each sound in a blend separately',
          'Keep blends together when dividing syllables'
        ],
        lesson_focus: 'Reading and spelling CCVC words with initial blends'
      },
      {
        substep: '2.3',
        name: 'Closed Syllable Exceptions',
        skills: [
          'Exception patterns: -ild, -ind (long i)',
          'Exception patterns: -old, -olt, -ost (long o)',
          'Recognizing when vowel is long in closed syllable'
        ],
        sample_words: ['wild', 'child', 'mind', 'find', 'kind', 'cold', 'gold', 'bolt', 'most', 'host'],
        concepts: [
          'Some closed syllables have long vowels (exceptions)',
          'Common exception patterns to memorize',
          'i before ld/nd often says long i; o before ld/lt/st often says long o'
        ],
        lesson_focus: 'Recognizing closed syllable exceptions with long vowels'
      },
      {
        substep: '2.4',
        name: 'Closed Syllables with 5 Sounds (Final Blends)',
        skills: [
          'Final blends: ft, lt, mp, nd, nt, pt',
          'Final blends: sk, sp, st',
          'Words with both initial and final blends'
        ],
        sample_words: ['clamp', 'blend', 'trunk', 'crisp', 'stamp', 'split', 'drift', 'frost', 'stunt', 'clasp'],
        nonsense_words: ['blund', 'strift', 'glimp', 'crast', 'flond'],
        concepts: [
          'Final blends follow the vowel',
          'Each sound in a blend is tapped',
          'CCVCC pattern words'
        ],
        lesson_focus: 'Reading and spelling words with initial and final blends'
      },
      {
        substep: '2.5',
        name: 'Three-Letter Blends (Up to 6 Sounds)',
        skills: [
          'Three-letter blends: scr, spl, spr, str, thr',
          'CCCVCC pattern words',
          'Complex consonant clusters'
        ],
        sample_words: ['strand', 'string', 'scrimp', 'splash', 'sprint', 'strong', 'script', 'shrimp', 'throb', 'strap'],
        nonsense_words: ['strig', 'splund', 'scramp', 'thrist', 'spronk'],
        concepts: [
          'Three-letter blends: each sound still heard',
          'Complex words require careful tapping',
          'Maximum 6 sounds in one-syllable closed words'
        ],
        lesson_focus: 'Mastery of complex closed syllable words'
      }
    ]
  },
  {
    step: 3,
    name: 'Two-Syllable Closed Words',
    substeps: [
      {
        substep: '3.1',
        name: 'VCCV Syllable Division',
        skills: [
          'Spotting and dotting vowels',
          'VCCV pattern: divide between consonants',
          'Applying closed syllable rules to each part'
        ],
        sample_words: ['napkin', 'rabbit', 'sudden', 'puppet', 'picnic', 'helmet', 'contest', 'subject', 'mascot', 'husband'],
        concepts: [
          'Spot and dot vowels first',
          'VCCV: divide between the two consonants',
          'Each syllable has one vowel sound',
          'Apply closed syllable rule to each syllable'
        ],
        lesson_focus: 'Dividing and decoding VCCV pattern words'
      },
      {
        substep: '3.2',
        name: 'Words with -ct Blend',
        skills: [
          'Final -ct blend in multisyllabic words',
          'Keeping -ct together in division',
          'Common -ct words'
        ],
        sample_words: ['exact', 'contact', 'insect', 'compact', 'instinct', 'distinct', 'abstract', 'subtract', 'conduct', 'conflict'],
        concepts: [
          'ct blend stays together',
          'Divide before the ct blend',
          'Common pattern in two-syllable words'
        ],
        lesson_focus: 'Reading and spelling words with -ct blend'
      },
      {
        substep: '3.3',
        name: 'Compound Closed Syllable Words',
        skills: [
          'Compound words with closed syllables',
          'Recognizing two base words',
          'Division at compound boundary'
        ],
        sample_words: ['sunlit', 'bathtub', 'catnap', 'sunset', 'hatbox', 'hotdog', 'inkblot', 'zigzag', 'lipstick', 'eggnog'],
        concepts: [
          'Compound word = two words joined together',
          'Divide at the compound boundary',
          'Apply syllable rules to each part'
        ],
        lesson_focus: 'Recognizing and decoding compound words'
      },
      {
        substep: '3.4',
        name: 'Three-Syllable Closed Words',
        skills: [
          'Three-syllable division',
          'Multiple division points',
          'Blends and digraphs in longer words'
        ],
        sample_words: ['fantastic', 'establish', 'Wisconsin', 'Atlantic', 'September', 'instruction', 'subtraction', 'subscription', 'transcription', 'manuscript'],
        concepts: [
          'Apply division rules at each VCCV pattern',
          'Keep digraphs and blends together',
          'Decode one syllable at a time'
        ],
        lesson_focus: 'Multisyllabic closed syllable word decoding'
      }
    ]
  },
  {
    step: 4,
    name: 'Vowel-Consonant-e (VCe) Syllables',
    substeps: [
      {
        substep: '4.1',
        name: 'One-Syllable VCe Words',
        skills: [
          'VCe syllable pattern recognition',
          'Silent e makes vowel long',
          'Long a, i, o, u, e in VCe words'
        ],
        sample_words: ['make', 'time', 'hope', 'cube', 'Pete', 'plate', 'smile', 'stone', 'flute', 'theme'],
        nonsense_words: ['bape', 'kibe', 'trome', 'flune', 'zede'],
        concepts: [
          'VCe: vowel-consonant-silent e pattern',
          'Silent e jumps over one consonant to make vowel say its name',
          'Contrast with closed syllables: hop vs hope, tap vs tape'
        ],
        lesson_focus: 'Distinguishing closed vs VCe syllables'
      },
      {
        substep: '4.2',
        name: 'Two-Syllable Words with VCe',
        skills: [
          'VCe in multisyllabic words',
          'Syllable division with VCe pattern',
          'Combining closed and VCe syllables'
        ],
        sample_words: ['compete', 'explode', 'reptile', 'stampede', 'costume', 'confuse', 'complete', 'athlete', 'concrete', 'subscribe'],
        concepts: [
          'VCe syllable can combine with closed syllables',
          'Divide before or after the consonant preceding VCe',
          'Silent e rule applies within syllable'
        ],
        lesson_focus: 'Multisyllabic decoding with VCe syllables'
      },
      {
        substep: '4.3',
        name: 'VCe Exceptions',
        skills: [
          'VCe words with short vowels',
          'Common exception words',
          'Recognizing when to flex pronunciation'
        ],
        sample_words: ['have', 'give', 'live', 'love', 'come', 'some', 'done', 'gone', 'none', 'glove'],
        concepts: [
          'Some VCe words have short vowels (exceptions)',
          'These are high-frequency words to memorize',
          'Flex strategy: try long, if not a word try short'
        ],
        lesson_focus: 'Recognizing and reading VCe exception words'
      },
      {
        substep: '4.4',
        name: 'Suffix Rules with VCe Base Words',
        skills: [
          'Drop e before vowel suffix (-ing, -ed, -er, -est)',
          'Keep e before consonant suffix (-ment, -ful, -less)',
          'Spelling patterns with VCe base words'
        ],
        sample_words: ['making', 'hoped', 'shaking', 'rider', 'latest', 'movement', 'hopeful', 'homeless', 'excitement', 'usefulness'],
        concepts: [
          'Drop e rule: remove e before adding suffix starting with vowel',
          'Keep e before consonant suffixes',
          'Base word meaning stays the same'
        ],
        lesson_focus: 'Spelling rules for adding suffixes to VCe words'
      }
    ]
  },
  {
    step: 5,
    name: 'Open Syllables',
    substeps: [
      {
        substep: '5.1',
        name: 'One-Syllable Open Words',
        skills: [
          'Open syllable: ends in vowel, vowel is long',
          'Common one-syllable open words',
          'Contrast with closed syllables'
        ],
        sample_words: ['be', 'he', 'me', 'she', 'we', 'no', 'so', 'go', 'hi', 'I'],
        concepts: [
          'Open syllable: nothing closes in the vowel',
          'Vowel at end of syllable says its name (long)',
          'These are often high-frequency words'
        ],
        lesson_focus: 'Recognizing open syllables'
      },
      {
        substep: '5.2',
        name: 'Y as a Vowel',
        skills: [
          'Y says long i at end of one-syllable word',
          'Y says long e at end of multisyllabic word',
          'Y in open syllable position'
        ],
        sample_words: ['my', 'fly', 'sky', 'try', 'why', 'baby', 'happy', 'candy', 'silly', 'plenty'],
        concepts: [
          'Y is a vowel when it makes a vowel sound',
          'End of one-syllable word: y says long i (my, fly)',
          'End of multisyllabic word: y says long e (baby, happy)'
        ],
        lesson_focus: 'Reading y as a vowel in different positions'
      },
      {
        substep: '5.3',
        name: 'Open Syllable Prefixes',
        skills: [
          'Common open syllable prefixes: re-, pre-, de-, be-',
          'Prefix meaning and usage',
          'Dividing after open syllable prefix'
        ],
        sample_words: ['redo', 'prefix', 'decode', 'begin', 'refuse', 'pretend', 'defend', 'belong', 'return', 'demand'],
        concepts: [
          'Prefixes are word parts added to beginning',
          'Open syllable prefixes end in long vowel',
          'Divide after the prefix'
        ],
        lesson_focus: 'Recognizing and reading open syllable prefixes'
      },
      {
        substep: '5.4',
        name: 'Open Syllable Division & Schwa',
        skills: [
          'VCV division: try open first (V/CV)',
          'Flex to closed if open does not make a word (VC/V)',
          'Schwa sound in unstressed syllables'
        ],
        sample_words: ['robot', 'hotel', 'student', 'cabin', 'lemon', 'camel', 'wagon', 'seven', 'planet', 'melon'],
        concepts: [
          'VCV pattern: try open syllable first (V/CV)',
          'Flex strategy: if open does not make a word, try closed (VC/V)',
          'Schwa: unstressed vowel often says /uh/'
        ],
        lesson_focus: 'Flexible syllable division with VCV pattern'
      }
    ]
  },
  {
    step: 6,
    name: 'Suffixes & Consonant-le Syllables',
    substeps: [
      {
        substep: '6.1',
        name: 'Common Suffixes (Set 1)',
        skills: [
          'Suffixes: -er, -est, -en, -ish',
          'Suffixes: -or, -y, -ly',
          'Adding suffixes to unchanging base words'
        ],
        sample_words: ['faster', 'softest', 'golden', 'selfish', 'actor', 'rocky', 'sadly', 'flatten', 'freshen', 'rusted'],
        concepts: [
          'Suffix changes word meaning or part of speech',
          'Identify base word + suffix',
          'Unchanging base: no spelling changes when adding suffix'
        ],
        lesson_focus: 'Reading and spelling words with common suffixes'
      },
      {
        substep: '6.2',
        name: 'Additional Suffixes (Set 2)',
        skills: [
          'Suffixes: -ful, -less, -ness, -ment',
          'Suffixes: -able, -ty',
          'Abstract noun and adjective suffixes'
        ],
        sample_words: ['thankful', 'helpless', 'sadness', 'shipment', 'fixable', 'plenty', 'careful', 'homeless', 'softness', 'payment'],
        concepts: [
          '-ful means full of; -less means without',
          '-ness and -ment create nouns',
          '-able means able to be'
        ],
        lesson_focus: 'Suffix meanings and spelling patterns'
      },
      {
        substep: '6.3',
        name: 'Consonant-le Syllables',
        skills: [
          'Consonant-le pattern: consonant + le',
          'Common endings: -ble, -cle, -dle, -fle, -gle, -kle, -ple, -tle, -zle',
          'Division before consonant-le'
        ],
        sample_words: ['table', 'uncle', 'middle', 'raffle', 'eagle', 'ankle', 'simple', 'little', 'puzzle', 'bottle'],
        concepts: [
          'Consonant-le: the consonant + le form a syllable',
          'Divide BEFORE the consonant-le',
          'The le syllable is never stressed'
        ],
        lesson_focus: 'Reading and dividing consonant-le words'
      },
      {
        substep: '6.4',
        name: 'Two-Syllable Consonant-le Words',
        skills: [
          'First syllable type + consonant-le',
          'Closed + consonant-le (bubble, jungle)',
          'VCe + consonant-le (maple, noble)',
          'Open + consonant-le (cable, bugle)'
        ],
        sample_words: ['bubble', 'jungle', 'maple', 'noble', 'cable', 'bugle', 'tremble', 'crumble', 'scramble', 'staple'],
        concepts: [
          'Identify first syllable type to determine vowel sound',
          'Closed first syllable = short vowel (bubble)',
          'Open or VCe first syllable = long vowel (maple, cable)'
        ],
        lesson_focus: 'Combining syllable types with consonant-le'
      }
    ]
  }
];

// Syllable types introduced in Steps 1-6
// Note: R-controlled and Vowel Team (D syllable) are introduced in Steps 7-12
export const WILSON_SYLLABLE_TYPES: WilsonSyllableType[] = [
  {
    type: 'closed',
    description: 'Ends in consonant, vowel is short',
    example: 'cat, splash',
    marker: 'breve (˘) over vowel',
    introduced_step: 1
  },
  {
    type: 'vce',
    description: 'Vowel-consonant-silent e, vowel is long',
    example: 'make, compete',
    marker: 'macron (¯) over vowel, slash through e',
    introduced_step: 4
  },
  {
    type: 'open',
    description: 'Ends in vowel, vowel is long',
    example: 'go, robot',
    marker: 'macron (¯) over vowel',
    introduced_step: 5
  },
  {
    type: 'consonant_le',
    description: 'Consonant + le at end, forms final syllable',
    example: 'table, puzzle',
    marker: 'box around -le',
    introduced_step: 6
  },
  {
    type: 'r_controlled',
    description: 'Vowel followed by r, vowel sound is changed',
    example: 'car, bird',
    marker: 'circle around vowel-r',
    introduced_step: 8  // Steps 7-12
  },
  {
    type: 'vowel_team',
    description: 'Two vowels together make one sound (D syllable)',
    example: 'rain, boat',
    marker: 'box around vowel team',
    introduced_step: 9  // Steps 7-12
  }
];

// Wilson lesson structure (10 parts of the Wilson Lesson Plan)
export const WILSON_LESSON_COMPONENTS = [
  { part: 1, name: 'Sound Cards', duration_minutes: 2, description: 'Quick review of sound cards for phoneme-grapheme correspondence' },
  { part: 2, name: 'Teach/Review Concepts', duration_minutes: 5, description: 'Introduce new concept or review previous learning' },
  { part: 3, name: 'Word Cards', duration_minutes: 2, description: 'Read real word cards with current patterns' },
  { part: 4, name: 'Word List Reading', duration_minutes: 5, description: 'Read real and nonsense words from word lists' },
  { part: 5, name: 'Sentence Reading', duration_minutes: 3, description: 'Apply decoding in connected text sentences' },
  { part: 6, name: 'Quick Drill', duration_minutes: 2, description: 'Rapid letter-sound review for automaticity' },
  { part: 7, name: 'Dictation: Sounds', duration_minutes: 2, description: 'Write graphemes from dictated phonemes' },
  { part: 8, name: 'Dictation: Words', duration_minutes: 3, description: 'Spell words using sound tapping' },
  { part: 9, name: 'Dictation: Sentences', duration_minutes: 3, description: 'Write dictated sentences' },
  { part: 10, name: 'Passage Reading', duration_minutes: 8, description: 'Read controlled decodable text for fluency' }
];

// Welded (Glued) Sounds Reference
export const WILSON_WELDED_SOUNDS = {
  step_1: {
    substep_1_4: ['-all (ball, call, fall)'],
    substep_1_5: ['-am (ham, jam, clam)', '-an (fan, man, plan)']
  },
  step_2: {
    substep_2_1: [
      '-ang (bang, clang, sang)',
      '-ing (ring, sing, bring)',
      '-ong (song, long, strong)',
      '-ung (hung, lung, stung)',
      '-ank (bank, thank, blank)',
      '-ink (pink, think, drink)',
      '-onk (honk, conk, bonk)',
      '-unk (bunk, chunk, trunk)'
    ]
  }
};

// Helper functions
export function getWilsonStep(stepNumber: number): WilsonStep | undefined {
  return WILSON_STEPS.find(s => s.step === stepNumber);
}

export function getWilsonSubstep(substepKey: string): WilsonSubstep | undefined {
  for (const step of WILSON_STEPS) {
    const substep = step.substeps.find(ss => ss.substep === substepKey);
    if (substep) return substep;
  }
  return undefined;
}

export function getWilsonPositionLabel(step: number, substep: string): string {
  const stepData = getWilsonStep(step);
  const substepData = getWilsonSubstep(substep);
  if (stepData && substepData) {
    return `Step ${step}: ${substepData.name}`;
  }
  return `Step ${step}, Substep ${substep}`;
}

export function getNextWilsonPosition(currentStep: number, currentSubstep: string): { step: number; substep: string } | null {
  const stepData = getWilsonStep(currentStep);
  if (!stepData) return null;

  const currentIndex = stepData.substeps.findIndex(ss => ss.substep === currentSubstep);

  // If there's a next substep in current step
  if (currentIndex < stepData.substeps.length - 1) {
    return { step: currentStep, substep: stepData.substeps[currentIndex + 1].substep };
  }

  // Move to next step
  const nextStep = getWilsonStep(currentStep + 1);
  if (nextStep && nextStep.substeps.length > 0) {
    return { step: currentStep + 1, substep: nextStep.substeps[0].substep };
  }

  return null; // End of Steps 1-6
}

export function getSyllableTypesForStep(stepNumber: number): WilsonSyllableType[] {
  return WILSON_SYLLABLE_TYPES.filter(st => st.introduced_step <= stepNumber);
}

// Get all substeps as flat array for progress tracking
export function getAllWilsonSubsteps(): Array<{ step: number; substep: WilsonSubstep }> {
  const result: Array<{ step: number; substep: WilsonSubstep }> = [];
  for (const step of WILSON_STEPS) {
    for (const substep of step.substeps) {
      result.push({ step: step.step, substep });
    }
  }
  return result;
}

// Total substeps count for progress calculation
export const TOTAL_WILSON_SUBSTEPS = WILSON_STEPS.reduce(
  (sum, step) => sum + step.substeps.length,
  0
);
