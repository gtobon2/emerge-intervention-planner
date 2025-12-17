// EMERGE Intervention Planner - Database Types
// Generated from Supabase schema

export type Curriculum = 'wilson' | 'delta_math' | 'camino' | 'wordgen' | 'amira';
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

export type CurriculumPosition =
  | WilsonPosition
  | DeltaMathPosition
  | CaminoPosition
  | WordGenPosition
  | AmiraPosition;

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

  created_at: string;
  updated_at: string;
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
  };
  return labels[curriculum];
}

export function getTierColor(tier: Tier): string {
  return tier === 2 ? 'tier2' : 'tier3';
}

export function getTierLabel(tier: Tier): string {
  return `Tier ${tier}`;
}
