// Wilson Reading System - Steps 1-6
// Complete curriculum sequence data

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
}

export const WILSON_STEPS: WilsonStep[] = [
  {
    step: 1,
    name: 'Closed Syllables & Foundational Skills',
    substeps: [
      {
        substep: '1.1',
        name: 'Short Vowels in Closed Syllables (CVC)',
        skills: ['Short vowel sounds (a, e, i, o, u)', 'Consonant sounds', 'Basic closed syllable structure', 'Sound tapping'],
        sample_words: ['sat', 'pet', 'hit', 'lot', 'cup', 'jam', 'hem', 'dim', 'mop', 'bus'],
        nonsense_words: ['vap', 'kem', 'zit', 'wod', 'jup'],
        concepts: ['Closed syllable: ends in consonant, vowel is short', 'Every syllable has one vowel sound'],
        lesson_focus: 'Sound-symbol correspondence, blending CVC words'
      },
      {
        substep: '1.2',
        name: 'Consonant Blends',
        skills: ['Initial blends (bl, cl, fl, gl, pl, sl, br, cr, dr, fr, gr, pr, tr, sc, sk, sm, sn, sp, st, sw)', 'Final blends (ft, lt, mp, nd, nt, pt, sk, sp, st)'],
        sample_words: ['plant', 'blend', 'crisp', 'stomp', 'drift', 'frost', 'sprint', 'strand'],
        nonsense_words: ['blom', 'crift', 'stund', 'pland'],
        concepts: ['Blends: two or three consonants where each sound is heard', 'Sound-by-sound blending with blends'],
        lesson_focus: 'Blending words with initial and final consonant blends'
      },
      {
        substep: '1.3',
        name: 'Digraphs',
        skills: ['Consonant digraphs: ch, sh, th, wh, ck', 'Digraphs as single sound units'],
        sample_words: ['chip', 'shop', 'thin', 'whip', 'thick', 'check', 'shack', 'when', 'chop', 'this'],
        nonsense_words: ['chib', 'shum', 'thock', 'whep'],
        concepts: ['Digraph: two letters that make ONE sound', 'Tap once for digraphs'],
        lesson_focus: 'Recognizing digraphs as single phoneme units'
      },
      {
        substep: '1.4',
        name: 'Bonus Letters (ff, ll, ss, zz)',
        skills: ['FLOSS rule: double f, l, s, z after short vowel in one-syllable word', 'Reading and spelling bonus letter patterns'],
        sample_words: ['stuff', 'bell', 'miss', 'jazz', 'cliff', 'smell', 'dress', 'fuzz', 'still', 'buff'],
        nonsense_words: ['beff', 'woss', 'glill', 'tuzz'],
        concepts: ['FLOSS rule application', 'Bonus letters make one sound, tap once'],
        lesson_focus: 'Applying FLOSS rule in reading and spelling'
      },
      {
        substep: '1.5',
        name: 'Glued Sounds (Welded Sounds)',
        skills: ['all, am, an glued sounds', 'ang, ing, ong, ung glued sounds', 'ank, ink, onk, unk glued sounds'],
        sample_words: ['ball', 'ham', 'man', 'bang', 'ring', 'song', 'bunk', 'bank', 'pink', 'honk'],
        nonsense_words: ['clang', 'prink', 'blunk'],
        concepts: ['Glued sounds stay together as a unit', 'Tap with two/three fingers stuck together', 'Vowel sound changes in glued sounds'],
        lesson_focus: 'Reading and spelling glued sound patterns'
      },
      {
        substep: '1.6',
        name: 'Suffixes (-s, -es, -ed, -ing)',
        skills: ['Suffix -s and -es', 'Three sounds of -ed: /id/, /d/, /t/', 'Suffix -ing', 'Identifying base words'],
        sample_words: ['cats', 'dishes', 'jumped', 'played', 'wanted', 'running', 'sitting', 'helps', 'foxes'],
        concepts: ['Suffix: word part added to end of base word', 'Base word + suffix', '-ed says /id/ after t/d, /d/ after voiced, /t/ after unvoiced'],
        lesson_focus: 'Reading and spelling words with suffixes'
      }
    ]
  },
  {
    step: 2,
    name: 'Vowel-Consonant-e (VCe) Syllables',
    substeps: [
      {
        substep: '2.1',
        name: 'VCe with Long Vowels',
        skills: ['VCe syllable pattern', 'Silent e makes vowel "say its name"', 'Long a, i, o, u, e in VCe words'],
        sample_words: ['make', 'time', 'hope', 'cube', 'eve', 'plate', 'smile', 'stone', 'huge', 'these'],
        nonsense_words: ['bape', 'kibe', 'trome', 'flune'],
        concepts: ['VCe: vowel-consonant-silent e', 'Silent e jumps over one consonant to make vowel long', 'Contrast with closed syllables: hop vs hope'],
        lesson_focus: 'Distinguishing closed vs VCe syllables'
      },
      {
        substep: '2.2',
        name: 'VCe with Digraphs and Blends',
        skills: ['VCe words with initial/final blends', 'VCe words with digraphs'],
        sample_words: ['shake', 'stripe', 'throne', 'whale', 'smoke', 'spine', 'chrome', 'phase'],
        concepts: ['Applying VCe pattern to more complex words'],
        lesson_focus: 'Multisyllabic decoding with VCe'
      },
      {
        substep: '2.3',
        name: 'VCe Exceptions and Review',
        skills: ['VCe exceptions: have, give, love, etc.', 'Suffixes with VCe base words'],
        sample_words: ['have', 'give', 'live', 'love', 'come', 'some', 'making', 'hoped', 'shaking'],
        concepts: ['Some VCe words have short vowels (exceptions)', 'Drop e before adding vowel suffix'],
        lesson_focus: 'VCe exceptions and suffix spelling rules'
      }
    ]
  },
  {
    step: 3,
    name: 'Open Syllables & Multisyllabic Words',
    substeps: [
      {
        substep: '3.1',
        name: 'Open Syllables',
        skills: ['Open syllable: ends in vowel, vowel is long', 'Common open syllables: be, he, me, she, we, no, so, go, hi, by, my, fly'],
        sample_words: ['be', 'he', 'she', 'we', 'no', 'so', 'go', 'hi', 'my', 'fly', 'why', 'try'],
        concepts: ['Open syllable: nothing closes in the vowel, so it says its name', 'Open vs closed syllable contrast'],
        lesson_focus: 'Recognizing open syllables'
      },
      {
        substep: '3.2',
        name: 'Two-Syllable Words (VC/CV Division)',
        skills: ['VCCV syllable division', 'Divide between two consonants', 'Syllable types in multisyllabic words'],
        sample_words: ['napkin', 'rabbit', 'sudden', 'puppet', 'picnic', 'helmet', 'contest', 'subject'],
        concepts: ['Spot and dot vowels first', 'VCCV: divide between consonants', 'Each syllable has one vowel sound'],
        lesson_focus: 'Dividing and decoding VCCV words'
      },
      {
        substep: '3.3',
        name: 'Two-Syllable Words (V/CV and VC/V Division)',
        skills: ['VCV syllable division', 'Try open first, flex to closed if not a word'],
        sample_words: ['robot', 'silent', 'baby', 'student', 'cabin', 'lemon', 'comet', 'visit'],
        concepts: ['VCV: try V/CV (open) first', 'Flex strategy: if open doesn\'t make a word, try closed'],
        lesson_focus: 'Flexible syllable division'
      },
      {
        substep: '3.4',
        name: 'Syllable Division with Blends and Digraphs',
        skills: ['Keep blends and digraphs together in division', 'Three-syllable words'],
        sample_words: ['children', 'kitchen', 'hundred', 'pumpkin', 'establish', 'fantastic'],
        concepts: ['Never split a digraph or blend', 'Apply division rules to longer words'],
        lesson_focus: 'Complex multisyllabic decoding'
      }
    ]
  },
  {
    step: 4,
    name: 'R-Controlled Vowels',
    substeps: [
      {
        substep: '4.1',
        name: 'Ar and Or',
        skills: ['ar says /ar/ as in car', 'or says /or/ as in for'],
        sample_words: ['car', 'star', 'farm', 'hard', 'for', 'storm', 'horn', 'short', 'chart', 'porch'],
        nonsense_words: ['flar', 'blor', 'starp', 'clorn'],
        concepts: ['R-controlled: r changes the vowel sound', 'ar and or are distinct sounds'],
        lesson_focus: 'Reading and spelling ar and or words'
      },
      {
        substep: '4.2',
        name: 'Er, Ir, Ur',
        skills: ['er, ir, ur all say /er/', 'Spelling choices for /er/ sound'],
        sample_words: ['her', 'fern', 'bird', 'first', 'burn', 'hurt', 'perch', 'shirt', 'church'],
        concepts: ['er, ir, ur are spelling cousins - same sound', 'Must memorize which spelling for each word'],
        lesson_focus: 'Reading r-controlled vowels, spelling with correct choice'
      },
      {
        substep: '4.3',
        name: 'R-Controlled in Multisyllabic Words',
        skills: ['R-controlled syllable type', 'R-controlled in longer words'],
        sample_words: ['market', 'corner', 'perfect', 'surprise', 'cartoon', 'garden'],
        concepts: ['R-controlled syllable type: vowel + r'],
        lesson_focus: 'Syllable division with r-controlled syllables'
      }
    ]
  },
  {
    step: 5,
    name: 'Vowel Teams',
    substeps: [
      {
        substep: '5.1',
        name: 'AI/AY and OA/OW/OE',
        skills: ['ai (middle) and ay (end) say long a', 'oa, ow, oe say long o'],
        sample_words: ['rain', 'day', 'boat', 'snow', 'toe', 'train', 'play', 'float', 'show', 'hoe'],
        concepts: ['Position-based spelling: ai middle, ay end', 'When two vowels go walking, first does talking (sometimes)'],
        lesson_focus: 'Long a and long o vowel teams'
      },
      {
        substep: '5.2',
        name: 'EE/EA and IE/IGH',
        skills: ['ee and ea say long e', 'ie and igh say long i'],
        sample_words: ['feet', 'meat', 'tie', 'high', 'sleep', 'read', 'pie', 'night', 'green', 'light'],
        concepts: ['ea can also say short e (bread, head)', 'igh: three letters, one sound'],
        lesson_focus: 'Long e and long i vowel teams'
      },
      {
        substep: '5.3',
        name: 'Other Vowel Teams (OO, OU, EW, AU, AW)',
        skills: ['oo says /oo/ (moon) or /oo/ (book)', 'ou/ow say /ou/ as in out', 'ew/ue say /oo/', 'au/aw say /aw/'],
        sample_words: ['moon', 'book', 'out', 'cow', 'new', 'blue', 'auto', 'saw'],
        concepts: ['Some vowel teams have multiple sounds', 'Learn common patterns'],
        lesson_focus: 'Additional vowel team patterns'
      },
      {
        substep: '5.4',
        name: 'Vowel Teams in Multisyllabic Words',
        skills: ['Vowel team syllable type', 'Vowel teams in longer words'],
        sample_words: ['rainbow', 'toaster', 'fifteen', 'explain', 'mushroom', 'birthday'],
        concepts: ['Vowel team syllable type'],
        lesson_focus: 'Syllable division with vowel teams'
      }
    ]
  },
  {
    step: 6,
    name: 'Diphthongs & Advanced Patterns',
    substeps: [
      {
        substep: '6.1',
        name: 'Diphthongs (OI/OY, OU/OW)',
        skills: ['oi (middle) and oy (end) diphthong', 'ou and ow as diphthong /ou/'],
        sample_words: ['oil', 'boy', 'out', 'cow', 'coin', 'toy', 'loud', 'now', 'point', 'enjoy'],
        concepts: ['Diphthong: vowel sound that glides', 'Mouth position changes during sound'],
        lesson_focus: 'Diphthong reading and spelling'
      },
      {
        substep: '6.2',
        name: 'Advanced Suffixes',
        skills: ['-tion, -sion saying /shun/', '-ture saying /chur/', '-ous, -ious, -eous'],
        sample_words: ['nation', 'vision', 'nature', 'famous', 'curious', 'gorgeous'],
        concepts: ['Latin suffixes', 'Suffix pronunciation patterns'],
        lesson_focus: 'Advanced suffix patterns'
      },
      {
        substep: '6.3',
        name: 'Consonant-le Syllables',
        skills: ['Final -le syllable', '-ble, -cle, -dle, -fle, -gle, -kle, -ple, -tle, -zle'],
        sample_words: ['table', 'uncle', 'middle', 'raffle', 'eagle', 'ankle', 'simple', 'little', 'puzzle'],
        concepts: ['Consonant-le syllable: consonant + le', 'Divide before the consonant-le'],
        lesson_focus: 'Reading and dividing consonant-le words'
      },
      {
        substep: '6.4',
        name: 'Review and Complex Words',
        skills: ['All syllable types', 'Complex multisyllabic words', 'Morpheme awareness'],
        sample_words: ['uncomfortable', 'independent', 'transportation', 'automatically'],
        concepts: ['All six syllable types', 'Syllable division rules', 'Prefix, base, suffix identification'],
        lesson_focus: 'Comprehensive review and application'
      }
    ]
  }
];

export const WILSON_SYLLABLE_TYPES: WilsonSyllableType[] = [
  { type: 'closed', description: 'Ends in consonant, vowel is short', example: 'cat', marker: 'breve over vowel' },
  { type: 'vce', description: 'Vowel-consonant-silent e, vowel is long', example: 'make', marker: 'macron over vowel, cross out e' },
  { type: 'open', description: 'Ends in vowel, vowel is long', example: 'go', marker: 'macron over vowel' },
  { type: 'r-controlled', description: 'Vowel followed by r', example: 'car', marker: 'circle vowel-r' },
  { type: 'vowel_team', description: 'Two vowels together', example: 'rain', marker: 'box vowel team' },
  { type: 'consonant_le', description: 'Consonant + le at end', example: 'table', marker: 'box -le' }
];

// Wilson lesson structure (10 parts, adapted to 35-40 min)
export const WILSON_LESSON_COMPONENTS = [
  { name: 'Sound Cards', duration_minutes: 2, description: 'Review letter-sounds' },
  { name: 'Teach/Review Concepts', duration_minutes: 5, description: 'New skill, rules' },
  { name: 'Word Cards', duration_minutes: 2, description: 'Decode real words' },
  { name: 'Word List Reading', duration_minutes: 5, description: 'Real + nonsense words' },
  { name: 'Sentence Reading', duration_minutes: 3, description: 'Apply in sentences' },
  { name: 'Passage Reading', duration_minutes: 8, description: 'Controlled decodable' },
  { name: 'Quick Drill', duration_minutes: 2, description: 'Rapid review' },
  { name: 'Dictation: Sounds', duration_minutes: 2, description: 'Sound dictation' },
  { name: 'Dictation: Words', duration_minutes: 3, description: 'Word dictation' },
  { name: 'Dictation: Sentences', duration_minutes: 3, description: 'Sentence dictation' }
];

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

  return null; // End of curriculum
}
