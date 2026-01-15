/**
 * Despegando (Spanish) Worksheet Generators
 *
 * Core logic for generating different worksheet types for Spanish reading intervention.
 * Parallel to Wilson generators but adapted for Spanish phonics patterns.
 */

import {
  type DifficultyLevel,
  type WorksheetSection,
  type WorksheetItem,
  type AnswerKeySection,
  DIFFICULTY_SETTINGS,
} from './types';
import {
  segmentSpanishWord,
  divideSpanishSyllables,
  createSpanishSoundBoxes,
  createBlankedSpanishWord,
  shuffleArray,
  getRandomItems,
  generateCVSyllables,
  generateCCVSyllables,
  type SpanishSoundBox,
} from './spanish-word-utils';
import {
  getDespegandoLesson,
  type DespegandoLesson,
} from '@/lib/curriculum/despegando';
import type {
  DespegandoLessonElements,
  SpanishWord,
  SpanishSyllable,
  SpanishSentence,
  ElkoninBoxItem,
} from '@/lib/curriculum/despegando-lesson-elements';
import {
  getSpanishMazeSentencesForLesson,
  getSpanishIllustratableSentences,
  type SpanishMazeSentence,
} from './despegando-maze-sentences';

// Spanish worksheet template types
export type SpanishWorksheetTemplate =
  | 'syllable_grid'
  | 'word_list_spanish'
  | 'elkonin_boxes'
  | 'sentence_dictation_spanish'
  | 'syllable_clapping'
  | 'mixed_spanish'
  | 'sentence_completion_spanish'
  | 'draw_and_write_spanish';

// Spanish worksheet configuration
export interface SpanishWorksheetConfig {
  template: SpanishWorksheetTemplate;
  lesson: number; // Lesson 1-40
  difficulty: DifficultyLevel;
  wordCount: number;
  includeNonsenseWords: boolean;
  includeAnswerKey: boolean;
  studentName?: string;
  date?: string;
}

// Generated Spanish worksheet
export interface GeneratedSpanishWorksheet {
  id: string;
  config: SpanishWorksheetConfig;
  lessonData: DespegandoLesson;
  phaseNumber: number;
  phaseName: string;
  title: string;
  titleSpanish: string;
  instructions: string;
  instructionsSpanish: string;
  content: { sections: WorksheetSection[] };
  answerKey?: { sections: AnswerKeySection[] };
  createdAt: Date;
}

// Spanish sentence frames for dictation
export const SPANISH_SENTENCE_FRAMES: string[] = [
  'Mi ___ me ___.',
  'La ___ es ___.',
  'Yo ___ a mi ___.',
  'El ___ y la ___.',
  'Mi ___ está en la ___.',
  '___ y ___ son amigos.',
  'La ___ tiene una ___.',
  'Mira la ___ en el ___.',
  'Me gusta la ___.',
  'El ___ come ___.',
];

// Spanish high-frequency words (palabras de alta frecuencia)
export const SPANISH_HF_WORDS: string[] = [
  'el', 'la', 'los', 'las', 'un', 'una',
  'de', 'en', 'con', 'por', 'para',
  'que', 'qué', 'es', 'son', 'está',
  'y', 'o', 'pero', 'como', 'más',
  'mi', 'tu', 'su', 'me', 'te', 'se',
  'hay', 'aquí', 'ahí', 'muy', 'bien',
];

// Template descriptions for UI
export const SPANISH_WORKSHEET_TEMPLATES: Record<SpanishWorksheetTemplate, {
  name: string;
  nameSpanish: string;
  description: string;
  descriptionSpanish: string;
  icon: string;
  suitableFor: string[];
}> = {
  syllable_grid: {
    name: 'Syllable Grid',
    nameSpanish: 'Tabla de Sílabas',
    description: 'Practice reading CV syllables (ma, me, mi, mo, mu)',
    descriptionSpanish: 'Practica la lectura de sílabas CV (ma, me, mi, mo, mu)',
    icon: '📊',
    suitableFor: ['syllable practice', 'fluency', 'warm-up'],
  },
  word_list_spanish: {
    name: 'Spanish Word List',
    nameSpanish: 'Lista de Palabras',
    description: 'Read and write Spanish words with current patterns',
    descriptionSpanish: 'Lee y escribe palabras con los patrones actuales',
    icon: '📝',
    suitableFor: ['reading', 'spelling', 'homework'],
  },
  elkonin_boxes: {
    name: 'Sound Boxes (Cajas de Sonidos)',
    nameSpanish: 'Cajas de Sonidos',
    description: 'Segment Spanish words into individual sounds',
    descriptionSpanish: 'Segmenta palabras en sonidos individuales',
    icon: '🔤',
    suitableFor: ['phonemic awareness', 'encoding', 'centers'],
  },
  sentence_dictation_spanish: {
    name: 'Sentence Dictation',
    nameSpanish: 'Dictado de Oraciones',
    description: 'Practice spelling Spanish words in sentences',
    descriptionSpanish: 'Practica escribir palabras en oraciones',
    icon: '✍️',
    suitableFor: ['dictation', 'writing', 'homework'],
  },
  syllable_clapping: {
    name: 'Syllable Clapping',
    nameSpanish: 'Palmadas de Sílabas',
    description: 'Count syllables with clapping activities',
    descriptionSpanish: 'Cuenta sílabas con actividades de palmadas',
    icon: '👏',
    suitableFor: ['phonological awareness', 'kinesthetic', 'warm-up'],
  },
  mixed_spanish: {
    name: 'Mixed Practice',
    nameSpanish: 'Práctica Combinada',
    description: 'Combined worksheet with multiple activity types',
    descriptionSpanish: 'Hoja combinada con múltiples tipos de actividades',
    icon: '📚',
    suitableFor: ['review', 'assessment', 'homework'],
  },
  sentence_completion_spanish: {
    name: 'Finish the Sentence',
    nameSpanish: 'Completa la Oración',
    description: 'Choose the correct word to complete the sentence',
    descriptionSpanish: 'Elige la palabra correcta para completar la oración',
    icon: '✅',
    suitableFor: ['comprehension', 'vocabulary', 'centers'],
  },
  draw_and_write_spanish: {
    name: 'Draw & Write',
    nameSpanish: 'Dibuja y Escribe',
    description: 'Read a decodable sentence and draw a picture',
    descriptionSpanish: 'Lee una oración decodificable y dibuja',
    icon: '🎨',
    suitableFor: ['comprehension', 'creativity', 'centers'],
  },
};

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `ws_es_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Main Spanish worksheet generator
 */
export function generateSpanishWorksheet(
  config: SpanishWorksheetConfig,
  lessonElements?: DespegandoLessonElements
): GeneratedSpanishWorksheet | null {
  const result = getDespegandoLesson(config.lesson);
  if (!result) {
    console.error(`Lesson ${config.lesson} not found`);
    return null;
  }

  const { phase, lesson: lessonData } = result;

  // Use the phase number directly from the phase object
  const phaseNumber = phase.phase;

  const phaseName = phaseNumber === 1 ? 'Vowels & First Consonants' :
    phaseNumber === 2 ? 'Additional Consonants' :
    phaseNumber === 3 ? 'Digraphs' :
    phaseNumber === 4 ? 'Consonant Blends' : 'Advanced & Fluency';

  let content;
  let title;
  let titleSpanish;
  let instructions;
  let instructionsSpanish;

  switch (config.template) {
    case 'syllable_grid':
      ({ content, title, titleSpanish, instructions, instructionsSpanish } =
        generateSyllableGridWorksheet(config, lessonData, lessonElements));
      break;
    case 'word_list_spanish':
      ({ content, title, titleSpanish, instructions, instructionsSpanish } =
        generateSpanishWordListWorksheet(config, lessonData, lessonElements));
      break;
    case 'elkonin_boxes':
      ({ content, title, titleSpanish, instructions, instructionsSpanish } =
        generateElkoninBoxesWorksheet(config, lessonData, lessonElements));
      break;
    case 'sentence_dictation_spanish':
      ({ content, title, titleSpanish, instructions, instructionsSpanish } =
        generateSpanishSentenceDictationWorksheet(config, lessonData, lessonElements));
      break;
    case 'syllable_clapping':
      ({ content, title, titleSpanish, instructions, instructionsSpanish } =
        generateSyllableClappingWorksheet(config, lessonData, lessonElements));
      break;
    case 'mixed_spanish':
      ({ content, title, titleSpanish, instructions, instructionsSpanish } =
        generateMixedSpanishWorksheet(config, lessonData, lessonElements));
      break;
    case 'sentence_completion_spanish':
      ({ content, title, titleSpanish, instructions, instructionsSpanish } =
        generateSpanishSentenceCompletionWorksheet(config, lessonData, lessonElements));
      break;
    case 'draw_and_write_spanish':
      ({ content, title, titleSpanish, instructions, instructionsSpanish } =
        generateSpanishDrawAndWriteWorksheet(config, lessonData, lessonElements));
      break;
    default:
      return null;
  }

  const worksheet: GeneratedSpanishWorksheet = {
    id: generateId(),
    config,
    lessonData,
    phaseNumber,
    phaseName,
    title,
    titleSpanish,
    instructions,
    instructionsSpanish,
    content,
    createdAt: new Date(),
  };

  if (config.includeAnswerKey) {
    worksheet.answerKey = generateSpanishAnswerKey(content);
  }

  return worksheet;
}

/**
 * Generate Syllable Grid Worksheet (CV syllables)
 */
function generateSyllableGridWorksheet(
  config: SpanishWorksheetConfig,
  lessonData: DespegandoLesson,
  lessonElements?: DespegandoLessonElements
): {
  content: { sections: WorksheetSection[] };
  title: string;
  titleSpanish: string;
  instructions: string;
  instructionsSpanish: string;
} {
  const sections: WorksheetSection[] = [];

  // Get syllables from lesson data or generate from lesson
  let syllables: string[] = lessonElements?.syllables?.map(s => s.syllable) || lessonData.syllables;

  if (syllables.length === 0) {
    // Generate CV syllables from the lesson's target letters
    const targetLetters = lessonData.skills.filter(s => s.length === 1);
    syllables = targetLetters.flatMap(letter => generateCVSyllables(letter));
  }

  // Organize syllables into rows for grid display
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const consonants = [...new Set(syllables.map(s => s.replace(/[aeiouáéíóú]/gi, '')))];

  // Create syllable grid section
  if (consonants.length > 0) {
    sections.push({
      title: 'Syllable Grid / Tabla de Sílabas',
      type: 'word_list',
      items: consonants.slice(0, 6).map((consonant, idx) => {
        const row = vowels.map(v => consonant + v).join('   ');
        return {
          id: idx + 1,
          prompt: row,
          answer: row,
        };
      }),
    });
  }

  // Mixed syllable reading
  const shuffledSyllables = shuffleArray(syllables);
  sections.push({
    title: 'Read the Syllables / Lee las Sílabas',
    type: 'word_list',
    items: shuffledSyllables.slice(0, 15).map((syl, idx) => ({
      id: idx + 1,
      prompt: syl,
      answer: syl,
    })),
  });

  // Write the syllables dictation
  sections.push({
    title: 'Write the Syllables / Escribe las Sílabas',
    type: 'word_list',
    items: shuffledSyllables.slice(0, 8).map((syl, idx) => ({
      id: idx + 1,
      prompt: '________',
      answer: syl,
    })),
  });

  return {
    content: { sections },
    title: `Syllable Practice - Lesson ${lessonData.lesson}`,
    titleSpanish: `Práctica de Sílabas - Lección ${lessonData.lesson}`,
    instructions: 'Read each syllable row. Then read the mixed syllables. Write the syllables your teacher dictates.',
    instructionsSpanish: 'Lee cada fila de sílabas. Luego lee las sílabas mezcladas. Escribe las sílabas que dicta tu maestro.',
  };
}

/**
 * Generate Spanish Word List Worksheet
 */
function generateSpanishWordListWorksheet(
  config: SpanishWorksheetConfig,
  lessonData: DespegandoLesson,
  lessonElements?: DespegandoLessonElements
): {
  content: { sections: WorksheetSection[] };
  title: string;
  titleSpanish: string;
  instructions: string;
  instructionsSpanish: string;
} {
  const sections: WorksheetSection[] = [];

  // Get words from lesson elements or sample words
  let realWords: string[] = lessonElements?.realWords?.map(w => w.word) || lessonData.sampleWords;
  let nonsenseWords: string[] = lessonElements?.nonsenseWords?.map(w => w.word) || [];

  // Generate nonsense words if needed and none provided
  if (config.includeNonsenseWords && nonsenseWords.length === 0) {
    const syllables = lessonData.syllables;
    if (syllables.length >= 2) {
      // Create nonsense words by combining syllables
      for (let i = 0; i < 5; i++) {
        const shuffled = shuffleArray([...syllables]);
        nonsenseWords.push(shuffled.slice(0, 2).join(''));
      }
    }
  }

  // Real words section
  if (realWords.length > 0) {
    const shuffledReal = shuffleArray(realWords);
    sections.push({
      title: 'Real Words / Palabras Reales',
      type: 'word_list',
      items: shuffledReal.slice(0, config.wordCount).map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    });
  }

  // Nonsense words section
  if (nonsenseWords.length > 0 && config.includeNonsenseWords) {
    sections.push({
      title: 'Nonsense Words / Pseudopalabras',
      type: 'word_list',
      items: nonsenseWords.slice(0, 6).map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    });
  }

  // Syllable breakdown section
  sections.push({
    title: 'Divide into Syllables / Divide en Sílabas',
    type: 'syllable_split',
    items: realWords.slice(0, 6).map((word, idx) => {
      const syllables = divideSpanishSyllables(word);
      return {
        id: idx + 1,
        prompt: word,
        answer: syllables.join('-'),
        syllables,
      };
    }),
  });

  // Write the words section
  sections.push({
    title: 'Write the Words / Escribe las Palabras',
    type: 'word_list',
    items: realWords.slice(0, 8).map((word, idx) => ({
      id: idx + 1,
      prompt: '________________',
      answer: word,
    })),
  });

  return {
    content: { sections },
    title: `Word List Practice - Lesson ${lessonData.lesson}`,
    titleSpanish: `Práctica de Palabras - Lección ${lessonData.lesson}`,
    instructions: 'Read each word. Tap the syllables as you read. Write each word in the blanks.',
    instructionsSpanish: 'Lee cada palabra. Toca las sílabas mientras lees. Escribe cada palabra en los espacios.',
  };
}

/**
 * Generate Elkonin Boxes (Sound Mapping) Worksheet
 */
function generateElkoninBoxesWorksheet(
  config: SpanishWorksheetConfig,
  lessonData: DespegandoLesson,
  lessonElements?: DespegandoLessonElements
): {
  content: { sections: WorksheetSection[] };
  title: string;
  titleSpanish: string;
  instructions: string;
  instructionsSpanish: string;
} {
  const sections: WorksheetSection[] = [];

  // Get Elkonin box items or create from words
  let elkoninItems: ElkoninBoxItem[] = lessonElements?.elkoninBoxes || [];

  if (elkoninItems.length === 0) {
    // Create from sample words
    const words = lessonData.sampleWords.slice(0, 8);
    elkoninItems = words.map((word, idx) => ({
      id: `elk_${idx}`,
      word,
      sounds: segmentSpanishWord(word),
      soundCount: segmentSpanishWord(word).length,
      boxCount: segmentSpanishWord(word).length,
    }));
  }

  // Sound boxes section - empty boxes
  sections.push({
    title: 'Sound Boxes - Fill in the Sounds / Cajas de Sonidos - Llena los Sonidos',
    type: 'sound_boxes',
    items: elkoninItems.slice(0, 8).map((item, idx) => ({
      id: idx + 1,
      prompt: item.word,
      answer: item.word,
      soundBoxes: createSpanishSoundBoxes(item.word, false),
    })),
  });

  // Count the sounds section
  sections.push({
    title: 'Count the Sounds / Cuenta los Sonidos',
    type: 'fill_blank',
    items: elkoninItems.slice(0, 6).map((item, idx) => ({
      id: idx + 1,
      prompt: `${item.word} tiene ___ sonidos`,
      answer: item.soundCount.toString(),
    })),
  });

  // Sound identification section
  const words = elkoninItems.slice(0, 4);
  sections.push({
    title: 'First and Last Sounds / Primer y Último Sonido',
    type: 'fill_blank',
    items: words.flatMap((item, idx) => {
      const sounds = segmentSpanishWord(item.word);
      return [
        {
          id: idx * 2 + 1,
          prompt: `Primer sonido de "${item.word}": ___`,
          answer: sounds[0],
        },
        {
          id: idx * 2 + 2,
          prompt: `Último sonido de "${item.word}": ___`,
          answer: sounds[sounds.length - 1],
        },
      ];
    }),
  });

  return {
    content: { sections },
    title: `Sound Boxes - Lesson ${lessonData.lesson}`,
    titleSpanish: `Cajas de Sonidos - Lección ${lessonData.lesson}`,
    instructions: 'Say each word slowly. Listen for each sound. Write one sound in each box. Remember: digraphs like "ch", "ll", "rr" go in ONE box!',
    instructionsSpanish: 'Di cada palabra lentamente. Escucha cada sonido. Escribe un sonido en cada caja. ¡Recuerda: los dígrafos como "ch", "ll", "rr" van en UNA caja!',
  };
}

/**
 * Generate Spanish Sentence Dictation Worksheet
 */
function generateSpanishSentenceDictationWorksheet(
  config: SpanishWorksheetConfig,
  lessonData: DespegandoLesson,
  lessonElements?: DespegandoLessonElements
): {
  content: { sections: WorksheetSection[] };
  title: string;
  titleSpanish: string;
  instructions: string;
  instructionsSpanish: string;
} {
  const sections: WorksheetSection[] = [];

  // Get sentences from lesson elements or create from words
  let sentences: SpanishSentence[] = lessonElements?.sentences || [];

  if (sentences.length === 0) {
    // Create sentences using word pairs and frames
    const words = shuffleArray(lessonData.sampleWords);
    const frames = shuffleArray([...SPANISH_SENTENCE_FRAMES]);

    for (let i = 0; i < Math.min(5, frames.length); i++) {
      const frame = frames[i];
      const blankCount = (frame.match(/___/g) || []).length;
      const wordsForSentence = words.slice(i * 2, i * 2 + blankCount);

      if (wordsForSentence.length >= blankCount) {
        let text = frame;
        wordsForSentence.forEach(word => {
          text = text.replace('___', word);
        });
        sentences.push({
          id: `sent_${i}`,
          text,
          wordCount: text.split(' ').length,
          decodablePercentage: 100,
          forReading: true,
          forDictation: true,
          targetWords: wordsForSentence,
        });
      }
    }
  }

  // Listen and write section
  sections.push({
    title: 'Listen and Write / Escucha y Escribe',
    type: 'sentences',
    items: sentences.slice(0, 5).map((s, idx) => ({
      id: idx + 1,
      prompt: `${idx + 1}. ___________________________________________`,
      answer: s.text,
      blanks: s.targetWords,
    })),
  });

  // Target words for review
  const targetWords = sentences.flatMap(s => s.targetWords || []);
  if (targetWords.length > 0) {
    sections.push({
      title: 'Target Words / Palabras Objetivo',
      type: 'word_list',
      items: [...new Set(targetWords)].slice(0, 10).map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    });
  }

  // Sentence reading section
  sections.push({
    title: 'Read the Sentences / Lee las Oraciones',
    type: 'sentences',
    items: sentences.slice(0, 3).map((s, idx) => ({
      id: idx + 1,
      prompt: s.text,
      answer: s.text,
    })),
  });

  return {
    content: { sections },
    title: `Sentence Dictation - Lesson ${lessonData.lesson}`,
    titleSpanish: `Dictado de Oraciones - Lección ${lessonData.lesson}`,
    instructions: 'Listen carefully as your teacher reads each sentence. Write what you hear. Remember to use capital letters and punctuation.',
    instructionsSpanish: 'Escucha atentamente mientras tu maestro lee cada oración. Escribe lo que escuchas. Recuerda usar mayúsculas y puntuación.',
  };
}

/**
 * Generate Syllable Clapping Worksheet
 */
function generateSyllableClappingWorksheet(
  config: SpanishWorksheetConfig,
  lessonData: DespegandoLesson,
  lessonElements?: DespegandoLessonElements
): {
  content: { sections: WorksheetSection[] };
  title: string;
  titleSpanish: string;
  instructions: string;
  instructionsSpanish: string;
} {
  const sections: WorksheetSection[] = [];

  // Get words with different syllable counts
  const words = lessonElements?.realWords?.map(w => w.word) || lessonData.sampleWords;

  // Group words by syllable count
  const wordsBySyllables: { [key: number]: string[] } = {};
  words.forEach(word => {
    const count = divideSpanishSyllables(word).length;
    if (!wordsBySyllables[count]) wordsBySyllables[count] = [];
    wordsBySyllables[count].push(word);
  });

  // Syllable clapping section
  sections.push({
    title: 'Clap and Count / Aplaude y Cuenta',
    type: 'fill_blank',
    items: shuffleArray(words).slice(0, 10).map((word, idx) => {
      const syllables = divideSpanishSyllables(word);
      return {
        id: idx + 1,
        prompt: `${word} → ___ sílabas`,
        answer: syllables.length.toString(),
        syllables,
      };
    }),
  });

  // Match syllable count section
  sections.push({
    title: 'Draw Lines to Match / Conecta',
    type: 'matching',
    items: [2, 3, 4].filter(n => wordsBySyllables[n]?.length > 0).map((count, idx) => {
      const exampleWords = (wordsBySyllables[count] || []).slice(0, 3).join(', ');
      return {
        id: idx + 1,
        prompt: exampleWords,
        answer: `${count} sílabas`,
        options: ['2 sílabas', '3 sílabas', '4 sílabas'],
      };
    }),
  });

  // Syllable split section
  sections.push({
    title: 'Divide the Words / Divide las Palabras',
    type: 'syllable_split',
    items: words.slice(0, 8).map((word, idx) => {
      const syllables = divideSpanishSyllables(word);
      return {
        id: idx + 1,
        prompt: word,
        answer: syllables.join('-'),
        syllables,
      };
    }),
  });

  return {
    content: { sections },
    title: `Syllable Clapping - Lesson ${lessonData.lesson}`,
    titleSpanish: `Palmadas de Sílabas - Lección ${lessonData.lesson}`,
    instructions: 'Clap for each syllable as you say the word. Count how many claps. Write the number.',
    instructionsSpanish: 'Aplaude por cada sílaba mientras dices la palabra. Cuenta cuántas palmadas. Escribe el número.',
  };
}

/**
 * Generate Mixed Spanish Worksheet
 */
function generateMixedSpanishWorksheet(
  config: SpanishWorksheetConfig,
  lessonData: DespegandoLesson,
  lessonElements?: DespegandoLessonElements
): {
  content: { sections: WorksheetSection[] };
  title: string;
  titleSpanish: string;
  instructions: string;
  instructionsSpanish: string;
} {
  const sections: WorksheetSection[] = [];

  // Get all available content
  const syllables = lessonElements?.syllables?.map(s => s.syllable) || lessonData.syllables;
  const words = lessonElements?.realWords?.map(w => w.word) || lessonData.sampleWords;
  const shuffledWords = shuffleArray(words);

  // Part 1: Syllable warm-up
  if (syllables.length > 0) {
    sections.push({
      title: 'Part 1: Read the Syllables / Parte 1: Lee las Sílabas',
      type: 'word_list',
      items: shuffleArray(syllables).slice(0, 10).map((syl, idx) => ({
        id: idx + 1,
        prompt: syl,
        answer: syl,
      })),
    });
  }

  // Part 2: Word reading
  sections.push({
    title: 'Part 2: Read the Words / Parte 2: Lee las Palabras',
    type: 'word_list',
    items: shuffledWords.slice(0, 8).map((word, idx) => ({
      id: idx + 1,
      prompt: word,
      answer: word,
    })),
  });

  // Part 3: Sound boxes
  sections.push({
    title: 'Part 3: Sound Boxes / Parte 3: Cajas de Sonidos',
    type: 'sound_boxes',
    items: shuffledWords.slice(0, 4).map((word, idx) => ({
      id: idx + 1,
      prompt: word,
      answer: word,
      soundBoxes: createSpanishSoundBoxes(word, false),
    })),
  });

  // Part 4: Spelling/dictation
  sections.push({
    title: 'Part 4: Write the Words / Parte 4: Escribe las Palabras',
    type: 'word_list',
    items: shuffledWords.slice(4, 8).map((word, idx) => ({
      id: idx + 1,
      prompt: '________________',
      answer: word,
    })),
  });

  // Part 5: Fill in missing letters
  sections.push({
    title: 'Part 5: Complete the Word / Parte 5: Completa la Palabra',
    type: 'fill_blank',
    items: shuffledWords.slice(0, 5).map((word, idx) => {
      const blanked = createBlankedSpanishWord(word, 'vowels');
      return {
        id: idx + 1,
        prompt: blanked.display,
        answer: word,
      };
    }),
  });

  return {
    content: { sections },
    title: `Mixed Practice - Lesson ${lessonData.lesson}`,
    titleSpanish: `Práctica Combinada - Lección ${lessonData.lesson}`,
    instructions: 'Complete each section. Take your time and sound out each word.',
    instructionsSpanish: 'Completa cada sección. Tómate tu tiempo y pronuncia cada palabra.',
  };
}

/**
 * Generate Spanish Sentence Completion Worksheet (Finish the Sentence)
 * Uses curated MAZE sentences from Despegando_MAZE_Sentences.csv
 */
function generateSpanishSentenceCompletionWorksheet(
  config: SpanishWorksheetConfig,
  lessonData: DespegandoLesson,
  lessonElements?: DespegandoLessonElements
): {
  content: { sections: WorksheetSection[] };
  title: string;
  titleSpanish: string;
  instructions: string;
  instructionsSpanish: string;
} {
  const sections: WorksheetSection[] = [];

  // Get curated MAZE sentences for this lesson
  const mazeSentences = getSpanishMazeSentencesForLesson(config.lesson);
  const shuffledMaze = shuffleArray([...mazeSentences]);

  // If we have MAZE sentences, use them
  if (shuffledMaze.length > 0) {
    const completionItems: WorksheetItem[] = shuffledMaze
      .slice(0, Math.min(8, shuffledMaze.length))
      .map((maze, idx) => ({
        id: idx + 1,
        prompt: maze.sentence,
        answer: maze.correct,
        options: shuffleArray([maze.choiceA, maze.choiceB]),
      }));

    sections.push({
      title: 'Finish the Sentence / Completa la Oración',
      type: 'sentence_choice',
      items: completionItems,
    });

    // Create word bank from all correct answers and distractors
    const wordBank = new Set<string>();
    shuffledMaze.slice(0, 8).forEach(maze => {
      wordBank.add(maze.correct);
      wordBank.add(maze.choiceA);
      wordBank.add(maze.choiceB);
    });

    sections.push({
      title: 'Word Bank / Banco de Palabras',
      type: 'word_list',
      items: shuffleArray([...wordBank]).slice(0, 10).map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    });
  } else {
    // Fallback to generated sentences if no MAZE sentences available
    const words = lessonElements?.realWords?.map(w => w.word) || lessonData.sampleWords;
    const shuffledWords = shuffleArray(words);

    const sentenceFrames = [
      'El ___ está en la mesa.',
      'Mi mamá tiene una ___.',
      'Yo puedo ___ muy bien.',
      'La ___ es muy bonita.',
      'Mira el ___ grande.',
      'Me gusta la ___.',
    ];

    const completionItems: WorksheetItem[] = [];
    for (let i = 0; i < Math.min(6, shuffledWords.length - 1); i++) {
      const correctWord = shuffledWords[i];
      const distractorIndex = (i + Math.floor(shuffledWords.length / 2)) % shuffledWords.length;
      const distractorWord = shuffledWords[distractorIndex] !== correctWord
        ? shuffledWords[distractorIndex]
        : shuffledWords[(distractorIndex + 1) % shuffledWords.length];

      const sentence = sentenceFrames[i % sentenceFrames.length];
      const options = shuffleArray([correctWord, distractorWord]);

      completionItems.push({
        id: i + 1,
        prompt: sentence,
        answer: correctWord,
        options: options,
      });
    }

    sections.push({
      title: 'Finish the Sentence / Completa la Oración',
      type: 'sentence_choice',
      items: completionItems,
    });

    sections.push({
      title: 'Word Bank / Banco de Palabras',
      type: 'word_list',
      items: shuffledWords.slice(0, 8).map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    });
  }

  return {
    content: { sections },
    title: `Finish the Sentence - Lesson ${lessonData.lesson}`,
    titleSpanish: `Completa la Oración - Lección ${lessonData.lesson}`,
    instructions: 'Read each sentence. Circle the word that makes sense to complete the sentence.',
    instructionsSpanish: 'Lee cada oración. Encierra en un círculo la palabra que tiene sentido para completar la oración.',
  };
}

/**
 * Generate Spanish Draw and Write Worksheet
 * Uses curated illustratable MAZE sentences from Despegando_MAZE_Sentences.csv
 */
function generateSpanishDrawAndWriteWorksheet(
  config: SpanishWorksheetConfig,
  lessonData: DespegandoLesson,
  lessonElements?: DespegandoLessonElements
): {
  content: { sections: WorksheetSection[] };
  title: string;
  titleSpanish: string;
  instructions: string;
  instructionsSpanish: string;
} {
  const sections: WorksheetSection[] = [];

  // Get only illustratable MAZE sentences for this lesson
  const illustratableSentences = getSpanishIllustratableSentences(config.lesson);
  const shuffledSentences = shuffleArray([...illustratableSentences]);

  // If we have illustratable MAZE sentences, use them
  if (shuffledSentences.length > 0) {
    // Create complete sentences by filling in the correct answer
    const drawItems: WorksheetItem[] = shuffledSentences
      .slice(0, Math.min(4, shuffledSentences.length))
      .map((maze, idx) => {
        const completeSentence = maze.sentence.replace('___.', `${maze.correct}.`).replace('___', maze.correct);
        return {
          id: idx + 1,
          prompt: completeSentence,
          answer: completeSentence,
        };
      });

    sections.push({
      title: 'Read, Draw, and Write / Lee, Dibuja y Escribe',
      type: 'draw_area',
      items: drawItems,
    });

    // Copy the sentence section
    sections.push({
      title: 'Copy the Sentence / Copia la Oración',
      type: 'sentences',
      items: drawItems.slice(0, 2).map((item, idx) => ({
        id: idx + 1,
        prompt: `${item.prompt}\n_________________________________________________`,
        answer: item.answer,
      })),
    });
  } else {
    // Fallback to generated sentences if no illustratable sentences available
    const words = lessonElements?.realWords?.map(w => w.word) || lessonData.sampleWords;
    const shuffledWords = shuffleArray(words);

    const simpleFrames = [
      'El ___ es grande.',
      'Yo veo un ___.',
      'La ___ está aquí.',
      'Mira el ___.',
      'Mi ___ es bonito.',
      'Hay un ___ en la mesa.',
    ];

    const drawItems: WorksheetItem[] = [];
    for (let i = 0; i < Math.min(4, shuffledWords.length); i++) {
      const word = shuffledWords[i];
      const frame = simpleFrames[i % simpleFrames.length];
      const sentence = frame.replace('___', word);

      drawItems.push({
        id: i + 1,
        prompt: sentence,
        answer: sentence,
      });
    }

    sections.push({
      title: 'Read, Draw, and Write / Lee, Dibuja y Escribe',
      type: 'draw_area',
      items: drawItems,
    });

    sections.push({
      title: 'Copy the Sentence / Copia la Oración',
      type: 'sentences',
      items: drawItems.slice(0, 2).map((item, idx) => ({
        id: idx + 1,
        prompt: `${item.prompt}\n_________________________________________________`,
        answer: item.answer,
      })),
    });
  }

  return {
    content: { sections },
    title: `Draw & Write - Lesson ${lessonData.lesson}`,
    titleSpanish: `Dibuja y Escribe - Lección ${lessonData.lesson}`,
    instructions: 'Read the sentence. Draw a picture that shows what the sentence means. Then copy the sentence on the line.',
    instructionsSpanish: 'Lee la oración. Dibuja lo que significa la oración. Luego copia la oración en la línea.',
  };
}

/**
 * Generate Answer Key from Spanish worksheet content
 */
function generateSpanishAnswerKey(content: { sections: WorksheetSection[] }): { sections: AnswerKeySection[] } {
  return {
    sections: content.sections.map(section => ({
      title: section.title,
      answers: section.items.map(item => {
        if (item.soundBoxes) {
          return item.soundBoxes.map((sb: SpanishSoundBox) => sb.sound).join(' - ');
        }
        if (item.syllables) {
          return item.syllables.join(' / ');
        }
        return item.answer || item.prompt;
      }),
    })),
  };
}

/**
 * Get all lessons for dropdown selection
 */
export function getAllDespegandoLessonsForDropdown(): Array<{ value: number; label: string; labelSpanish: string; phase: number }> {
  const result: Array<{ value: number; label: string; labelSpanish: string; phase: number }> = [];

  // Import from despegando
  const { DESPEGANDO_PHASES } = require('@/lib/curriculum/despegando');

  for (const phase of DESPEGANDO_PHASES) {
    for (const lesson of phase.lessons) {
      result.push({
        value: lesson.lesson,
        label: `L${lesson.lesson} - ${lesson.name}`,
        labelSpanish: `L${lesson.lesson} - ${lesson.nameSpanish}`,
        phase: phase.phase,
      });
    }
  }

  return result;
}

/**
 * Get Spanish high-frequency words for a lesson
 */
export function getSpanishHFWordsForLesson(lesson: number, count: number = 8): string[] {
  // Return appropriate HF words based on lesson progression
  const basicWords = SPANISH_HF_WORDS.slice(0, 12);
  const advancedWords = SPANISH_HF_WORDS.slice(12);

  if (lesson <= 10) {
    return getRandomItems(basicWords, count);
  } else if (lesson <= 28) {
    return getRandomItems([...basicWords, ...advancedWords.slice(0, 8)], count);
  } else {
    return getRandomItems(SPANISH_HF_WORDS, count);
  }
}
