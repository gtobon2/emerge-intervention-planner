// WordGen - Academic Vocabulary Intervention
// Content-area vocabulary through discussion

export interface WordGenUnit {
  unit: number;
  topic: string;
  focus_words: string[];
}

export interface DailyActivity {
  day: number;
  focus: string;
  activities: string[];
}

export const WORDGEN_UNITS: WordGenUnit[] = [
  { unit: 1, topic: 'Should violent video games be banned?', focus_words: ['violence', 'influence', 'regulate', 'behavior', 'evidence'] },
  { unit: 2, topic: 'Is homework helpful or harmful?', focus_words: ['assignment', 'achievement', 'require', 'benefit', 'effective'] },
  { unit: 3, topic: 'Should schools have dress codes?', focus_words: ['uniform', 'identity', 'express', 'policy', 'appropriate'] },
  { unit: 4, topic: 'Should junk food be banned in schools?', focus_words: ['nutrition', 'obesity', 'prohibit', 'health', 'consume'] },
  { unit: 5, topic: 'Is technology helpful for learning?', focus_words: ['device', 'distraction', 'access', 'digital', 'resource'] },
  { unit: 6, topic: 'Should students be able to grade teachers?', focus_words: ['evaluate', 'feedback', 'perspective', 'improve', 'quality'] },
  { unit: 7, topic: 'Is it ever okay to lie?', focus_words: ['honesty', 'deceive', 'consequence', 'moral', 'trust'] },
  { unit: 8, topic: 'Should animals be kept in zoos?', focus_words: ['captivity', 'conservation', 'habitat', 'species', 'welfare'] },
  { unit: 9, topic: 'Is social media good or bad for teens?', focus_words: ['connection', 'privacy', 'communicate', 'impact', 'virtual'] },
  { unit: 10, topic: 'Should the voting age be lowered?', focus_words: ['democracy', 'participate', 'citizen', 'responsibility', 'representation'] },
  { unit: 11, topic: 'Should students have longer school days?', focus_words: ['schedule', 'productivity', 'fatigue', 'balance', 'academic'] },
  { unit: 12, topic: 'Is failure necessary for success?', focus_words: ['persevere', 'resilience', 'obstacle', 'growth', 'determination'] }
];

export const DAILY_CYCLE: DailyActivity[] = [
  {
    day: 1,
    focus: 'Word Introduction',
    activities: ['Preview topic', 'Introduce 5 words', 'Read Text 1', 'Word recording']
  },
  {
    day: 2,
    focus: 'Word Analysis',
    activities: ['Word parts (prefixes, suffixes, roots)', 'Context clues', 'Word relationships', 'Multiple meanings']
  },
  {
    day: 3,
    focus: 'Discussion',
    activities: ['Read Text 2', 'Compare perspectives', 'Structured discussion', 'Use target words orally']
  },
  {
    day: 4,
    focus: 'Writing',
    activities: ['Argument writing', 'Use evidence from texts', 'Use target words in writing', 'Peer review']
  },
  {
    day: 5,
    focus: 'Assessment',
    activities: ['Vocabulary quiz', 'Word use check', 'Extension activities', 'Unit reflection']
  }
];

// WordGen lesson structure (approximately 45 min)
export const WORDGEN_LESSON_COMPONENTS = [
  { name: 'Word Review', duration: 5, description: 'Quick review of words from previous days' },
  { name: 'Text Reading', duration: 10, description: 'Shared or partner reading of unit text' },
  { name: 'Word Work', duration: 10, description: 'Deep word analysis activities' },
  { name: 'Discussion', duration: 10, description: 'Structured academic discussion' },
  { name: 'Writing', duration: 8, description: 'Writing using target vocabulary' },
  { name: 'Wrap-Up', duration: 2, description: 'Summarize and preview next day' }
];

// Helper functions
export function getWordGenUnit(unitNumber: number): WordGenUnit | undefined {
  return WORDGEN_UNITS.find(u => u.unit === unitNumber);
}

export function getDayActivities(dayNumber: number): DailyActivity | undefined {
  return DAILY_CYCLE.find(d => d.day === dayNumber);
}

export function getWordGenPositionLabel(unit: number, day: number): string {
  const unitData = getWordGenUnit(unit);
  const dayData = getDayActivities(day);

  if (unitData && dayData) {
    return `Unit ${unit}: ${unitData.topic} - Day ${day} (${dayData.focus})`;
  }
  return `Unit ${unit}, Day ${day}`;
}

export function getNextWordGenPosition(currentUnit: number, currentDay: number): { unit: number; day: number } | null {
  if (currentDay < 5) {
    return { unit: currentUnit, day: currentDay + 1 };
  }

  // Move to next unit
  const nextUnit = currentUnit + 1;
  if (getWordGenUnit(nextUnit)) {
    return { unit: nextUnit, day: 1 };
  }

  return null; // End of curriculum
}

export function getWordsForUnit(unitNumber: number): string[] {
  const unit = getWordGenUnit(unitNumber);
  return unit?.focus_words || [];
}
