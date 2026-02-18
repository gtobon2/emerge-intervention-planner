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

// Grade levels for students and teachers
export type GradeLevel = 'Pre-K' | 'K' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

// All grade level options for UI selectors
export const GRADE_LEVELS: GradeLevel[] = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8'];
export type SessionStatus = 'planned' | 'completed' | 'cancelled';
export type Pacing = 'too_slow' | 'just_right' | 'too_fast';
export type MasteryLevel = 'yes' | 'no' | 'partial';
export type PMTrend = 'improving' | 'flat' | 'declining';

// Curriculum position types
export interface WilsonPosition {
  step: number;
  substep: string;
  stepRange?: [number, number]; // Optional range for errors that apply to multiple steps
}

export interface DeltaMathPosition {
  standard: string;
  session?: number; // 1-8 in the intervention cycle
  phase?: 'concrete' | 'transitional' | 'representational' | 'abstract' | 'mixed' | 'assessment';
}

export interface CaminoPosition {
  lesson: number;
  lessonRange?: [number, number]; // Optional range for errors that apply to multiple lessons
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
  owner_id: string | null; // User ID who owns/manages the group (for RBAC)
  created_by: string | null; // User ID of who created the group (historical tracking)
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  group_id: string;
  name: string;
  notes: string | null;
  grade_level: GradeLevel | null; // Student's grade level for teacher visibility
  created_at: string;
}

// Student assignment to interventionists (allows multiple interventionists per student)
export interface StudentAssignment {
  id: string;
  student_id: string;
  interventionist_id: string;
  assigned_by: string | null;
  assigned_at: string;
  created_at: string;
}

export type StudentAssignmentInsert = Omit<StudentAssignment, 'id' | 'assigned_at' | 'created_at'>;

// Student with assignment info for UI display
export interface StudentWithAssignments extends Student {
  assignments: StudentAssignment[];
  interventionists?: { id: string; full_name: string }[];
}

// Student group status for interventionists
export interface StudentGroupStatus {
  student_id: string;
  student_name: string;
  grade_level: GradeLevel | null;
  group_id: string | null;
  current_group_name: string | null;
  current_curriculum: Curriculum | null;
  group_owner_id: string | null;
  is_in_group: boolean;
}

// ===========================================
// STUDENT GROUP MEMBERSHIPS (Multi-group support)
// ===========================================

export type MembershipStatus = 'active' | 'inactive' | 'graduated';

// Student group membership - allows students to belong to multiple groups
export interface StudentGroupMembership {
  id: string;
  student_id: string;
  group_id: string;
  enrolled_at: string;
  enrolled_by: string | null;
  status: MembershipStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type StudentGroupMembershipInsert = Omit<StudentGroupMembership, 'id' | 'created_at' | 'updated_at' | 'enrolled_at'> & {
  enrolled_at?: string;
};

export type StudentGroupMembershipUpdate = Partial<Omit<StudentGroupMembershipInsert, 'student_id' | 'group_id'>>;

// Membership with group details for display
export interface MembershipWithGroup extends StudentGroupMembership {
  group: Group;
  owner?: { id: string; full_name: string } | null;
}

// Membership with student details for display
export interface MembershipWithStudent extends StudentGroupMembership {
  student: Student;
}

// Student with all their group memberships
export interface StudentWithGroups extends Student {
  memberships: MembershipWithGroup[];
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

export interface StudentGoal {
  id: string;
  student_id: string;
  group_id: string;
  goal_score: number;
  smart_goal_text: string;
  goal_target_date: string | null;
  benchmark_score: number | null;
  benchmark_date: string | null;
  measure_type: string;
  set_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type StudentGoalInsert = Omit<StudentGoal, 'id' | 'created_at' | 'updated_at'>;
export type StudentGoalUpdate = Partial<Omit<StudentGoalInsert, 'student_id' | 'group_id'>>;

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

// GroupInsert: owner_id and created_by are optional since they can be set automatically by the service layer
export type GroupInsert = Omit<Group, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'created_by'> & {
  owner_id?: string | null;
  created_by?: string | null;
};

// StudentInsert: grade_level is optional
export type StudentInsert = Omit<Student, 'id' | 'created_at' | 'grade_level'> & {
  grade_level?: GradeLevel | null;
};
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

export interface GroupWithOwner extends Group {
  owner?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
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
  totalStudents: number;
  totalGroups: number;
  totalSessions: number;
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
  type: 'student_unavailable' | 'interventionist_unavailable' | 'existing_session' | 'group_not_found' | 'no_cycle';
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

// ===========================================
// SCHEDULE CONSTRAINTS (Supabase-backed)
// ===========================================

export type ConstraintScope = 'schoolwide' | 'personal';

/**
 * Schedule constraint stored in Supabase
 * Supports multi-grade and role-based visibility
 */
export interface ScheduleConstraint {
  id: string;
  created_by: string;
  scope: ConstraintScope;
  applicable_grades: number[];
  label: string;
  type: ConstraintType;
  days: WeekDay[];
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export type ScheduleConstraintInsert = Omit<ScheduleConstraint, 'id' | 'created_at' | 'updated_at'>;
export type ScheduleConstraintUpdate = Partial<Omit<ScheduleConstraintInsert, 'created_by'>>;

/**
 * Extended type with creator profile info (for display)
 */
export interface ScheduleConstraintWithCreator extends ScheduleConstraint {
  creator?: {
    full_name: string;
    role: string;
  };
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

// ===========================================
// SESSION ATTENDANCE TYPES
// ===========================================

export type AttendanceStatus = 'present' | 'absent' | 'tardy' | 'excused';

export interface SessionAttendance {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  notes: string | null;
  marked_at: string;
  marked_by: string | null;
}

export type SessionAttendanceInsert = Omit<SessionAttendance, 'id' | 'marked_at'>;
export type SessionAttendanceUpdate = Partial<SessionAttendanceInsert>;

// Attendance with student info for display
export interface AttendanceWithStudent extends SessionAttendance {
  student: Student;
}

// ===========================================
// SCHOOL CALENDAR / NON-STUDENT DAYS
// ===========================================

export type NonStudentDayType =
  | 'holiday'
  | 'pd_day'
  | 'institute_day'
  | 'early_dismissal'
  | 'late_start'
  | 'testing_day'
  | 'emergency_closure'
  | 'break';

export interface SchoolCalendarEvent {
  id: string;
  date: string;          // YYYY-MM-DD
  end_date: string | null; // For date ranges (e.g., winter break)
  type: NonStudentDayType;
  title: string;
  affects_grades: number[] | null; // null = all grades affected
  modified_start_time: string | null; // For late starts
  modified_end_time: string | null;   // For early dismissals
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type SchoolCalendarEventInsert = Omit<SchoolCalendarEvent, 'id' | 'created_at'>;
export type SchoolCalendarEventUpdate = Partial<SchoolCalendarEventInsert>;

// ===========================================
// INTERVENTION CYCLES
// ===========================================

export type CycleStatus = 'planning' | 'active' | 'completed';

export interface InterventionCycle {
  id: string;
  name: string;           // "Cycle 3"
  start_date: string;     // YYYY-MM-DD
  end_date: string;       // YYYY-MM-DD
  grade_band: string | null; // "K-2", "3-5", "6-8" or null for all
  weeks_count: number;    // Typically 6-8
  status: CycleStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type InterventionCycleInsert = Omit<InterventionCycle, 'id' | 'created_at' | 'updated_at'>;
export type InterventionCycleUpdate = Partial<InterventionCycleInsert>;

// ===========================================
// ENHANCED GROUP SCHEDULE (per-day times)
// ===========================================

// Time slot for a specific day
export interface DayTimeSlot {
  day: WeekDay;
  time: string;        // "09:00" 24-hour format
  enabled: boolean;
}

// Enhanced schedule with per-day times and cycle reference
export interface EnhancedGroupSchedule {
  cycle_id?: string | null;       // Reference to intervention cycle
  custom_start_date?: string | null;  // Override cycle start (for mid-cycle starts)
  custom_end_date?: string | null;    // Override cycle end
  day_times: DayTimeSlot[];       // Per-day time configuration
  duration: number;               // Session duration in minutes
}

// Helper to check if schedule uses enhanced format
export function isEnhancedSchedule(schedule: GroupSchedule | EnhancedGroupSchedule | null): schedule is EnhancedGroupSchedule {
  return schedule !== null && 'day_times' in schedule;
}

// Helper to convert old format to new format
export function convertToEnhancedSchedule(oldSchedule: GroupSchedule | null): EnhancedGroupSchedule {
  if (!oldSchedule) {
    return {
      day_times: [
        { day: 'monday', time: '', enabled: false },
        { day: 'tuesday', time: '', enabled: false },
        { day: 'wednesday', time: '', enabled: false },
        { day: 'thursday', time: '', enabled: false },
        { day: 'friday', time: '', enabled: false },
      ],
      duration: 30,
    };
  }

  const defaultTime = oldSchedule.time || '09:00';
  const days = oldSchedule.days || [];
  const allDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  return {
    day_times: allDays.map(day => ({
      day,
      time: days.includes(day) ? defaultTime : '',
      enabled: days.includes(day),
    })),
    duration: oldSchedule.duration || 30,
  };
}

// Helper to get enabled days from enhanced schedule
export function getEnabledDays(schedule: EnhancedGroupSchedule): WeekDay[] {
  return schedule.day_times.filter(dt => dt.enabled).map(dt => dt.day);
}

// Helper to get time for a specific day
export function getTimeForDay(schedule: EnhancedGroupSchedule, day: WeekDay): string | null {
  const slot = schedule.day_times.find(dt => dt.day === day);
  return slot?.enabled ? slot.time : null;
}

// ===========================================
// FLEXIBLE GROUP SCHEDULE (sessions per week)
// ===========================================

/**
 * Flexible schedule with sessions-per-week (scheduler auto-picks days)
 * This is the new preferred format - simpler UX, smarter scheduling
 */
export interface FlexibleGroupSchedule {
  /** Reference to intervention cycle for date range */
  cycle_id?: string | null;
  
  /** Override cycle start (for mid-cycle starts) */
  custom_start_date?: string | null;
  
  /** Override cycle end */
  custom_end_date?: string | null;
  
  /** Number of sessions per week (2-5) */
  sessions_per_week: number;
  
  /** Preferred time for all sessions (can be null to let scheduler pick) */
  preferred_time?: string | null;
  
  /** Session duration in minutes */
  duration: number;
  
  /** 
   * Computed/cached day assignments (filled by scheduler)
   * If present, used directly. If absent, scheduler computes optimal days.
   */
  computed_days?: DayTimeSlot[];
}

/**
 * Type guard for flexible schedule format
 */
export function isFlexibleSchedule(
  schedule: GroupSchedule | EnhancedGroupSchedule | FlexibleGroupSchedule | null
): schedule is FlexibleGroupSchedule {
  return schedule !== null && 'sessions_per_week' in schedule;
}

/**
 * Convert enhanced schedule to flexible format
 */
export function convertToFlexibleSchedule(
  schedule: EnhancedGroupSchedule | null
): FlexibleGroupSchedule {
  if (!schedule) {
    return {
      sessions_per_week: 3,
      duration: 30,
    };
  }
  
  // Count enabled days
  const enabledDays = schedule.day_times.filter(dt => dt.enabled);
  const sessionsPerWeek = enabledDays.length || 3;
  
  // Get first time as preferred
  const firstTime = enabledDays.find(dt => dt.time)?.time || null;
  
  return {
    cycle_id: schedule.cycle_id,
    custom_start_date: schedule.custom_start_date,
    custom_end_date: schedule.custom_end_date,
    sessions_per_week: sessionsPerWeek,
    preferred_time: firstTime,
    duration: schedule.duration,
    // Keep computed_days to preserve user's selections during migration
    computed_days: schedule.day_times,
  };
}

/**
 * Convert flexible schedule back to enhanced format (for backward compatibility)
 */
export function flexibleToEnhancedSchedule(
  schedule: FlexibleGroupSchedule
): EnhancedGroupSchedule {
  // If we have computed days, use them
  if (schedule.computed_days && schedule.computed_days.length > 0) {
    return {
      cycle_id: schedule.cycle_id,
      custom_start_date: schedule.custom_start_date,
      custom_end_date: schedule.custom_end_date,
      day_times: schedule.computed_days,
      duration: schedule.duration,
    };
  }
  
  // Otherwise generate from sessions_per_week using default patterns
  const patterns: Record<number, WeekDay[]> = {
    2: ['tuesday', 'thursday'],
    3: ['monday', 'wednesday', 'friday'],
    4: ['monday', 'tuesday', 'thursday', 'friday'],
    5: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  };
  
  const selectedDays = new Set(patterns[schedule.sessions_per_week] || patterns[3]);
  const allDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  
  return {
    cycle_id: schedule.cycle_id,
    custom_start_date: schedule.custom_start_date,
    custom_end_date: schedule.custom_end_date,
    day_times: allDays.map(day => ({
      day,
      time: selectedDays.has(day) ? (schedule.preferred_time || '09:00') : '',
      enabled: selectedDays.has(day),
    })),
    duration: schedule.duration,
  };
}

/**
 * Get sessions per week from any schedule format
 */
export function getSessionsPerWeek(
  schedule: GroupSchedule | EnhancedGroupSchedule | FlexibleGroupSchedule | null
): number {
  if (!schedule) return 0;
  
  if (isFlexibleSchedule(schedule)) {
    return schedule.sessions_per_week;
  }
  
  if (isEnhancedSchedule(schedule)) {
    return getEnabledDays(schedule).length;
  }
  
  // Basic GroupSchedule
  return (schedule.days || []).length;
}

// ===========================================
// ATTENDANCE HELPERS
// ===========================================

export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  const labels: Record<AttendanceStatus, string> = {
    present: 'Present',
    absent: 'Absent',
    tardy: 'Tardy',
    excused: 'Excused',
  };
  return labels[status];
}

export function getAttendanceStatusIcon(status: AttendanceStatus): string {
  const icons: Record<AttendanceStatus, string> = {
    present: '✓',
    absent: '✗',
    tardy: '⏰',
    excused: 'E',
  };
  return icons[status];
}

export function getAttendanceStatusColor(status: AttendanceStatus): string {
  const colors: Record<AttendanceStatus, string> = {
    present: 'text-green-500',
    absent: 'text-red-500',
    tardy: 'text-yellow-500',
    excused: 'text-blue-500',
  };
  return colors[status];
}

// ===========================================
// NON-STUDENT DAY HELPERS
// ===========================================

export function getNonStudentDayTypeLabel(type: NonStudentDayType): string {
  const labels: Record<NonStudentDayType, string> = {
    holiday: 'Holiday',
    pd_day: 'PD Day',
    institute_day: 'Institute Day',
    early_dismissal: 'Early Dismissal',
    late_start: 'Late Start',
    testing_day: 'Testing Day',
    emergency_closure: 'Emergency Closure',
    break: 'Break',
  };
  return labels[type];
}

export function getNonStudentDayTypeColor(type: NonStudentDayType): string {
  const colors: Record<NonStudentDayType, string> = {
    holiday: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    pd_day: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    institute_day: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    early_dismissal: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    late_start: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    testing_day: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
    emergency_closure: 'bg-red-200 text-red-900 dark:bg-red-800/30 dark:text-red-200',
    break: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };
  return colors[type];
}

// ===========================================
// CYCLE HELPERS
// ===========================================

export function getCycleStatusColor(status: CycleStatus): string {
  const colors: Record<CycleStatus, string> = {
    planning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
  };
  return colors[status];
}

export function getCycleStatusLabel(status: CycleStatus): string {
  const labels: Record<CycleStatus, string> = {
    planning: 'Planning',
    active: 'Active',
    completed: 'Completed',
  };
  return labels[status];
}

// Calculate which week of the cycle we're in
export function getCurrentCycleWeek(cycle: InterventionCycle): number {
  const now = new Date();
  const start = new Date(cycle.start_date);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(1, weekNumber), cycle.weeks_count);
}

// ===========================================
// MATERIALS SYSTEM TYPES
// ===========================================

export type MaterialCategory =
  | 'cards'
  | 'manipulatives'
  | 'texts'
  | 'workbooks'
  | 'teacher'
  | 'visuals'
  | 'technology'
  | 'assessment'
  | 'other';

export type MaterialCurriculum = Curriculum | 'fundations';

// Material catalog - master list of materials
export interface MaterialCatalog {
  id: string;
  curriculum: MaterialCurriculum;
  category: MaterialCategory;
  name: string;
  description: string | null;
  quantity_hint: string | null;
  is_consumable: boolean;
  applicable_positions: string[] | null; // Position keys where this material applies
  sort_order: number;
  is_essential: boolean;
  created_at: string;
  updated_at: string;
}

// Group materials - links groups to their collected materials
export interface GroupMaterial {
  id: string;
  group_id: string;
  material_id: string;
  is_collected: boolean;
  collected_at: string | null;
  collected_by: string | null;
  notes: string | null;
  location: string | null;
  is_custom: boolean;
  custom_name: string | null;
  custom_description: string | null;
  custom_category: MaterialCategory | null;
  created_at: string;
  updated_at: string;
}

// Session material checklist - session-specific materials
export interface SessionMaterialChecklist {
  id: string;
  session_id: string;
  material_id: string | null;
  custom_material_name: string | null;
  custom_material_description: string | null;
  is_prepared: boolean;
  prepared_at: string | null;
  prepared_by: string | null;
  specific_item: string | null;
  quantity_needed: string | null;
  notes: string | null;
  is_auto_generated: boolean;
  created_at: string;
}

// ===========================================
// MATERIALS INSERT/UPDATE TYPES
// ===========================================

export type MaterialCatalogInsert = Omit<MaterialCatalog, 'id' | 'created_at' | 'updated_at'>;
export type MaterialCatalogUpdate = Partial<MaterialCatalogInsert>;

export type GroupMaterialInsert = Omit<GroupMaterial, 'id' | 'created_at' | 'updated_at' | 'collected_at' | 'collected_by'>;
export type GroupMaterialUpdate = Partial<GroupMaterialInsert> & {
  is_collected?: boolean;
  collected_at?: string | null;
  collected_by?: string | null;
};

export type SessionMaterialChecklistInsert = Omit<SessionMaterialChecklist, 'id' | 'created_at' | 'prepared_at' | 'prepared_by'>;
export type SessionMaterialChecklistUpdate = Partial<SessionMaterialChecklistInsert> & {
  is_prepared?: boolean;
  prepared_at?: string | null;
  prepared_by?: string | null;
};

// ===========================================
// MATERIALS JOINED TYPES
// ===========================================

export interface GroupMaterialWithCatalog extends GroupMaterial {
  material: MaterialCatalog | null;
}

export interface SessionMaterialWithCatalog extends SessionMaterialChecklist {
  material: MaterialCatalog | null;
}

// ===========================================
// MATERIALS SUMMARY TYPES
// ===========================================

export interface GroupMaterialsSummary {
  group_id: string;
  group_name: string;
  curriculum: Curriculum;
  total_materials: number;
  collected_count: number;
  collection_percent: number;
}

export interface WeeklySessionMaterial {
  session_id: string;
  session_date: string;
  session_time: string | null;
  group_id: string;
  group_name: string;
  curriculum: Curriculum;
  checklist_id: string;
  material_name: string;
  category: MaterialCategory;
  specific_item: string | null;
  quantity_needed: string | null;
  is_prepared: boolean;
  notes: string | null;
}

// ===========================================
// MATERIALS HELPERS
// ===========================================

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  cards: 'Cards & Flashcards',
  manipulatives: 'Manipulatives',
  texts: 'Decodable Texts',
  workbooks: 'Workbooks & Worksheets',
  teacher: 'Teacher Materials',
  visuals: 'Visual Aids',
  technology: 'Technology',
  assessment: 'Assessment Tools',
  other: 'Other',
};

export const MATERIAL_CATEGORY_ICONS: Record<MaterialCategory, string> = {
  cards: 'layers',
  manipulatives: 'puzzle',
  texts: 'book-open',
  workbooks: 'file-text',
  teacher: 'pen-tool',
  visuals: 'image',
  technology: 'monitor',
  assessment: 'clipboard-check',
  other: 'package',
};

export function getMaterialCategoryColor(category: MaterialCategory): string {
  const colors: Record<MaterialCategory, string> = {
    cards: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    manipulatives: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    texts: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    workbooks: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    teacher: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    visuals: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    technology: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    assessment: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
  };
  return colors[category];
}
