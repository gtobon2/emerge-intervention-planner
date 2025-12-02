// EMERGE Intervention Planner - Scope & Sequence Data
// Complete curriculum progression data for Wilson, Delta Math, Camino, WordGen, Amira

// ============================================
// WILSON READING SYSTEM - STEPS 1-6
// ============================================

export const WILSON_SEQUENCE = {
  curriculum: 'wilson',
  name: 'Wilson Reading System',
  total_steps: 6,
  description: 'Structured literacy program for students with word-level reading difficulties',
  
  steps: [
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
          skills: ['Suffix -s and -es', 'Three sounds of -ed: /ĭd/, /d/, /t/', 'Suffix -ing', 'Identifying base words'],
          sample_words: ['cats', 'dishes', 'jumped', 'played', 'wanted', 'running', 'sitting', 'helps', 'foxes'],
          concepts: ['Suffix: word part added to end of base word', 'Base word + suffix', '-ed says /ĭd/ after t/d, /d/ after voiced, /t/ after unvoiced'],
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
          skills: ['ar says /är/ as in car', 'or says /ôr/ as in for'],
          sample_words: ['car', 'star', 'farm', 'hard', 'for', 'storm', 'horn', 'short', 'chart', 'porch'],
          nonsense_words: ['flar', 'blor', 'starp', 'clorn'],
          concepts: ['R-controlled: r changes the vowel sound', 'ar and or are distinct sounds'],
          lesson_focus: 'Reading and spelling ar and or words'
        },
        {
          substep: '4.2',
          name: 'Er, Ir, Ur',
          skills: ['er, ir, ur all say /ėr/', 'Spelling choices for /ėr/ sound'],
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
          skills: ['oo says /oo/ (moon) or /ŏŏ/ (book)', 'ou/ow say /ou/ as in out', 'ew/ue say /oo/', 'au/aw say /ô/'],
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
  ],
  
  syllable_types: [
    { type: 'closed', description: 'Ends in consonant, vowel is short', example: 'cat', marker: 'breve over vowel' },
    { type: 'vce', description: 'Vowel-consonant-silent e, vowel is long', example: 'make', marker: 'macron over vowel, cross out e' },
    { type: 'open', description: 'Ends in vowel, vowel is long', example: 'go', marker: 'macron over vowel' },
    { type: 'r-controlled', description: 'Vowel followed by r', example: 'car', marker: 'circle vowel-r' },
    { type: 'vowel_team', description: 'Two vowels together', example: 'rain', marker: 'box vowel team' },
    { type: 'consonant_le', description: 'Consonant + le at end', example: 'table', marker: 'box -le' }
  ]
};

// ============================================
// DELTA MATH - MATHEMATICS STANDARDS
// ============================================

export const DELTA_MATH_SEQUENCE = {
  curriculum: 'delta_math',
  name: 'Delta Math Intervention',
  description: 'Standards-based mathematics intervention using CRA approach',
  
  // Organized by grade level, then domain, then standard
  grades: {
    '3': {
      grade: 3,
      domains: [
        {
          domain: 'NBT',
          name: 'Number & Operations in Base Ten',
          standards: [
            {
              standard: '3.NBT.1',
              description: 'Round whole numbers to nearest 10 or 100',
              skills: ['Place value understanding', 'Number line placement', 'Rounding rules'],
              prerequisite_skills: ['Place value to 1000', 'Number comparison'],
              common_errors: ['Rounding up when should round down', 'Not identifying rounding digit'],
              cra_tools: {
                concrete: ['Number line floor mat', 'Base-10 blocks'],
                representational: ['Open number lines', 'Rounding charts'],
                abstract: ['Rounding rules', 'Mental math']
              }
            },
            {
              standard: '3.NBT.2',
              description: 'Add/subtract within 1000 using strategies and algorithms',
              skills: ['Regrouping in addition', 'Regrouping in subtraction', 'Multiple strategies'],
              prerequisite_skills: ['Place value', 'Basic addition/subtraction facts'],
              common_errors: ['Forgetting to regroup', 'Regrouping errors', 'Subtracting smaller from larger regardless of position'],
              cra_tools: {
                concrete: ['Base-10 blocks', 'Place value mats'],
                representational: ['Place value charts', 'Expanded form'],
                abstract: ['Standard algorithm']
              }
            }
          ]
        },
        {
          domain: 'NF',
          name: 'Number & Operations—Fractions',
          standards: [
            {
              standard: '3.NF.1',
              description: 'Understand fractions as parts of a whole',
              skills: ['Unit fractions', 'Numerator/denominator meaning', 'Fraction notation'],
              prerequisite_skills: ['Equal parts', 'Part-whole relationship'],
              common_errors: ['Confusing numerator and denominator', 'Not making equal parts'],
              cra_tools: {
                concrete: ['Fraction tiles', 'Fraction circles', 'Pattern blocks'],
                representational: ['Area models', 'Number lines'],
                abstract: ['Fraction notation']
              }
            }
          ]
        }
      ]
    },
    '4': {
      grade: 4,
      domains: [
        {
          domain: 'NBT',
          name: 'Number & Operations in Base Ten',
          standards: [
            {
              standard: '4.NBT.4',
              description: 'Add/subtract multi-digit whole numbers using standard algorithm',
              skills: ['Standard addition algorithm', 'Standard subtraction algorithm', 'Regrouping across zeros'],
              prerequisite_skills: ['3.NBT.2', 'Place value to millions'],
              common_errors: ['Regrouping across zeros', 'Alignment errors', 'Computation errors'],
              cra_tools: {
                concrete: ['Base-10 blocks'],
                representational: ['Place value charts', 'Expanded form'],
                abstract: ['Standard algorithm']
              }
            },
            {
              standard: '4.NBT.5',
              description: 'Multiply up to 4-digit by 1-digit, and 2-digit by 2-digit',
              skills: ['Partial products', 'Area model', 'Standard algorithm'],
              prerequisite_skills: ['Multiplication facts', 'Place value'],
              common_errors: ['Place value errors in partial products', 'Forgetting to add partial products'],
              cra_tools: {
                concrete: ['Base-10 blocks', 'Arrays'],
                representational: ['Area model', 'Partial products'],
                abstract: ['Standard algorithm']
              }
            },
            {
              standard: '4.NBT.6',
              description: 'Divide up to 4-digit by 1-digit with remainders',
              skills: ['Partial quotients', 'Standard algorithm', 'Interpreting remainders'],
              prerequisite_skills: ['Division facts', 'Place value', 'Multiplication'],
              common_errors: ['Place value errors in quotient', 'Forgetting to bring down', 'Remainder errors'],
              cra_tools: {
                concrete: ['Base-10 blocks for grouping'],
                representational: ['Partial quotients', 'Arrays'],
                abstract: ['Standard algorithm']
              }
            }
          ]
        },
        {
          domain: 'NF',
          name: 'Number & Operations—Fractions',
          standards: [
            {
              standard: '4.NF.1',
              description: 'Explain equivalent fractions using visual models',
              skills: ['Equivalent fractions', 'Multiplying/dividing by form of 1'],
              prerequisite_skills: ['3.NF.1', 'Basic multiplication'],
              common_errors: ['Adding instead of multiplying', 'Only multiplying numerator or denominator'],
              cra_tools: {
                concrete: ['Fraction bars', 'Fraction circles'],
                representational: ['Area models', 'Number lines'],
                abstract: ['Multiplication method']
              }
            },
            {
              standard: '4.NF.2',
              description: 'Compare fractions with different numerators and denominators',
              skills: ['Common denominators', 'Benchmark fractions', 'Cross multiplication'],
              prerequisite_skills: ['4.NF.1', 'Equivalent fractions'],
              common_errors: ['Comparing numerators without common denominator', 'Thinking larger denominator = larger fraction'],
              cra_tools: {
                concrete: ['Fraction bars side by side'],
                representational: ['Number lines', 'Area models'],
                abstract: ['Common denominator method']
              }
            },
            {
              standard: '4.NF.3c',
              description: 'Add/subtract fractions with like denominators',
              skills: ['Adding numerators', 'Keeping common denominator', 'Simplifying'],
              prerequisite_skills: ['Fraction meaning', 'Basic addition/subtraction'],
              common_errors: ['Adding denominators too', 'Not simplifying'],
              cra_tools: {
                concrete: ['Fraction bars'],
                representational: ['Area models', 'Number lines'],
                abstract: ['Procedure']
              }
            },
            {
              standard: '4.NF.4b',
              description: 'Multiply a fraction by a whole number',
              skills: ['Repeated addition model', 'Multiplication of fractions'],
              prerequisite_skills: ['4.NF.3', 'Multiplication meaning'],
              common_errors: ['Multiplying denominator too', 'Expecting product to be larger'],
              cra_tools: {
                concrete: ['Fraction bars'],
                representational: ['Area models', 'Repeated addition'],
                abstract: ['Multiplication procedure']
              }
            }
          ]
        }
      ]
    },
    '5': {
      grade: 5,
      domains: [
        {
          domain: 'NBT',
          name: 'Number & Operations in Base Ten',
          standards: [
            {
              standard: '5.NBT.1',
              description: 'Recognize place value patterns (10x relationship)',
              skills: ['Powers of 10', 'Place value relationships', 'Decimal place value'],
              prerequisite_skills: ['4.NBT place value', 'Multiplication by 10'],
              common_errors: ['Not recognizing decimal patterns', 'Confusion with zero placeholders'],
              cra_tools: {
                concrete: ['Base-10 blocks including flats for decimals'],
                representational: ['Place value charts', 'Patterns'],
                abstract: ['Powers of 10 notation']
              }
            },
            {
              standard: '5.NBT.3',
              description: 'Read, write, compare decimals to thousandths',
              skills: ['Decimal place value', 'Decimal comparison', 'Decimal equivalence'],
              prerequisite_skills: ['Fraction-decimal connection', '4th grade decimals'],
              common_errors: ['Longer decimal = larger', 'Treating decimals as whole numbers'],
              cra_tools: {
                concrete: ['Decimats (10x10 grids)', 'Money'],
                representational: ['Place value charts', 'Number lines'],
                abstract: ['Comparison symbols']
              }
            },
            {
              standard: '5.NBT.7',
              description: 'Add, subtract, multiply, divide decimals to hundredths',
              skills: ['Decimal operations', 'Place value alignment', 'Estimation'],
              prerequisite_skills: ['5.NBT.3', 'Whole number operations'],
              common_errors: ['Misaligning decimal points', 'Ignoring decimal in multiplication'],
              cra_tools: {
                concrete: ['Decimats', 'Money'],
                representational: ['Area models', 'Number lines'],
                abstract: ['Standard algorithms with decimals']
              }
            }
          ]
        },
        {
          domain: 'NF',
          name: 'Number & Operations—Fractions',
          standards: [
            {
              standard: '5.NF.1',
              description: 'Add/subtract fractions with unlike denominators',
              skills: ['Finding common denominators', 'Equivalent fractions', 'Adding/subtracting'],
              prerequisite_skills: ['4.NF.1', '4.NF.3c'],
              common_errors: ['Adding without common denominator', 'Adding denominators'],
              cra_tools: {
                concrete: ['Fraction bars'],
                representational: ['Area models', 'Number lines'],
                abstract: ['LCD procedure']
              }
            },
            {
              standard: '5.NF.4',
              description: 'Multiply fractions and whole numbers',
              skills: ['Fraction × whole number', 'Fraction × fraction', 'Area model for fractions'],
              prerequisite_skills: ['4.NF.4', 'Fraction meaning'],
              common_errors: ['Expecting larger product', 'Multiplying denominators incorrectly'],
              cra_tools: {
                concrete: ['Fraction bars', 'Paper folding'],
                representational: ['Area models'],
                abstract: ['Multiplication procedure']
              }
            },
            {
              standard: '5.NF.7',
              description: 'Divide unit fractions and whole numbers',
              skills: ['Whole number ÷ unit fraction', 'Unit fraction ÷ whole number'],
              prerequisite_skills: ['Division meaning', 'Fraction understanding'],
              common_errors: ['Inverting wrong number', 'Not understanding "how many X fit in Y"'],
              cra_tools: {
                concrete: ['Fraction bars', 'Measurement contexts'],
                representational: ['Number lines', 'Visual models'],
                abstract: ['Reciprocal method']
              }
            }
          ]
        }
      ]
    }
  },
  
  intervention_cycle: {
    sessions_per_standard: 8,
    cycle: [
      { session: 1, phase: 'concrete', focus: 'Diagnostic & introduce with manipulatives' },
      { session: 2, phase: 'concrete', focus: 'Hands-on practice with manipulatives' },
      { session: 3, phase: 'transitional', focus: 'Concrete to representational bridge' },
      { session: 4, phase: 'representational', focus: 'Visual models and diagrams' },
      { session: 5, phase: 'transitional', focus: 'Representational to abstract bridge' },
      { session: 6, phase: 'abstract', focus: 'Procedural fluency' },
      { session: 7, phase: 'mixed', focus: 'Mixed practice and word problems' },
      { session: 8, phase: 'assessment', focus: 'Post-assess and identify remaining gaps' }
    ]
  }
};

// ============================================
// CAMINO A LA LECTURA - SPANISH READING
// ============================================

export const CAMINO_SEQUENCE = {
  curriculum: 'camino',
  name: 'Camino a la Lectura',
  total_weeks: 40,
  total_lessons: 40,
  description: 'Systematic Spanish reading intervention for K-3 struggling readers',
  
  phases: [
    {
      phase: 1,
      name: 'Vocales y Primeras Consonantes (Vowels & First Consonants)',
      weeks: '1-10',
      lessons: [
        {
          lesson: 1,
          week: 1,
          focus: 'Vocales: a, e, i, o, u',
          skills: ['5 vowel sounds', 'Vowel identification', 'Consistent vowel pronunciation'],
          syllables: ['a', 'e', 'i', 'o', 'u'],
          sample_words: ['ojo', 'oso', 'ala', 'uva', 'Eva'],
          pa_focus: 'Vowel identification and isolation',
          decodable: null
        },
        {
          lesson: 2,
          week: 2,
          focus: 'Letra M',
          skills: ['M sound /m/', 'CV syllables with m', 'Blending ma-me-mi-mo-mu'],
          syllables: ['ma', 'me', 'mi', 'mo', 'mu'],
          sample_words: ['mamá', 'mapa', 'mía', 'mula', 'ama', 'amo'],
          pa_focus: 'Syllable blending',
          decodable: 'Book 1: Mi Mamá'
        },
        {
          lesson: 3,
          week: 3,
          focus: 'Letra P',
          skills: ['P sound /p/', 'CV syllables with p', 'Two-syllable words'],
          syllables: ['pa', 'pe', 'pi', 'po', 'pu'],
          sample_words: ['papá', 'puma', 'pipa', 'Pepe', 'mapa', 'mopa'],
          pa_focus: 'Syllable segmenting',
          decodable: 'Book 2: Pepe y Papá'
        },
        {
          lesson: 4,
          week: 4,
          focus: 'Letra L',
          skills: ['L sound /l/', 'CV syllables with l', 'Blending with previous letters'],
          syllables: ['la', 'le', 'li', 'lo', 'lu'],
          sample_words: ['loma', 'lima', 'lupa', 'pelo', 'pala', 'mula'],
          pa_focus: 'Initial sound isolation',
          decodable: 'Book 3: La Loma'
        },
        {
          lesson: 5,
          week: 5,
          focus: 'Repaso M, P, L',
          skills: ['Review m, p, l', 'CVC combinations', 'Two-syllable word fluency'],
          syllables: ['ma', 'me', 'mi', 'mo', 'mu', 'pa', 'pe', 'pi', 'po', 'pu', 'la', 'le', 'li', 'lo', 'lu'],
          sample_words: ['mapa', 'pala', 'pelo', 'loma', 'Lupe', 'mula', 'puma'],
          pa_focus: 'Syllable manipulation',
          decodable: 'Book 4: Mapa de Lupe'
        },
        {
          lesson: 6,
          week: 6,
          focus: 'Letra S',
          skills: ['S sound /s/', 'CV syllables with s', 'Final s'],
          syllables: ['sa', 'se', 'si', 'so', 'su'],
          sample_words: ['sopa', 'mesa', 'asa', 'suma', 'piso', 'oso'],
          pa_focus: 'Final sound isolation',
          decodable: 'Book 5: La Sopa'
        },
        {
          lesson: 7,
          week: 7,
          focus: 'Letra T',
          skills: ['T sound /t/', 'CV syllables with t', 'Three-letter combinations'],
          syllables: ['ta', 'te', 'ti', 'to', 'tu'],
          sample_words: ['tapa', 'toma', 'tela', 'ata', 'pato', 'moto'],
          pa_focus: 'Phoneme blending',
          decodable: 'Book 6: El Pato'
        },
        {
          lesson: 8,
          week: 8,
          focus: 'Letra D',
          skills: ['D sound /d/', 'CV syllables with d', 'D vs T contrast'],
          syllables: ['da', 'de', 'di', 'do', 'du'],
          sample_words: ['dedo', 'día', 'soda', 'lodo', 'moda', 'dama'],
          pa_focus: 'Phoneme segmenting',
          decodable: 'Book 7: El Dedo'
        },
        {
          lesson: 9,
          week: 9,
          focus: 'Repaso S, T, D',
          skills: ['Review s, t, d', 'Multi-syllabic words', 'Fluency building'],
          syllables: ['All Phase 1 syllables'],
          sample_words: ['pelota', 'semilla', 'patata', 'tomate', 'salida', 'pesado'],
          pa_focus: 'Phoneme manipulation',
          decodable: 'Book 8: La Pelota'
        },
        {
          lesson: 10,
          week: 10,
          focus: 'Evaluación Unidad 1',
          skills: ['Assessment of Phase 1', 'All vowels', 'All Phase 1 consonants'],
          syllables: ['All Phase 1'],
          sample_words: ['Assessment words'],
          pa_focus: 'Full PA battery',
          decodable: 'Books 9-10: Assessment texts'
        }
      ]
    },
    {
      phase: 2,
      name: 'Consonantes Adicionales (Additional Consonants)',
      weeks: '11-20',
      lessons: [
        {
          lesson: 11,
          week: 11,
          focus: 'Letra N',
          skills: ['N sound /n/', 'CV syllables with n', 'N vs M contrast'],
          syllables: ['na', 'ne', 'ni', 'no', 'nu'],
          sample_words: ['nena', 'mano', 'luna', 'uno', 'mono', 'nido'],
          pa_focus: 'Rhyming',
          decodable: 'Book 11'
        },
        {
          lesson: 12,
          week: 12,
          focus: 'Letra R (suave)',
          skills: ['R tap sound /ɾ/', 'CV syllables with r', 'R between vowels'],
          syllables: ['ra', 're', 'ri', 'ro', 'ru'],
          sample_words: ['ratón', 'pera', 'río', 'caro', 'loro', 'toro'],
          pa_focus: 'Sound matching',
          decodable: 'Book 12'
        },
        {
          lesson: 13,
          week: 13,
          focus: 'Letra C (fuerte: ca, co, cu)',
          skills: ['Hard C sound /k/', 'Ca, co, cu syllables'],
          syllables: ['ca', 'co', 'cu'],
          sample_words: ['casa', 'poco', 'cuna', 'saco', 'loco', 'cama'],
          pa_focus: 'Syllable deletion',
          decodable: 'Book 13'
        },
        {
          lesson: 14,
          week: 14,
          focus: 'Letra C (suave: ce, ci)',
          skills: ['Soft C sound /s/', 'Ce, ci syllables', 'C spelling rule'],
          syllables: ['ce', 'ci'],
          sample_words: ['cena', 'cine', 'dulce', 'cero', 'cielo', 'lucir'],
          pa_focus: 'Syllable addition',
          decodable: 'Book 14'
        },
        {
          lesson: 15,
          week: 15,
          focus: 'Repaso N, R, C',
          skills: ['Review n, r, c', 'Multi-syllabic words', 'Hard/soft c patterns'],
          syllables: ['All n, r, c syllables'],
          sample_words: ['corona', 'canela', 'perico', 'cocina', 'cereza'],
          pa_focus: 'Blending complex words',
          decodable: 'Book 15'
        },
        {
          lesson: 16,
          week: 16,
          focus: 'Letra B',
          skills: ['B sound /b/', 'CV syllables with b', 'B/V same sound in Spanish'],
          syllables: ['ba', 'be', 'bi', 'bo', 'bu'],
          sample_words: ['boca', 'lobo', 'Cuba', 'beso', 'sube', 'bueno'],
          pa_focus: 'Segmenting',
          decodable: 'Book 16'
        },
        {
          lesson: 17,
          week: 17,
          focus: 'Letra G (fuerte: ga, go, gu)',
          skills: ['Hard G sound /g/', 'Ga, go, gu syllables'],
          syllables: ['ga', 'go', 'gu'],
          sample_words: ['gato', 'lago', 'águila', 'gota', 'gusano', 'amigo'],
          pa_focus: 'Sound substitution',
          decodable: 'Book 17'
        },
        {
          lesson: 18,
          week: 18,
          focus: 'Letras F, V',
          skills: ['F sound /f/', 'V sound /b/ (same as B)', 'F and V syllables'],
          syllables: ['fa', 'fe', 'fi', 'fo', 'fu', 'va', 've', 'vi', 'vo', 'vu'],
          sample_words: ['foca', 'café', 'vaca', 'uva', 'fila', 'favor'],
          pa_focus: 'Phoneme deletion',
          decodable: 'Book 18'
        },
        {
          lesson: 19,
          week: 19,
          focus: 'Letras Z, J, Ñ',
          skills: ['Z sound /s/', 'J sound /x/', 'Ñ sound /ɲ/', 'Special letters'],
          syllables: ['za', 'zo', 'zu', 'ja', 'je', 'ji', 'jo', 'ju', 'ña', 'ñe', 'ñi', 'ño', 'ñu'],
          sample_words: ['zapato', 'jugo', 'niño', 'zumo', 'ojo', 'año', 'leña'],
          pa_focus: 'Phoneme addition',
          decodable: 'Book 19'
        },
        {
          lesson: 20,
          week: 20,
          focus: 'Evaluación Unidad 2',
          skills: ['Assessment of Phase 2', 'All consonants', 'All CV syllables'],
          syllables: ['All syllables taught'],
          sample_words: ['Assessment words'],
          pa_focus: 'Full review',
          decodable: 'Book 20'
        }
      ]
    },
    {
      phase: 3,
      name: 'Dígrafos y Letras Dobles (Digraphs & Double Letters)',
      weeks: '21-28',
      lessons: [
        { lesson: 21, week: 21, focus: 'Dígrafo CH', syllables: ['cha', 'che', 'chi', 'cho', 'chu'], sample_words: ['chico', 'leche', 'noche', 'mucho', 'cuchara'] },
        { lesson: 22, week: 22, focus: 'Dígrafo LL', syllables: ['lla', 'lle', 'lli', 'llo', 'llu'], sample_words: ['llama', 'calle', 'pollo', 'silla', 'lluvia'] },
        { lesson: 23, week: 23, focus: 'Dígrafo RR (erre)', syllables: ['rra', 'rre', 'rri', 'rro', 'rru'], sample_words: ['perro', 'carro', 'torre', 'tierra', 'burro'] },
        { lesson: 24, week: 24, focus: 'Combinación QU', syllables: ['que', 'qui'], sample_words: ['queso', 'paquete', 'quito', 'pequeño', 'mosquito'] },
        { lesson: 25, week: 25, focus: 'Repaso CH, LL, RR, QU', syllables: ['All digraphs'], sample_words: ['mochila', 'tortilla', 'perrito', 'chiquito'] },
        { lesson: 26, week: 26, focus: 'Letra H (muda)', syllables: ['ha', 'he', 'hi', 'ho', 'hu'], sample_words: ['hola', 'ahora', 'hilo', 'hijo', 'hermano'] },
        { lesson: 27, week: 27, focus: 'Diptongos', syllables: ['ai', 'ei', 'oi', 'au', 'eu', 'ou'], sample_words: ['baile', 'peine', 'auto', 'Europa', 'boina'] },
        { lesson: 28, week: 28, focus: 'Evaluación Unidad 3', syllables: ['All digraphs'], sample_words: ['Assessment words'] }
      ]
    },
    {
      phase: 4,
      name: 'Grupos Consonánticos (Consonant Blends)',
      weeks: '29-36',
      lessons: [
        { lesson: 29, week: 29, focus: 'Grupos con L (bl, cl, fl, gl, pl)', sample_words: ['blanco', 'clase', 'flor', 'globo', 'plato'] },
        { lesson: 30, week: 30, focus: 'Grupos con R - Parte 1 (br, cr, dr)', sample_words: ['brazo', 'crema', 'drama', 'brisa', 'cruz'] },
        { lesson: 31, week: 31, focus: 'Grupos con R - Parte 2 (fr, gr, pr, tr)', sample_words: ['fresa', 'grande', 'primo', 'tren', 'fruta'] },
        { lesson: 32, week: 32, focus: 'Práctica mixta de grupos', sample_words: ['biblioteca', 'problema', 'cristal', 'trabajo'] },
        { lesson: 33, week: 33, focus: 'División silábica', sample_words: ['pa-lo-ma', 'ár-bol', 'cam-pa-na'] },
        { lesson: 34, week: 34, focus: 'Acentuación básica', sample_words: ['pá-ja-ro', 'ca-fé', 'te-lé-fo-no'] },
        { lesson: 35, week: 35, focus: 'Palabras multisilábicas complejas', sample_words: ['mariposa', 'elefante', 'biblioteca'] },
        { lesson: 36, week: 36, focus: 'Evaluación Unidad 4', sample_words: ['Assessment words'] }
      ]
    },
    {
      phase: 5,
      name: 'Habilidades Avanzadas y Repaso (Advanced Skills & Review)',
      weeks: '37-40',
      lessons: [
        { lesson: 37, week: 37, focus: 'Fluidez lectora', activities: ['Repeated reading', 'Echo reading', 'Timed reading'] },
        { lesson: 38, week: 38, focus: 'Estrategias de comprensión', activities: ['Predicting', 'Questioning', 'Summarizing'] },
        { lesson: 39, week: 39, focus: 'Transición a textos auténticos', activities: ['Leveled readers', 'Text selection'] },
        { lesson: 40, week: 40, focus: 'Evaluación Final', activities: ['Comprehensive assessment', 'Exit criteria evaluation'] }
      ]
    }
  ],
  
  fluency_benchmarks: {
    weeks_1_10: { wcpm_target: '10-20', accuracy: '90%+' },
    weeks_11_20: { wcpm_target: '20-40', accuracy: '92%+' },
    weeks_21_28: { wcpm_target: '40-60', accuracy: '94%+' },
    weeks_29_36: { wcpm_target: '60-80', accuracy: '96%+' },
    weeks_37_40: { wcpm_target: '80-100+', accuracy: '98%+' }
  }
};

// ============================================
// WORDGEN - VOCABULARY INTERVENTION
// ============================================

export const WORDGEN_SEQUENCE = {
  curriculum: 'wordgen',
  name: 'WordGen Academic Vocabulary',
  description: 'Academic vocabulary instruction through content-area discussions',
  
  series_1: {
    units: [
      { unit: 1, topic: 'Should violent video games be banned?', focus_words: ['violence', 'influence', 'regulate', 'behavior', 'evidence'] },
      { unit: 2, topic: 'Is homework helpful or harmful?', focus_words: ['assignment', 'achievement', 'require', 'benefit', 'effective'] },
      { unit: 3, topic: 'Should schools have dress codes?', focus_words: ['uniform', 'identity', 'express', 'policy', 'appropriate'] },
      { unit: 4, topic: 'Should junk food be banned in schools?', focus_words: ['nutrition', 'obesity', 'prohibit', 'health', 'consume'] },
      { unit: 5, topic: 'Is technology helpful for learning?', focus_words: ['device', 'distraction', 'access', 'digital', 'resource'] },
      // ... additional units
    ],
    
    daily_cycle: [
      { day: 1, focus: 'Word Introduction', activities: ['Preview topic', 'Introduce 5 words', 'Read Text 1', 'Word recording'] },
      { day: 2, focus: 'Word Analysis', activities: ['Word parts', 'Context clues', 'Word relationships', 'Multiple meanings'] },
      { day: 3, focus: 'Discussion', activities: ['Read Text 2', 'Compare perspectives', 'Structured discussion', 'Use target words'] },
      { day: 4, focus: 'Writing', activities: ['Argument writing', 'Use evidence', 'Use target words', 'Peer review'] },
      { day: 5, focus: 'Assessment', activities: ['Vocabulary quiz', 'Word use check', 'Extension activities'] }
    ]
  }
};

// ============================================
// AMIRA - AI READING TUTOR
// ============================================

export const AMIRA_SEQUENCE = {
  curriculum: 'amira',
  name: 'Amira Learning',
  description: 'AI-powered reading tutor with real-time micro-interventions',
  
  // Amira is adaptive - no fixed sequence
  // Track levels and progress metrics instead
  
  level_progression: {
    levels: ['Emergent', 'Beginning', 'Transitional', 'Fluent'],
    metrics: ['accuracy', 'wcpm', 'fluency_score', 'comprehension']
  },
  
  session_structure: {
    warm_up: '3-5 min',
    oral_reading: '15-20 min',
    comprehension: '5-8 min',
    summary: '2-3 min'
  },
  
  teacher_dashboard_metrics: [
    'Accuracy percentage',
    'Words correct per minute (WCPM)',
    'Fluency score (1-4)',
    'Comprehension score',
    'Time on task',
    'Skills flagged for intervention'
  ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getWilsonPosition(step: number, substep: string) {
  const stepData = WILSON_SEQUENCE.steps.find(s => s.step === step);
  if (!stepData) return null;
  return stepData.substeps.find(ss => ss.substep === substep);
}

export function getCaminoLesson(lessonNumber: number) {
  for (const phase of CAMINO_SEQUENCE.phases) {
    const lesson = phase.lessons?.find(l => l.lesson === lessonNumber);
    if (lesson) return { ...lesson, phase: phase.name };
  }
  return null;
}

export function getMathStandard(standard: string) {
  for (const [gradeKey, gradeData] of Object.entries(DELTA_MATH_SEQUENCE.grades)) {
    for (const domain of gradeData.domains) {
      const found = domain.standards.find(s => s.standard === standard);
      if (found) return { ...found, grade: gradeData.grade, domain: domain.name };
    }
  }
  return null;
}

export function getNextPosition(curriculum: string, currentPosition: any) {
  // Returns the next position in sequence for a given curriculum
  // Implementation depends on curriculum type
  switch (curriculum) {
    case 'wilson':
      // Logic to get next Wilson substep
      break;
    case 'camino':
      // Logic to get next Camino lesson
      break;
    case 'delta_math':
      // Logic to get next standard in intervention cycle
      break;
    default:
      return null;
  }
}
