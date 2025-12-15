/**
 * EMERGE Intervention Planner - Database Seeding
 * Populate local database with mock data for development/demo
 */

import { db } from './index';
import type { LocalGroup, LocalStudent, LocalSession, LocalProgressMonitoring, LocalErrorBankEntry } from './index';

// ============================================
// SEED DATA - Converted from mock-data.ts
// ============================================

const SEED_GROUPS: Omit<LocalGroup, 'id'>[] = [
  {
    name: 'Wilson Foundations A',
    curriculum: 'wilson',
    tier: 2,
    grade: 2,
    current_position: { step: 3, substep: '2' },
    schedule: { days: ['monday', 'wednesday', 'friday'], time: '09:00', duration: 40 },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
  },
  {
    name: 'Wilson Intensive',
    curriculum: 'wilson',
    tier: 3,
    grade: 3,
    current_position: { step: 2, substep: '1' },
    schedule: { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], time: '10:00', duration: 45 },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-12-12T00:00:00Z',
  },
  {
    name: 'Delta Math - Fractions',
    curriculum: 'delta_math',
    tier: 2,
    grade: 4,
    current_position: { standard: '4.NF.1' },
    schedule: { days: ['tuesday', 'thursday'], time: '11:00', duration: 35 },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-12-11T00:00:00Z',
  },
  {
    name: 'Delta Math - Multiplication',
    curriculum: 'delta_math',
    tier: 3,
    grade: 3,
    current_position: { standard: '3.OA.7' },
    schedule: { days: ['monday', 'wednesday', 'friday'], time: '13:00', duration: 40 },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
  },
  {
    name: 'Camino Nivel 1',
    curriculum: 'camino',
    tier: 2,
    grade: 1,
    current_position: { lesson: 25 },
    schedule: { days: ['monday', 'wednesday', 'friday'], time: '08:30', duration: 45 },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-12-12T00:00:00Z',
  },
  {
    name: 'Camino Nivel 2',
    curriculum: 'camino',
    tier: 2,
    grade: 2,
    current_position: { lesson: 45 },
    schedule: { days: ['tuesday', 'thursday'], time: '08:30', duration: 45 },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-12-09T00:00:00Z',
  },
  {
    name: 'WordGen Unit 3',
    curriculum: 'wordgen',
    tier: 2,
    grade: 6,
    current_position: { unit: 3, day: 3 },
    schedule: { days: ['monday', 'wednesday'], time: '14:00', duration: 45 },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-12-11T00:00:00Z',
  },
  {
    name: 'WordGen Intensive',
    curriculum: 'wordgen',
    tier: 3,
    grade: 7,
    current_position: { unit: 2, day: 1 },
    schedule: { days: ['tuesday', 'thursday', 'friday'], time: '14:00', duration: 50 },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
  },
  {
    name: 'Amira Emergent',
    curriculum: 'amira',
    tier: 2,
    grade: 1,
    current_position: { level: 'Beginning' },
    schedule: { days: ['monday', 'tuesday', 'wednesday', 'thursday'], time: '09:30', duration: 30 },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-12-12T00:00:00Z',
  },
  {
    name: 'Amira Fluency',
    curriculum: 'amira',
    tier: 2,
    grade: 2,
    current_position: { level: 'Transitional' },
    schedule: { days: ['wednesday', 'friday'], time: '10:30', duration: 30 },
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-12-11T00:00:00Z',
  },
];

// Students data (group_id will be mapped during seeding)
const SEED_STUDENTS_TEMPLATE = [
  // Group 1 - Wilson Foundations A
  { group_index: 0, name: 'Maria Santos', notes: 'Strong decoder, needs fluency work' },
  { group_index: 0, name: 'James Chen', notes: 'Reversals with b/d improving' },
  { group_index: 0, name: 'Aisha Johnson', notes: 'Excellent progress' },

  // Group 2 - Wilson Intensive
  { group_index: 1, name: 'Devon Williams', notes: 'Dyslexia diagnosis, responds well to multisensory' },
  { group_index: 1, name: 'Sofia Rodriguez', notes: 'ELL, strong oral language' },
  { group_index: 1, name: 'Tyler Brown', notes: 'Attention challenges, benefits from movement' },
  { group_index: 1, name: 'Emma Davis', notes: 'Anxiety around reading, building confidence' },

  // Group 3 - Delta Math Fractions
  { group_index: 2, name: 'Jayden Martinez', notes: 'Visual learner, needs manipulatives' },
  { group_index: 2, name: 'Olivia Wilson', notes: 'Strong computation, weak concepts' },
  { group_index: 2, name: 'Ethan Garcia', notes: 'Makes progress with concrete examples' },

  // Group 4 - Delta Math Multiplication
  { group_index: 3, name: 'Ava Thompson', notes: 'Needs more practice with 7s and 8s' },
  { group_index: 3, name: 'Noah Anderson', notes: 'Strong skip counting foundation' },
  { group_index: 3, name: 'Isabella Lee', notes: 'Benefits from games and competition' },
  { group_index: 3, name: 'Liam Jackson', notes: 'Working memory challenges' },

  // Group 5 - Camino Nivel 1
  { group_index: 4, name: 'Valentina Ruiz', notes: 'Native Spanish speaker, strong foundation' },
  { group_index: 4, name: 'Diego Morales', notes: 'Bilingual home, code-switching' },
  { group_index: 4, name: 'Camila Herrera', notes: 'Excellent syllable awareness' },

  // Group 6 - Camino Nivel 2
  { group_index: 5, name: 'Mateo Vargas', notes: 'Strong oral reading' },
  { group_index: 5, name: 'Luna Castillo', notes: 'Working on accent marks' },
  { group_index: 5, name: 'Sebastian Flores', notes: 'Needs support with diphthongs' },

  // Group 7 - WordGen Unit 3
  { group_index: 6, name: 'Zoe Mitchell', notes: 'Strong discussion skills' },
  { group_index: 6, name: 'Marcus Taylor', notes: 'Needs writing scaffolds' },
  { group_index: 6, name: 'Chloe White', notes: 'Excellent word analysis' },

  // Group 8 - WordGen Intensive
  { group_index: 7, name: 'Jordan Harris', notes: 'ELL, strong vocabulary growth' },
  { group_index: 7, name: 'Riley Clark', notes: 'Needs morphology focus' },
  { group_index: 7, name: 'Avery Lewis', notes: 'Benefits from extended discussion' },
  { group_index: 7, name: 'Cameron Walker', notes: 'Strong reader, weak vocabulary' },

  // Group 9 - Amira Emergent
  { group_index: 8, name: 'Lily Robinson', notes: 'Loves the AI tutor' },
  { group_index: 8, name: 'Owen Young', notes: 'Building letter-sound connections' },
  { group_index: 8, name: 'Mia King', notes: 'Strong phonemic awareness' },

  // Group 10 - Amira Fluency
  { group_index: 9, name: 'Jack Scott', notes: 'Working on expression' },
  { group_index: 9, name: 'Grace Adams', notes: 'Excellent comprehension' },
  { group_index: 9, name: 'Henry Baker', notes: 'Fluency improving steadily' },
];

// Error bank entries
const SEED_ERROR_BANK: Omit<LocalErrorBankEntry, 'id'>[] = [
  {
    curriculum: 'wilson',
    curriculum_position: { step: 2, substep: '1' },
    error_pattern: 'Reverses b and d',
    underlying_gap: 'Letter formation confusion',
    correction_protocol: 'Use bed trick, sand tracing, and multisensory letter formation',
    correction_prompts: [
      'Remember: b has the belly before the stick',
      'd has the stick before the belly',
      'Let\'s trace the letter in sand',
    ],
    visual_cues: 'Bed mnemonic visual',
    kinesthetic_cues: 'Sand tray letter tracing',
    is_custom: false,
    effectiveness_count: 6,
    occurrence_count: 8,
    created_at: '2024-10-01T00:00:00Z',
  },
  {
    curriculum: 'wilson',
    curriculum_position: { step: 3, substep: '1' },
    error_pattern: 'Omits sounds in blends',
    underlying_gap: 'Phonemic segmentation difficulty',
    correction_protocol: 'Use finger spelling and sound boxes to segment',
    correction_prompts: [
      'Let\'s tap out each sound',
      'How many sounds do you hear?',
      'Touch a box for each sound',
    ],
    visual_cues: 'Sound boxes (Elkonin boxes)',
    kinesthetic_cues: 'Finger tapping for each phoneme',
    is_custom: false,
    effectiveness_count: 8,
    occurrence_count: 12,
    created_at: '2024-11-01T00:00:00Z',
  },
  {
    curriculum: 'delta_math',
    curriculum_position: { standard: '4.NF.1' },
    error_pattern: 'Adds numerators and denominators when comparing',
    underlying_gap: 'Misunderstanding of fraction parts',
    correction_protocol: 'Use fraction strips and number line to show equivalent parts',
    correction_prompts: [
      'What does the denominator tell us?',
      'Let\'s use fraction strips to compare',
      'Show me on the number line',
    ],
    visual_cues: 'Fraction strips, number line',
    kinesthetic_cues: 'Folding paper to show fractions',
    is_custom: false,
    effectiveness_count: 4,
    occurrence_count: 5,
    created_at: '2024-11-15T00:00:00Z',
  },
  {
    curriculum: 'camino',
    curriculum_position: { lesson: 20 },
    error_pattern: 'Confuses "b" and "v" sounds',
    underlying_gap: 'Phoneme distinction in Spanish',
    correction_protocol: 'Practice minimal pairs with mirror work',
    correction_prompts: [
      'Watch my mouth: "boca" vs "vaca"',
      'Feel the difference with your hand',
      'Let\'s practice with the mirror',
    ],
    visual_cues: 'Mouth position cards',
    kinesthetic_cues: 'Hand on throat to feel vibration difference',
    is_custom: false,
    effectiveness_count: 5,
    occurrence_count: 6,
    created_at: '2024-10-15T00:00:00Z',
  },
];

// ============================================
// SEEDING FUNCTIONS
// ============================================

/**
 * Check if database is empty
 */
export async function isDatabaseEmpty(): Promise<boolean> {
  const groupCount = await db.groups.count();
  return groupCount === 0;
}

/**
 * Seed the database with initial data
 * Returns the number of records created
 */
export async function seedDatabase(): Promise<{
  groups: number;
  students: number;
  sessions: number;
  progressMonitoring: number;
  errorBank: number;
}> {
  const stats = {
    groups: 0,
    students: 0,
    sessions: 0,
    progressMonitoring: 0,
    errorBank: 0,
  };

  await db.transaction('rw', [db.groups, db.students, db.sessions, db.progressMonitoring, db.errorBank], async () => {
    // 1. Seed groups
    const groupIds: number[] = [];
    for (const group of SEED_GROUPS) {
      const id = await db.groups.add(group);
      groupIds.push(id);
      stats.groups++;
    }

    // 2. Seed students (mapping group_index to actual group_id)
    const studentIds: number[] = [];
    for (const studentTemplate of SEED_STUDENTS_TEMPLATE) {
      const groupId = groupIds[studentTemplate.group_index];
      const student: Omit<LocalStudent, 'id'> = {
        group_id: groupId,
        name: studentTemplate.name,
        notes: studentTemplate.notes,
        created_at: '2024-09-01T00:00:00Z',
      };
      const id = await db.students.add(student);
      studentIds.push(id);
      stats.students++;
    }

    // 3. Seed sample sessions
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Today's sessions
    await db.sessions.add({
      group_id: groupIds[0], // Wilson Foundations A
      date: today,
      time: '09:00',
      status: 'planned',
      curriculum_position: { step: 3, substep: '2' },
      advance_after: false,
      planned_practice_items: [
        { type: 'review', item: 'Closed syllables with blends' },
        { type: 'new', item: 'VCe syllable introduction' },
      ],
      planned_response_formats: ['oral', 'written', 'tapping'],
      planned_otr_target: 50,
      cumulative_review_items: null,
      anticipated_errors: null,
      actual_otr_estimate: null,
      pacing: null,
      components_completed: null,
      exit_ticket_correct: null,
      exit_ticket_total: null,
      mastery_demonstrated: null,
      errors_observed: null,
      unexpected_errors: null,
      pm_score: null,
      pm_trend: null,
      dbi_adaptation_notes: null,
      notes: null,
      next_session_notes: null,
      fidelity_checklist: null,
      created_at: today + 'T00:00:00Z',
      updated_at: today + 'T00:00:00Z',
    });
    stats.sessions++;

    await db.sessions.add({
      group_id: groupIds[1], // Wilson Intensive
      date: today,
      time: '10:00',
      status: 'planned',
      curriculum_position: { step: 2, substep: '1' },
      advance_after: false,
      planned_practice_items: [
        { type: 'review', item: 'Short vowel sounds' },
        { type: 'review', item: 'Sound tapping' },
      ],
      planned_response_formats: ['oral', 'tapping'],
      planned_otr_target: 60,
      cumulative_review_items: null,
      anticipated_errors: null,
      actual_otr_estimate: null,
      pacing: null,
      components_completed: null,
      exit_ticket_correct: null,
      exit_ticket_total: null,
      mastery_demonstrated: null,
      errors_observed: null,
      unexpected_errors: null,
      pm_score: null,
      pm_trend: null,
      dbi_adaptation_notes: null,
      notes: null,
      next_session_notes: null,
      fidelity_checklist: null,
      created_at: today + 'T00:00:00Z',
      updated_at: today + 'T00:00:00Z',
    });
    stats.sessions++;

    // Yesterday's completed session
    await db.sessions.add({
      group_id: groupIds[2], // Delta Math Fractions
      date: yesterday,
      time: '11:00',
      status: 'completed',
      curriculum_position: { standard: '4.NF.1' },
      advance_after: false,
      planned_otr_target: 35,
      planned_practice_items: null,
      planned_response_formats: null,
      cumulative_review_items: null,
      anticipated_errors: null,
      actual_otr_estimate: 38,
      pacing: 'just_right',
      components_completed: ['Concrete', 'Representational', 'Exit Ticket'],
      exit_ticket_correct: 7,
      exit_ticket_total: 10,
      mastery_demonstrated: 'partial',
      errors_observed: null,
      unexpected_errors: null,
      pm_score: null,
      pm_trend: null,
      dbi_adaptation_notes: null,
      notes: 'Students making good progress with fraction strips.',
      next_session_notes: null,
      fidelity_checklist: null,
      created_at: yesterday + 'T00:00:00Z',
      updated_at: yesterday + 'T00:00:00Z',
    });
    stats.sessions++;

    // 4. Seed sample progress monitoring data
    // For first student (Maria Santos)
    const mariaDates = ['2024-09-15', '2024-10-01', '2024-10-15', '2024-11-01', '2024-11-15', '2024-12-01'];
    const mariaScores = [22, 28, 32, 35, 41, 45];

    for (let i = 0; i < mariaDates.length; i++) {
      await db.progressMonitoring.add({
        student_id: studentIds[0], // Maria Santos
        group_id: groupIds[0],
        date: mariaDates[i],
        measure_type: 'DIBELS ORF',
        score: mariaScores[i],
        benchmark: 50,
        goal: 55,
        notes: i === 0 ? 'Baseline' : null,
        created_at: mariaDates[i] + 'T00:00:00Z',
      });
      stats.progressMonitoring++;
    }

    // For second student (Devon Williams)
    const devonDates = ['2024-09-15', '2024-10-01', '2024-10-15', '2024-11-01', '2024-11-15', '2024-12-01'];
    const devonScores = [12, 14, 18, 21, 24, 28];

    for (let i = 0; i < devonDates.length; i++) {
      await db.progressMonitoring.add({
        student_id: studentIds[3], // Devon Williams
        group_id: groupIds[1],
        date: devonDates[i],
        measure_type: 'DIBELS ORF',
        score: devonScores[i],
        benchmark: 40,
        goal: 35,
        notes: i === 0 ? 'Baseline - intensive need' : i === devonDates.length - 1 ? 'Great progress!' : null,
        created_at: devonDates[i] + 'T00:00:00Z',
      });
      stats.progressMonitoring++;
    }

    // 5. Seed error bank
    for (const error of SEED_ERROR_BANK) {
      await db.errorBank.add(error);
      stats.errorBank++;
    }
  });

  return stats;
}

/**
 * Seed database if empty
 */
export async function seedIfEmpty(): Promise<boolean> {
  const empty = await isDatabaseEmpty();

  if (empty) {
    console.log('Database is empty. Seeding with initial data...');
    const stats = await seedDatabase();
    console.log('Database seeded successfully:', stats);
    return true;
  }

  console.log('Database already has data. Skipping seed.');
  return false;
}

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.groups, db.students, db.sessions, db.progressMonitoring, db.errorBank], async () => {
    await db.groups.clear();
    await db.students.clear();
    await db.sessions.clear();
    await db.progressMonitoring.clear();
    await db.errorBank.clear();
  });
}
