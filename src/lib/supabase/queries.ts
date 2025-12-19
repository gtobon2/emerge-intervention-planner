// @ts-nocheck
/**
 * EMERGE Intervention Planner - Centralized Supabase Queries
 *
 * This file contains all database query functions for consistent data fetching
 * across the application. Each function is properly typed and handles errors.
 *
 * Note: Type checking disabled due to Supabase generic type inference issues.
 * Types are still enforced at the function signature level.
 */

import { supabase } from './client';
import type {
  Group,
  GroupInsert,
  GroupUpdate,
  GroupWithStudents,
  Student,
  StudentInsert,
  StudentUpdate,
  Session,
  SessionInsert,
  SessionUpdate,
  SessionWithGroup,
  TodaySession,
  ProgressMonitoring,
  ProgressMonitoringInsert,
  ProgressMonitoringWithStudent,
  ErrorBankEntry,
  ErrorBankInsert,
  ErrorBankUpdate,
  Curriculum,
  CurriculumPosition,
  CurriculumSequence,
} from './types';

// ===========================================
// TYPE DEFINITIONS FOR QUERY RESULTS
// ===========================================

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

export interface QueryArrayResult<T> {
  data: T[];
  error: Error | null;
}

// ===========================================
// GROUP QUERIES
// ===========================================

/**
 * Fetch all groups, ordered by name
 */
export async function fetchGroups(): Promise<QueryArrayResult<Group>> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Fetch a single group by ID
 */
export async function fetchGroupById(id: string): Promise<QueryResult<Group>> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Fetch a single group with its students
 */
export async function fetchGroupWithStudents(
  id: string
): Promise<QueryResult<GroupWithStudents>> {
  try {
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (groupError) throw groupError;

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('group_id', id)
      .order('name');

    if (studentsError) throw studentsError;

    return {
      data: { ...(group as Group), students: students || [] },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Create a new group
 */
export async function createGroup(
  group: GroupInsert
): Promise<QueryResult<Group>> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .insert(group)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Update an existing group
 */
export async function updateGroup(
  id: string,
  updates: GroupUpdate
): Promise<QueryResult<Group>> {
  try {
    const { data, error } = await supabase
      .from('groups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('groups').delete().eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

// ===========================================
// STUDENT QUERIES
// ===========================================

/**
 * Fetch all students for a specific group
 */
export async function fetchStudentsForGroup(
  groupId: string
): Promise<QueryArrayResult<Student>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('group_id', groupId)
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Fetch a single student by ID
 */
export async function fetchStudentById(
  id: string
): Promise<QueryResult<Student>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Create a new student
 */
export async function createStudent(
  student: StudentInsert
): Promise<QueryResult<Student>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Update an existing student
 */
export async function updateStudent(
  id: string,
  updates: StudentUpdate
): Promise<QueryResult<Student>> {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Delete a student
 */
export async function deleteStudent(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('students').delete().eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

// ===========================================
// SESSION QUERIES
// ===========================================

/**
 * Fetch all sessions for a specific group
 */
export async function fetchSessionsForGroup(
  groupId: string
): Promise<QueryArrayResult<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Fetch sessions for today across all groups
 */
export async function fetchTodaySessions(): Promise<
  QueryArrayResult<TodaySession>
> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('sessions')
      .select(
        `
        id,
        group_id,
        time,
        status,
        curriculum_position,
        groups!inner (
          name,
          curriculum,
          tier
        )
      `
      )
      .eq('date', today)
      .order('time');

    if (error) throw error;

    const todaySessions: TodaySession[] = (data || []).map((session: any) => ({
      id: session.id,
      groupId: session.group_id,
      groupName: session.groups.name,
      curriculum: session.groups.curriculum,
      tier: session.groups.tier,
      time: session.time,
      status: session.status,
      position: session.curriculum_position,
    }));

    return { data: todaySessions, error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Fetch sessions for a specific date range
 */
export async function fetchSessionsInDateRange(
  startDate: string,
  endDate: string
): Promise<QueryArrayResult<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Fetch a single session by ID
 */
export async function fetchSessionById(
  id: string
): Promise<QueryResult<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Fetch a single session with its group information
 */
export async function fetchSessionWithGroup(
  id: string
): Promise<QueryResult<SessionWithGroup>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(
        `
        *,
        groups (*)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      data: {
        ...data,
        group: data.groups,
      } as SessionWithGroup,
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Create a new session
 */
export async function createSession(
  session: SessionInsert
): Promise<QueryResult<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Update an existing session
 */
export async function updateSession(
  id: string,
  updates: SessionUpdate
): Promise<QueryResult<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Delete a session
 */
export async function deleteSession(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('sessions').delete().eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

// ===========================================
// PROGRESS MONITORING QUERIES
// ===========================================

/**
 * Fetch progress monitoring data for a specific group
 */
export async function fetchProgressForGroup(
  groupId: string
): Promise<QueryArrayResult<ProgressMonitoring>> {
  try {
    const { data, error } = await supabase
      .from('progress_monitoring')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Fetch progress monitoring data for a group with student information
 */
export async function fetchProgressForGroupWithStudents(
  groupId: string
): Promise<QueryArrayResult<ProgressMonitoringWithStudent>> {
  try {
    const { data, error } = await supabase
      .from('progress_monitoring')
      .select(
        `
        *,
        students (*)
      `
      )
      .eq('group_id', groupId)
      .order('date', { ascending: true });

    if (error) throw error;

    const formattedData = (data || []).map((item: any) => ({
      ...item,
      student: item.students,
    }));

    return { data: formattedData, error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Fetch progress monitoring data for a specific student
 */
export async function fetchProgressForStudent(
  studentId: string
): Promise<QueryArrayResult<ProgressMonitoring>> {
  try {
    const { data, error } = await supabase
      .from('progress_monitoring')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Add a progress monitoring data point
 */
export async function addProgressDataPoint(
  dataPoint: ProgressMonitoringInsert
): Promise<QueryResult<ProgressMonitoring>> {
  try {
    const { data, error } = await supabase
      .from('progress_monitoring')
      .insert(dataPoint)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Delete a progress monitoring data point
 */
export async function deleteProgressDataPoint(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('progress_monitoring')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

// ===========================================
// ERROR BANK QUERIES
// ===========================================

/**
 * Fetch all error bank entries for a specific curriculum
 */
export async function fetchErrorsForCurriculum(
  curriculum: Curriculum
): Promise<QueryArrayResult<ErrorBankEntry>> {
  try {
    const { data, error } = await supabase
      .from('error_bank')
      .select('*')
      .eq('curriculum', curriculum)
      .order('occurrence_count', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Fetch error bank entries for a specific curriculum position
 */
export async function fetchErrorsForPosition(
  curriculum: Curriculum,
  position: CurriculumPosition
): Promise<QueryArrayResult<ErrorBankEntry>> {
  try {
    // Fetch all errors for the curriculum
    const { data, error } = await supabase
      .from('error_bank')
      .select('*')
      .eq('curriculum', curriculum);

    if (error) throw error;

    // Filter errors that match the position or are universal (null position)
    const filteredErrors = (data || []).filter((e) => {
      if (!e.curriculum_position) return true; // Universal error
      return matchCurriculumPosition(curriculum, e.curriculum_position, position);
    });

    return { data: filteredErrors, error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Create a new error bank entry
 */
export async function createErrorBankEntry(
  error: ErrorBankInsert
): Promise<QueryResult<ErrorBankEntry>> {
  try {
    const { data, error: dbError } = await supabase
      .from('error_bank')
      .insert({ ...error, is_custom: true })
      .select()
      .single();

    if (dbError) throw dbError;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Update an existing error bank entry
 */
export async function updateErrorBankEntry(
  id: string,
  updates: ErrorBankUpdate
): Promise<QueryResult<ErrorBankEntry>> {
  try {
    const { data, error } = await supabase
      .from('error_bank')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Increment the effectiveness count for an error
 */
export async function incrementErrorEffectiveness(
  id: string
): Promise<{ error: Error | null }> {
  try {
    // First fetch the current count
    const { data: current, error: fetchError } = await supabase
      .from('error_bank')
      .select('effectiveness_count')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Then update it
    const { error: updateError } = await supabase
      .from('error_bank')
      .update({ effectiveness_count: (current.effectiveness_count || 0) + 1 })
      .eq('id', id);

    if (updateError) throw updateError;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

/**
 * Increment the occurrence count for an error
 */
export async function incrementErrorOccurrence(
  id: string
): Promise<{ error: Error | null }> {
  try {
    // First fetch the current count
    const { data: current, error: fetchError } = await supabase
      .from('error_bank')
      .select('occurrence_count')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Then update it
    const { error: updateError } = await supabase
      .from('error_bank')
      .update({ occurrence_count: (current.occurrence_count || 0) + 1 })
      .eq('id', id);

    if (updateError) throw updateError;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

/**
 * Delete an error bank entry
 */
export async function deleteErrorBankEntry(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('error_bank').delete().eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

// ===========================================
// CURRICULUM SEQUENCE QUERIES
// ===========================================

/**
 * Fetch curriculum sequences for a specific curriculum
 */
export async function fetchCurriculumSequences(
  curriculum: Curriculum
): Promise<QueryArrayResult<CurriculumSequence>> {
  try {
    const { data, error } = await supabase
      .from('curriculum_sequences')
      .select('*')
      .eq('curriculum', curriculum)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Fetch a specific curriculum sequence by position key
 */
export async function fetchCurriculumSequenceByPosition(
  curriculum: Curriculum,
  positionKey: string
): Promise<QueryResult<CurriculumSequence>> {
  try {
    const { data, error } = await supabase
      .from('curriculum_sequences')
      .select('*')
      .eq('curriculum', curriculum)
      .eq('position_key', positionKey)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Helper function to match curriculum positions
 * Used for filtering errors by position
 */
function matchCurriculumPosition(
  curriculum: Curriculum,
  errorPosition: CurriculumPosition,
  currentPosition: CurriculumPosition
): boolean {
  switch (curriculum) {
    case 'wilson': {
      const errPos = errorPosition as { step: number; substep?: string };
      const curPos = currentPosition as { step: number; substep: string };
      return errPos.step === curPos.step;
    }
    case 'delta_math': {
      const errPos = errorPosition as { standard: string };
      const curPos = currentPosition as { standard: string };
      return errPos.standard === curPos.standard;
    }
    case 'camino': {
      const errPos = errorPosition as {
        lesson?: number;
        lesson_range?: [number, number];
      };
      const curPos = currentPosition as { lesson: number };
      if (errPos.lesson) {
        return errPos.lesson === curPos.lesson;
      }
      if (errPos.lesson_range) {
        return (
          curPos.lesson >= errPos.lesson_range[0] &&
          curPos.lesson <= errPos.lesson_range[1]
        );
      }
      return false;
    }
    case 'wordgen': {
      const errPos = errorPosition as { unit: number; day?: number };
      const curPos = currentPosition as { unit: number; day: number };
      return errPos.unit === curPos.unit;
    }
    case 'amira': {
      const errPos = errorPosition as { level: string };
      const curPos = currentPosition as { level: string };
      return errPos.level === curPos.level;
    }
    default:
      return false;
  }
}

/**
 * Get sessions for a specific week
 */
export function getSessionsForWeek(sessions: Session[], weekStart: Date): Session[] {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    return sessionDate >= weekStart && sessionDate < weekEnd;
  });
}

/**
 * Get the most recent session for a group
 */
export async function fetchMostRecentSession(
  groupId: string
): Promise<QueryResult<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Get upcoming sessions for a group
 */
export async function fetchUpcomingSessions(
  groupId: string,
  limit: number = 5
): Promise<QueryArrayResult<Session>> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('group_id', groupId)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

/**
 * Complete a session with all collected data
 * This updates the session with all the data collected during the session,
 * including OTRs, errors, duration, notes, etc.
 */
export async function completeSession(
  id: string,
  completionData: {
    actual_otr_estimate?: number | null;
    pacing?: 'too_slow' | 'just_right' | 'too_fast' | null;
    components_completed?: string[] | null;
    exit_ticket_correct?: number | null;
    exit_ticket_total?: number | null;
    mastery_demonstrated?: 'yes' | 'no' | 'partial' | null;
    errors_observed?: any[] | null;
    unexpected_errors?: any[] | null;
    pm_score?: number | null;
    pm_trend?: 'improving' | 'flat' | 'declining' | null;
    dbi_adaptation_notes?: string | null;
    notes?: string | null;
    next_session_notes?: string | null;
    fidelity_checklist?: any[] | null;
  }
): Promise<QueryResult<Session>> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        ...completionData,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

/**
 * Save errors from a session to the error bank
 * This function processes errors observed during a session and either:
 * 1. Creates new error bank entries for new errors
 * 2. Increments occurrence/effectiveness counts for existing errors
 */
export async function saveSessionErrors(
  sessionId: string,
  curriculum: Curriculum,
  curriculumPosition: CurriculumPosition,
  errorsObserved: Array<{
    error_pattern: string;
    correction_used: string;
    correction_worked: boolean;
    add_to_bank?: boolean;
  }>
): Promise<{ error: Error | null }> {
  try {
    // Get all errors from the session that should be added to the bank
    const errorsToAdd = errorsObserved.filter((e) => e.add_to_bank);

    for (const error of errorsToAdd) {
      // Check if this error pattern already exists in the error bank
      const { data: existingErrors } = await supabase
        .from('error_bank')
        .select('*')
        .eq('curriculum', curriculum)
        .eq('error_pattern', error.error_pattern);

      if (existingErrors && existingErrors.length > 0) {
        // Error exists - increment counters
        const existingError = existingErrors[0];
        const updates: any = {
          occurrence_count: existingError.occurrence_count + 1,
        };

        if (error.correction_worked) {
          updates.effectiveness_count = existingError.effectiveness_count + 1;
        }

        await supabase
          .from('error_bank')
          .update(updates)
          .eq('id', existingError.id);
      } else {
        // New error - create entry
        await supabase.from('error_bank').insert({
          curriculum,
          curriculum_position: curriculumPosition,
          error_pattern: error.error_pattern,
          correction_protocol: error.correction_used,
          correction_prompts: [error.correction_used],
          is_custom: true,
          effectiveness_count: error.correction_worked ? 1 : 0,
          occurrence_count: 1,
        });
      }
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

/**
 * Record student OTR data for a session
 * This is helpful for tracking individual student participation
 */
export async function recordStudentOTRs(
  sessionId: string,
  studentOTRs: Array<{
    student_id: string;
    otr_count: number;
  }>
): Promise<{ error: Error | null }> {
  // Note: This would require a session_student_data table
  // For now, we can store this in the session notes or a JSONB field
  // This is a placeholder for future implementation
  try {
    // Future: Insert into session_student_data table
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}
