/**
 * Wilson Worksheet Generators
 *
 * Core logic for generating different worksheet types based on Wilson substeps.
 */

import {
  type WorksheetConfig,
  type GeneratedWorksheet,
  type WorksheetSection,
  type WorksheetItem,
  type AnswerKeySection,
  DIFFICULTY_SETTINGS,
  SENTENCE_FRAMES,
} from './types';
import {
  getWordsForSubstep,
  createSoundBoxes,
  divideSyllables,
  createBlankedWord,
  shuffleArray,
  getRandomItems,
  segmentWordToSounds,
} from './word-utils';
import { getWilsonSubstep, getWilsonStep, type WilsonSubstep } from '@/lib/curriculum/wilson';
import {
  getMazeSentencesForSubstep,
  getIllustratableSentences,
  type MazeSentence,
} from './wilson-maze-sentences';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Main worksheet generator
 */
export function generateWorksheet(config: WorksheetConfig): GeneratedWorksheet | null {
  const substepData = getWilsonSubstep(config.substep);
  if (!substepData) {
    console.error(`Substep ${config.substep} not found`);
    return null;
  }

  // Get step number from substep key
  const stepNumber = parseInt(config.substep.split('.')[0], 10);
  const stepData = getWilsonStep(stepNumber);

  let content;
  let title;
  let instructions;

  switch (config.template) {
    case 'word_list':
      ({ content, title, instructions } = generateWordListWorksheet(config, substepData));
      break;
    case 'sentence_dictation':
      ({ content, title, instructions } = generateSentenceDictationWorksheet(config, substepData));
      break;
    case 'sound_mapping':
      ({ content, title, instructions } = generateSoundMappingWorksheet(config, substepData));
      break;
    case 'syllable_division':
      ({ content, title, instructions } = generateSyllableDivisionWorksheet(config, substepData));
      break;
    case 'hf_words':
      ({ content, title, instructions } = generateHFWordsWorksheet(config, substepData));
      break;
    case 'combined':
      ({ content, title, instructions } = generateCombinedWorksheet(config, substepData));
      break;
    case 'sentence_completion':
      ({ content, title, instructions } = generateSentenceCompletionWorksheet(config, substepData));
      break;
    case 'draw_and_write':
      ({ content, title, instructions } = generateDrawAndWriteWorksheet(config, substepData));
      break;
    default:
      return null;
  }

  const worksheet: GeneratedWorksheet = {
    id: generateId(),
    config,
    substepData,
    stepNumber,
    stepName: stepData?.name || `Step ${stepNumber}`,
    title,
    instructions,
    content,
    createdAt: new Date(),
  };

  if (config.includeAnswerKey) {
    worksheet.answerKey = generateAnswerKey(content);
  }

  return worksheet;
}

/**
 * Generate Word List Worksheet
 */
function generateWordListWorksheet(
  config: WorksheetConfig,
  substepData: WilsonSubstep
): { content: { sections: WorksheetSection[] }; title: string; instructions: string } {
  const settings = DIFFICULTY_SETTINGS[config.difficulty];
  const { realWords, nonsenseWords } = getWordsForSubstep(
    config.substep,
    config.wordCount,
    config.includeNonsenseWords,
    settings.nonsenseWordRatio
  );

  const sections: WorksheetSection[] = [];

  // Real words section
  if (realWords.length > 0) {
    sections.push({
      title: 'Real Words',
      type: 'word_list',
      items: realWords.map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    });
  }

  // Nonsense words section
  if (nonsenseWords.length > 0) {
    sections.push({
      title: 'Nonsense Words',
      type: 'word_list',
      items: nonsenseWords.map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    });
  }

  // Write the words section
  const allWords = shuffleArray([...realWords, ...nonsenseWords]);
  sections.push({
    title: 'Write the Words',
    type: 'word_list',
    items: allWords.slice(0, 8).map((word, idx) => ({
      id: idx + 1,
      prompt: '________________',
      answer: word,
    })),
  });

  return {
    content: { sections },
    title: `Word List Practice - ${substepData.name}`,
    instructions: 'Read each word aloud. Tap the sounds as you read. Then write each word in the blank.',
  };
}

/**
 * Generate Sentence Dictation Worksheet
 */
function generateSentenceDictationWorksheet(
  config: WorksheetConfig,
  substepData: WilsonSubstep
): { content: { sections: WorksheetSection[] }; title: string; instructions: string } {
  const { realWords } = getWordsForSubstep(config.substep, config.wordCount, false);
  const shuffledWords = shuffleArray(realWords);

  // Create sentences using word pairs
  const sentences: { sentence: string; targetWords: string[] }[] = [];
  const frames = shuffleArray([...SENTENCE_FRAMES]);

  for (let i = 0; i < Math.min(5, frames.length); i++) {
    const frame = frames[i];
    const blankCount = (frame.match(/___/g) || []).length;
    const wordsForSentence = shuffledWords.slice(i * 2, i * 2 + blankCount);

    if (wordsForSentence.length >= blankCount) {
      let sentence = frame;
      wordsForSentence.forEach(word => {
        sentence = sentence.replace('___', word);
      });
      sentences.push({ sentence, targetWords: wordsForSentence });
    }
  }

  const sections: WorksheetSection[] = [
    {
      title: 'Listen and Write',
      type: 'sentences',
      items: sentences.map((s, idx) => ({
        id: idx + 1,
        prompt: `${idx + 1}. ___________________________________________`,
        answer: s.sentence,
        blanks: s.targetWords,
      })),
    },
    {
      title: 'Target Words for Review',
      type: 'word_list',
      items: shuffledWords.slice(0, 10).map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    },
  ];

  return {
    content: { sections },
    title: `Sentence Dictation - ${substepData.name}`,
    instructions: 'Listen carefully as your teacher reads each sentence. Write what you hear. Remember to use capital letters and punctuation.',
  };
}

/**
 * Generate Sound Mapping Worksheet
 */
function generateSoundMappingWorksheet(
  config: WorksheetConfig,
  substepData: WilsonSubstep
): { content: { sections: WorksheetSection[] }; title: string; instructions: string } {
  const { realWords, nonsenseWords } = getWordsForSubstep(
    config.substep,
    config.wordCount,
    config.includeNonsenseWords,
    0.3
  );

  const allWords = shuffleArray([...realWords, ...nonsenseWords]).slice(0, 10);

  const sections: WorksheetSection[] = [
    {
      title: 'Sound Boxes - Fill in the Sounds',
      type: 'sound_boxes',
      items: allWords.map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
        soundBoxes: createSoundBoxes(word, false),
      })),
    },
    {
      title: 'Count the Sounds',
      type: 'fill_blank',
      items: allWords.slice(0, 6).map((word, idx) => {
        const sounds = segmentWordToSounds(word);
        return {
          id: idx + 1,
          prompt: `${word} has ___ sounds`,
          answer: sounds.length.toString(),
        };
      }),
    },
  ];

  return {
    content: { sections },
    title: `Sound Mapping - ${substepData.name}`,
    instructions: 'Tap each sound in the word. Write one sound in each box. Remember: digraphs and welded sounds go in ONE box!',
  };
}

/**
 * Generate Syllable Division Worksheet (for Step 3+)
 */
function generateSyllableDivisionWorksheet(
  config: WorksheetConfig,
  substepData: WilsonSubstep
): { content: { sections: WorksheetSection[] }; title: string; instructions: string } {
  const { realWords } = getWordsForSubstep(config.substep, config.wordCount, false);

  // Filter for multisyllabic words
  const multiSyllabicWords = realWords.filter(word => word.length >= 5);
  const wordsToUse = multiSyllabicWords.length >= 6 ? multiSyllabicWords : realWords;

  const sections: WorksheetSection[] = [
    {
      title: 'Divide and Conquer',
      type: 'syllable_split',
      items: wordsToUse.slice(0, 10).map((word, idx) => {
        const syllables = divideSyllables(word);
        return {
          id: idx + 1,
          prompt: word,
          answer: syllables.join(' / '),
          syllables,
        };
      }),
    },
    {
      title: 'Identify the Syllable Type',
      type: 'matching',
      items: wordsToUse.slice(0, 6).map((word, idx) => {
        const syllables = divideSyllables(word);
        return {
          id: idx + 1,
          prompt: word,
          answer: syllables.join('-'),
          options: ['closed', 'open', 'VCe', 'consonant-le'],
        };
      }),
    },
  ];

  return {
    content: { sections },
    title: `Syllable Division - ${substepData.name}`,
    instructions: 'Spot and dot the vowels. Look for the division pattern. Draw a line between syllables. Read each syllable, then blend.',
  };
}

/**
 * Generate High-Frequency Words Worksheet
 */
function generateHFWordsWorksheet(
  config: WorksheetConfig,
  substepData: WilsonSubstep
): { content: { sections: WorksheetSection[] }; title: string; instructions: string } {
  // Use common HF words that might appear with the substep
  const hfWords = ['the', 'was', 'said', 'have', 'what', 'were', 'there', 'could', 'would', 'should', 'where', 'who', 'their', 'some', 'come'];
  const selectedHF = getRandomItems(hfWords, 8);

  const sections: WorksheetSection[] = [
    {
      title: 'Read These Words',
      type: 'word_list',
      items: selectedHF.map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    },
    {
      title: 'Write Three Times Each',
      type: 'word_list',
      items: selectedHF.slice(0, 5).map((word, idx) => ({
        id: idx + 1,
        prompt: `${word}: _________ _________ _________`,
        answer: `${word} ${word} ${word}`,
      })),
    },
    {
      title: 'Fill in the Missing Letters',
      type: 'fill_blank',
      items: selectedHF.slice(0, 6).map((word, idx) => {
        const blanked = createBlankedWord(word, 'vowels');
        return {
          id: idx + 1,
          prompt: blanked.display,
          answer: word,
        };
      }),
    },
  ];

  return {
    content: { sections },
    title: `High-Frequency Words Practice`,
    instructions: 'These words appear often in reading. Practice reading and writing them until they become automatic!',
  };
}

/**
 * Generate Combined Worksheet
 */
function generateCombinedWorksheet(
  config: WorksheetConfig,
  substepData: WilsonSubstep
): { content: { sections: WorksheetSection[] }; title: string; instructions: string } {
  const { realWords, nonsenseWords } = getWordsForSubstep(
    config.substep,
    config.wordCount,
    config.includeNonsenseWords,
    0.2
  );

  const allWords = shuffleArray([...realWords, ...nonsenseWords]);

  const sections: WorksheetSection[] = [
    // Word reading section
    {
      title: 'Part 1: Read the Words',
      type: 'word_list',
      items: allWords.slice(0, 8).map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    },
    // Sound boxes section
    {
      title: 'Part 2: Sound Boxes',
      type: 'sound_boxes',
      items: allWords.slice(0, 4).map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
        soundBoxes: createSoundBoxes(word, false),
      })),
    },
    // Spelling section
    {
      title: 'Part 3: Spelling',
      type: 'word_list',
      items: allWords.slice(4, 8).map((word, idx) => ({
        id: idx + 1,
        prompt: '________________',
        answer: word,
      })),
    },
    // Sentence section
    {
      title: 'Part 4: Write a Sentence',
      type: 'sentences',
      items: [
        {
          id: 1,
          prompt: `Write a sentence using the word "${allWords[0]}":`,
          answer: `(Answers will vary using "${allWords[0]}")`,
        },
        {
          id: 2,
          prompt: `Write a sentence using the word "${allWords[1]}":`,
          answer: `(Answers will vary using "${allWords[1]}")`,
        },
      ],
    },
  ];

  return {
    content: { sections },
    title: `Combined Practice - ${substepData.name}`,
    instructions: 'Complete each section. Take your time and tap the sounds in each word.',
  };
}

/**
 * Generate Sentence Completion Worksheet (Finish the Sentence)
 * Uses curated MAZE sentences from Wilson_Database.xlsx
 */
function generateSentenceCompletionWorksheet(
  config: WorksheetConfig,
  substepData: WilsonSubstep
): { content: { sections: WorksheetSection[] }; title: string; instructions: string } {
  // Get curated MAZE sentences for this substep
  const mazeSentences = getMazeSentencesForSubstep(config.substep);
  const shuffledMaze = shuffleArray([...mazeSentences]);

  const sections: WorksheetSection[] = [];

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
      title: 'Finish the Sentence',
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
      title: 'Word Bank',
      type: 'word_list',
      items: shuffleArray([...wordBank]).slice(0, 10).map((word, idx) => ({
        id: idx + 1,
        prompt: word,
        answer: word,
      })),
    });
  } else {
    // Fallback to generated sentences if no MAZE sentences available
    const { realWords } = getWordsForSubstep(config.substep, config.wordCount, false);
    const shuffledWords = shuffleArray(realWords);

    const sentenceFrames = [
      'The ___ is on the bed.',
      'I can ___ very fast.',
      'She has a ___ pet.',
      'We went to the ___.',
      'The ___ is red.',
      'He can ___ the ball.',
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
      title: 'Finish the Sentence',
      type: 'sentence_choice',
      items: completionItems,
    });

    sections.push({
      title: 'Word Bank',
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
    title: `Finish the Sentence - ${substepData.name}`,
    instructions: 'Read each sentence. Circle the word that makes sense to complete the sentence.',
  };
}

/**
 * Generate Draw and Write Worksheet
 * Uses curated illustratable MAZE sentences from Wilson_Database.xlsx
 */
function generateDrawAndWriteWorksheet(
  config: WorksheetConfig,
  substepData: WilsonSubstep
): { content: { sections: WorksheetSection[] }; title: string; instructions: string } {
  // Get only illustratable MAZE sentences for this substep
  const illustratableSentences = getIllustratableSentences(config.substep);
  const shuffledSentences = shuffleArray([...illustratableSentences]);

  const sections: WorksheetSection[] = [];

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
      title: 'Read, Draw, and Write',
      type: 'draw_area',
      items: drawItems,
    });

    // Copy the sentence section
    sections.push({
      title: 'Copy the Sentence',
      type: 'sentences',
      items: drawItems.slice(0, 2).map((item, idx) => ({
        id: idx + 1,
        prompt: `${item.prompt}\n_________________________________________________`,
        answer: item.answer,
      })),
    });
  } else {
    // Fallback to generated sentences if no illustratable sentences available
    const { realWords } = getWordsForSubstep(config.substep, config.wordCount, false);
    const shuffledWords = shuffleArray(realWords);

    const simpleFrames = [
      'The ___ is big.',
      'I see a ___.',
      'The ___ can run.',
      'Look at the ___.',
      'A ___ is here.',
      'The ___ is fun.',
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
      title: 'Read, Draw, and Write',
      type: 'draw_area',
      items: drawItems,
    });

    sections.push({
      title: 'Copy the Sentence',
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
    title: `Draw & Write - ${substepData.name}`,
    instructions: 'Read the sentence. Draw a picture that shows what the sentence means. Then copy the sentence on the line.',
  };
}

/**
 * Generate Answer Key from worksheet content
 */
function generateAnswerKey(content: { sections: WorksheetSection[] }): { sections: AnswerKeySection[] } {
  return {
    sections: content.sections.map(section => ({
      title: section.title,
      answers: section.items.map(item => {
        if (item.soundBoxes) {
          return item.soundBoxes.map(sb => sb.sound).join(' - ');
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
 * Get all available substeps for dropdown
 */
export function getAllSubstepsForDropdown(): Array<{ value: string; label: string; step: number }> {
  const result: Array<{ value: string; label: string; step: number }> = [];

  // Import directly to avoid circular dependency issues
  const { WILSON_STEPS } = require('@/lib/curriculum/wilson');

  for (const step of WILSON_STEPS) {
    for (const substep of step.substeps) {
      result.push({
        value: substep.substep,
        label: `${substep.substep} - ${substep.name}`,
        step: step.step,
      });
    }
  }

  return result;
}
