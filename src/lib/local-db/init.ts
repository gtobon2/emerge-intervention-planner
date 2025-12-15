/**
 * EMERGE Intervention Planner - Database Initialization
 * Seeds the local database with demo data on first run
 */

import { db } from './index';
import type {
  LocalGroupInsert,
  LocalStudentInsert,
  LocalSessionInsert,
  LocalProgressMonitoringInsert,
  LocalErrorBankInsert,
} from './index';

// ============================================
// DEMO DATA DEFINITIONS
// ============================================

const DEMO_GROUPS: LocalGroupInsert[] = [
  {
    name: 'Reading Rockets',
    curriculum: 'wilson',
    tier: 2,
    grade: 3,
    current_position: { step: 1, substep: '1.1' },
    schedule: {
      days: ['monday', 'wednesday', 'friday'],
      time: '09:00',
      duration: 30,
    },
  },
  {
    name: 'Math Masters',
    curriculum: 'delta_math',
    tier: 2,
    grade: 4,
    current_position: { standard: '4.NBT.1' },
    schedule: {
      days: ['tuesday', 'thursday'],
      time: '10:30',
      duration: 45,
    },
  },
  {
    name: 'Intensive Reading',
    curriculum: 'wilson',
    tier: 3,
    grade: 5,
    current_position: { step: 2, substep: '2.3' },
    schedule: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      time: '14:00',
      duration: 45,
    },
  },
];

const DEMO_STUDENTS: Omit<LocalStudentInsert, 'group_id'>[] = [
  { name: 'Emma Rodriguez', notes: 'Strong phonemic awareness, working on blending' },
  { name: 'Liam Chen', notes: 'Needs extra time for processing' },
  { name: 'Sophia Patel', notes: 'Excellent participation' },
  { name: 'Noah Johnson', notes: 'Working on place value concepts' },
  { name: 'Olivia Kim', notes: 'Shows great progress with word families' },
  { name: 'Ethan Williams', notes: null },
];

const DEMO_ERROR_BANK: LocalErrorBankInsert[] = [
  {
    curriculum: 'wilson',
    curriculum_position: null,
    error_pattern: 'Confuses /b/ and /d/ sounds',
    underlying_gap: 'Visual discrimination of similar letters',
    correction_protocol: 'Use multisensory tracing, emphasize ball and stick formation',
    correction_prompts: [
      'Look at the letter - where does the ball go?',
      'Trace the letter while saying the sound',
      'What sound does your mouth make?',
    ],
    visual_cues: 'Bed diagram (b and d with bed in between)',
    kinesthetic_cues: 'Use hand signals - thumb up for b, thumb back for d',
    is_custom: false,
    effectiveness_count: 12,
    occurrence_count: 25,
  },
  {
    curriculum: 'wilson',
    curriculum_position: null,
    error_pattern: 'Drops final consonant in CVC words',
    underlying_gap: 'Phoneme segmentation',
    correction_protocol: 'Use finger tapping for each sound, emphasize all three sounds',
    correction_prompts: [
      'How many sounds do you hear?',
      'Tap each sound on your fingers',
      'Don\'t forget the last sound!',
    ],
    visual_cues: 'Three boxes for three sounds (Elkonin boxes)',
    kinesthetic_cues: 'Tap fingers while saying each phoneme',
    is_custom: false,
    effectiveness_count: 8,
    occurrence_count: 15,
  },
  {
    curriculum: 'delta_math',
    curriculum_position: { standard: '4.NBT.1' },
    error_pattern: 'Misidentifies place value (e.g., 342 = "three hundred forty-two" but thinks 4 represents 4 not 40)',
    underlying_gap: 'Understanding that position determines value',
    correction_protocol: 'Use base-10 blocks to build number, explicitly connect digit position to value',
    correction_prompts: [
      'What place is this digit in?',
      'How many groups of 10 do you see?',
      'Show me with the blocks',
    ],
    visual_cues: 'Place value chart with labels',
    kinesthetic_cues: 'Build numbers with manipulatives',
    is_custom: false,
    effectiveness_count: 6,
    occurrence_count: 10,
  },
];

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

/**
 * Check if the database is empty
 */
async function isDatabaseEmpty(): Promise<boolean> {
  const groupCount = await db.groups.count();
  return groupCount === 0;
}

/**
 * Seed the database with demo data
 */
async function seedDemoData(): Promise<void> {
  console.log('[DB Init] Seeding database with demo data...');

  await db.transaction('rw', [db.groups, db.students, db.sessions, db.progressMonitoring, db.errorBank], async () => {
    // Insert demo groups
    const groupIds: number[] = [];
    for (const group of DEMO_GROUPS) {
      const id = await db.groups.add({
        ...group,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      groupIds.push(id);
    }
    console.log(`[DB Init] Created ${groupIds.length} demo groups`);

    // Insert demo students (2 per group)
    let studentIndex = 0;
    const studentIds: number[] = [];
    for (const groupId of groupIds) {
      // Add 2 students per group
      for (let i = 0; i < 2 && studentIndex < DEMO_STUDENTS.length; i++) {
        const student = DEMO_STUDENTS[studentIndex];
        const id = await db.students.add({
          ...student,
          group_id: groupId,
          created_at: new Date().toISOString(),
        });
        studentIds.push(id);
        studentIndex++;
      }
    }
    console.log(`[DB Init] Created ${studentIds.length} demo students`);

    // Create a few demo sessions for the first group
    if (groupIds.length > 0) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const demoSessions: LocalSessionInsert[] = [
        {
          group_id: groupIds[0],
          date: twoDaysAgo.toISOString().split('T')[0],
          time: '09:00',
          status: 'completed',
          curriculum_position: { step: 1, substep: '1.1' },
          advance_after: false,
          planned_otr_target: 40,
          planned_response_formats: ['choral', 'individual'],
          planned_practice_items: null,
          cumulative_review_items: null,
          anticipated_errors: null,
          actual_otr_estimate: 38,
          pacing: 'just_right',
          components_completed: ['warm_up', 'new_teaching', 'practice'],
          exit_ticket_correct: 4,
          exit_ticket_total: 5,
          mastery_demonstrated: 'yes',
          errors_observed: null,
          unexpected_errors: null,
          pm_score: null,
          pm_trend: null,
          dbi_adaptation_notes: null,
          notes: 'Great session! Students were very engaged.',
          next_session_notes: 'Continue with CVC words',
          fidelity_checklist: null,
        },
        {
          group_id: groupIds[0],
          date: yesterday.toISOString().split('T')[0],
          time: '09:00',
          status: 'completed',
          curriculum_position: { step: 1, substep: '1.1' },
          advance_after: false,
          planned_otr_target: 45,
          planned_response_formats: ['choral', 'individual'],
          planned_practice_items: null,
          cumulative_review_items: null,
          anticipated_errors: null,
          actual_otr_estimate: 42,
          pacing: 'just_right',
          components_completed: ['warm_up', 'new_teaching', 'practice', 'review'],
          exit_ticket_correct: 5,
          exit_ticket_total: 5,
          mastery_demonstrated: 'yes',
          errors_observed: null,
          unexpected_errors: null,
          pm_score: null,
          pm_trend: null,
          dbi_adaptation_notes: null,
          notes: 'All students showing progress',
          next_session_notes: null,
          fidelity_checklist: null,
        },
        {
          group_id: groupIds[0],
          date: today.toISOString().split('T')[0],
          time: '09:00',
          status: 'planned',
          curriculum_position: { step: 1, substep: '1.2' },
          advance_after: true,
          planned_otr_target: 40,
          planned_response_formats: ['choral', 'individual', 'partner'],
          planned_practice_items: null,
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
        },
      ];

      for (const session of demoSessions) {
        await db.sessions.add({
          ...session,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      console.log(`[DB Init] Created ${demoSessions.length} demo sessions`);
    }

    // Insert demo progress monitoring data for first two students
    if (studentIds.length >= 2 && groupIds.length > 0) {
      const progressData: LocalProgressMonitoringInsert[] = [];
      const dates = [];
      for (let i = 4; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 7); // Weekly intervals
        dates.push(date.toISOString().split('T')[0]);
      }

      // Student 1 - showing growth
      const student1Scores = [12, 15, 18, 22, 25];
      dates.forEach((date, index) => {
        progressData.push({
          group_id: groupIds[0],
          student_id: studentIds[0],
          date,
          measure_type: 'Words Correct Per Minute',
          score: student1Scores[index],
          benchmark: 20,
          goal: 30,
          notes: null,
        });
      });

      // Student 2 - showing some growth
      const student2Scores = [10, 12, 14, 15, 17];
      dates.forEach((date, index) => {
        progressData.push({
          group_id: groupIds[0],
          student_id: studentIds[1],
          date,
          measure_type: 'Words Correct Per Minute',
          score: student2Scores[index],
          benchmark: 20,
          goal: 25,
          notes: null,
        });
      });

      for (const pm of progressData) {
        await db.progressMonitoring.add({
          ...pm,
          created_at: new Date().toISOString(),
        });
      }
      console.log(`[DB Init] Created ${progressData.length} progress monitoring records`);
    }

    // Insert demo error bank entries
    for (const error of DEMO_ERROR_BANK) {
      await db.errorBank.add({
        ...error,
        created_at: new Date().toISOString(),
      });
    }
    console.log(`[DB Init] Created ${DEMO_ERROR_BANK.length} error bank entries`);
  });

  console.log('[DB Init] Demo data seeding complete!');
}

/**
 * Initialize the database
 * - Opens/creates the IndexedDB database
 * - Seeds with demo data if empty
 * - Returns initialization status
 */
export async function initializeDatabase(): Promise<{
  success: boolean;
  isEmpty: boolean;
  seededWithDemo: boolean;
  error?: string;
}> {
  try {
    console.log('[DB Init] Initializing local database...');

    // Check if database exists and is accessible
    await db.open();
    console.log('[DB Init] Database opened successfully');

    // Check if database is empty
    const isEmpty = await isDatabaseEmpty();
    console.log(`[DB Init] Database empty: ${isEmpty}`);

    let seededWithDemo = false;

    // Seed with demo data if empty
    if (isEmpty) {
      await seedDemoData();
      seededWithDemo = true;
    }

    console.log('[DB Init] Initialization complete');

    return {
      success: true,
      isEmpty,
      seededWithDemo,
    };
  } catch (error) {
    console.error('[DB Init] Failed to initialize database:', error);
    return {
      success: false,
      isEmpty: true,
      seededWithDemo: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  stats: {
    groups: number;
    students: number;
    sessions: number;
    progressMonitoring: number;
    errorBank: number;
  };
}> {
  try {
    const [groups, students, sessions, progressMonitoring, errorBank] = await Promise.all([
      db.groups.count(),
      db.students.count(),
      db.sessions.count(),
      db.progressMonitoring.count(),
      db.errorBank.count(),
    ]);

    return {
      healthy: true,
      stats: {
        groups,
        students,
        sessions,
        progressMonitoring,
        errorBank,
      },
    };
  } catch (error) {
    console.error('[DB Health] Health check failed:', error);
    return {
      healthy: false,
      stats: {
        groups: 0,
        students: 0,
        sessions: 0,
        progressMonitoring: 0,
        errorBank: 0,
      },
    };
  }
}
