// @ts-nocheck
/**
 * EMERGE Intervention Planner - Mock Data
 *
 * Realistic sample data for Geraldo's intervention caseload:
 * - 10 student groups across 5 curricula
 * - Mix of Tier 2 and Tier 3 interventions
 * - Various grade levels (K-8)
 */

import type {
  Group,
  Student,
  Session,
  SessionWithGroup,
  ProgressMonitoring,
  ErrorBankEntry,
  Curriculum,
  GroupWithStudents,
} from './supabase/types';

// Helper to generate UUIDs
const uuid = () => crypto.randomUUID();

// Current date helpers
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

// ============================================
// GROUPS - 10 intervention groups
// ============================================
export const MOCK_GROUPS: Group[] = [
  {
    id: 'group-1',
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
    id: 'group-2',
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
    id: 'group-3',
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
    id: 'group-4',
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
    id: 'group-5',
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
    id: 'group-6',
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
    id: 'group-7',
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
    id: 'group-8',
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
    id: 'group-9',
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
    id: 'group-10',
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

// ============================================
// STUDENTS - 3-5 students per group
// ============================================
export const MOCK_STUDENTS: Student[] = [
  // Wilson Foundations A (group-1)
  { id: 'student-1', group_id: 'group-1', name: 'Maria Santos', notes: 'Strong decoder, needs fluency work', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-2', group_id: 'group-1', name: 'James Chen', notes: 'Reversals with b/d improving', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-3', group_id: 'group-1', name: 'Aisha Johnson', notes: 'Excellent progress', created_at: '2024-09-01T00:00:00Z' },

  // Wilson Intensive (group-2)
  { id: 'student-4', group_id: 'group-2', name: 'Devon Williams', notes: 'Dyslexia diagnosis, responds well to multisensory', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-5', group_id: 'group-2', name: 'Sofia Rodriguez', notes: 'ELL, strong oral language', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-6', group_id: 'group-2', name: 'Tyler Brown', notes: 'Attention challenges, benefits from movement', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-7', group_id: 'group-2', name: 'Emma Davis', notes: 'Anxiety around reading, building confidence', created_at: '2024-09-01T00:00:00Z' },

  // Delta Math Fractions (group-3)
  { id: 'student-8', group_id: 'group-3', name: 'Jayden Martinez', notes: 'Visual learner, needs manipulatives', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-9', group_id: 'group-3', name: 'Olivia Wilson', notes: 'Strong computation, weak concepts', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-10', group_id: 'group-3', name: 'Ethan Garcia', notes: 'Makes progress with concrete examples', created_at: '2024-09-01T00:00:00Z' },

  // Delta Math Multiplication (group-4)
  { id: 'student-11', group_id: 'group-4', name: 'Ava Thompson', notes: 'Needs more practice with 7s and 8s', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-12', group_id: 'group-4', name: 'Noah Anderson', notes: 'Strong skip counting foundation', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-13', group_id: 'group-4', name: 'Isabella Lee', notes: 'Benefits from games and competition', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-14', group_id: 'group-4', name: 'Liam Jackson', notes: 'Working memory challenges', created_at: '2024-09-01T00:00:00Z' },

  // Camino Nivel 1 (group-5)
  { id: 'student-15', group_id: 'group-5', name: 'Valentina Ruiz', notes: 'Native Spanish speaker, strong foundation', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-16', group_id: 'group-5', name: 'Diego Morales', notes: 'Bilingual home, code-switching', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-17', group_id: 'group-5', name: 'Camila Herrera', notes: 'Excellent syllable awareness', created_at: '2024-09-01T00:00:00Z' },

  // Camino Nivel 2 (group-6)
  { id: 'student-18', group_id: 'group-6', name: 'Mateo Vargas', notes: 'Strong oral reading', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-19', group_id: 'group-6', name: 'Luna Castillo', notes: 'Working on accent marks', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-20', group_id: 'group-6', name: 'Sebastian Flores', notes: 'Needs support with diphthongs', created_at: '2024-09-01T00:00:00Z' },

  // WordGen Unit 3 (group-7)
  { id: 'student-21', group_id: 'group-7', name: 'Zoe Mitchell', notes: 'Strong discussion skills', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-22', group_id: 'group-7', name: 'Marcus Taylor', notes: 'Needs writing scaffolds', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-23', group_id: 'group-7', name: 'Chloe White', notes: 'Excellent word analysis', created_at: '2024-09-01T00:00:00Z' },

  // WordGen Intensive (group-8)
  { id: 'student-24', group_id: 'group-8', name: 'Jordan Harris', notes: 'ELL, strong vocabulary growth', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-25', group_id: 'group-8', name: 'Riley Clark', notes: 'Needs morphology focus', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-26', group_id: 'group-8', name: 'Avery Lewis', notes: 'Benefits from extended discussion', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-27', group_id: 'group-8', name: 'Cameron Walker', notes: 'Strong reader, weak vocabulary', created_at: '2024-09-01T00:00:00Z' },

  // Amira Emergent (group-9)
  { id: 'student-28', group_id: 'group-9', name: 'Lily Robinson', notes: 'Loves the AI tutor', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-29', group_id: 'group-9', name: 'Owen Young', notes: 'Building letter-sound connections', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-30', group_id: 'group-9', name: 'Mia King', notes: 'Strong phonemic awareness', created_at: '2024-09-01T00:00:00Z' },

  // Amira Fluency (group-10)
  { id: 'student-31', group_id: 'group-10', name: 'Jack Scott', notes: 'Working on expression', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-32', group_id: 'group-10', name: 'Grace Adams', notes: 'Excellent comprehension', created_at: '2024-09-01T00:00:00Z' },
  { id: 'student-33', group_id: 'group-10', name: 'Henry Baker', notes: 'Fluency improving steadily', created_at: '2024-09-01T00:00:00Z' },
];

// ============================================
// SESSIONS - Recent and upcoming
// ============================================
export const MOCK_SESSIONS: Session[] = [
  // Today's sessions
  {
    id: 'session-1',
    group_id: 'group-1',
    date: today,
    time: '09:00',
    status: 'planned',
    curriculum_position: { step: 3, substep: '2' },
    planned_practice_items: [
      { type: 'review', item: 'Closed syllables with blends' },
      { type: 'new', item: 'VCe syllable introduction' },
    ],
    planned_response_formats: ['oral', 'written', 'tapping'],
    planned_otr_target: 50,
    created_at: '2024-12-13T00:00:00Z',
  },
  {
    id: 'session-2',
    group_id: 'group-2',
    date: today,
    time: '10:00',
    status: 'planned',
    curriculum_position: { step: 2, substep: '1' },
    planned_practice_items: [
      { type: 'review', item: 'Short vowel sounds' },
      { type: 'review', item: 'Sound tapping' },
    ],
    planned_response_formats: ['oral', 'tapping'],
    planned_otr_target: 60,
    created_at: '2024-12-13T00:00:00Z',
  },
  {
    id: 'session-3',
    group_id: 'group-5',
    date: today,
    time: '08:30',
    status: 'completed',
    curriculum_position: { lesson: 25 },
    planned_practice_items: [
      { type: 'new', item: 'Sílabas con "bl" y "br"' },
    ],
    planned_response_formats: ['oral', 'written'],
    planned_otr_target: 45,
    actual_otr_count: 52,
    notes: 'Great session! Students engaged with blends.',
    created_at: '2024-12-13T00:00:00Z',
  },
  {
    id: 'session-4',
    group_id: 'group-9',
    date: today,
    time: '09:30',
    status: 'planned',
    curriculum_position: { level: 'Beginning' },
    planned_practice_items: [
      { type: 'review', item: 'Letter sounds a-m' },
      { type: 'new', item: 'Blending CVC words' },
    ],
    planned_response_formats: ['oral'],
    planned_otr_target: 40,
    created_at: '2024-12-13T00:00:00Z',
  },

  // Yesterday's completed sessions
  {
    id: 'session-5',
    group_id: 'group-3',
    date: yesterday,
    time: '11:00',
    status: 'completed',
    curriculum_position: { standard: '4.NF.1' },
    planned_otr_target: 35,
    actual_otr_count: 38,
    notes: 'Students making good progress with fraction strips.',
    errors_logged: [
      { pattern: 'Adds numerators and denominators', count: 2 },
    ],
    created_at: '2024-12-12T00:00:00Z',
  },
  {
    id: 'session-6',
    group_id: 'group-4',
    date: yesterday,
    time: '13:00',
    status: 'completed',
    curriculum_position: { standard: '3.OA.7' },
    planned_otr_target: 55,
    actual_otr_count: 48,
    notes: 'Focus on 7s facts. Use more games next time.',
    created_at: '2024-12-12T00:00:00Z',
  },

  // Tomorrow's sessions
  {
    id: 'session-7',
    group_id: 'group-7',
    date: tomorrow,
    time: '14:00',
    status: 'planned',
    curriculum_position: { unit: 3, week: 2, day: 4 },
    planned_practice_items: [
      { type: 'review', item: 'Unit 3 vocabulary' },
      { type: 'new', item: 'Academic discussion stems' },
    ],
    planned_response_formats: ['oral', 'written'],
    planned_otr_target: 30,
    created_at: '2024-12-13T00:00:00Z',
  },
  {
    id: 'session-8',
    group_id: 'group-10',
    date: tomorrow,
    time: '10:30',
    status: 'planned',
    curriculum_position: { level: 'Developing' },
    planned_otr_target: 35,
    created_at: '2024-12-13T00:00:00Z',
  },
];

// Sessions with group info for calendar/list views
export const MOCK_SESSIONS_WITH_GROUPS: SessionWithGroup[] = MOCK_SESSIONS.map(session => ({
  ...session,
  group: MOCK_GROUPS.find(g => g.id === session.group_id)!,
}));

// Groups with students
export const MOCK_GROUPS_WITH_STUDENTS: GroupWithStudents[] = MOCK_GROUPS.map(group => ({
  ...group,
  students: MOCK_STUDENTS.filter(s => s.group_id === group.id),
}));

// ============================================
// PROGRESS MONITORING DATA
// ============================================
export const MOCK_PROGRESS: ProgressMonitoring[] = [
  // Maria Santos - Wilson (student-1)
  { id: 'pm-1', student_id: 'student-1', group_id: 'group-1', date: '2024-09-15', score: 22, benchmark: 'DIBELS ORF', notes: 'Baseline', created_at: '2024-09-15T00:00:00Z' },
  { id: 'pm-2', student_id: 'student-1', group_id: 'group-1', date: '2024-10-01', score: 28, benchmark: 'DIBELS ORF', created_at: '2024-10-01T00:00:00Z' },
  { id: 'pm-3', student_id: 'student-1', group_id: 'group-1', date: '2024-10-15', score: 32, benchmark: 'DIBELS ORF', created_at: '2024-10-15T00:00:00Z' },
  { id: 'pm-4', student_id: 'student-1', group_id: 'group-1', date: '2024-11-01', score: 35, benchmark: 'DIBELS ORF', created_at: '2024-11-01T00:00:00Z' },
  { id: 'pm-5', student_id: 'student-1', group_id: 'group-1', date: '2024-11-15', score: 41, benchmark: 'DIBELS ORF', created_at: '2024-11-15T00:00:00Z' },
  { id: 'pm-6', student_id: 'student-1', group_id: 'group-1', date: '2024-12-01', score: 45, benchmark: 'DIBELS ORF', created_at: '2024-12-01T00:00:00Z' },

  // Devon Williams - Wilson Intensive (student-4)
  { id: 'pm-7', student_id: 'student-4', group_id: 'group-2', date: '2024-09-15', score: 12, benchmark: 'DIBELS ORF', notes: 'Baseline - intensive need', created_at: '2024-09-15T00:00:00Z' },
  { id: 'pm-8', student_id: 'student-4', group_id: 'group-2', date: '2024-10-01', score: 14, benchmark: 'DIBELS ORF', created_at: '2024-10-01T00:00:00Z' },
  { id: 'pm-9', student_id: 'student-4', group_id: 'group-2', date: '2024-10-15', score: 18, benchmark: 'DIBELS ORF', created_at: '2024-10-15T00:00:00Z' },
  { id: 'pm-10', student_id: 'student-4', group_id: 'group-2', date: '2024-11-01', score: 21, benchmark: 'DIBELS ORF', created_at: '2024-11-01T00:00:00Z' },
  { id: 'pm-11', student_id: 'student-4', group_id: 'group-2', date: '2024-11-15', score: 24, benchmark: 'DIBELS ORF', created_at: '2024-11-15T00:00:00Z' },
  { id: 'pm-12', student_id: 'student-4', group_id: 'group-2', date: '2024-12-01', score: 28, benchmark: 'DIBELS ORF', notes: 'Great progress!', created_at: '2024-12-01T00:00:00Z' },

  // Jayden Martinez - Delta Math (student-8)
  { id: 'pm-13', student_id: 'student-8', group_id: 'group-3', date: '2024-09-15', score: 45, benchmark: 'Fraction Concepts', notes: 'Baseline', created_at: '2024-09-15T00:00:00Z' },
  { id: 'pm-14', student_id: 'student-8', group_id: 'group-3', date: '2024-10-15', score: 52, benchmark: 'Fraction Concepts', created_at: '2024-10-15T00:00:00Z' },
  { id: 'pm-15', student_id: 'student-8', group_id: 'group-3', date: '2024-11-15', score: 61, benchmark: 'Fraction Concepts', created_at: '2024-11-15T00:00:00Z' },
  { id: 'pm-16', student_id: 'student-8', group_id: 'group-3', date: '2024-12-10', score: 68, benchmark: 'Fraction Concepts', notes: 'On track for goal', created_at: '2024-12-10T00:00:00Z' },
];

// ============================================
// ERROR BANK ENTRIES (logged from sessions)
// ============================================
export const MOCK_ERROR_ENTRIES: ErrorBankEntry[] = [
  {
    id: 'error-1',
    curriculum: 'wilson',
    curriculum_position: { step: 2 },
    error_pattern: 'Reverses b and d',
    student_examples: ['James wrote "doy" for "boy"', 'Maria confused "dig" and "big"'],
    frequency: 8,
    first_observed: '2024-10-01',
    last_observed: '2024-12-10',
    intervention_tried: 'Bed trick, sand tracing',
    intervention_effective: true,
    notes: 'Improving with consistent practice',
    created_at: '2024-10-01T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
  },
  {
    id: 'error-2',
    curriculum: 'wilson',
    curriculum_position: { step: 3 },
    error_pattern: 'Omits sounds in blends',
    student_examples: ['Devon said "sop" for "stop"', 'Tyler read "bak" for "black"'],
    frequency: 12,
    first_observed: '2024-11-01',
    last_observed: '2024-12-12',
    intervention_tried: 'Finger spelling, sound boxes',
    intervention_effective: null,
    notes: 'Still working on this pattern',
    created_at: '2024-11-01T00:00:00Z',
    updated_at: '2024-12-12T00:00:00Z',
  },
  {
    id: 'error-3',
    curriculum: 'delta_math',
    curriculum_position: { standard: '4.NF.1' },
    error_pattern: 'Adds numerators and denominators when comparing',
    student_examples: ['Jayden said 1/2 + 1/3 = 2/5'],
    frequency: 5,
    first_observed: '2024-11-15',
    last_observed: '2024-12-10',
    intervention_tried: 'Fraction strips, number line',
    intervention_effective: true,
    notes: 'Visual models helping',
    created_at: '2024-11-15T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
  },
  {
    id: 'error-4',
    curriculum: 'camino',
    curriculum_position: { lesson: 20 },
    error_pattern: 'Confuses "b" and "v" sounds',
    student_examples: ['Diego said "baca" for "vaca"'],
    frequency: 6,
    first_observed: '2024-10-15',
    last_observed: '2024-12-05',
    intervention_tried: 'Minimal pairs practice, mirror work',
    intervention_effective: true,
    notes: 'Common for bilingual learners',
    created_at: '2024-10-15T00:00:00Z',
    updated_at: '2024-12-05T00:00:00Z',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTodaysSessions(): SessionWithGroup[] {
  return MOCK_SESSIONS_WITH_GROUPS.filter(s => s.date === today);
}

export function getUpcomingSessions(): SessionWithGroup[] {
  return MOCK_SESSIONS_WITH_GROUPS
    .filter(s => s.date >= today && s.status === 'planned')
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '').localeCompare(b.time || '');
    });
}

export function getGroupWithStudents(groupId: string): GroupWithStudents | undefined {
  return MOCK_GROUPS_WITH_STUDENTS.find(g => g.id === groupId);
}

export function getStudentsForGroup(groupId: string): Student[] {
  return MOCK_STUDENTS.filter(s => s.group_id === groupId);
}

export function getSessionsForGroup(groupId: string): Session[] {
  return MOCK_SESSIONS.filter(s => s.group_id === groupId);
}

export function getProgressForStudent(studentId: string): ProgressMonitoring[] {
  return MOCK_PROGRESS.filter(p => p.student_id === studentId);
}

export function getProgressForGroup(groupId: string): ProgressMonitoring[] {
  return MOCK_PROGRESS.filter(p => p.group_id === groupId);
}

export function getErrorsForCurriculum(curriculum: Curriculum): ErrorBankEntry[] {
  return MOCK_ERROR_ENTRIES.filter(e => e.curriculum === curriculum);
}
