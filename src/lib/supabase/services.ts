/**
 * Supabase Database Services
 * CRUD operations for all tables
 */

import { supabase } from './client';
import { isSupabaseConfigured } from './config';
import type {
  Group,
  GroupInsert,
  GroupUpdate,
  Student,
  StudentInsert,
  StudentUpdate,
  Session,
  SessionInsert,
  SessionUpdate,
  ProgressMonitoring,
  ProgressMonitoringInsert,
  ErrorBankEntry,
  ErrorBankInsert,
  ErrorBankUpdate,
} from './types';

// ============================================
// GROUPS
// ============================================

export async function fetchAllGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Group[];
}

export async function fetchGroupById(id: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(error.message);
  }
  return data as Group;
}

export async function createGroup(group: GroupInsert): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .insert(group)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Group;
}

export async function updateGroup(id: string, updates: GroupUpdate): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Group;
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================
// STUDENTS
// ============================================

export async function fetchStudentsByGroupId(groupId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('group_id', groupId)
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []) as Student[];
}

export async function fetchAllStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []) as Student[];
}

export async function fetchStudentById(id: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as Student;
}

export async function createStudent(student: StudentInsert): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Student;
}

export async function updateStudent(id: string, updates: StudentUpdate): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Student;
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================
// SESSIONS
// ============================================

export async function fetchSessionsByGroupId(groupId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Session[];
}

export async function fetchAllSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Session[];
}

export async function fetchSessionById(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as Session;
}

export async function createSession(session: SessionInsert): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Session;
}

export async function updateSession(id: string, updates: SessionUpdate): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Session;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================
// PROGRESS MONITORING
// ============================================

export async function fetchProgressByGroupId(groupId: string): Promise<ProgressMonitoring[]> {
  const { data, error } = await supabase
    .from('progress_monitoring')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as ProgressMonitoring[];
}

export async function fetchProgressByStudentId(studentId: string): Promise<ProgressMonitoring[]> {
  const { data, error } = await supabase
    .from('progress_monitoring')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as ProgressMonitoring[];
}

export async function createProgressMonitoring(pm: ProgressMonitoringInsert): Promise<ProgressMonitoring> {
  const { data, error } = await supabase
    .from('progress_monitoring')
    .insert(pm)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ProgressMonitoring;
}

export async function deleteProgressMonitoring(id: string): Promise<void> {
  const { error } = await supabase
    .from('progress_monitoring')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================
// ERROR BANK
// ============================================

export async function fetchAllErrors(): Promise<ErrorBankEntry[]> {
  const { data, error } = await supabase
    .from('error_bank')
    .select('*')
    .order('occurrence_count', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as ErrorBankEntry[];
}

export async function fetchErrorsByCurriculum(curriculum: string): Promise<ErrorBankEntry[]> {
  const { data, error } = await supabase
    .from('error_bank')
    .select('*')
    .eq('curriculum', curriculum)
    .order('occurrence_count', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as ErrorBankEntry[];
}

export async function createError(entry: ErrorBankInsert): Promise<ErrorBankEntry> {
  const { data, error } = await supabase
    .from('error_bank')
    .insert(entry)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ErrorBankEntry;
}

export async function updateError(id: string, updates: ErrorBankUpdate): Promise<ErrorBankEntry> {
  const { data, error } = await supabase
    .from('error_bank')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ErrorBankEntry;
}

export async function deleteError(id: string): Promise<void> {
  const { error } = await supabase
    .from('error_bank')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================
// UTILITY: Check if Supabase is available
// ============================================

export function useSupabase(): boolean {
  return isSupabaseConfigured();
}

// ============================================
// ROLE-BASED QUERIES
// ============================================

/**
 * Fetch students based on user role
 * - Admin: All students
 * - Interventionist: Students assigned to them
 * - Teacher: Students in their grade level
 */
export async function fetchStudentsByRole(
  role: 'admin' | 'interventionist' | 'teacher',
  userId: string,
  gradeLevel?: string | null
): Promise<Student[]> {
  if (role === 'admin') {
    return fetchAllStudents();
  }

  if (role === 'interventionist') {
    // Fetch students assigned to this interventionist
    const { data, error } = await supabase
      .from('student_assignments')
      .select(`
        students (*)
      `)
      .eq('interventionist_id', userId);

    if (error) throw new Error(error.message);

    // Extract students from the result
    const students = (data || [])
      .map((row: any) => row.students)
      .filter((s: any) => s !== null) as Student[];

    return students;
  }

  if (role === 'teacher' && gradeLevel) {
    // Fetch students in teacher's grade level
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('grade_level', gradeLevel)
      .order('name');

    if (error) throw new Error(error.message);
    return (data || []) as Student[];
  }

  return [];
}

/**
 * Fetch groups based on user role
 * - Admin: All groups
 * - Interventionist: Groups they created + limited view of other groups
 * - Teacher: All groups (read-only view)
 */
export async function fetchGroupsByRole(
  role: 'admin' | 'interventionist' | 'teacher',
  userId: string
): Promise<Group[]> {
  if (role === 'admin' || role === 'teacher') {
    return fetchAllGroups();
  }

  if (role === 'interventionist') {
    // Fetch groups created by this interventionist
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Group[];
  }

  return [];
}

/**
 * Fetch groups with visibility info for interventionists
 * Includes "in_another_group" status without revealing details
 */
export async function fetchGroupsWithVisibility(
  role: 'admin' | 'interventionist' | 'teacher',
  userId: string
): Promise<(Group & { isOwn: boolean })[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((group: any) => ({
    ...group,
    isOwn: role === 'admin' || group.created_by === userId,
  })) as (Group & { isOwn: boolean })[];
}

/**
 * Create a group with the current user as owner
 */
export async function createGroupWithOwner(group: GroupInsert, creatorId: string): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .insert({ ...group, created_by: creatorId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Group;
}
