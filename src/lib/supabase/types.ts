// EMERGE Intervention Planner - Database Types
// Generated from Supabase schema

import type { WilsonLessonPlan, LessonComponentType } from '../curriculum/wilson-lesson-elements';
import type { CaminoLessonPlan, CaminoLessonComponentType } from '../curriculum/camino/camino-lesson-elements';

// Re-export for convenience
export type { WilsonLessonPlan, LessonComponentType } from '../curriculum/wilson-lesson-elements';
export type { CaminoLessonPlan, CaminoLessonComponentType } from '../curriculum/camino/camino-lesson-elements';

// Multi-day Wilson lesson assignment
export interface WilsonDayAssignment {
  day: number;  // 1, 2, or 3
  components: LessonComponentType[];
}

export type Curriculum = 'wilson' | 'delta_math' | 'camino' | 'wordgen' | 'amira' | 'despegando';
export type Tier = 2 | 3;
export type SessionStatus = 'planned' | 'completed' | 'cancelled';
export type Pacing = 'too_slow' | 'just_right' | 'too_fast';
export type MasteryLevel = 'yes' | 'no' | 'partial';
export type PMTrend = 'improving' | 'flat' | 'declining';

// Curriculum position types
export interface WilsonPosition {
  step: number;
  substep: string;
}

export interface DeltaMathPosition {
  standard: string;
  session?: number; // 1-8 in the intervention cycle
  phase?: 'concrete' | 'transitional' | 'representational' | 'abstract' | 'mixed' | 'assessment';
}

export interface CaminoPosition {
  lesson: number;
}

export interface WordGenPosition {
  unit: number;
  day: number;
}

export interface AmiraPosition {
  level: 'Emergent' | 'Beginning' | 'Transitional' | 'Fluent';
}

export interface DespegandoPosition {
  phase: number; // 1-5
  lesson: number; // 1-40
}

export type CurriculumPosition =
  | WilsonPosition
  | DeltaMathPosition
  | CaminoPosition
  | WordGenPosition
  | AmiraPosition
  | DespegandoPosition;

/**
 * Type guards for CurriculumPosition variants
 *
 * These functions enable type-safe access to curriculum-specific position properties
 * without requiring 'as any' casts.
 */
export function isWilsonPosition(pos: CurriculumPosition): pos is WilsonPosition {
  return 'step' in pos && 'substep' in pos;
}

export function isDeltaMathPosition(pos: CurriculumPosition): pos is DeltaMathPosition {
  return 'standard' in pos;
}

export function isCaminoPosition(pos: CurriculumPosition): pos is CaminoPosition {
  return 'lesson' in pos;
}

export function isWordGenPosition(pos: CurriculumPosition): pos is WordGenPosition {
  return 'unit' in pos && 'day' in pos;
}

export function isAmiraPosition(pos: CurriculumPosition): pos is AmiraPosition {
  return 'level' in pos && typeof (pos as AmiraPosition).level === 'string';
}

export function isDespegandoPosition(pos: CurriculumPosition): pos is DespegandoPosition {
  return 'phase' in pos && 'lesson' in pos;
}

// Schedule type
export interface GroupSchedule {
  days?: string[]; // e.g., ['monday', 'wednesday', 'friday']
  time?: string;   // e.g., '09:00'
  duration?: number; // minutes
}

// Error tracking types
export interface AnticipatedError {
  id: string;
  error_pattern: string;
  correction_protocol: string;
  occurred?: boolean;
  correction_worked?: boolean;
}

export interface ObservedError {
  error_pattern: string;
  correction_used: string;
  correction_worked: boolean;
  add_to_bank?: boolean;
}

// Fidelity checklist item
export interface FidelityItem {
  component: string;
  completed: boolean;
  duration_minutes?: number;
  notes?: string;
}

// Practice items
export interface PracticeItem {
  item: string;
  type: 'new' | 'review' | 'cumulative';
}

// ===========================================
// DATABASE TABLE TYPES
// ===========================================

export interface Group {
  id: string;
  name: string;
  curriculum: Curriculum;
  tier: Tier;
  grade: number;
  current_position: CurriculumPosition;
  schedule: GroupSchedule | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  group_id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  group_id: string;
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

  // Camino-specific lesson plan
  camino_lesson_plan?: CaminoLessonPlan | null;

  // Camino lesson progress tracking (persists between sessions)
  camino_lesson_progress?: CaminoLessonProgress | null;

  // Multi-day session series (for splitting lessons across days)
  series_id?: string | null;       // Links sessions in a multi-day series
  series_order?: number | null;    // 1, 2, 3 for day order in series
  series_total?: number | null;    // Total days in series (2 or 3)

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

// Camino lesson progress tracking type
export interface CaminoLessonProgress {
  [sectionComponent: string]: {
    completed: boolean;
    elementsCompleted: string[];
    activitiesCompleted: number[];
  };
}

export interface ProgressMonitoring {
  id: string;
  group_id: string;
  student_id: string | null;
  date: string;
  measure_type: string;
  score: number;
  benchmark: number | null;
  goal: number | null;
  notes: string | null;
  created_at: string;
}

export interface ErrorBankEntry {
  id: string;
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

export interface CurriculumSequence {
  id: string;
  curriculum: Curriculum;
  position_key: string;
  position_label: string;
  description: string | null;
  skills: string[] | null;
  sample_words: Record<string, string[]> | null;
  prerequisite_positions: string[] | null;
  next_positions: string[] | null;
  lesson_components: LessonComponent[] | null;
  suggested_activities: string[] | null;
  materials_needed: string[] | null;
  sort_order: number;
  created_at: string;
}

export interface LessonComponent {
  name: string;
  duration_minutes: number;
  description?: string;
  required?: boolean;
}

export interface AILog {
  id: string;
  feature: string;
  input_text: string | null;
  output_text: string | null;
  model: string | null;
  tokens_used: number | null;
  created_at: string;
}

// ===========================================
// INSERT TYPES (for creating new records)
// ===========================================

export type GroupInsert = Omit<Group, 'id' | 'created_at' | 'updated_at'>;
export type StudentInsert = Omit<Student, 'id' | 'created_at'>;
export type SessionInsert = Omit<Session, 'id' | 'created_at' | 'updated_at'>;
export type ProgressMonitoringInsert = Omit<ProgressMonitoring, 'id' | 'created_at'>;
export type ErrorBankInsert = Omit<ErrorBankEntry, 'id' | 'created_at'>;

// ===========================================
// UPDATE TYPES (for updating records)
// ===========================================

export type GroupUpdate = Partial<GroupInsert>;
export type StudentUpdate = Partial<StudentInsert>;
export type SessionUpdate = Partial<SessionInsert>;
export type ProgressMonitoringUpdate = Partial<ProgressMonitoringInsert>;
export type ErrorBankUpdate = Partial<ErrorBankInsert>;

// ===========================================
// JOINED/ENRICHED TYPES
// ===========================================

export interface GroupWithStudents extends Group {
  students: Student[];
}

export interface GroupWithSessions extends Group {
  sessions: Session[];
}

export interface SessionWithGroup extends Session {
  group: Group;
}

export interface ProgressMonitoringWithStudent extends ProgressMonitoring {
  student: Student | null;
}

// ===========================================
// UI/DISPLAY TYPES
// ===========================================

export interface GroupCardData {
  id: string;
  name: string;
  curriculum: Curriculum;
  tier: Tier;
  grade: number;
  current_position: CurriculumPosition;
  nextSession: {
    date: string;
    time?: string;
  } | null;
  studentCount: number;
  lastSessionDate: string | null;
}

export interface TodaySession {
  id: string;
  groupId: string;
  groupName: string;
  curriculum: Curriculum;
  tier: Tier;
  time: string | null;
  status: SessionStatus;
  position: CurriculumPosition;
}

export interface QuickStats {
  sessionsThisWeek: number;
  sessionsCompleted: number;
  groupsNeedingAttention: number;
  pmDataPointsDue: number;
}

// ===========================================
// CURRICULUM-SPECIFIC DISPLAY HELPERS
// ===========================================

export function formatCurriculumPosition(curriculum: Curriculum, position: CurriculumPosition): string {
  switch (curriculum) {
    case 'wilson':
      const wilson = position as WilsonPosition;
      return `Step ${wilson.step}, Substep ${wilson.substep}`;
    case 'delta_math':
      const delta = position as DeltaMathPosition;
      return delta.standard;
    case 'camino':
      const camino = position as CaminoPosition;
      return `Lesson ${camino.lesson}`;
    case 'wordgen':
      const wordgen = position as WordGenPosition;
      return `Unit ${wordgen.unit}, Day ${wordgen.day}`;
    case 'amira':
      const amira = position as AmiraPosition;
      return amira.level;
    default:
      return JSON.stringify(position);
  }
}

export function getCurriculumColor(curriculum: Curriculum): string {
  const colors: Record<Curriculum, string> = {
    wilson: 'wilson',
    delta_math: 'delta',
    camino: 'camino',
    wordgen: 'wordgen',
    amira: 'amira',
    despegando: 'emerald',
  };
  return colors[curriculum];
}

export function getCurriculumLabel(curriculum: Curriculum): string {
  const labels: Record<Curriculum, string> = {
    wilson: 'Wilson Reading System',
    delta_math: 'Delta Math',
    camino: 'Camino a la Lectura',
    wordgen: 'WordGen',
    amira: 'Amira Learning',
    despegando: 'Despegando (Spanish)',
  };
  return labels[curriculum];
}

export function getTierColor(tier: Tier): string {
  return tier === 2 ? 'tier2' : 'tier3';
}

export function getTierLabel(tier: Tier): string {
  return `Tier ${tier}`;
}

// ===========================================
// SCHEDULE BUILDER TYPES
// ===========================================

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

// Time block representation
export interface TimeBlock {
  startTime: string;  // "HH:MM" format (24-hour)
  endTime: string;    // "HH:MM" format (24-hour)
}

// Weekly recurring time block
export interface WeeklyTimeBlock extends TimeBlock {
  days: WeekDay[];
}

// Constraint types
export type ConstraintType = 'lunch' | 'core_instruction' | 'specials' | 'therapy' | 'other';

// Interventionist entity
export interface Interventionist {
  id: string;
  name: string;
  email?: string;
  color: string;  // Hex color for calendar display
  availability: WeeklyTimeBlock[];
  created_at: string;
  updated_at: string;
}

// Grade-level constraint (applies to all students in a grade)
export interface GradeLevelConstraint {
  id: string;
  grade: number;
  label: string;  // "Lunch", "Core Reading", "Specials", etc.
  type: ConstraintType;
  schedule: WeeklyTimeBlock;
  created_at: string;
}

// Individual student constraint (override/addition to grade-level)
export interface StudentConstraint {
  id: string;
  student_id: string;
  label: string;
  type: ConstraintType;
  schedule: WeeklyTimeBlock;
  created_at: string;
}

// Suggested time slot from scheduling algorithm
export interface SuggestedTimeSlot {
  day: WeekDay;
  startTime: string;
  endTime: string;
  score: number;  // Lower is better (0 = perfect, higher = more issues)
  conflicts: ScheduleConflict[];
}

// Schedule conflict details
export interface ScheduleConflict {
  type: 'student_unavailable' | 'interventionist_unavailable' | 'existing_session';
  description: string;
  studentId?: string;
  studentName?: string;
}

// Insert types for schedule entities
export type InterventionistInsert = Omit<Interventionist, 'id' | 'created_at' | 'updated_at'>;
export type InterventionistUpdate = Partial<InterventionistInsert>;
export type GradeLevelConstraintInsert = Omit<GradeLevelConstraint, 'id' | 'created_at'>;
export type StudentConstraintInsert = Omit<StudentConstraint, 'id' | 'created_at'>;

// Extended Group type with interventionist
export interface GroupWithInterventionist extends Group {
  interventionist_id?: string;
  interventionist?: Interventionist | null;
}

// Schedule view data
export interface ScheduleSlot {
  day: WeekDay;
  time: string;  // "HH:MM"
  type: 'available' | 'session' | 'constraint' | 'suggested';
  session?: Session;
  group?: Group;
  constraint?: GradeLevelConstraint | StudentConstraint;
}

// Preset constraint templates
export const CONSTRAINT_PRESETS: Record<string, { label: string; type: ConstraintType; defaultTime: TimeBlock }> = {
  lunch_early: { label: 'Lunch (Early)', type: 'lunch', defaultTime: { startTime: '11:00', endTime: '11:30' } },
  lunch_mid: { label: 'Lunch (Mid)', type: 'lunch', defaultTime: { startTime: '11:30', endTime: '12:00' } },
  lunch_late: { label: 'Lunch (Late)', type: 'lunch', defaultTime: { startTime: '12:00', endTime: '12:30' } },
  core_reading: { label: 'Core Reading', type: 'core_instruction', defaultTime: { startTime: '09:00', endTime: '10:30' } },
  core_math: { label: 'Core Math', type: 'core_instruction', defaultTime: { startTime: '10:30', endTime: '11:30' } },
  specials: { label: 'Specials (PE/Art/Music)', type: 'specials', defaultTime: { startTime: '13:00', endTime: '13:45' } },
};

// Default interventionist colors
export const INTERVENTIONIST_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#0ea5e9', // Sky
];
