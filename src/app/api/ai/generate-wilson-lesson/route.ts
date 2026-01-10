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
const WILSON_SUBSTEP_INFO: Record<string, {
  focus: string;
  sounds: string[];
  concepts: string[];
  patterns: string[];
}> = {
  '1.1': {
    focus: 'Short vowels a and i in CVC words',
    sounds: ['a (short)', 'i (short)'],
    concepts: ['closed syllable', 'CVC pattern'],
    patterns: ['CVC with a', 'CVC with i'],
  },
  '1.2': {
    focus: 'Short vowels o, u, and e in CVC words',
    sounds: ['o (short)', 'u (short)', 'e (short)'],
    concepts: ['closed syllable', 'CVC pattern'],
    patterns: ['CVC with o', 'CVC with u', 'CVC with e'],
  },
  '1.3': {
    focus: 'Consonant digraphs sh, th, wh, ch, ck',
    sounds: ['sh', 'th', 'wh', 'ch', 'ck'],
    concepts: ['digraph', 'two letters one sound'],
    patterns: ['sh words', 'th words', 'ch words', 'wh words', 'ck words'],
  },
  '1.4': {
    focus: 'Initial and final consonant blends',
    sounds: ['bl', 'cl', 'fl', 'gl', 'pl', 'sl', 'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 'sc', 'sk', 'sm', 'sn', 'sp', 'st', 'sw'],
    concepts: ['blend', 'two consonants blended together'],
    patterns: ['initial blends', 'final blends', 'CCVC', 'CVCC'],
  },
  '1.5': {
    focus: 'Review of three-sound words with all short vowels',
    sounds: ['a', 'e', 'i', 'o', 'u (all short)'],
    concepts: ['closed syllable review', 'sound discrimination'],
    patterns: ['CVC review'],
  },
  '1.6': {
    focus: 'Glued/Welded sounds ang, ing, ong, ung, ank, ink, onk, unk',
    sounds: ['ang', 'ing', 'ong', 'ung', 'ank', 'ink', 'onk', 'unk'],
    concepts: ['welded sounds', 'glued sounds', 'sounds that stick together'],
    patterns: ['ang words', 'ing words', 'ank words', 'ink words'],
  },
  '2.1': {
    focus: 'Closed syllable exceptions (old, ild, ind, olt, ost)',
    sounds: ['old', 'ild', 'ind', 'olt', 'ost'],
    concepts: ['closed syllable exception', 'long vowel in closed syllable'],
    patterns: ['old words', 'ild words', 'ind words'],
  },
  '2.2': {
    focus: 'Suffix -s for plurals and verbs',
    sounds: ['/s/', '/z/'],
    concepts: ['suffix', 'plural', 'baseword + suffix'],
    patterns: ['adding -s to nouns', 'adding -s to verbs'],
  },
  '2.3': {
    focus: 'Suffix -es',
    sounds: ['/ez/', '/iz/'],
    concepts: ['suffix', 'when to use -es'],
    patterns: ['words ending in s, x, z, ch, sh'],
  },
  '2.4': {
    focus: 'Suffix -ed (three sounds)',
    sounds: ['/ed/', '/d/', '/t/'],
    concepts: ['past tense', 'suffix', 'three sounds of -ed'],
    patterns: ['-ed after t or d', '-ed after voiced', '-ed after unvoiced'],
  },
  '2.5': {
    focus: 'Suffix -ing',
    sounds: ['/ing/'],
    concepts: ['present participle', 'suffix', 'doubling rule'],
    patterns: ['baseword + ing', 'double consonant + ing'],
  },
  '2.6': {
    focus: 'Suffix review (-s, -es, -ed, -ing)',
    sounds: ['all suffix sounds'],
    concepts: ['suffix review', 'choosing correct suffix'],
    patterns: ['mixed suffix practice'],
  },
  '3.1': {
    focus: 'Two-syllable words with closed syllables (VC/CV)',
    sounds: ['all short vowels in multisyllable words'],
    concepts: ['syllable division', 'rabbit rule', 'VC/CV pattern'],
    patterns: ['VCCV division between consonants'],
  },
  '3.2': {
    focus: 'Vowel-Consonant-e syllable type',
    sounds: ['long a', 'long i', 'long o', 'long u', 'long e'],
    concepts: ['VCe pattern', 'magic e', 'silent e'],
    patterns: ['a_e', 'i_e', 'o_e', 'u_e', 'e_e'],
  },
  '3.3': {
    focus: 'Open syllable type',
    sounds: ['long vowels at syllable end'],
    concepts: ['open syllable', 'vowel at end says its name'],
    patterns: ['V/CV division', 'open first syllable'],
  },
  '3.4': {
    focus: 'Syllable division review',
    sounds: ['all patterns'],
    concepts: ['closed vs open vs VCe', 'syllable division rules'],
    patterns: ['mixed syllable types'],
  },
  '4.1': {
    focus: 'R-controlled vowel ar',
    sounds: ['ar'],
    concepts: ['r-controlled', 'bossy r'],
    patterns: ['ar words'],
  },
  '4.2': {
    focus: 'R-controlled vowel or',
    sounds: ['or'],
    concepts: ['r-controlled', 'bossy r'],
    patterns: ['or words'],
  },
  '4.3': {
    focus: 'R-controlled vowels er, ir, ur',
    sounds: ['er', 'ir', 'ur'],
    concepts: ['r-controlled', 'same sound different spellings'],
    patterns: ['er words', 'ir words', 'ur words'],
  },
  '4.4': {
    focus: 'R-controlled review',
    sounds: ['ar', 'or', 'er', 'ir', 'ur'],
    concepts: ['all r-controlled patterns'],
    patterns: ['mixed r-controlled'],
  },
  '5.1': {
    focus: 'Vowel teams ai and ay',
    sounds: ['ai', 'ay (long a)'],
    concepts: ['vowel team', 'two vowels one sound', 'position rules'],
    patterns: ['ai in middle', 'ay at end'],
  },
  '5.2': {
    focus: 'Vowel teams ee and ea',
    sounds: ['ee', 'ea (long e)'],
    concepts: ['vowel team', 'multiple spellings'],
    patterns: ['ee words', 'ea words'],
  },
  '5.3': {
    focus: 'Vowel teams oi and oy',
    sounds: ['oi', 'oy (diphthong)'],
    concepts: ['diphthong', 'position rules'],
    patterns: ['oi in middle', 'oy at end'],
  },
  '5.4': {
    focus: 'Vowel teams oa, ow, oe',
    sounds: ['oa', 'ow', 'oe (long o)'],
    concepts: ['vowel team', 'multiple spellings for long o'],
    patterns: ['oa words', 'ow words', 'oe words'],
  },
  '5.5': {
    focus: 'Vowel teams ou, oo, ew, au, aw',
    sounds: ['ou', 'oo', 'ew', 'au', 'aw'],
    concepts: ['vowel team', 'diphthong', 'various vowel sounds'],
    patterns: ['ou words', 'oo words', 'ew words', 'au/aw words'],
  },
  '5.6': {
    focus: 'Vowel team review',
    sounds: ['all vowel teams'],
    concepts: ['vowel team review'],
    patterns: ['mixed vowel teams'],
  },
  '6.1': {
    focus: 'Consonant-le syllable type',
    sounds: ['ble', 'cle', 'dle', 'fle', 'gle', 'kle', 'ple', 'tle', 'zle'],
    concepts: ['consonant-le', 'final stable syllable'],
    patterns: ['-ble', '-cle', '-dle', '-fle', '-gle', '-kle', '-ple', '-tle', '-zle'],
  },
  '6.2': {
    focus: 'Suffixes -tion and -sion',
    sounds: ['/shun/'],
    concepts: ['Latin suffix', 'abstract nouns'],
    patterns: ['-tion', '-sion'],
  },
  '6.3': {
    focus: 'Common prefixes (un-, re-, pre-, dis-, mis-)',
    sounds: ['un-', 're-', 'pre-', 'dis-', 'mis-'],
    concepts: ['prefix', 'meaning units', 'morphology'],
    patterns: ['prefix + baseword'],
  },
  '6.4': {
    focus: 'Multisyllable word review',
    sounds: ['all patterns'],
    concepts: ['all syllable types', 'morphology'],
    patterns: ['complex multisyllable words'],
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
