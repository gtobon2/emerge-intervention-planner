/**
 * EMERGE Intervention Planner - Local Database
 * IndexedDB implementation using Dexie.js for local-first, FERPA-compliant storage
 */

import Dexie, { Table } from 'dexie';
import type {
  Curriculum,
  Tier,
  SessionStatus,
  Pacing,
  MasteryLevel,
  PMTrend,
  CurriculumPosition,
  GroupSchedule,
  AnticipatedError,
  ObservedError,
  FidelityItem,
  PracticeItem,
  WeeklyTimeBlock,
  ConstraintType,
} from '../supabase/types';
import type {
  WilsonLessonElements,
  WilsonLessonPlan,
} from '../curriculum/wilson-lesson-elements';
import type {
  CaminoLessonElements,
  CaminoLessonPlan,
} from '../curriculum/camino/camino-lesson-elements';

// ============================================
// LOCAL DATABASE INTERFACES
// ============================================

export interface LocalGroup {
  id?: number;
  name: string;
  curriculum: Curriculum;
  tier: Tier;
  grade: number;
  current_position: CurriculumPosition;
  schedule: GroupSchedule | null;
  interventionist_id?: number;  // Optional link to interventionist
  created_at: string;
  updated_at: string;
}

export interface LocalStudent {
  id?: number;
  group_id: number;
  name: string;
  notes: string | null;
  created_at: string;
}

export interface LocalSession {
  id?: number;
  group_id: number;
  date: string;
  time: string | null;
  status: SessionStatus;
  curriculum_position: CurriculumPosition;
  advance_after: boolean;

  // Planning fields (BEFORE session)
  planned_otr_target: number | null;
  planned_response_formats: string[] | null;
  planned_practice_items: PracticeItem[] | null;
  cumulative_review_items: PracticeItem[] | null;
  anticipated_errors: AnticipatedError[] | null;

  // Logging fields (AFTER session)
  actual_otr_estimate: number | null;
  pacing: Pacing | null;
  components_completed: string[] | null;
  exit_ticket_correct: number | null;
  exit_ticket_total: number | null;
  mastery_demonstrated: MasteryLevel | null;

  // Error tracking
  errors_observed: ObservedError[] | null;
  unexpected_errors: ObservedError[] | null;

  // Tier 3 specific
  pm_score: number | null;
  pm_trend: PMTrend | null;
  dbi_adaptation_notes: string | null;

  // General
  notes: string | null;
  next_session_notes: string | null;
  fidelity_checklist: FidelityItem[] | null;

  // Wilson-specific lesson plan
  wilson_lesson_plan?: WilsonLessonPlan | null;

  // Wilson lesson progress tracking (persists between sessions)
  wilson_lesson_progress?: WilsonLessonProgress | null;

  // Multi-day session series (for splitting lessons across days)
  series_id: string | null;
  series_order: number | null;
  series_total: number | null;

  created_at: string;
  updated_at: string;
}

// Wilson lesson progress tracking type
export interface WilsonLessonProgress {
  [sectionComponent: string]: {
    completed: boolean;
    elementsCompleted: string[];
    activitiesCompleted: number[];
  };
}

export interface LocalProgressMonitoring {
  id?: number;
  group_id: number;
  student_id: number | null;
  date: string;
  measure_type: string;
  score: number;
  benchmark: number | null;
  goal: number | null;
  notes: string | null;
  created_at: string;
}

export interface LocalErrorBankEntry {
  id?: number;
  curriculum: Curriculum;
  curriculum_position: CurriculumPosition | null;
  error_pattern: string;
  underlying_gap: string | null;
  correction_protocol: string;
  correction_prompts: string[] | null;
  visual_cues: string | null;
  kinesthetic_cues: string | null;
  is_custom: boolean;
  effectiveness_count: number;
  occurrence_count: number;
  created_at: string;
}

/**
 * Per-student session tracking data
 *
 * Stores individual student performance within a session:
 * - OTR count: How many opportunities to respond the student received
 * - Errors: Which errors the student exhibited during the session
 * - Correction effectiveness: Whether corrections worked for this student
 */
export interface LocalStudentSessionTracking {
  id?: number;
  session_id: number;
  student_id: number;
  otr_count: number;
  /** Array of error patterns the student exhibited */
  errors_exhibited: string[];
  /** Map of error pattern -> whether correction worked for this student */
  correction_effectiveness: Record<string, boolean>;
  /** Additional notes specific to this student for this session */
  notes: string | null;
  created_at: string;
}

// ============================================
// SCHEDULE BUILDER INTERFACES
// ============================================

/**
 * Interventionist entity
 * Represents a staff member who conducts intervention sessions
 */
export interface LocalInterventionist {
  id?: number;
  name: string;
  email?: string;
  color: string;  // Hex color for calendar display
  availability: WeeklyTimeBlock[];
  created_at: string;
  updated_at: string;
}

/**
 * Grade-level constraint
 * Applies to all students in a specific grade (e.g., "3rd grade lunch at 11:30")
 */
export interface LocalGradeLevelConstraint {
  id?: number;
  grade: number;
  label: string;  // "Lunch", "Core Reading", "Specials"
  type: ConstraintType;
  schedule: WeeklyTimeBlock;
  created_at: string;
}

/**
 * Individual student constraint
 * Override or addition to grade-level constraints for specific students
 */
export interface LocalStudentConstraint {
  id?: number;
  student_id: number;
  label: string;
  type: ConstraintType;
  schedule: WeeklyTimeBlock;
  created_at: string;
}

/**
 * Student goal for progress monitoring
 * Sets a target goal and benchmark per student per group
 */
export interface LocalStudentGoal {
  id?: number;
  student_id: number;
  group_id: number;
  goal_score: number;
  smart_goal_text: string;
  goal_target_date: string;
  benchmark_score: number | null;
  benchmark_date: string | null;
  measure_type: string;
  set_date: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// DEXIE DATABASE CLASS
// ============================================

export class EmergeDatabase extends Dexie {
  groups!: Table<LocalGroup, number>;
  students!: Table<LocalStudent, number>;
  sessions!: Table<LocalSession, number>;
  progressMonitoring!: Table<LocalProgressMonitoring, number>;
  errorBank!: Table<LocalErrorBankEntry, number>;
  studentSessionTracking!: Table<LocalStudentSessionTracking, number>;
  wilsonLessonElements!: Table<WilsonLessonElements, number>;
  wilsonLessonPlans!: Table<WilsonLessonPlan, number>;
  // Camino (Spanish) curriculum tables
  caminoLessonElements!: Table<CaminoLessonElements, number>;
  caminoLessonPlans!: Table<CaminoLessonPlan, number>;
  // Schedule builder tables
  interventionists!: Table<LocalInterventionist, number>;
  gradeLevelConstraints!: Table<LocalGradeLevelConstraint, number>;
  studentConstraints!: Table<LocalStudentConstraint, number>;
  studentGoals!: Table<LocalStudentGoal, number>;

  constructor() {
    super('emerge-intervention-planner');

    // Define database schema
    // Note: Only indexed fields are listed in the schema
    // Version 1: Initial schema
    this.version(1).stores({
      groups: '++id, name, curriculum, tier, grade, created_at, updated_at',
      students: '++id, name, group_id, created_at',
      sessions: '++id, group_id, date, status, created_at, updated_at',
      progressMonitoring: '++id, student_id, group_id, date, created_at',
      errorBank: '++id, curriculum, error_pattern, created_at',
    });

    // Version 2: Add per-student session tracking
    this.version(2).stores({
      groups: '++id, name, curriculum, tier, grade, created_at, updated_at',
      students: '++id, name, group_id, created_at',
      sessions: '++id, group_id, date, status, created_at, updated_at',
      progressMonitoring: '++id, student_id, group_id, date, created_at',
      errorBank: '++id, curriculum, error_pattern, created_at',
      studentSessionTracking: '++id, session_id, student_id, created_at',
    });

    // Version 3: Add Wilson lesson elements and lesson plans
    this.version(3).stores({
      groups: '++id, name, curriculum, tier, grade, created_at, updated_at',
      students: '++id, name, group_id, created_at',
      sessions: '++id, group_id, date, status, created_at, updated_at',
      progressMonitoring: '++id, student_id, group_id, date, created_at',
      errorBank: '++id, curriculum, error_pattern, created_at',
      studentSessionTracking: '++id, session_id, student_id, created_at',
      wilsonLessonElements: '++id, substep, stepNumber, createdAt, updatedAt',
      wilsonLessonPlans: '++id, sessionId, substep, createdAt, updatedAt',
    });

    // Version 4: Add schedule builder tables (interventionists, constraints)
    this.version(4).stores({
      groups: '++id, name, curriculum, tier, grade, interventionist_id, created_at, updated_at',
      students: '++id, name, group_id, created_at',
      sessions: '++id, group_id, date, status, created_at, updated_at',
      progressMonitoring: '++id, student_id, group_id, date, created_at',
      errorBank: '++id, curriculum, error_pattern, created_at',
      studentSessionTracking: '++id, session_id, student_id, created_at',
      wilsonLessonElements: '++id, substep, stepNumber, createdAt, updatedAt',
      wilsonLessonPlans: '++id, sessionId, substep, createdAt, updatedAt',
      interventionists: '++id, name, email, created_at, updated_at',
      gradeLevelConstraints: '++id, grade, type, created_at',
      studentConstraints: '++id, student_id, type, created_at',
    });

    // Version 5: Add series_id index for multi-day sessions
    this.version(5).stores({
      groups: '++id, name, curriculum, tier, grade, interventionist_id, created_at, updated_at',
      students: '++id, name, group_id, created_at',
      sessions: '++id, group_id, date, status, series_id, created_at, updated_at',
      progressMonitoring: '++id, student_id, group_id, date, created_at',
      errorBank: '++id, curriculum, error_pattern, created_at',
      studentSessionTracking: '++id, session_id, student_id, created_at',
      wilsonLessonElements: '++id, substep, stepNumber, createdAt, updatedAt',
      wilsonLessonPlans: '++id, sessionId, substep, createdAt, updatedAt',
      interventionists: '++id, name, email, created_at, updated_at',
      gradeLevelConstraints: '++id, grade, type, created_at',
      studentConstraints: '++id, student_id, type, created_at',
    });

    // Version 6: Add Camino (Spanish) curriculum tables
    this.version(6).stores({
      groups: '++id, name, curriculum, tier, grade, interventionist_id, created_at, updated_at',
      students: '++id, name, group_id, created_at',
      sessions: '++id, group_id, date, status, series_id, created_at, updated_at',
      progressMonitoring: '++id, student_id, group_id, date, created_at',
      errorBank: '++id, curriculum, error_pattern, created_at',
      studentSessionTracking: '++id, session_id, student_id, created_at',
      wilsonLessonElements: '++id, substep, stepNumber, createdAt, updatedAt',
      wilsonLessonPlans: '++id, sessionId, substep, createdAt, updatedAt',
      caminoLessonElements: '++id, unit, lesson, lessonCode, createdAt, updatedAt',
      caminoLessonPlans: '++id, sessionId, unit, lesson, lessonCode, createdAt, updatedAt',
      interventionists: '++id, name, email, created_at, updated_at',
      gradeLevelConstraints: '++id, grade, type, created_at',
      studentConstraints: '++id, student_id, type, created_at',
    });

    // Version 7: Add student goals table
    this.version(7).stores({
      groups: '++id, name, curriculum, tier, grade, interventionist_id, created_at, updated_at',
      students: '++id, name, group_id, created_at',
      sessions: '++id, group_id, date, status, series_id, created_at, updated_at',
      progressMonitoring: '++id, student_id, group_id, date, created_at',
      errorBank: '++id, curriculum, error_pattern, created_at',
      studentSessionTracking: '++id, session_id, student_id, created_at',
      wilsonLessonElements: '++id, substep, stepNumber, createdAt, updatedAt',
      wilsonLessonPlans: '++id, sessionId, substep, createdAt, updatedAt',
      caminoLessonElements: '++id, unit, lesson, lessonCode, createdAt, updatedAt',
      caminoLessonPlans: '++id, sessionId, unit, lesson, lessonCode, createdAt, updatedAt',
      interventionists: '++id, name, email, created_at, updated_at',
      gradeLevelConstraints: '++id, grade, type, created_at',
      studentConstraints: '++id, student_id, type, created_at',
      studentGoals: '++id, student_id, group_id, measure_type, created_at, updated_at',
    });

    // Version 8: Add SMART goal text, benchmark date, goal target date to student goals
    this.version(8).stores({
      groups: '++id, name, curriculum, tier, grade, interventionist_id, created_at, updated_at',
      students: '++id, name, group_id, created_at',
      sessions: '++id, group_id, date, status, series_id, created_at, updated_at',
      progressMonitoring: '++id, student_id, group_id, date, created_at',
      errorBank: '++id, curriculum, error_pattern, created_at',
      studentSessionTracking: '++id, session_id, student_id, created_at',
      wilsonLessonElements: '++id, substep, stepNumber, createdAt, updatedAt',
      wilsonLessonPlans: '++id, sessionId, substep, createdAt, updatedAt',
      caminoLessonElements: '++id, unit, lesson, lessonCode, createdAt, updatedAt',
      caminoLessonPlans: '++id, sessionId, unit, lesson, lessonCode, createdAt, updatedAt',
      interventionists: '++id, name, email, created_at, updated_at',
      gradeLevelConstraints: '++id, grade, type, created_at',
      studentConstraints: '++id, student_id, type, created_at',
      studentGoals: '++id, student_id, group_id, measure_type, created_at, updated_at',
    }).upgrade(tx => {
      return tx.table('studentGoals').toCollection().modify(goal => {
        if (!goal.smart_goal_text) goal.smart_goal_text = '';
        if (!goal.goal_target_date) goal.goal_target_date = '';
        if (!goal.benchmark_date) goal.benchmark_date = null;
      });
    });
  }
}

// ============================================
// DATABASE INSTANCE
// ============================================

export const db = new EmergeDatabase();

// ============================================
// INSERT TYPES (for creating new records)
// ============================================

export type LocalGroupInsert = Omit<LocalGroup, 'id' | 'created_at' | 'updated_at'>;
export type LocalStudentInsert = Omit<LocalStudent, 'id' | 'created_at'>;
export type LocalSessionInsert = Omit<LocalSession, 'id' | 'created_at' | 'updated_at'>;
export type LocalProgressMonitoringInsert = Omit<LocalProgressMonitoring, 'id' | 'created_at'>;
export type LocalErrorBankInsert = Omit<LocalErrorBankEntry, 'id' | 'created_at'>;
export type LocalStudentSessionTrackingInsert = Omit<LocalStudentSessionTracking, 'id' | 'created_at'>;
// Schedule builder insert types
export type LocalInterventionistInsert = Omit<LocalInterventionist, 'id' | 'created_at' | 'updated_at'>;
export type LocalGradeLevelConstraintInsert = Omit<LocalGradeLevelConstraint, 'id' | 'created_at'>;
export type LocalStudentConstraintInsert = Omit<LocalStudentConstraint, 'id' | 'created_at'>;
// Goal insert/update types
export type LocalStudentGoalInsert = Omit<LocalStudentGoal, 'id' | 'created_at' | 'updated_at'>;
export type LocalStudentGoalUpdate = Partial<LocalStudentGoalInsert>;

// ============================================
// UPDATE TYPES (for updating records)
// ============================================

export type LocalGroupUpdate = Partial<LocalGroupInsert>;
export type LocalStudentUpdate = Partial<LocalStudentInsert>;
export type LocalSessionUpdate = Partial<LocalSessionInsert>;
export type LocalProgressMonitoringUpdate = Partial<LocalProgressMonitoringInsert>;
export type LocalErrorBankUpdate = Partial<LocalErrorBankInsert>;
export type LocalStudentSessionTrackingUpdate = Partial<LocalStudentSessionTrackingInsert>;
// Schedule builder update types
export type LocalInterventionistUpdate = Partial<LocalInterventionistInsert>;
export type LocalGradeLevelConstraintUpdate = Partial<LocalGradeLevelConstraintInsert>;
export type LocalStudentConstraintUpdate = Partial<LocalStudentConstraintInsert>;

// ============================================
// JOINED/ENRICHED TYPES
// ============================================

export interface LocalGroupWithStudents extends LocalGroup {
  students: LocalStudent[];
}

export interface LocalGroupWithSessions extends LocalGroup {
  sessions: LocalSession[];
}

export interface LocalSessionWithGroup extends LocalSession {
  group: LocalGroup;
}

export interface LocalProgressMonitoringWithStudent extends LocalProgressMonitoring {
  student: LocalStudent | null;
}

export interface LocalGroupWithInterventionist extends LocalGroup {
  interventionist: LocalInterventionist | null;
}

// Export all types
export * from '../supabase/types';
