// EMERGE Intervention Planner - Error Bank Seed Data
// Pre-populated based on research from NCII, Wilson Language Training, 
// IES Practice Guides, and Spanish literacy research

export const WILSON_ERRORS = [
  // ============================================
  // STEP 1: CLOSED SYLLABLES & FOUNDATIONAL SKILLS
  // ============================================
  
  // Substep 1.1-1.2: Basic closed syllables
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 1 },
    error_pattern: 'Reverses b and d',
    underlying_gap: 'Visual discrimination difficulty with mirror-image letters',
    correction_protocol: 'Use "bed" trick: make fists with thumbs up - left hand is b, right hand is d, together they make a bed. Also use verbal cue: "b has a belly in front, d has a diaper in back"',
    correction_prompts: [
      'Make your hands into a bed. Which side is b?',
      'B has its belly in front. D has its diaper in back.',
      'Feel the direction: b faces right, d faces left.'
    ],
    visual_cues: 'Bed hand trick, directional arrows on letter cards',
    kinesthetic_cues: 'Trace letter in sand/salt while saying sound'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 1 },
    error_pattern: 'Does not tap sounds correctly (skips sounds or taps extra)',
    underlying_gap: 'Phonemic awareness gap - cannot segment words into individual phonemes',
    correction_protocol: 'Model tapping slowly. Use Elkonin boxes for visual support. Say "Touch and say each sound" then blend.',
    correction_prompts: [
      'Watch my fingers. One tap for each sound.',
      'How many sounds do you hear in this word?',
      'Let\'s use our sound boxes. One sound in each box.'
    ],
    visual_cues: 'Elkonin boxes, sound-by-sound finger tapping visual',
    kinesthetic_cues: 'Thumb to each finger for each phoneme'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 2 },
    error_pattern: 'Confuses short vowel sounds (especially e/i and o/u)',
    underlying_gap: 'Vowel sounds are acoustically similar; may need more explicit mouth position training',
    correction_protocol: 'Use keyword pictures and mirror. "Short e - Ed, mouth open like you\'re going to the dentist. Short i - itch, mouth is smiling."',
    correction_prompts: [
      'Look in the mirror. What is your mouth doing?',
      'Is your mouth open wide or in a smile?',
      'Use your keyword: is it Ed or itch?'
    ],
    visual_cues: 'Keyword pictures, mouth position photos',
    kinesthetic_cues: 'Feel jaw position with hand'
  },
  
  // Substep 1.3: Digraphs
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 3 },
    error_pattern: 'Reads digraph as two separate sounds (ch as /k/-/h/)',
    underlying_gap: 'Not recognizing that two letters can represent one sound',
    correction_protocol: 'Emphasize "glued together" concept. Use one finger tap for digraph. Point to both letters while making single sound.',
    correction_prompts: [
      'These two letters are glued together. They make ONE sound.',
      'We tap once because it\'s one sound. What sound?',
      'Ch says /ch/, not /k/-/h/. They work as a team.'
    ],
    visual_cues: 'Underline or box digraph as unit, digraph cards',
    kinesthetic_cues: 'Single finger tap, "glue" gesture (press palms together)'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 3 },
    error_pattern: 'Adds schwa after digraph (says "chuh" instead of /ch/)',
    underlying_gap: 'Tendency to add vowel sound to isolated consonants',
    correction_protocol: 'Model crisp, clipped sound. "Just the sound, no extra. Listen: /ch/. Clip it short."',
    correction_prompts: [
      'Clip it! Just the sound, no extra.',
      'Make it short and crisp.',
      'Listen to me, then you try: /ch/ - no "uh" at the end.'
    ],
    visual_cues: 'Scissors gesture for "clip it"',
    kinesthetic_cues: 'Quick hand chop motion for crisp sounds'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 3 },
    error_pattern: 'Confuses sh and ch sounds',
    underlying_gap: 'Both are fricatives produced in similar mouth position',
    correction_protocol: 'Contrast sounds explicitly. Sh is continuous (shhh like quiet), ch has a stop then release (like a sneeze). Use minimal pairs.',
    correction_prompts: [
      'Sh goes on and on: shhhhhh. Can you make ch go on? No - it stops.',
      'Sh is the quiet sound. Ch is like a little sneeze.',
      'Is this ship or chip? Listen carefully.'
    ],
    visual_cues: 'Quiet finger for sh, sneeze gesture for ch',
    kinesthetic_cues: 'Feel continuous airflow for sh vs. burst for ch'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 3 },
    error_pattern: 'Confuses wh with w (says /w/ for wh words)',
    underlying_gap: 'Many dialects have merged wh→w; student may not hear difference',
    correction_protocol: 'Exaggerate the /hw/ blend. "Wh is like blowing out a candle then saying w." Practice with minimal pairs: witch/which, wale/whale.',
    correction_prompts: [
      'For wh, blow a little air first, then say w.',
      'Pretend you\'re blowing out a candle: /hw/.',
      'Which one am I saying: wail or whale? Listen for the air.'
    ],
    visual_cues: 'Candle blowing visual',
    kinesthetic_cues: 'Feel air on hand for wh vs. no air for w'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 3 },
    error_pattern: 'Confuses voiced and unvoiced th',
    underlying_gap: 'Not distinguishing between /θ/ (thin) and /ð/ (this)',
    correction_protocol: 'Use throat check. "Put your hand on your throat. For THIS, you feel vibration. For THIN, no vibration."',
    correction_prompts: [
      'Put your hand on your throat. Do you feel the buzz?',
      'This one vibrates. This one doesn\'t. Which is which?',
      'Voiced th: your voice is on. Unvoiced th: your voice is off.'
    ],
    visual_cues: 'Voiced/unvoiced sorting mat',
    kinesthetic_cues: 'Hand on throat to feel voicing'
  },
  
  // Substep 1.4: Bonus Letters (ff, ll, ss, zz)
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 4 },
    error_pattern: 'Spells with single letter instead of double (stuf instead of stuff)',
    underlying_gap: 'Not applying FLOSS rule consistently',
    correction_protocol: 'Review FLOSS rule: after a short vowel at the end of a one-syllable word, double f, l, s, or z. Practice with word sorts.',
    correction_prompts: [
      'Is this a FLOSS word? Short vowel, one syllable, ends in f, l, s, or z?',
      'Check your rules notebook. What does FLOSS tell us?',
      'This word follows the FLOSS rule, so we need to double the...'
    ],
    visual_cues: 'FLOSS rule chart, highlighter on vowel and final letter',
    kinesthetic_cues: 'Still one tap - double letters make one sound'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 4 },
    error_pattern: 'Taps twice for double letters',
    underlying_gap: 'Treating each letter as separate sound',
    correction_protocol: 'Reinforce: double letters make ONE sound, one tap. "Two letters, one sound, one tap."',
    correction_prompts: [
      'Two letters but one sound. How many taps?',
      'These letters are twins - they work together as one.',
      'Double letters, single sound, single tap.'
    ],
    visual_cues: 'Circle double letters as unit',
    kinesthetic_cues: 'Single tap for double letters'
  },
  
  // Substep 1.5: Glued Sounds
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 5 },
    error_pattern: 'Segments glued sounds into individual phonemes',
    underlying_gap: 'Not recognizing welded/glued sound units',
    correction_protocol: 'Teach as units. For -all, -am, -an: tap with two fingers stuck together. "These sounds are glued - they stay together."',
    correction_prompts: [
      'These sounds are glued together. We keep them as a team.',
      'Use your glued fingers - two sounds stuck together.',
      'All says /ɔl/, not /a/-/l/. Hear how they blend?'
    ],
    visual_cues: 'Glued sound cards, fingers stuck together visual',
    kinesthetic_cues: 'Two fingers pressed together for tap'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 5 },
    error_pattern: 'Pronounces "all" glued sound with short a',
    underlying_gap: 'Not recognizing vowel change in glued sounds',
    correction_protocol: 'Emphasize the "aw" sound in -all. "The a becomes an aw sound when it\'s glued to ll."',
    correction_prompts: [
      'In -all words, the a says /aw/, not /a/.',
      'Listen: ball, call, fall. Do you hear /aw/?',
      'The ll changes the a sound. It becomes aw.'
    ],
    visual_cues: 'Keyword picture for -all (ball)',
    kinesthetic_cues: null
  },
  
  // Substep 1.6: Suffixes
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 6 },
    error_pattern: 'Pronounces -ed as /ĕd/ in all words',
    underlying_gap: 'Not recognizing the three sounds of -ed suffix',
    correction_protocol: 'Teach 3 sounds: /ĭd/ after t/d (hunted), /d/ after voiced sounds (played), /t/ after unvoiced (jumped). Use throat check.',
    correction_prompts: [
      'The -ed ending has 3 sounds. Which one fits this word?',
      'What\'s the last sound of the base word? Is it voiced or unvoiced?',
      'After /t/ or /d/, we add /ĭd/. After voiced sounds, /d/. After unvoiced, /t/.'
    ],
    visual_cues: '-ed three sounds chart, sorting mat',
    kinesthetic_cues: 'Hand on throat to check voicing of base word ending'
  },
  {
    curriculum: 'wilson',
    position: { step: 1, substep: 6 },
    error_pattern: 'Does not identify base word before adding suffix',
    underlying_gap: 'Reading suffixed words as whole units without morphological analysis',
    correction_protocol: 'Always find and underline base word first. Box the suffix. Read base word, then add suffix.',
    correction_prompts: [
      'First, find the base word. What\'s the real word hiding in there?',
      'Underline the base word. Box the suffix.',
      'Read the base word first, then add the ending.'
    ],
    visual_cues: 'Underline base, box suffix notation',
    kinesthetic_cues: null
  },
  
  // ============================================
  // STEP 2: VOWEL-CONSONANT-E SYLLABLES
  // ============================================
  
  {
    curriculum: 'wilson',
    position: { step: 2, substep: 1 },
    error_pattern: 'Pronounces silent e',
    underlying_gap: 'Not recognizing the VCe pattern where e is silent',
    correction_protocol: 'Draw rainbow arc from e to vowel. "The e is a helper - it makes the vowel say its name, then stays quiet."',
    correction_prompts: [
      'The e is a magic e - it helps but doesn\'t speak.',
      'Cross out the silent e after you use its power.',
      'E jumps over one consonant to bonk the vowel and make it say its name.'
    ],
    visual_cues: 'Rainbow arc from e to vowel, cross out e',
    kinesthetic_cues: 'Arc hand motion from e to vowel'
  },
  {
    curriculum: 'wilson',
    position: { step: 2, substep: 1 },
    error_pattern: 'Uses short vowel in VCe words (reads "hope" as "hop")',
    underlying_gap: 'Not recognizing VCe syllable type',
    correction_protocol: 'Mark syllable type. "What type of syllable is this? VCe! When there\'s an e at the end, the vowel says its name."',
    correction_prompts: [
      'Is there an e at the end? Then the vowel says its name.',
      'This is a VCe syllable. What does the vowel say?',
      'Check for magic e. Found it? The vowel is long.'
    ],
    visual_cues: 'VCe syllable type marking (macron over vowel, cross out e)',
    kinesthetic_cues: null
  },
  {
    curriculum: 'wilson',
    position: { step: 2, substep: 1 },
    error_pattern: 'Confuses closed vs. VCe syllables (hop vs. hope)',
    underlying_gap: 'Not distinguishing syllable types that determine vowel sound',
    correction_protocol: 'Use word chains to contrast. "hop-hope, mop-mope, tap-tape." Mark syllable types and compare.',
    correction_prompts: [
      'How many vowels? Where is the e? That tells us the syllable type.',
      'Closed syllable - short vowel. VCe syllable - long vowel.',
      'Add an e to the end. Now what happens to the vowel?'
    ],
    visual_cues: 'Word chains visual, syllable type comparison chart',
    kinesthetic_cues: null
  },
  
  // ============================================
  // STEP 3: OPEN SYLLABLES & MULTISYLLABIC WORDS
  // ============================================
  
  {
    curriculum: 'wilson',
    position: { step: 3, substep: 1 },
    error_pattern: 'Uses short vowel in open syllables',
    underlying_gap: 'Not recognizing open syllables have long vowel sounds',
    correction_protocol: 'Mark open syllable (no consonant after vowel). "When a syllable ends with a vowel, nothing closes it in, so the vowel is free to say its name."',
    correction_prompts: [
      'This syllable ends with a vowel - it\'s open. What does the vowel say?',
      'Nothing is closing in the vowel, so it says its name.',
      'Open syllable = long vowel. Closed syllable = short vowel.'
    ],
    visual_cues: 'Open vs. closed syllable visual (door open/closed)',
    kinesthetic_cues: null
  },
  {
    curriculum: 'wilson',
    position: { step: 3, substep: 2 },
    error_pattern: 'Divides syllables incorrectly in VCCV words',
    underlying_gap: 'Not applying syllable division rules correctly',
    correction_protocol: 'Teach "spot and dot" - mark all vowels first. For VCCV, divide between the consonants. "Two consonants in the middle? Split between them."',
    correction_prompts: [
      'First, spot and dot the vowels. How many syllables?',
      'Two consonants in the middle - where do we divide?',
      'Split between the consonants: nap-kin, not na-pkin.'
    ],
    visual_cues: 'Spot and dot notation, division line between consonants',
    kinesthetic_cues: 'Scoop each syllable with finger'
  },
  {
    curriculum: 'wilson',
    position: { step: 3, substep: 3 },
    error_pattern: 'Does not flex vowel sound when first attempt doesn\'t make a word',
    underlying_gap: 'Not applying the "flex" strategy for VCV patterns',
    correction_protocol: 'Teach: try open syllable first (long vowel). If that\'s not a word, flex to closed (short vowel). "Try it long. Not a word? Flex it short."',
    correction_prompts: [
      'Try the long vowel first. Is that a real word?',
      'Not a word? Flex it! Try the short vowel.',
      'Good readers are flexible. Try it both ways.'
    ],
    visual_cues: 'Flex strategy visual',
    kinesthetic_cues: 'Flexing arm motion for "flex the vowel"'
  },
  
  // ============================================
  // STEP 4: R-CONTROLLED VOWELS
  // ============================================
  
  {
    curriculum: 'wilson',
    position: { step: 4, substep: 1 },
    error_pattern: 'Pronounces vowel and r as separate sounds',
    underlying_gap: 'Not recognizing r-controlled vowel as a unit',
    correction_protocol: 'Teach vowel-r as a team. "The r is bossy - it changes the vowel sound. They work together."',
    correction_prompts: [
      'The r controls the vowel. They make one sound together.',
      'Circle the vowel and r together - they\'re a team.',
      'Bossy r changes the vowel sound.'
    ],
    visual_cues: 'Circle vowel-r as unit, "bossy r" character',
    kinesthetic_cues: null
  },
  {
    curriculum: 'wilson',
    position: { step: 4, substep: 1 },
    error_pattern: 'Confuses er, ir, ur (all make /er/ sound)',
    underlying_gap: 'Three spellings for same sound creates confusion',
    correction_protocol: 'Teach that er, ir, ur all say /er/. Use keywords: her, bird, fur. For spelling, must memorize which words use which spelling.',
    correction_prompts: [
      'Er, ir, and ur are spelling cousins - they all say /er/.',
      'For reading, they\'re all /er/. For spelling, check your word list.',
      'What\'s your keyword? Her, bird, or fur?'
    ],
    visual_cues: 'er/ir/ur chart with keywords',
    kinesthetic_cues: null
  },
  
  // ============================================
  // STEP 5: VOWEL TEAMS
  // ============================================
  
  {
    curriculum: 'wilson',
    position: { step: 5, substep: 1 },
    error_pattern: 'Reads vowel team as two separate sounds',
    underlying_gap: 'Not recognizing vowel teams as single sound units',
    correction_protocol: 'Teach "when two vowels go walking, the first one does the talking" for some teams. Box the vowel team as a unit.',
    correction_prompts: [
      'These vowels are a team. What one sound do they make?',
      'Box the vowel team - they work together.',
      'Two letters, one sound. What sound do they make together?'
    ],
    visual_cues: 'Box vowel teams, vowel team cards',
    kinesthetic_cues: null
  },
  {
    curriculum: 'wilson',
    position: { step: 5, substep: 1 },
    error_pattern: 'Confuses ai/ay and other position-based vowel teams',
    underlying_gap: 'Not recognizing spelling patterns based on position in word',
    correction_protocol: 'Teach position rules: ai is usually in the middle, ay is usually at the end. Same for oi/oy, etc.',
    correction_prompts: [
      'Where is this sound in the word? Middle or end?',
      'Ai goes in the middle, ay goes at the end.',
      'At the end of a word, we use ay, not ai.'
    ],
    visual_cues: 'Position-based vowel team chart',
    kinesthetic_cues: null
  },
  
  // ============================================
  // STEP 6: DIPHTHONGS & COMPLEX PATTERNS
  // ============================================
  
  {
    curriculum: 'wilson',
    position: { step: 6, substep: 1 },
    error_pattern: 'Does not produce gliding sound in diphthongs (oi/oy, ou/ow)',
    underlying_gap: 'Not recognizing that diphthongs require mouth position change',
    correction_protocol: 'Teach that diphthongs GLIDE - mouth moves during the sound. "Start here, glide to there. Feel your mouth move."',
    correction_prompts: [
      'This sound glides. Start with your mouth one way, end another.',
      'Feel how your mouth moves? That\'s the glide.',
      'Oi starts like "oh" and glides to "ee". Slow it down.'
    ],
    visual_cues: 'Mouth position diagram showing glide',
    kinesthetic_cues: 'Feel mouth position change with hand on jaw'
  }
];

// ============================================
// MATHEMATICS ERROR BANK
// ============================================

export const MATH_ERRORS = [
  // ============================================
  // PLACE VALUE (NBT Standards)
  // ============================================
  
  {
    curriculum: 'delta_math',
    position: { standard: '3.NBT.1' },
    error_pattern: 'Treats digits as individual numbers (327 as "3, 2, 7" not 300+20+7)',
    underlying_gap: 'Does not understand that position determines value',
    correction_protocol: 'Use base-10 blocks on place value mat. Build the number physically. "How many hundreds? How many tens? How many ones? What is the VALUE of each digit?"',
    correction_prompts: [
      'What is the VALUE of this digit? Not its name, its value.',
      'If this 3 is in the hundreds place, what is it worth?',
      'Show me with blocks: 327 = ___ hundreds + ___ tens + ___ ones'
    ],
    visual_cues: 'Place value chart, expanded form notation',
    manipulatives: 'Base-10 blocks, place value mat'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '3.NBT.2' },
    error_pattern: 'Subtracts smaller digit from larger regardless of position',
    underlying_gap: 'Applies faulty algorithm to avoid regrouping (52-28=36)',
    correction_protocol: 'Always check: can I subtract the bottom from the top in each place? If not, regroup. Use base-10 blocks to show WHY we regroup.',
    correction_prompts: [
      'Can you take 8 ones from 2 ones? No? What do we need to do?',
      'Show me with blocks. We need to trade a ten for more ones.',
      'When we regroup, we\'re just renaming the number. 52 = 4 tens and 12 ones.'
    ],
    visual_cues: 'Regrouping notation with arrows',
    manipulatives: 'Base-10 blocks with trading'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '4.NBT.6' },
    error_pattern: 'Places quotient digits in wrong place value position',
    underlying_gap: 'Does not connect division to place value meaning',
    correction_protocol: 'Always estimate first. Use place value mat with base-10 blocks. "Start with the biggest place. Can we make groups of 5 from these hundreds?"',
    correction_prompts: [
      'Before we start, estimate: about how big should our answer be?',
      'Start with the biggest place. Can we make groups from here?',
      'Where does this quotient digit belong? Hundreds, tens, or ones?'
    ],
    visual_cues: 'Place value division mat, partial quotients method',
    manipulatives: 'Base-10 blocks for grouping'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '4.NBT.6' },
    error_pattern: 'Forgets to bring down digits or skips place values in quotient',
    underlying_gap: 'Procedural execution without place value understanding',
    correction_protocol: 'Use expanded notation or partial quotients to make place value visible. Check: does every place value have a digit in the quotient?',
    correction_prompts: [
      'Did you bring down the next digit? Show me.',
      'Check your quotient: hundreds, tens, ones - do you have a digit for each place?',
      'Let\'s use partial quotients so we can see each step clearly.'
    ],
    visual_cues: 'Partial quotients scaffolded recording',
    manipulatives: null
  },
  
  // ============================================
  // FRACTIONS (NF Standards)
  // ============================================
  
  {
    curriculum: 'delta_math',
    position: { standard: '4.NF.2' },
    error_pattern: 'Believes larger denominator = larger fraction (1/8 > 1/4)',
    underlying_gap: 'Applies whole number thinking: 8 > 4 so 1/8 > 1/4',
    correction_protocol: 'Use fraction bars side by side. "If you share a pizza with 2 people vs 8 people, who gets more?" More parts means SMALLER pieces.',
    correction_prompts: [
      'Would you rather have 1/2 of a pizza or 1/8?',
      'More pieces means each piece is... bigger or smaller?',
      'Let\'s look at the fraction bars. Which piece is actually bigger?'
    ],
    visual_cues: 'Fraction bars side by side, pizza visual',
    manipulatives: 'Fraction tiles, fraction circles'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '4.NF.2' },
    error_pattern: 'Compares fractions by looking only at numerators or only at denominators',
    underlying_gap: 'Does not understand that both parts matter for fraction size',
    correction_protocol: 'Teach multiple comparison strategies: same denominators (compare numerators), same numerators (compare denominators), benchmark to 1/2, find common denominator.',
    correction_prompts: [
      'Do these have the same denominator? The same numerator? Neither?',
      'Can you compare both to 1/2? Is one bigger and one smaller than 1/2?',
      'What if we found a common denominator? Then we could compare easily.'
    ],
    visual_cues: 'Fraction comparison strategy chart, number line',
    manipulatives: 'Fraction bars for visual comparison'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '4.NF.3c' },
    error_pattern: 'Adds both numerators AND denominators (2/5 + 1/5 = 3/10)',
    underlying_gap: 'Treats fraction as two separate whole numbers',
    correction_protocol: 'Use fraction bars physically. "The denominator tells us what SIZE pieces. When we add, do the sizes change? No! We\'re counting how many of the SAME size."',
    correction_prompts: [
      'Read this as "two-fifths plus one-fifth." How many fifths total?',
      'The denominator is the NAME of the pieces. Does the name change when we add?',
      'Think: 2 apples + 1 apple = ? apples. The "apples" doesn\'t change to "apples-apples."'
    ],
    visual_cues: 'Fraction bars showing same-sized pieces being combined',
    manipulatives: 'Fraction bars, pattern blocks'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '4.NF.3c' },
    error_pattern: 'Does not regroup improper fraction to mixed number',
    underlying_gap: 'Does not recognize when numerator exceeds denominator',
    correction_protocol: 'Teach: when numerator ≥ denominator, we have at least 1 whole. Use fraction circles: "How many pieces make a whole? Do you have enough pieces for a whole?"',
    correction_prompts: [
      'Is this numerator bigger than the denominator? What does that tell us?',
      'If you have 7 fourths, how many wholes can you make?',
      'Let\'s use our fraction circles. Each full circle is 1 whole.'
    ],
    visual_cues: 'Fraction circles showing improper to mixed conversion',
    manipulatives: 'Fraction circles'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '5.NF.1' },
    error_pattern: 'Adds fractions with unlike denominators without finding common denominator',
    underlying_gap: 'Does not understand fractions must represent same-sized pieces to add',
    correction_protocol: 'Use fraction bars. "Can we add thirds and sixths directly? Try to put them together - they don\'t line up! We need same-sized pieces."',
    correction_prompts: [
      'Can we count thirds and sixths together? They\'re different sizes!',
      'We need a common denominator - same-sized pieces. What number do both denominators go into?',
      'First make equivalent fractions with the same denominator, then add.'
    ],
    visual_cues: 'Fraction bars showing need for common denominator',
    manipulatives: 'Fraction bars'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '4.NF.4b' },
    error_pattern: 'Expects multiplication to make fractions larger (1/2 × 1/2 should be bigger than 1/2)',
    underlying_gap: 'Whole number multiplication reasoning applied to fractions',
    correction_protocol: 'Use area model. "We\'re taking 1/2 OF 1/2. Take half of this paper. Now take half of THAT half. More or less paper?"',
    correction_prompts: [
      'When we say 1/2 × 1/2, we mean half OF a half.',
      'Take half of this paper. Now take half of that. Did you get more or less?',
      'Multiplying by a fraction less than 1 makes things smaller.'
    ],
    visual_cues: 'Area model for fraction multiplication',
    manipulatives: 'Paper folding, grid paper'
  },
  
  // ============================================
  // DECIMALS
  // ============================================
  
  {
    curriculum: 'delta_math',
    position: { standard: '5.NBT.3' },
    error_pattern: 'Longer decimal = larger number (0.36 > 0.5 because 36 > 5)',
    underlying_gap: 'Treating decimals as whole numbers after the point',
    correction_protocol: 'Use decimats (10×10 grids). Shade 0.5 (half the grid) and 0.36 (36 small squares). Or use money: "50 cents or 36 cents - which is more?"',
    correction_prompts: [
      'Let\'s shade these on our decimat. Which covers more of the grid?',
      'Would you rather have 50 cents or 36 cents?',
      '0.5 is the same as 0.50. Now compare 50 hundredths to 36 hundredths.'
    ],
    visual_cues: 'Decimat grids, money comparison',
    manipulatives: 'Decimats (10×10 grids), coins'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '5.NBT.3' },
    error_pattern: 'Shorter decimal = larger number (0.4 > 0.87 because tenths are bigger than hundredths)',
    underlying_gap: 'Confusing place value SIZE with total VALUE',
    correction_protocol: 'Shade both on decimats and compare TOTAL shaded area. "Yes, each tenth is bigger than each hundredth, but do you have MORE of the grid shaded?"',
    correction_prompts: [
      'Let\'s shade both. Which has MORE total area covered?',
      '0.4 is 4 tenths. 0.87 is 87 hundredths. Let\'s see which is more.',
      'Compare like place values: 0.40 vs 0.87. Which has more tenths? More hundredths?'
    ],
    visual_cues: 'Side-by-side decimat comparison',
    manipulatives: 'Decimats'
  },
  {
    curriculum: 'delta_math',
    position: { standard: '5.NBT.7' },
    error_pattern: 'Ignores decimal point when computing (2.5 × 3 = 75)',
    underlying_gap: 'Treating decimal as whole number, not understanding place value',
    correction_protocol: 'Estimate first: "2.5 is about 2 or 3. Times 3 is about 6 to 9. Can the answer be 75?" Use decimat to show 2.5 × 3.',
    correction_prompts: [
      'Before we calculate, estimate: about what should the answer be?',
      '2.5 is between 2 and 3. Times 3 is... Can it be 75?',
      'Let\'s use place value to check where the decimal goes.'
    ],
    visual_cues: 'Estimation number line, place value chart',
    manipulatives: 'Decimats'
  }
];

// ============================================
// SPANISH PHONICS ERROR BANK (Camino a la Lectura)
// ============================================

export const SPANISH_ERRORS = [
  // ============================================
  // VOWEL ERRORS
  // ============================================
  
  {
    curriculum: 'camino',
    position: null, // Universal - all lessons
    error_pattern: 'Applies English vowel reduction (schwa) to unstressed syllables',
    underlying_gap: 'English is stress-timed; Spanish is syllable-timed with full vowels',
    correction_protocol: 'Emphasize that every Spanish vowel is pronounced fully. Use syllable clapping to maintain equal stress. "En español, cada vocal se pronuncia completamente."',
    correction_prompts: [
      'En español, cada vocal se pronuncia completamente.',
      'Vamos a aplaudir las sílabas: co-lor, no "colr"',
      'Di cada sílaba con fuerza. No te comas las vocales.'
    ],
    visual_cues: 'Syllable boxes with equal sizing',
    kinesthetic_cues: 'Clap or tap each syllable with equal stress'
  },
  {
    curriculum: 'camino',
    position: { lesson_range: [1, 5] }, // Vowel introduction
    error_pattern: 'Substitutes English short vowel for Spanish vowel',
    underlying_gap: 'English has multiple vowel sounds per letter; Spanish has one',
    correction_protocol: 'Spanish vowels never change. A is always /a/ like "papa". Create comparison chart with English equivalents.',
    correction_prompts: [
      'La A española siempre dice /a/. No cambia nunca.',
      'En español: A-E-I-O-U, siempre igual.',
      'Escucha: papa, mamá, casa. Siempre la misma /a/.'
    ],
    visual_cues: 'Spanish vowel chart with consistent mouth position photos',
    kinesthetic_cues: 'Feel consistent mouth position for each vowel'
  },
  {
    curriculum: 'camino',
    position: { lesson_range: [1, 5] },
    error_pattern: 'Pronounces Spanish /i/ as English short /ɪ/ (bit vs. beat)',
    underlying_gap: 'English /ɪ/ is lax; Spanish /i/ is tense like "ee"',
    correction_protocol: 'Spanish /i/ always sounds like English "ee" in "see." Smile position. "La I española siempre suena como ee."',
    correction_prompts: [
      'La I siempre dice /i/ como en "pizza" o "see".',
      'Sonríe cuando dices /i/. Los labios bien estirados.',
      'Escucha: sí, mi, y día. Todas dicen /i/.'
    ],
    visual_cues: 'Smiling mouth photo for /i/',
    kinesthetic_cues: 'Feel smiling/stretched lip position'
  },
  {
    curriculum: 'camino',
    position: { lesson_range: [1, 5] },
    error_pattern: 'Confuses Spanish /e/ with English /ɛ/ or /eɪ/',
    underlying_gap: 'English "e" varies; Spanish /e/ is pure mid-vowel',
    correction_protocol: 'Spanish /e/ is between English "eh" and "ay" - pure, no glide. "La E no se mueve. Es un sonido puro."',
    correction_prompts: [
      'La E es pura. No dice "ey" al final.',
      'Mantén tu boca en una posición. No se mueve.',
      'Escucha: me, de, le. La E no cambia.'
    ],
    visual_cues: 'Mouth position photo - steady, not gliding',
    kinesthetic_cues: 'Hold jaw steady during /e/'
  },
  
  // ============================================
  // CONSONANT ERRORS
  // ============================================
  
  {
    curriculum: 'camino',
    position: { lesson: 11 }, // Letter N lesson
    error_pattern: 'Confuses n and m in final position',
    underlying_gap: 'Both are nasal sounds; English speakers may not distinguish clearly',
    correction_protocol: 'Lip closure cue: For /m/, lips come together. For /n/, mouth stays open and tongue touches roof.',
    correction_prompts: [
      '¿Tus labios se cierran o se quedan abiertos?',
      'Mírame: /m/ - labios juntos. /n/ - boca abierta.',
      'Para /n/, tu lengua toca arriba. Para /m/, tus labios se besan.'
    ],
    visual_cues: 'Mirror for lip position, side-view diagram',
    kinesthetic_cues: 'Feel lips: together for m, apart for n'
  },
  {
    curriculum: 'camino',
    position: null, // Universal
    error_pattern: 'Pronounces B and V differently',
    underlying_gap: 'English distinguishes B/V; Spanish B and V are the same phoneme /b/',
    correction_protocol: 'Explicit instruction: In Spanish, B and V make the SAME sound. The difference is spelling only.',
    correction_prompts: [
      'En español, la B y la V suenan exactamente igual.',
      'B y V son gemelas - mismo sonido, diferente ropa.',
      'La diferencia está solo en cómo se escriben, no cómo suenan.'
    ],
    visual_cues: 'B=V visual showing same sound',
    kinesthetic_cues: null
  },
  {
    curriculum: 'camino',
    position: { lesson_range: [15, 40] }, // R/RR lessons and beyond
    error_pattern: 'Cannot produce Spanish tap /ɾ/ (single r)',
    underlying_gap: 'English has no equivalent; closest is flapped t in "butter"',
    correction_protocol: 'Start with English "butter" or "ladder" - that middle sound is close to Spanish r. Say "a day" faster until it sounds like "rey".',
    correction_prompts: [
      'Di "butter" rápido. Ese sonido del medio es como la R.',
      'Pon tu lengua donde dices "d" pero solo tócala una vez.',
      'Practica: para, pero, puro. Un toquecito rápido.'
    ],
    visual_cues: 'Tongue position diagram - alveolar tap',
    kinesthetic_cues: 'Feel single quick tap of tongue on ridge'
  },
  {
    curriculum: 'camino',
    position: { lesson_range: [15, 40] },
    error_pattern: 'Cannot produce Spanish trill /r/ (rr)',
    underlying_gap: 'English has no trilled sounds; requires relaxed tongue vibration',
    correction_protocol: 'Tongue must be RELAXED to vibrate. Start with "drrr" motor sound. Practice with "tr" combinations (tres, otro).',
    correction_prompts: [
      'Relaja tu lengua. Si está tensa, no puede vibrar.',
      'Haz el sonido de un motor: drrrrr.',
      'Practica: tres, otro, tigre. Luego: perro, carro, tierra.'
    ],
    visual_cues: 'Relaxed tongue diagram, motor/purring cat visual',
    kinesthetic_cues: 'Feel tongue vibration when relaxed'
  },
  {
    curriculum: 'camino',
    position: null, // H words
    error_pattern: 'Pronounces H with aspiration (as in English)',
    underlying_gap: 'English H is pronounced; Spanish H is always silent',
    correction_protocol: 'Spanish H is ALWAYS silent - "H muda." It\'s there for spelling history only.',
    correction_prompts: [
      'La H es muda. No dice nada.',
      'Hora se dice /ora/. La H está dormida.',
      'Escucha: hola, hoy, hacer. ¿Escuchas la H? No, porque es muda.'
    ],
    visual_cues: 'Sleeping H visual',
    kinesthetic_cues: null
  },
  {
    curriculum: 'camino',
    position: null, // LL/Y lessons
    error_pattern: 'Pronounces LL as English /l/',
    underlying_gap: 'Spanish LL is /ʎ/ or /ʝ/, not /l/',
    correction_protocol: 'LL sounds like English "y" in "yes" (in most dialects). "Calle" = /ka-ye/, not /kal-le/.',
    correction_prompts: [
      'LL suena como Y. Calle = ca-ye.',
      'No es /l/ dos veces. Es un sonido especial.',
      'Practica: ella, calle, pollo. ¿Escuchas el sonido de Y?'
    ],
    visual_cues: 'LL = Y visual',
    kinesthetic_cues: null
  },
  {
    curriculum: 'camino',
    position: null, // Ñ lessons
    error_pattern: 'Pronounces Ñ as N followed by Y, or as plain N',
    underlying_gap: 'Ñ is a unique palatal nasal, not N+Y',
    correction_protocol: 'Ñ is one sound, not two. Tongue touches roof of mouth farther back than N. Like "ny" in "canyon" but as ONE sound.',
    correction_prompts: [
      'Ñ es UN sonido. Mira: niño = ni-ño, dos sílabas.',
      'Tu lengua toca más atrás que para N.',
      'Como el sonido del medio en "canyon" pero una sola vez.'
    ],
    visual_cues: 'Tongue position comparison: N vs Ñ',
    kinesthetic_cues: 'Feel tongue position farther back on palate'
  },
  
  // ============================================
  // SYLLABLE & STRESS ERRORS
  // ============================================
  
  {
    curriculum: 'camino',
    position: null, // Universal
    error_pattern: 'Divides syllables incorrectly (splits consonant blends)',
    underlying_gap: 'Spanish keeps certain blends together; English patterns differ',
    correction_protocol: 'Teach "grupos inseparables": bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, tr always stay together.',
    correction_prompts: [
      'BL, BR, CL, CR... son grupos inseparables. No los separamos.',
      'Libro = li-bro, no lib-ro. La B y la R se quedan juntas.',
      'Estos amigos no se separan nunca: bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, tr.'
    ],
    visual_cues: 'Inseparable blends chart with "friends holding hands" visual',
    kinesthetic_cues: null
  },
  {
    curriculum: 'camino',
    position: { lesson_range: [20, 40] }, // Diphthong lessons
    error_pattern: 'Separates diphthongs into two syllables',
    underlying_gap: 'Not recognizing strong+weak vowel combinations as single syllables',
    correction_protocol: 'Teach strong vowels (A,E,O) and weak vowels (I,U). Diphthong = strong+weak or weak+strong in ONE syllable. If weak vowel has accent, it\'s hiato (2 syllables).',
    correction_prompts: [
      'Vocales fuertes: A, E, O. Débiles: I, U.',
      'Cuando una fuerte y una débil están juntas, son UNA sílaba.',
      'Bueno = bue-no (2 sílabas). Día = dí-a (2 sílabas por el acento).'
    ],
    visual_cues: 'Strong vowels in red, weak in blue; diphthong vs. hiato chart',
    kinesthetic_cues: 'Clap syllables to verify count'
  },
  {
    curriculum: 'camino',
    position: { lesson_range: [25, 40] }, // Accent mark lessons
    error_pattern: 'Ignores written accent marks (reads "papá" as "papa")',
    underlying_gap: 'Not recognizing that accent marks indicate stress position',
    correction_protocol: 'Accent mark = stress that syllable stronger. It can change meaning: papa (potato) vs. papá (father).',
    correction_prompts: [
      'El acento te dice dónde poner la fuerza.',
      '¿Ves el acento? Esa sílaba es más fuerte.',
      'Papá tiene acento en la segunda A. Pa-PÁ, no PA-pa.'
    ],
    visual_cues: 'Minimal pairs with/without accent: papa/papá, mama/mamá',
    kinesthetic_cues: 'Clap louder on accented syllable'
  },
  {
    curriculum: 'camino',
    position: null, // Universal
    error_pattern: 'Applies English stress patterns (stress on first syllable)',
    underlying_gap: 'English defaults to first-syllable stress; Spanish has different rules',
    correction_protocol: 'Teach Spanish stress rules: words ending in vowel/n/s stress second-to-last; words ending in other consonants stress last syllable.',
    correction_prompts: [
      '¿En qué letra termina? Eso nos dice dónde poner la fuerza.',
      'Termina en vocal, N, o S: la fuerza va en la penúltima sílaba.',
      'Termina en otra consonante: la fuerza va en la última sílaba.'
    ],
    visual_cues: 'Stress rules chart',
    kinesthetic_cues: 'Clap louder on stressed syllable'
  }
];

// ============================================
// EXPORT COMBINED ERROR BANK
// ============================================

export const ALL_ERRORS = [
  ...WILSON_ERRORS,
  ...MATH_ERRORS,
  ...SPANISH_ERRORS
];

// Helper function to get errors by curriculum and position
export function getErrorsForPosition(curriculum, position) {
  return ALL_ERRORS.filter(error => {
    if (error.curriculum !== curriculum) return false;
    if (!error.position) return true; // Universal errors for this curriculum
    
    // Match position based on curriculum type
    if (curriculum === 'wilson') {
      return error.position.step === position.step && 
             (!error.position.substep || error.position.substep === position.substep);
    }
    if (curriculum === 'delta_math') {
      return error.position.standard === position.standard;
    }
    if (curriculum === 'camino') {
      if (error.position.lesson) {
        return error.position.lesson === position.lesson;
      }
      if (error.position.lesson_range) {
        return position.lesson >= error.position.lesson_range[0] && 
               position.lesson <= error.position.lesson_range[1];
      }
    }
    return false;
  });
}
