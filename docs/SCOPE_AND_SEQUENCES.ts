// EMERGE Intervention Planner - Scope & Sequence Data
// Complete curriculum progression data for Wilson, Delta Math, Camino, WordGen, Amira
//
// NOTE: For Wilson, the source of truth is src/lib/curriculum/wilson.ts
// This file mirrors that data for documentation purposes

// ============================================
// WILSON READING SYSTEM - STEPS 1-6
// Official Wilson Language Training Scope & Sequence
// ============================================

export const WILSON_SEQUENCE = {
  curriculum: 'wilson',
  name: 'Wilson Reading System',
  total_steps: 6,
  description: 'Structured literacy program for students with word-level reading difficulties',

  steps: [
    {
      step: 1,
      name: 'Closed Syllables (3 Sounds)',
      substeps: [
        {
          substep: '1.1',
          name: 'Basic Consonants & Short Vowels a, i, o',
          skills: ['Consonants: f, l, m, n, r, s (initial); d, g, p, t (final)', 'Short vowels: a, i, o', 'Sound tapping', 'Blending CVC words'],
          sample_words: ['sat', 'sit', 'lot', 'fan', 'rim', 'top', 'fin', 'dog', 'map', 'rag'],
          nonsense_words: ['dit', 'fom', 'nas', 'lig', 'mot'],
          concepts: ['Closed syllable: vowel is "closed in" by consonant, making it short', 'Every syllable has one vowel sound', 'Tap each sound, then blend'],
          lesson_focus: 'Sound-symbol correspondence for basic consonants and short a, i, o'
        },
        {
          substep: '1.2',
          name: 'Additional Consonants, Digraphs & Short Vowels u, e',
          skills: ['Consonants: b, h, j, c, k, ck, v, w, x, y, z', 'Digraphs: sh, ch, th, wh, qu', 'Short vowels: u, e', 'Digraphs as single sound units'],
          sample_words: ['bed', 'cup', 'ship', 'chop', 'thin', 'when', 'quit', 'back', 'yes', 'box'],
          nonsense_words: ['sheb', 'thup', 'chod', 'whem', 'quiv'],
          concepts: ['Digraph: two letters that make ONE sound', 'Tap once for digraphs', 'ck used after short vowel at end of one-syllable word'],
          lesson_focus: 'Introducing digraphs and completing short vowel sounds'
        },
        {
          substep: '1.3',
          name: 'Three-Sound Words with Digraphs',
          skills: ['Reading and spelling CVC words with digraphs', 'All five short vowels', 'Initial and final digraph positions'],
          sample_words: ['wish', 'chop', 'wet', 'them', 'such', 'with', 'shed', 'chest', 'whip', 'shut'],
          nonsense_words: ['chib', 'shum', 'thock', 'whep', 'chud'],
          concepts: ['Apply digraph knowledge in full word reading', 'Digraphs can appear at beginning or end of words', 'Continue tapping with digraphs as single units'],
          lesson_focus: 'Fluent reading and spelling of three-sound words including digraphs'
        },
        {
          substep: '1.4',
          name: 'Bonus Letters (FLOSS Rule) & Welded Sound /all/',
          skills: ['FLOSS rule: double f, l, s, z after short vowel', 'Bonus letters in one-syllable words', 'Welded sound /all/'],
          sample_words: ['off', 'bill', 'miss', 'buzz', 'call', 'cliff', 'smell', 'dress', 'fuzz', 'stall'],
          nonsense_words: ['beff', 'woss', 'glill', 'tuzz', 'chall'],
          concepts: ['FLOSS rule: f, l, s, z double after short vowel in one-syllable word', 'Bonus letters make one sound, tap once', 'Welded /all/ - tap with fingers together'],
          lesson_focus: 'Applying FLOSS rule and introducing first welded sound'
        },
        {
          substep: '1.5',
          name: 'Welded Sounds /am/ and /an/',
          skills: ['Welded sound /am/', 'Welded sound /an/', 'Nasalized vowel sounds'],
          sample_words: ['ham', 'fan', 'jam', 'man', 'clam', 'plan', 'slam', 'than', 'swam', 'scan'],
          nonsense_words: ['blam', 'stran', 'glam', 'thran'],
          concepts: ['Welded sounds stay together as a unit', 'Tap with two fingers stuck together for welded sounds', 'Vowel sound changes slightly before m and n'],
          lesson_focus: 'Reading and spelling welded /am/ and /an/ patterns'
        },
        {
          substep: '1.6',
          name: 'Suffixes -s and -es',
          skills: ['Suffix -s with unchanging base words', 'Suffix -es after s, x, z, ch, sh', 'Identifying base word + suffix'],
          sample_words: ['cats', 'dogs', 'bugs', 'dishes', 'foxes', 'wishes', 'boxes', 'chills', 'quizzes', 'brushes'],
          concepts: ['Suffix: word part added to end of base word', 'Base word + suffix = new word', 'Add -es when word ends in s, x, z, ch, sh'],
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
          skills: ['Welded sounds: ang, ing, ong, ung', 'Welded sounds: ank, ink, onk, unk', 'Nasalized vowel + velar sounds'],
          sample_words: ['bang', 'ring', 'song', 'hung', 'bank', 'pink', 'honk', 'bunk', 'clang', 'drink'],
          nonsense_words: ['glang', 'prink', 'blonk', 'stunk', 'thring'],
          concepts: ['ng and nk are welded to the vowel before them', 'Tap these as welded units (2-3 fingers together)', 'The vowel sound changes before ng and nk'],
          lesson_focus: 'Mastering all welded sound patterns'
        },
        {
          substep: '2.2',
          name: 'Closed Syllables with 4 Sounds (Initial Blends)',
          skills: ['Initial blends: bl, cl, fl, gl, pl, sl', 'Initial blends: br, cr, dr, fr, gr, pr, tr', 'Initial blends: sc, sk, sm, sn, sp, st, sw'],
          sample_words: ['stop', 'clap', 'blast', 'from', 'step', 'grab', 'swim', 'plan', 'trip', 'sled'],
          nonsense_words: ['blom', 'stup', 'frap', 'glin', 'swem'],
          concepts: ['Blend: each consonant sound is heard', 'Tap each sound in a blend separately', 'Keep blends together when dividing syllables'],
          lesson_focus: 'Reading and spelling CCVC words with initial blends'
        },
        {
          substep: '2.3',
          name: 'Closed Syllable Exceptions',
          skills: ['Exception patterns: -ild, -ind (long i)', 'Exception patterns: -old, -olt, -ost (long o)', 'Recognizing when vowel is long in closed syllable'],
          sample_words: ['wild', 'child', 'mind', 'find', 'kind', 'cold', 'gold', 'bolt', 'most', 'host'],
          concepts: ['Some closed syllables have long vowels (exceptions)', 'Common exception patterns to memorize', 'i before ld/nd often says long i; o before ld/lt/st often says long o'],
          lesson_focus: 'Recognizing closed syllable exceptions with long vowels'
        },
        {
          substep: '2.4',
          name: 'Closed Syllables with 5 Sounds (Final Blends)',
          skills: ['Final blends: ft, lt, mp, nd, nt, pt', 'Final blends: sk, sp, st', 'Words with both initial and final blends'],
          sample_words: ['clamp', 'blend', 'trunk', 'crisp', 'stamp', 'split', 'drift', 'frost', 'stunt', 'clasp'],
          nonsense_words: ['blund', 'strift', 'glimp', 'crast', 'flond'],
          concepts: ['Final blends follow the vowel', 'Each sound in a blend is tapped', 'CCVCC pattern words'],
          lesson_focus: 'Reading and spelling words with initial and final blends'
        },
        {
          substep: '2.5',
          name: 'Three-Letter Blends (Up to 6 Sounds)',
          skills: ['Three-letter blends: scr, spl, spr, str, thr', 'CCCVCC pattern words', 'Complex consonant clusters'],
          sample_words: ['strand', 'string', 'scrimp', 'splash', 'sprint', 'strong', 'script', 'shrimp', 'throb', 'strap'],
          nonsense_words: ['strig', 'splund', 'scramp', 'thrist', 'spronk'],
          concepts: ['Three-letter blends: each sound still heard', 'Complex words require careful tapping', 'Maximum 6 sounds in one-syllable closed words'],
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
          skills: ['Spotting and dotting vowels', 'VCCV pattern: divide between consonants', 'Applying closed syllable rules to each part'],
          sample_words: ['napkin', 'rabbit', 'sudden', 'puppet', 'picnic', 'helmet', 'contest', 'subject', 'mascot', 'husband'],
          concepts: ['Spot and dot vowels first', 'VCCV: divide between the two consonants', 'Each syllable has one vowel sound', 'Apply closed syllable rule to each syllable'],
          lesson_focus: 'Dividing and decoding VCCV pattern words'
        },
        {
          substep: '3.2',
          name: 'Words with -ct Blend',
          skills: ['Final -ct blend in multisyllabic words', 'Keeping -ct together in division', 'Common -ct words'],
          sample_words: ['exact', 'contact', 'insect', 'compact', 'instinct', 'distinct', 'abstract', 'subtract', 'conduct', 'conflict'],
          concepts: ['ct blend stays together', 'Divide before the ct blend', 'Common pattern in two-syllable words'],
          lesson_focus: 'Reading and spelling words with -ct blend'
        },
        {
          substep: '3.3',
          name: 'Compound Closed Syllable Words',
          skills: ['Compound words with closed syllables', 'Recognizing two base words', 'Division at compound boundary'],
          sample_words: ['sunlit', 'bathtub', 'catnap', 'sunset', 'hatbox', 'hotdog', 'inkblot', 'zigzag', 'lipstick', 'eggnog'],
          concepts: ['Compound word = two words joined together', 'Divide at the compound boundary', 'Apply syllable rules to each part'],
          lesson_focus: 'Recognizing and decoding compound words'
        },
        {
          substep: '3.4',
          name: 'Three-Syllable Closed Words',
          skills: ['Three-syllable division', 'Multiple division points', 'Blends and digraphs in longer words'],
          sample_words: ['fantastic', 'establish', 'Wisconsin', 'Atlantic', 'September', 'instruction', 'subtraction', 'subscription', 'transcription', 'manuscript'],
          concepts: ['Apply division rules at each VCCV pattern', 'Keep digraphs and blends together', 'Decode one syllable at a time'],
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
          skills: ['VCe syllable pattern recognition', 'Silent e makes vowel long', 'Long a, i, o, u, e in VCe words'],
          sample_words: ['make', 'time', 'hope', 'cube', 'Pete', 'plate', 'smile', 'stone', 'flute', 'theme'],
          nonsense_words: ['bape', 'kibe', 'trome', 'flune', 'zede'],
          concepts: ['VCe: vowel-consonant-silent e pattern', 'Silent e jumps over one consonant to make vowel say its name', 'Contrast with closed syllables: hop vs hope, tap vs tape'],
          lesson_focus: 'Distinguishing closed vs VCe syllables'
        },
        {
          substep: '4.2',
          name: 'Two-Syllable Words with VCe',
          skills: ['VCe in multisyllabic words', 'Syllable division with VCe pattern', 'Combining closed and VCe syllables'],
          sample_words: ['compete', 'explode', 'reptile', 'stampede', 'costume', 'confuse', 'complete', 'athlete', 'concrete', 'subscribe'],
          concepts: ['VCe syllable can combine with closed syllables', 'Divide before or after the consonant preceding VCe', 'Silent e rule applies within syllable'],
          lesson_focus: 'Multisyllabic decoding with VCe syllables'
        },
        {
          substep: '4.3',
          name: 'VCe Exceptions',
          skills: ['VCe words with short vowels', 'Common exception words', 'Recognizing when to flex pronunciation'],
          sample_words: ['have', 'give', 'live', 'love', 'come', 'some', 'done', 'gone', 'none', 'glove'],
          concepts: ['Some VCe words have short vowels (exceptions)', 'These are high-frequency words to memorize', 'Flex strategy: try long, if not a word try short'],
          lesson_focus: 'Recognizing and reading VCe exception words'
        },
        {
          substep: '4.4',
          name: 'Suffix Rules with VCe Base Words',
          skills: ['Drop e before vowel suffix (-ing, -ed, -er, -est)', 'Keep e before consonant suffix (-ment, -ful, -less)', 'Spelling patterns with VCe base words'],
          sample_words: ['making', 'hoped', 'shaking', 'rider', 'latest', 'movement', 'hopeful', 'homeless', 'excitement', 'usefulness'],
          concepts: ['Drop e rule: remove e before adding suffix starting with vowel', 'Keep e before consonant suffixes', 'Base word meaning stays the same'],
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
          skills: ['Open syllable: ends in vowel, vowel is long', 'Common one-syllable open words', 'Contrast with closed syllables'],
          sample_words: ['be', 'he', 'me', 'she', 'we', 'no', 'so', 'go', 'hi', 'I'],
          concepts: ['Open syllable: nothing closes in the vowel', 'Vowel at end of syllable says its name (long)', 'These are often high-frequency words'],
          lesson_focus: 'Recognizing open syllables'
        },
        {
          substep: '5.2',
          name: 'Y as a Vowel',
          skills: ['Y says long i at end of one-syllable word', 'Y says long e at end of multisyllabic word', 'Y in open syllable position'],
          sample_words: ['my', 'fly', 'sky', 'try', 'why', 'baby', 'happy', 'candy', 'silly', 'plenty'],
          concepts: ['Y is a vowel when it makes a vowel sound', 'End of one-syllable word: y says long i (my, fly)', 'End of multisyllabic word: y says long e (baby, happy)'],
          lesson_focus: 'Reading y as a vowel in different positions'
        },
        {
          substep: '5.3',
          name: 'Open Syllable Prefixes',
          skills: ['Common open syllable prefixes: re-, pre-, de-, be-', 'Prefix meaning and usage', 'Dividing after open syllable prefix'],
          sample_words: ['redo', 'prefix', 'decode', 'begin', 'refuse', 'pretend', 'defend', 'belong', 'return', 'demand'],
          concepts: ['Prefixes are word parts added to beginning', 'Open syllable prefixes end in long vowel', 'Divide after the prefix'],
          lesson_focus: 'Recognizing and reading open syllable prefixes'
        },
        {
          substep: '5.4',
          name: 'Open Syllable Division & Schwa',
          skills: ['VCV division: try open first (V/CV)', 'Flex to closed if open does not make a word (VC/V)', 'Schwa sound in unstressed syllables'],
          sample_words: ['robot', 'hotel', 'student', 'cabin', 'lemon', 'camel', 'wagon', 'seven', 'planet', 'melon'],
          concepts: ['VCV pattern: try open syllable first (V/CV)', 'Flex strategy: if open does not make a word, try closed (VC/V)', 'Schwa: unstressed vowel often says /uh/'],
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
          skills: ['Suffixes: -er, -est, -en, -ish', 'Suffixes: -or, -y, -ly', 'Adding suffixes to unchanging base words'],
          sample_words: ['faster', 'softest', 'golden', 'selfish', 'actor', 'rocky', 'sadly', 'flatten', 'freshen', 'rusted'],
          concepts: ['Suffix changes word meaning or part of speech', 'Identify base word + suffix', 'Unchanging base: no spelling changes when adding suffix'],
          lesson_focus: 'Reading and spelling words with common suffixes'
        },
        {
          substep: '6.2',
          name: 'Additional Suffixes (Set 2)',
          skills: ['Suffixes: -ful, -less, -ness, -ment', 'Suffixes: -able, -ty', 'Abstract noun and adjective suffixes'],
          sample_words: ['thankful', 'helpless', 'sadness', 'shipment', 'fixable', 'plenty', 'careful', 'homeless', 'softness', 'payment'],
          concepts: ['-ful means full of; -less means without', '-ness and -ment create nouns', '-able means able to be'],
          lesson_focus: 'Suffix meanings and spelling patterns'
        },
        {
          substep: '6.3',
          name: 'Consonant-le Syllables',
          skills: ['Consonant-le pattern: consonant + le', 'Common endings: -ble, -cle, -dle, -fle, -gle, -kle, -ple, -tle, -zle', 'Division before consonant-le'],
          sample_words: ['table', 'uncle', 'middle', 'raffle', 'eagle', 'ankle', 'simple', 'little', 'puzzle', 'bottle'],
          concepts: ['Consonant-le: the consonant + le form a syllable', 'Divide BEFORE the consonant-le', 'The le syllable is never stressed'],
          lesson_focus: 'Reading and dividing consonant-le words'
        },
        {
          substep: '6.4',
          name: 'Two-Syllable Consonant-le Words',
          skills: ['First syllable type + consonant-le', 'Closed + consonant-le (bubble, jungle)', 'VCe + consonant-le (maple, noble)', 'Open + consonant-le (cable, bugle)'],
          sample_words: ['bubble', 'jungle', 'maple', 'noble', 'cable', 'bugle', 'tremble', 'crumble', 'scramble', 'staple'],
          concepts: ['Identify first syllable type to determine vowel sound', 'Closed first syllable = short vowel (bubble)', 'Open or VCe first syllable = long vowel (maple, cable)'],
          lesson_focus: 'Combining syllable types with consonant-le'
        }
      ]
    }
  ],

  syllable_types: [
    { type: 'closed', description: 'Ends in consonant, vowel is short', example: 'cat, splash', marker: 'breve (˘) over vowel' },
    { type: 'vce', description: 'Vowel-consonant-silent e, vowel is long', example: 'make, compete', marker: 'macron (¯) over vowel, slash through e' },
    { type: 'open', description: 'Ends in vowel, vowel is long', example: 'go, robot', marker: 'macron (¯) over vowel' },
    { type: 'consonant_le', description: 'Consonant + le at end, forms final syllable', example: 'table, puzzle', marker: 'box around -le' },
    { type: 'r_controlled', description: 'Vowel followed by r, vowel sound is changed', example: 'car, bird', marker: 'circle around vowel-r' },
    { type: 'vowel_team', description: 'Two vowels together make one sound (D syllable)', example: 'rain, boat', marker: 'box around vowel team' }
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
