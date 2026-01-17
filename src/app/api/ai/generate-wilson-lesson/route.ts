import { NextRequest, NextResponse } from 'next/server';
import { getAICompletion, isAIConfigured } from '@/lib/ai';
import type {
  LessonPlanSection,
  LessonPlanElement,
  LessonComponentType,
} from '@/lib/curriculum/wilson-lesson-elements';
import {
  createEmptyLessonPlan,
  generateElementId,
} from '@/lib/curriculum/wilson-lesson-elements';

interface RequestBody {
  substep: string;
  substepName: string;
}

// Wilson substep knowledge base - what each substep teaches
// CORRECTED to match official Wilson scope & sequence from src/lib/curriculum/wilson.ts
const WILSON_SUBSTEP_INFO: Record<string, {
  focus: string;
  sounds: string[];
  concepts: string[];
  patterns: string[];
}> = {
  // Step 1: Closed Syllables (3 Sounds)
  '1.1': {
    focus: 'Basic Consonants & Short Vowels a, i, o',
    sounds: ['a (short)', 'i (short)', 'o (short)', 'f', 'l', 'm', 'n', 'r', 's', 'd', 'g', 'p', 't'],
    concepts: ['closed syllable: vowel is "closed in" by consonant, making it short', 'every syllable has one vowel sound', 'tap each sound, then blend'],
    patterns: ['CVC with a', 'CVC with i', 'CVC with o'],
  },
  '1.2': {
    focus: 'Additional Consonants, Digraphs & Short Vowels u, e',
    sounds: ['u (short)', 'e (short)', 'b', 'h', 'j', 'c', 'k', 'ck', 'v', 'w', 'x', 'y', 'z', 'sh', 'ch', 'th', 'wh', 'qu'],
    concepts: ['digraph: two letters that make ONE sound', 'tap once for digraphs', 'ck used after short vowel at end of one-syllable word'],
    patterns: ['CVC with u', 'CVC with e', 'digraph words'],
  },
  '1.3': {
    focus: 'Three-Sound Words with Digraphs',
    sounds: ['sh', 'ch', 'th', 'wh', 'ck'],
    concepts: ['apply digraph knowledge in full word reading', 'digraphs can appear at beginning or end of words', 'continue tapping with digraphs as single units'],
    patterns: ['initial digraphs', 'final digraphs', 'CVC with digraphs'],
  },
  '1.4': {
    focus: 'Bonus Letters (FLOSS Rule) & Welded Sound /all/',
    sounds: ['ff', 'll', 'ss', 'zz', 'all'],
    concepts: ['FLOSS rule: f, l, s, z double after short vowel in one-syllable word', 'bonus letters make one sound, tap once', 'welded /all/ - tap with fingers together'],
    patterns: ['FLOSS words', '-all words'],
  },
  '1.5': {
    focus: 'Welded Sounds /am/ and /an/',
    sounds: ['am', 'an'],
    concepts: ['welded sounds stay together as a unit', 'tap with two fingers stuck together for welded sounds', 'vowel sound changes slightly before m and n'],
    patterns: ['-am words', '-an words'],
  },
  '1.6': {
    focus: 'Suffixes -s and -es',
    sounds: ['-s', '-es'],
    concepts: ['suffix: word part added to end of base word', 'base word + suffix = new word', 'add -es when word ends in s, x, z, ch, sh'],
    patterns: ['plural -s', 'plural -es'],
  },
  // Step 2: Closed Syllables (4-6 Sounds with Blends)
  '2.1': {
    focus: 'Welded Sounds with -ng and -nk',
    sounds: ['ang', 'ing', 'ong', 'ung', 'ank', 'ink', 'onk', 'unk'],
    concepts: ['ng and nk are welded to the vowel before them', 'tap these as welded units (2-3 fingers together)', 'the vowel sound changes before ng and nk'],
    patterns: ['-ang words', '-ing words', '-ong words', '-ung words', '-ank words', '-ink words', '-onk words', '-unk words'],
  },
  '2.2': {
    focus: 'Closed Syllables with 4 Sounds (Initial Blends)',
    sounds: ['bl', 'cl', 'fl', 'gl', 'pl', 'sl', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw'],
    concepts: ['blend: each consonant sound is heard', 'tap each sound in a blend separately', 'keep blends together when dividing syllables'],
    patterns: ['CCVC words', 'initial l-blends', 'initial r-blends', 'initial s-blends'],
  },
  '2.3': {
    focus: 'Closed Syllable Exceptions',
    sounds: ['ild', 'ind', 'old', 'olt', 'ost'],
    concepts: ['some closed syllables have long vowels (exceptions)', 'common exception patterns to memorize', 'i before ld/nd often says long i; o before ld/lt/st often says long o'],
    patterns: ['-ild words', '-ind words', '-old words', '-olt words', '-ost words'],
  },
  '2.4': {
    focus: 'Closed Syllables with 5 Sounds (Final Blends)',
    sounds: ['ft', 'lt', 'mp', 'nd', 'nt', 'pt', 'sk', 'sp', 'st'],
    concepts: ['final blends follow the vowel', 'each sound in a blend is tapped', 'CCVCC pattern words'],
    patterns: ['CVCC words', 'CCVCC words', 'final blends'],
  },
  '2.5': {
    focus: 'Three-Letter Blends (Up to 6 Sounds)',
    sounds: ['scr', 'spl', 'spr', 'str', 'thr'],
    concepts: ['three-letter blends: each sound still heard', 'complex words require careful tapping', 'maximum 6 sounds in one-syllable closed words'],
    patterns: ['CCCVC words', 'CCCVCC words', 'three-letter blends'],
  },
  // Step 3: Two-Syllable Closed Words
  '3.1': {
    focus: 'VCCV Syllable Division',
    sounds: ['all short vowels in multisyllable words'],
    concepts: ['spot and dot vowels first', 'VCCV: divide between the two consonants', 'each syllable has one vowel sound', 'apply closed syllable rule to each syllable'],
    patterns: ['VCCV division', 'two-syllable closed words'],
  },
  '3.2': {
    focus: 'Words with -ct Blend',
    sounds: ['ct'],
    concepts: ['ct blend stays together', 'divide before the ct blend', 'common pattern in two-syllable words'],
    patterns: ['-ct words', 'multisyllable -ct words'],
  },
  '3.3': {
    focus: 'Compound Closed Syllable Words',
    sounds: ['compound word components'],
    concepts: ['compound word = two words joined together', 'divide at the compound boundary', 'apply syllable rules to each part'],
    patterns: ['compound words', 'closed + closed compounds'],
  },
  '3.4': {
    focus: 'Three-Syllable Closed Words',
    sounds: ['all closed syllable patterns'],
    concepts: ['apply division rules at each VCCV pattern', 'keep digraphs and blends together', 'decode one syllable at a time'],
    patterns: ['three-syllable words', 'complex multisyllable'],
  },
  // Step 4: Vowel-Consonant-e (VCe) Syllables
  '4.1': {
    focus: 'One-Syllable VCe Words',
    sounds: ['long a', 'long i', 'long o', 'long u', 'long e'],
    concepts: ['VCe: vowel-consonant-silent e pattern', 'silent e jumps over one consonant to make vowel say its name', 'contrast with closed syllables: hop vs hope, tap vs tape'],
    patterns: ['a_e', 'i_e', 'o_e', 'u_e', 'e_e'],
  },
  '4.2': {
    focus: 'Two-Syllable Words with VCe',
    sounds: ['VCe in longer words'],
    concepts: ['VCe syllable can combine with closed syllables', 'divide before or after the consonant preceding VCe', 'silent e rule applies within syllable'],
    patterns: ['closed + VCe', 'VCe multisyllable'],
  },
  '4.3': {
    focus: 'VCe Exceptions',
    sounds: ['have', 'give', 'live', 'love', 'come', 'some', 'done', 'gone', 'none'],
    concepts: ['some VCe words have short vowels (exceptions)', 'these are high-frequency words to memorize', 'flex strategy: try long, if not a word try short'],
    patterns: ['VCe exception words'],
  },
  '4.4': {
    focus: 'Suffix Rules with VCe Base Words',
    sounds: ['-ing', '-ed', '-er', '-est', '-ment', '-ful', '-less'],
    concepts: ['drop e rule: remove e before adding suffix starting with vowel', 'keep e before consonant suffixes', 'base word meaning stays the same'],
    patterns: ['VCe + vowel suffix', 'VCe + consonant suffix'],
  },
  // Step 5: Open Syllables
  '5.1': {
    focus: 'One-Syllable Open Words',
    sounds: ['be', 'he', 'me', 'she', 'we', 'no', 'so', 'go', 'hi', 'I'],
    concepts: ['open syllable: nothing closes in the vowel', 'vowel at end of syllable says its name (long)', 'these are often high-frequency words'],
    patterns: ['one-syllable open words'],
  },
  '5.2': {
    focus: 'Y as a Vowel',
    sounds: ['y as long i', 'y as long e'],
    concepts: ['y is a vowel when it makes a vowel sound', 'end of one-syllable word: y says long i (my, fly)', 'end of multisyllabic word: y says long e (baby, happy)'],
    patterns: ['y as long i', 'y as long e'],
  },
  '5.3': {
    focus: 'Open Syllable Prefixes',
    sounds: ['re-', 'pre-', 'de-', 'be-'],
    concepts: ['prefixes are word parts added to beginning', 'open syllable prefixes end in long vowel', 'divide after the prefix'],
    patterns: ['re- words', 'pre- words', 'de- words', 'be- words'],
  },
  '5.4': {
    focus: 'Open Syllable Division & Schwa',
    sounds: ['schwa /ə/'],
    concepts: ['VCV pattern: try open syllable first (V/CV)', 'flex strategy: if open does not make a word, try closed (VC/V)', 'schwa: unstressed vowel often says /uh/'],
    patterns: ['V/CV division', 'VC/V division', 'schwa words'],
  },
  // Step 6: Suffixes & Consonant-le Syllables
  '6.1': {
    focus: 'Common Suffixes (Set 1)',
    sounds: ['-er', '-est', '-en', '-ish', '-or', '-y', '-ly'],
    concepts: ['suffix changes word meaning or part of speech', 'identify base word + suffix', 'unchanging base: no spelling changes when adding suffix'],
    patterns: ['suffix -er', 'suffix -est', 'suffix -en', 'suffix -ish', 'suffix -or', 'suffix -y', 'suffix -ly'],
  },
  '6.2': {
    focus: 'Additional Suffixes (Set 2)',
    sounds: ['-ful', '-less', '-ness', '-ment', '-able', '-ty'],
    concepts: ['-ful means full of; -less means without', '-ness and -ment create nouns', '-able means able to be'],
    patterns: ['suffix -ful', 'suffix -less', 'suffix -ness', 'suffix -ment', 'suffix -able'],
  },
  '6.3': {
    focus: 'Consonant-le Syllables',
    sounds: ['ble', 'cle', 'dle', 'fle', 'gle', 'kle', 'ple', 'tle', 'zle'],
    concepts: ['consonant-le: the consonant + le form a syllable', 'divide BEFORE the consonant-le', 'the le syllable is never stressed'],
    patterns: ['-ble', '-cle', '-dle', '-fle', '-gle', '-kle', '-ple', '-tle', '-zle'],
  },
  '6.4': {
    focus: 'Two-Syllable Consonant-le Words',
    sounds: ['consonant-le combinations'],
    concepts: ['identify first syllable type to determine vowel sound', 'closed first syllable = short vowel (bubble)', 'open or VCe first syllable = long vowel (maple, cable)'],
    patterns: ['closed + consonant-le', 'VCe + consonant-le', 'open + consonant-le'],
  },
};

const WILSON_LESSON_SYSTEM_PROMPT = `You are an expert Wilson Reading System instructor and curriculum designer.
Your task is to generate a complete, structured lesson plan for a specific Wilson substep.

You must generate content that is:
1. Appropriate for the substep's focus sounds and patterns
2. Decodable given the student's current skill level (only use patterns taught up to this substep)
3. Engaging and age-appropriate for struggling readers (typically ages 8-18)
4. Following the Wilson Reading System's multisensory, structured literacy approach

For each lesson component, provide:
- Specific words/sounds that match the substep's patterns
- Practical activities using those elements
- Notes for the teacher

IMPORTANT: Only use spelling patterns and sounds that have been explicitly taught up to and including the current substep. Do not use patterns from later substeps.`;

function generateLessonPrompt(substep: string, substepName: string): string {
  const info = WILSON_SUBSTEP_INFO[substep] || {
    focus: substepName,
    sounds: [],
    concepts: [],
    patterns: [],
  };

  return `Generate a complete Wilson Reading System lesson plan for:

**Substep ${substep}: ${substepName}**

Focus: ${info.focus}
Target sounds: ${info.sounds.join(', ')}
Key concepts: ${info.concepts.join(', ')}
Patterns: ${info.patterns.join(', ')}

Generate the following in JSON format:

{
  "sounds": [
    {"sound": "string", "keyword": "string", "isNew": boolean}
  ],
  "words": [
    {"word": "string", "forDecoding": boolean, "forSpelling": boolean}
  ],
  "nonsenseWords": [
    {"word": "string", "pattern": "string"}
  ],
  "highFrequencyWords": [
    {"word": "string", "isNew": boolean, "teachingTip": "string or null"}
  ],
  "sentences": [
    {"text": "string", "forReading": boolean, "forDictation": boolean}
  ],
  "story": {
    "title": "string",
    "text": "string (3-5 sentences using only decodable words from this and prior substeps)"
  },
  "activities": {
    "soundsDrill": ["activity description"],
    "wordStudy": ["activity description"],
    "spelling": ["activity description"],
    "fluency": ["activity description"]
  }
}

Requirements:
1. Generate 6-10 sound cards (mix of new and review)
2. Generate 12-15 real words for the target pattern
3. Generate 6-8 nonsense words for the target pattern
4. Generate 4-6 high-frequency words (mix of decodable and sight words)
5. Generate 4-6 sentences for reading practice
6. Generate 2-3 sentences for dictation practice
7. Generate a short decodable story (3-5 sentences)
8. Generate 2-3 activities per lesson block

Return ONLY valid JSON, no markdown or explanation.`;
}

interface AILessonResponse {
  sounds: Array<{ sound: string; keyword: string; isNew: boolean }>;
  words: Array<{ word: string; forDecoding: boolean; forSpelling: boolean }>;
  nonsenseWords: Array<{ word: string; pattern: string }>;
  highFrequencyWords: Array<{ word: string; isNew: boolean; teachingTip: string | null }>;
  sentences: Array<{ text: string; forReading: boolean; forDictation: boolean }>;
  story: { title: string; text: string };
  activities: {
    soundsDrill: string[];
    wordStudy: string[];
    spelling: string[];
    fluency: string[];
  };
}

function createLessonPlanFromAI(
  substep: string,
  substepName: string,
  aiResponse: AILessonResponse
): {
  sections: LessonPlanSection[];
  totalDuration: number;
} {
  const sections: LessonPlanSection[] = [
    // Block 1: Word Study
    {
      component: 'sounds-quick-drill',
      componentName: 'Sound Cards - Quick Drill',
      duration: 2,
      elements: aiResponse.sounds.slice(0, 8).map((s) => ({
        id: generateElementId(),
        type: 'sound' as const,
        value: `${s.sound} (${s.keyword})`,
        sourceId: `ai-sound-${s.sound}`,
      })),
      activities: aiResponse.activities.soundsDrill || [],
      notes: '',
    },
    {
      component: 'teach-review-reading',
      componentName: 'Teach/Review - New Learning for Reading',
      duration: 10,
      elements: aiResponse.sounds.filter(s => s.isNew).slice(0, 3).map((s) => ({
        id: generateElementId(),
        type: 'sound' as const,
        value: `NEW: ${s.sound} (${s.keyword})`,
        sourceId: `ai-new-sound-${s.sound}`,
      })),
      activities: ['Introduce new sound with keyword and gesture', 'Model sound production with mirror'],
      notes: `Focus sounds for this substep: ${aiResponse.sounds.filter(s => s.isNew).map(s => s.sound).join(', ')}`,
    },
    {
      component: 'word-cards',
      componentName: 'Word Cards',
      duration: 3,
      elements: aiResponse.words.slice(0, 8).map((w) => ({
        id: generateElementId(),
        type: 'word' as const,
        value: w.word,
        sourceId: `ai-word-${w.word}`,
      })),
      activities: ['Flash word cards for automatic recognition', 'Discuss word meanings'],
      notes: '',
    },
    {
      component: 'wordlist-reading',
      componentName: 'Wordlist Reading',
      duration: 5,
      elements: [
        ...aiResponse.words.slice(0, 6).map((w) => ({
          id: generateElementId(),
          type: 'word' as const,
          value: w.word,
          sourceId: `ai-wordlist-${w.word}`,
        })),
        ...aiResponse.nonsenseWords.slice(0, 4).map((w) => ({
          id: generateElementId(),
          type: 'nonsense' as const,
          value: `*${w.word}* (${w.pattern})`,
          sourceId: `ai-nonsense-${w.word}`,
        })),
      ],
      activities: aiResponse.activities.wordStudy || ['Choral reading of word list', 'Individual turns with error correction'],
      notes: '',
    },
    {
      component: 'sentence-reading',
      componentName: 'Sentence Reading',
      duration: 5,
      elements: aiResponse.sentences.filter(s => s.forReading).slice(0, 4).map((s) => ({
        id: generateElementId(),
        type: 'sentence' as const,
        value: s.text,
        sourceId: `ai-sentence-${s.text.slice(0, 20)}`,
      })),
      activities: ['Echo reading for fluency', 'Discussion of sentence meaning'],
      notes: '',
    },
    // Block 2: Spelling
    {
      component: 'quick-drill-reverse',
      componentName: 'Quick Drill - Reverse (Sounds to Letters)',
      duration: 2,
      elements: aiResponse.sounds.slice(0, 6).map((s) => ({
        id: generateElementId(),
        type: 'sound' as const,
        value: s.sound,
        sourceId: `ai-reverse-${s.sound}`,
      })),
      activities: ['Teacher says sound, students write letter(s)', 'Air writing practice'],
      notes: '',
    },
    {
      component: 'teach-review-spelling',
      componentName: 'Teach/Review - New Learning for Spelling',
      duration: 10,
      elements: aiResponse.words.filter(w => w.forSpelling).slice(0, 4).map((w) => ({
        id: generateElementId(),
        type: 'word' as const,
        value: w.word,
        sourceId: `ai-spell-word-${w.word}`,
      })),
      activities: aiResponse.activities.spelling || ['Finger spelling with sound tapping', 'Dictation with proof and edit'],
      notes: '',
    },
    {
      component: 'dictation',
      componentName: 'Dictation',
      duration: 8,
      elements: [
        ...aiResponse.sounds.slice(0, 3).map((s) => ({
          id: generateElementId(),
          type: 'sound' as const,
          value: `Sound: ${s.sound}`,
          sourceId: `ai-dict-sound-${s.sound}`,
        })),
        ...aiResponse.words.filter(w => w.forSpelling).slice(0, 4).map((w) => ({
          id: generateElementId(),
          type: 'word' as const,
          value: w.word,
          sourceId: `ai-dict-word-${w.word}`,
        })),
        ...aiResponse.sentences.filter(s => s.forDictation).slice(0, 2).map((s) => ({
          id: generateElementId(),
          type: 'sentence' as const,
          value: s.text,
          sourceId: `ai-dict-sentence-${s.text.slice(0, 20)}`,
        })),
      ],
      activities: ['Sound dictation', 'Word dictation with finger spelling', 'Sentence dictation with proofreading'],
      notes: '',
    },
    // Block 3: Fluency/Comprehension
    {
      component: 'passage-reading',
      componentName: 'Passage/Story Reading',
      duration: 10,
      elements: [{
        id: generateElementId(),
        type: 'story' as const,
        value: `"${aiResponse.story.title}": ${aiResponse.story.text.slice(0, 100)}...`,
        sourceId: `ai-story-${aiResponse.story.title}`,
      }],
      activities: aiResponse.activities.fluency || ['S.O.S. (Silent-Oral-Silent) reading', 'Comprehension discussion'],
      notes: `Full story:\n${aiResponse.story.text}`,
    },
    {
      component: 'listening-comprehension',
      componentName: 'Listening Comprehension',
      duration: 5,
      elements: [],
      activities: ['Read aloud from grade-level text', 'Discussion of vocabulary and comprehension'],
      notes: 'Use age-appropriate read-aloud material above student reading level',
    },
  ];

  const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

  return { sections, totalDuration };
}

// Fallback lesson when AI is not configured
function generateFallbackLesson(substep: string, substepName: string): AILessonResponse {
  const info = WILSON_SUBSTEP_INFO[substep];

  return {
    sounds: (info?.sounds || ['a', 'i']).slice(0, 6).map((s, i) => ({
      sound: s,
      keyword: `keyword for ${s}`,
      isNew: i < 2,
    })),
    words: [
      { word: 'cat', forDecoding: true, forSpelling: true },
      { word: 'sat', forDecoding: true, forSpelling: true },
      { word: 'mat', forDecoding: true, forSpelling: true },
      { word: 'hat', forDecoding: true, forSpelling: true },
      { word: 'bat', forDecoding: true, forSpelling: true },
      { word: 'rat', forDecoding: true, forSpelling: false },
    ],
    nonsenseWords: [
      { word: 'dat', pattern: 'CVC' },
      { word: 'fap', pattern: 'CVC' },
      { word: 'mip', pattern: 'CVC' },
    ],
    highFrequencyWords: [
      { word: 'the', isNew: false, teachingTip: 'Irregular - memorize' },
      { word: 'is', isNew: false, teachingTip: null },
      { word: 'a', isNew: true, teachingTip: null },
    ],
    sentences: [
      { text: 'The cat sat on the mat.', forReading: true, forDictation: true },
      { text: 'A rat ran to the hat.', forReading: true, forDictation: false },
      { text: 'Pat has a fat cat.', forReading: true, forDictation: true },
    ],
    story: {
      title: 'The Cat and the Rat',
      text: 'The cat sat on a mat. A rat ran past the cat. The cat ran to get the rat. The rat hid in a hat. The cat sat and sat.',
    },
    activities: {
      soundsDrill: ['Rapid sound card flip', 'Say sound while tapping'],
      wordStudy: ['Choral reading of word list', 'Individual reading with feedback'],
      spelling: ['Finger spelling practice', 'Dictation with proofreading'],
      fluency: ['Echo reading', 'Partner reading'],
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { substep, substepName } = body;

    if (!substep) {
      return NextResponse.json(
        { error: 'Missing required field: substep' },
        { status: 400 }
      );
    }

    let aiResponse: AILessonResponse;

    if (!isAIConfigured()) {
      // Use fallback when AI is not configured
      console.log('AI not configured, using fallback lesson');
      aiResponse = generateFallbackLesson(substep, substepName);
    } else {
      const prompt = generateLessonPrompt(substep, substepName);

      const result = await getAICompletion({
        systemPrompt: WILSON_LESSON_SYSTEM_PROMPT,
        userPrompt: prompt,
        maxTokens: 2048,
      });

      try {
        // Parse the AI response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response, using fallback:', parseError);
        aiResponse = generateFallbackLesson(substep, substepName);
      }
    }

    // Create the lesson plan structure
    const { sections, totalDuration } = createLessonPlanFromAI(
      substep,
      substepName,
      aiResponse
    );

    // Create the full lesson plan
    const lessonPlan = {
      substep,
      substepName: substepName || `Substep ${substep}`,
      sections,
      totalDuration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      lessonPlan,
      aiGenerated: isAIConfigured(),
    });
  } catch (error) {
    console.error('Error generating Wilson lesson:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate lesson plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
