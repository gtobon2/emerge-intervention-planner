// Amira Learning - AI-powered Reading Tutor
// Adaptive reading instruction with real-time interventions

export type AmiraLevel = 'Emergent' | 'Beginning' | 'Transitional' | 'Fluent';

export interface AmiraSessionStructure {
  component: string;
  duration: string;
  description: string;
}

export interface AmiraMetric {
  name: string;
  description: string;
}

export const AMIRA_LEVELS: AmiraLevel[] = ['Emergent', 'Beginning', 'Transitional', 'Fluent'];

export const SESSION_STRUCTURE: AmiraSessionStructure[] = [
  { component: 'Warm-Up', duration: '3-5 min', description: 'Quick skills review and motivation' },
  { component: 'Oral Reading', duration: '15-20 min', description: 'AI-guided reading with real-time interventions' },
  { component: 'Comprehension', duration: '5-8 min', description: 'AI-generated comprehension questions' },
  { component: 'Summary', duration: '2-3 min', description: 'Session review and next steps' }
];

export const DASHBOARD_METRICS: AmiraMetric[] = [
  { name: 'Accuracy', description: 'Percentage of words read correctly' },
  { name: 'WCPM', description: 'Words correct per minute' },
  { name: 'Fluency Score', description: 'Score from 1-4 based on prosody and expression' },
  { name: 'Comprehension', description: 'Score based on question responses' },
  { name: 'Time on Task', description: 'Active reading time during session' },
  { name: 'Skills Flagged', description: 'Specific skills needing additional intervention' }
];

// Amira intervention types that the AI tutor provides
export const MICRO_INTERVENTIONS = [
  'Word-level decoding support',
  'Syllable segmentation cues',
  'Phoneme blending assistance',
  'High-frequency word recognition',
  'Fluency pacing guidance',
  'Self-correction prompts',
  'Comprehension check-ins'
];

// Amira lesson components for teacher-led portions
export const AMIRA_LESSON_COMPONENTS = [
  { name: 'Connection', duration: 3, description: 'Connect to previous learning' },
  { name: 'Skill Introduction', duration: 5, description: 'Brief teacher instruction on focus skill' },
  { name: 'Amira Session', duration: 20, description: 'Student works with AI tutor' },
  { name: 'Debrief', duration: 5, description: 'Review AI report and discuss' },
  { name: 'Extension', duration: 7, description: 'Additional practice on flagged skills' }
];

// Helper functions
export function getAmiraLevelLabel(level: AmiraLevel): string {
  const descriptions: Record<AmiraLevel, string> = {
    'Emergent': 'Building foundational skills',
    'Beginning': 'Developing basic decoding',
    'Transitional': 'Building fluency and comprehension',
    'Fluent': 'Advanced reading with deep comprehension'
  };
  return `${level}: ${descriptions[level]}`;
}

export function getNextAmiraLevel(currentLevel: AmiraLevel): AmiraLevel | null {
  const currentIndex = AMIRA_LEVELS.indexOf(currentLevel);
  if (currentIndex < AMIRA_LEVELS.length - 1) {
    return AMIRA_LEVELS[currentIndex + 1];
  }
  return null;
}

export function getSessionDuration(): { min: number; max: number } {
  let minTotal = 0;
  let maxTotal = 0;

  SESSION_STRUCTURE.forEach(component => {
    const [min, max] = component.duration.replace(' min', '').split('-').map(Number);
    minTotal += min;
    maxTotal += max || min;
  });

  return { min: minTotal, max: maxTotal };
}

// Fluency score rubric
export const FLUENCY_RUBRIC = {
  1: 'Word-by-word reading with little or no expression',
  2: 'Reading in two or three word phrases with some expression',
  3: 'Reading in larger phrases with appropriate expression most of the time',
  4: 'Reading smoothly with expression that reflects understanding'
};
