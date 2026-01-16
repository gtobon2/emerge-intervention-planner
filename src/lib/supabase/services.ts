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
 * - Interventionist: Groups they own
 * - Teacher: Groups for viewing (read-only)
 */
export async function fetchGroupsByRole(
  role: 'admin' | 'interventionist' | 'teacher',
  userId: string
): Promise<Group[]> {
  if (role === 'admin') {
    return fetchAllGroups();
  }

  if (role === 'interventionist') {
    // Fetch groups owned by this interventionist
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Group[];
  }

  if (role === 'teacher') {
    // Teachers see groups they own only
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Group[];
  }

  return [];
}

/**
 * Fetch groups with visibility info for interventionists
 * Includes "isOwn" flag based on owner_id
 */
export async function fetchGroupsWithVisibility(
  role: 'admin' | 'interventionist' | 'teacher',
  userId: string
): Promise<(Group & { isOwn: boolean })[]> {
  if (role === 'admin') {
    // Admins see all groups and can edit all
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((g: any) => ({ ...g, isOwn: true }));
  }

  // Non-admins see only their own groups
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((g: any) => ({ ...g, isOwn: true }));
}

/**
 * Create a group with the current user as owner
 */
export async function createGroupWithOwner(group: GroupInsert, creatorId: string): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .insert({ ...group, owner_id: creatorId, created_by: creatorId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Group;
}

// ============================================
// GROUP OWNERSHIP MANAGEMENT
// ============================================

/**
 * Fetch all groups with owner information (for admin)
 */
export async function fetchAllGroupsWithOwners(): Promise<(Group & { owner?: { id: string; full_name: string; email: string } | null })[]> {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      owner:profiles!groups_owner_id_fkey (id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    // If the foreign key relationship doesn't exist yet, fall back to manual join
    if (error.message.includes('groups_owner_id_fkey')) {
      const groupsData = await fetchAllGroups();
      return groupsData.map(g => ({ ...g, owner: null }));
    }
    throw new Error(error.message);
  }
  return (data || []).map((g: any) => ({
    ...g,
    owner: g.owner || null,
  }));
}

/**
 * Transfer group ownership to another user (admin only)
 */
export async function transferGroupOwnership(groupId: string, newOwnerId: string): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .update({ owner_id: newOwnerId, updated_at: new Date().toISOString() })
    .eq('id', groupId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Group;
}

/**
 * Fetch groups owned by a specific user
 */
export async function fetchGroupsByOwner(ownerId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Group[];
}

/**
 * Check if user can access a group (owner or admin)
 */
export async function canUserAccessGroup(groupId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === 'admin') return true;

  const { data, error } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', groupId)
    .single();

  if (error) return false;
  return data?.owner_id === userId;
}

/**
 * Fetch group with owner details
 */
export async function fetchGroupWithOwner(groupId: string): Promise<(Group & { owner?: { id: string; full_name: string } | null }) | null> {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      owner:profiles!groups_owner_id_fkey (id, full_name)
    `)
    .eq('id', groupId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    // If foreign key doesn't exist, fall back
    if (error.message.includes('groups_owner_id_fkey')) {
      const group = await fetchGroupById(groupId);
      return group ? { ...group, owner: null } : null;
    }
    throw new Error(error.message);
  }
  return { ...data, owner: data.owner || null };
}
