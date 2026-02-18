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
  MaterialCatalog,
  GroupMaterial,
  GroupMaterialInsert,
  GroupMaterialUpdate,
  SessionMaterialChecklist,
  SessionMaterialChecklistInsert,
  SessionMaterialChecklistUpdate,
  GroupMaterialWithCatalog,
  SessionMaterialWithCatalog,
  Curriculum,
  StudentGroupMembership,
  StudentGroupMembershipInsert,
  StudentGroupMembershipUpdate,
  MembershipWithGroup,
  MembershipWithStudent,
  StudentWithGroups,
  MembershipStatus,
  StudentGoal,
  StudentGoalInsert,
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

/**
 * Add an existing student to a group with proper syncing
 * This ensures:
 * 1. Student's group_id is updated (legacy compatibility)
 * 2. Junction table entry is created (new multi-group support)
 * 3. Student is assigned to the group's owner (if any)
 */
export async function addStudentToGroupWithSync(
  studentId: string,
  groupId: string,
  addedBy: string | null
): Promise<Student> {
  // Get the group to find owner_id
  const group = await fetchGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  // Update student's group_id (legacy - kept for backward compatibility)
  const student = await updateStudent(studentId, { group_id: groupId });

  // Also create junction table entry for multi-group support
  try {
    await supabase
      .from('student_group_memberships')
      .upsert({
        student_id: studentId,
        group_id: groupId,
        enrolled_by: addedBy,
        status: 'active',
      }, {
        onConflict: 'student_id,group_id',
        ignoreDuplicates: false,
      });
  } catch (err) {
    // Log but don't fail - junction table sync is best-effort during transition
    console.warn('Failed to create group membership:', err);
  }

  // If group has an owner, ensure student is assigned to them
  if (group.owner_id) {
    try {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('student_assignments')
        .select('id')
        .eq('student_id', studentId)
        .eq('interventionist_id', group.owner_id)
        .maybeSingle();

      if (!existing) {
        // Create assignment
        await supabase
          .from('student_assignments')
          .insert({
            student_id: studentId,
            interventionist_id: group.owner_id,
            assigned_by: addedBy,
          });
      }
    } catch (err) {
      // Log but don't fail - assignment sync is best-effort
      console.warn('Failed to sync student assignment:', err);
    }
  }

  return student;
}

/**
 * Remove a student from a group (sets group_id to null)
 * Optionally removes the assignment to the group's owner
 */
export async function removeStudentFromGroup(
  studentId: string,
  groupId: string,
  removeAssignment: boolean = false
): Promise<Student> {
  // Get the group to find owner_id (if we need to remove assignment)
  const group = removeAssignment ? await fetchGroupById(groupId) : null;

  // Remove from group (set group_id to null directly)
  const { data, error } = await supabase
    .from('students')
    .update({ group_id: null })
    .eq('id', studentId)
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  const student = data as Student;

  // Optionally remove assignment
  if (removeAssignment && group?.owner_id) {
    try {
      await supabase
        .from('student_assignments')
        .delete()
        .eq('student_id', studentId)
        .eq('interventionist_id', group.owner_id);
    } catch (err) {
      console.warn('Failed to remove student assignment:', err);
    }
  }

  return student;
}

// ============================================
// STUDENT GROUP MEMBERSHIPS (Multi-group support)
// ============================================

/**
 * Get all active group memberships for a student
 */
export async function getStudentGroups(studentId: string): Promise<MembershipWithGroup[]> {
  const { data, error } = await supabase
    .from('student_group_memberships')
    .select(`
      *,
      group:groups!inner (
        *,
        owner:profiles!groups_owner_id_fkey (id, full_name)
      )
    `)
    .eq('student_id', studentId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  return (data || []).map((row: any) => ({
    ...row,
    group: row.group,
    owner: row.group?.owner || null,
  })) as MembershipWithGroup[];
}

/**
 * Get all student memberships for a group
 */
export async function getGroupStudents(groupId: string): Promise<MembershipWithStudent[]> {
  const { data, error } = await supabase
    .from('student_group_memberships')
    .select(`
      *,
      student:students!inner (*)
    `)
    .eq('group_id', groupId)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  return (data || []).map((row: any) => ({
    ...row,
    student: row.student,
  })) as MembershipWithStudent[];
}

/**
 * Add a student to a group via the junction table
 * This is the preferred method for multi-group support
 */
export async function addStudentToGroup(
  studentId: string,
  groupId: string,
  enrolledBy: string | null,
  options?: { notes?: string; syncAssignment?: boolean }
): Promise<StudentGroupMembership> {
  const { data, error } = await supabase
    .from('student_group_memberships')
    .insert({
      student_id: studentId,
      group_id: groupId,
      enrolled_by: enrolledBy,
      status: 'active',
      notes: options?.notes || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Student is already enrolled in this group');
    }
    throw new Error(error.message);
  }

  // Optionally sync with student_assignments
  if (options?.syncAssignment !== false) {
    const group = await fetchGroupById(groupId);
    if (group?.owner_id) {
      try {
        const { data: existing } = await supabase
          .from('student_assignments')
          .select('id')
          .eq('student_id', studentId)
          .eq('interventionist_id', group.owner_id)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from('student_assignments')
            .insert({
              student_id: studentId,
              interventionist_id: group.owner_id,
              assigned_by: enrolledBy,
            });
        }
      } catch (err) {
        console.warn('Failed to sync student assignment:', err);
      }
    }
  }

  return data as StudentGroupMembership;
}

/**
 * Remove a student from a group (updates status to inactive)
 * Can optionally hard-delete the membership
 */
export async function removeStudentFromGroupMembership(
  studentId: string,
  groupId: string,
  options?: { hardDelete?: boolean; removeAssignment?: boolean }
): Promise<void> {
  if (options?.hardDelete) {
    const { error } = await supabase
      .from('student_group_memberships')
      .delete()
      .eq('student_id', studentId)
      .eq('group_id', groupId);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('student_group_memberships')
      .update({ status: 'inactive' as MembershipStatus, updated_at: new Date().toISOString() })
      .eq('student_id', studentId)
      .eq('group_id', groupId);

    if (error) throw new Error(error.message);
  }

  // Optionally remove assignment
  if (options?.removeAssignment) {
    const group = await fetchGroupById(groupId);
    if (group?.owner_id) {
      // Only remove if student has no other groups with this owner
      const { data: otherGroups } = await supabase
        .from('student_group_memberships')
        .select('group_id, groups!inner(owner_id)')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .neq('group_id', groupId);

      const hasOtherGroupsWithOwner = (otherGroups || []).some(
        (g: any) => g.groups?.owner_id === group.owner_id
      );

      if (!hasOtherGroupsWithOwner) {
        await supabase
          .from('student_assignments')
          .delete()
          .eq('student_id', studentId)
          .eq('interventionist_id', group.owner_id);
      }
    }
  }
}

/**
 * Update a student's group membership
 */
export async function updateGroupMembership(
  studentId: string,
  groupId: string,
  updates: StudentGroupMembershipUpdate
): Promise<StudentGroupMembership> {
  const { data, error } = await supabase
    .from('student_group_memberships')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('student_id', studentId)
    .eq('group_id', groupId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as StudentGroupMembership;
}

/**
 * Graduate a student from a group
 */
export async function graduateStudentFromGroup(
  studentId: string,
  groupId: string
): Promise<StudentGroupMembership> {
  return updateGroupMembership(studentId, groupId, {
    status: 'graduated',
    notes: `Graduated on ${new Date().toLocaleDateString()}`,
  });
}

/**
 * Get a student with all their active group memberships
 */
export async function fetchStudentWithGroups(studentId: string): Promise<StudentWithGroups | null> {
  const student = await fetchStudentById(studentId);
  if (!student) return null;

  const memberships = await getStudentGroups(studentId);

  return {
    ...student,
    memberships,
  };
}

/**
 * Check if a student is already in a group with the same curriculum
 * (using the new junction table)
 */
export async function checkCurriculumConflictForMembership(
  studentId: string,
  curriculum: string,
  excludeGroupId?: string
): Promise<{
  hasConflict: boolean;
  conflictingGroupName?: string;
  conflictingGroupId?: string;
}> {
  let query = supabase
    .from('student_group_memberships')
    .select(`
      group_id,
      groups!inner (
        id,
        name,
        curriculum
      )
    `)
    .eq('student_id', studentId)
    .eq('status', 'active')
    .eq('groups.curriculum', curriculum);

  if (excludeGroupId) {
    query = query.neq('group_id', excludeGroupId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  if (data && data.length > 0) {
    const group = (data[0] as any).groups;
    return {
      hasConflict: true,
      conflictingGroupName: group?.name,
      conflictingGroupId: group?.id,
    };
  }

  return { hasConflict: false };
}

/**
 * Get all groups for an interventionist that a student is NOT already in
 */
export async function getAvailableGroupsForStudent(
  interventionistId: string,
  studentId: string
): Promise<Group[]> {
  // Get groups owned by this interventionist
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .eq('owner_id', interventionistId)
    .order('name');

  if (groupsError) throw new Error(groupsError.message);
  if (!groups || groups.length === 0) return [];

  // Get student's current memberships
  const { data: memberships, error: membError } = await supabase
    .from('student_group_memberships')
    .select('group_id')
    .eq('student_id', studentId)
    .eq('status', 'active');

  if (membError) throw new Error(membError.message);

  const enrolledGroupIds = new Set((memberships || []).map(m => m.group_id));

  // Filter out groups the student is already in
  return groups.filter(g => !enrolledGroupIds.has(g.id)) as Group[];
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

export async function fetchSessionsByDate(date: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('date', date)
    .order('time', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as Session[];
}

export async function fetchSessionsByDateAndGroups(date: string, groupIds: string[]): Promise<Session[]> {
  if (groupIds.length === 0) return [];

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('date', date)
    .in('group_id', groupIds)
    .order('time', { ascending: true });

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

/**
 * Bulk update sessions (for rescheduling multiple sessions at once)
 * @param sessionIds - Array of session IDs to update
 * @param updates - Updates to apply to all sessions
 * @returns Array of updated sessions
 */
export async function bulkUpdateSessions(
  sessionIds: string[],
  updates: SessionUpdate
): Promise<Session[]> {
  if (sessionIds.length === 0) return [];

  const { data, error } = await supabase
    .from('sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in('id', sessionIds)
    .select();

  if (error) throw new Error(error.message);
  return (data || []) as Session[];
}

/**
 * Get future sessions for a group on a specific weekday
 * Used for "apply to all future sessions" when rescheduling
 * @param groupId - The group ID
 * @param weekday - The weekday to match (0=Sunday, 1=Monday, etc. in JS)
 * @param fromDate - Only include sessions on or after this date
 * @param excludeSessionId - Optional session ID to exclude (the one being moved)
 */
export async function getFutureSessionsForGroupOnWeekday(
  groupId: string,
  weekday: number,
  fromDate: string,
  excludeSessionId?: string
): Promise<Session[]> {
  let query = supabase
    .from('sessions')
    .select('*')
    .eq('group_id', groupId)
    .gte('date', fromDate)
    .in('status', ['planned', 'scheduled']);

  if (excludeSessionId) {
    query = query.neq('id', excludeSessionId);
  }

  const { data, error } = await query.order('date', { ascending: true });

  if (error) throw new Error(error.message);

  // Filter by weekday in JS since Supabase doesn't have a direct weekday function
  const sessions = (data || []) as Session[];
  return sessions.filter(session => {
    const [year, month, day] = session.date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDay() === weekday;
  });
}

/**
 * Reschedule a session and optionally all future sessions for the same group/weekday
 * @param sessionId - The session being rescheduled
 * @param newDate - The new date
 * @param newTime - The new time (optional)
 * @param applyToFuture - Whether to apply to all future sessions on the same weekday
 * @returns Object with updated sessions and count
 */
export async function rescheduleSession(
  sessionId: string,
  newDate: string,
  newTime?: string,
  applyToFuture: boolean = false
): Promise<{ updated: Session[]; count: number }> {
  // Get the original session
  const session = await fetchSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const updates: SessionUpdate = { date: newDate };
  if (newTime) {
    updates.time = newTime;
  }

  if (!applyToFuture) {
    // Just update this one session
    const updated = await updateSession(sessionId, updates);
    return { updated: [updated], count: 1 };
  }

  // Get the original weekday
  const [origYear, origMonth, origDay] = session.date.split('-').map(Number);
  const originalDate = new Date(origYear, origMonth - 1, origDay);
  const originalWeekday = originalDate.getDay();

  // Get the new weekday
  const [newYear, newMonth, newDay] = newDate.split('-').map(Number);
  const newDateObj = new Date(newYear, newMonth - 1, newDay);
  const newWeekday = newDateObj.getDay();

  // Get all future sessions for this group on the original weekday
  const futureSessions = await getFutureSessionsForGroupOnWeekday(
    session.group_id,
    originalWeekday,
    session.date,
    sessionId
  );

  // Update the original session first
  const updatedOriginal = await updateSession(sessionId, updates);
  const allUpdated: Session[] = [updatedOriginal];

  // Calculate the day difference (e.g., moving from Monday to Wednesday = +2)
  const dayDiff = newWeekday - originalWeekday;

  // Update each future session
  for (const futureSession of futureSessions) {
    const [fYear, fMonth, fDay] = futureSession.date.split('-').map(Number);
    const futureDate = new Date(fYear, fMonth - 1, fDay);
    
    // Shift by the same day difference
    futureDate.setDate(futureDate.getDate() + dayDiff);
    
    const newFutureDate = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;
    
    const futureUpdates: SessionUpdate = { date: newFutureDate };
    if (newTime) {
      futureUpdates.time = newTime;
    }
    
    const updated = await updateSession(futureSession.id, futureUpdates);
    allUpdated.push(updated);
  }

  return { updated: allUpdated, count: allUpdated.length };
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
// STUDENT GOALS
// ============================================

export async function fetchGoalsByGroupId(groupId: string): Promise<StudentGoal[]> {
  const { data, error } = await supabase
    .from('student_goals')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as StudentGoal[];
}

export async function fetchGoalByStudentAndGroup(studentId: string, groupId: string): Promise<StudentGoal | null> {
  const { data, error } = await supabase
    .from('student_goals')
    .select('*')
    .eq('student_id', studentId)
    .eq('group_id', groupId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as StudentGoal | null;
}

export async function upsertStudentGoal(goal: StudentGoalInsert): Promise<StudentGoal> {
  const { data, error } = await supabase
    .from('student_goals')
    .upsert(goal, {
      onConflict: 'student_id,group_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as StudentGoal;
}

export async function upsertBulkStudentGoals(goals: StudentGoalInsert[]): Promise<StudentGoal[]> {
  if (goals.length === 0) return [];

  const { data, error } = await supabase
    .from('student_goals')
    .upsert(goals, {
      onConflict: 'student_id,group_id',
      ignoreDuplicates: false,
    })
    .select();

  if (error) throw new Error(error.message);
  return (data || []) as StudentGoal[];
}

export async function deleteStudentGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from('student_goals')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function fetchGoalsByGroupWithStudents(groupId: string): Promise<(StudentGoal & { student: { name: string } | null })[]> {
  const { data, error } = await supabase
    .from('student_goals')
    .select(`
      *,
      student:students!inner(name)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as (StudentGoal & { student: { name: string } | null })[];
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

// ============================================
// ROLE-BASED SESSION QUERIES
// ============================================

/**
 * Fetch sessions for groups owned by a specific user
 * Used for interventionists and teachers on the dashboard
 */
export async function fetchSessionsByGroupOwner(ownerId: string): Promise<Session[]> {
  // First get the group IDs owned by this user
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id')
    .eq('owner_id', ownerId);

  if (groupsError) throw new Error(groupsError.message);

  if (!groups || groups.length === 0) {
    return [];
  }

  const groupIds = groups.map(g => g.id);

  // Then fetch sessions for those groups
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .in('group_id', groupIds)
    .order('date', { ascending: false });

  if (sessionsError) throw new Error(sessionsError.message);
  return (sessions || []) as Session[];
}

/**
 * Fetch sessions based on user role
 * - Admin: All sessions
 * - Interventionist/Teacher: Sessions from groups they own
 */
export async function fetchSessionsByRole(
  role: 'admin' | 'interventionist' | 'teacher',
  userId: string
): Promise<Session[]> {
  if (role === 'admin') {
    return fetchAllSessions();
  }

  // Non-admins only see sessions from their own groups
  return fetchSessionsByGroupOwner(userId);
}

// ============================================
// SESSION ATTENDANCE
// ============================================

import type {
  SessionAttendance,
  SessionAttendanceInsert,
  SessionAttendanceUpdate,
  SchoolCalendarEvent,
  SchoolCalendarEventInsert,
  SchoolCalendarEventUpdate,
  InterventionCycle,
  InterventionCycleInsert,
  InterventionCycleUpdate,
} from './types';

/**
 * Fetch attendance records for a session
 */
export async function fetchAttendanceBySessionId(sessionId: string): Promise<SessionAttendance[]> {
  const { data, error } = await supabase
    .from('session_attendance')
    .select('*')
    .eq('session_id', sessionId)
    .order('marked_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as SessionAttendance[];
}

/**
 * Fetch attendance records for a student
 */
export async function fetchAttendanceByStudentId(studentId: string): Promise<SessionAttendance[]> {
  const { data, error } = await supabase
    .from('session_attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('marked_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as SessionAttendance[];
}

/**
 * Create or update attendance for a student in a session
 */
export async function upsertAttendance(attendance: SessionAttendanceInsert): Promise<SessionAttendance> {
  const { data, error } = await supabase
    .from('session_attendance')
    .upsert(attendance, {
      onConflict: 'session_id,student_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SessionAttendance;
}

/**
 * Bulk create/update attendance for all students in a session
 */
export async function bulkUpsertAttendance(attendances: SessionAttendanceInsert[]): Promise<SessionAttendance[]> {
  const { data, error } = await supabase
    .from('session_attendance')
    .upsert(attendances, {
      onConflict: 'session_id,student_id',
      ignoreDuplicates: false,
    })
    .select();

  if (error) throw new Error(error.message);
  return (data || []) as SessionAttendance[];
}

/**
 * Delete attendance record
 */
export async function deleteAttendance(id: string): Promise<void> {
  const { error } = await supabase
    .from('session_attendance')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Get attendance statistics for a student
 */
export async function getStudentAttendanceStats(studentId: string): Promise<{
  total: number;
  present: number;
  absent: number;
  tardy: number;
  excused: number;
  attendanceRate: number;
}> {
  const records = await fetchAttendanceByStudentId(studentId);

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    tardy: records.filter(r => r.status === 'tardy').length,
    excused: records.filter(r => r.status === 'excused').length,
    attendanceRate: 0,
  };

  // Calculate attendance rate (present + tardy counts as attended)
  const attended = stats.present + stats.tardy;
  stats.attendanceRate = stats.total > 0 ? Math.round((attended / stats.total) * 100) : 0;

  return stats;
}

// ============================================
// SCHOOL CALENDAR
// ============================================

/**
 * Fetch all school calendar events
 */
export async function fetchAllCalendarEvents(): Promise<SchoolCalendarEvent[]> {
  const { data, error } = await supabase
    .from('school_calendar')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as SchoolCalendarEvent[];
}

/**
 * Fetch calendar events for a date range
 */
export async function fetchCalendarEventsInRange(
  startDate: string,
  endDate: string
): Promise<SchoolCalendarEvent[]> {
  const { data, error } = await supabase
    .from('school_calendar')
    .select('*')
    .or(`date.gte.${startDate},end_date.gte.${startDate}`)
    .or(`date.lte.${endDate},end_date.lte.${endDate}`)
    .order('date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as SchoolCalendarEvent[];
}

/**
 * Check if a specific date is a non-student day
 */
export async function isNonStudentDay(
  checkDate: string,
  gradeLevel?: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('school_calendar')
    .select('id')
    .or(`and(date.eq.${checkDate}),and(date.lte.${checkDate},end_date.gte.${checkDate})`)
    .limit(1);

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) return false;

  // If grade level is specified, check if it affects that grade
  if (gradeLevel !== undefined) {
    const { data: gradeData, error: gradeError } = await supabase
      .from('school_calendar')
      .select('affects_grades')
      .or(`and(date.eq.${checkDate}),and(date.lte.${checkDate},end_date.gte.${checkDate})`)
      .limit(1)
      .single();

    if (gradeError) return true; // Assume non-student day if error
    if (!gradeData?.affects_grades) return true; // null = affects all grades
    return gradeData.affects_grades.includes(gradeLevel);
  }

  return true;
}

/**
 * Get all non-student days in a date range
 */
export async function getNonStudentDaysInRange(
  startDate: string,
  endDate: string,
  gradeLevel?: number
): Promise<string[]> {
  const events = await fetchCalendarEventsInRange(startDate, endDate);
  const nonStudentDays: Set<string> = new Set();

  for (const event of events) {
    // Check grade level filter
    if (gradeLevel !== undefined && event.affects_grades) {
      if (!event.affects_grades.includes(gradeLevel)) continue;
    }

    // Add all dates in the event range
    const eventStart = new Date(event.date);
    const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;

    const current = new Date(eventStart);
    while (current <= eventEnd) {
      const dateStr = current.toISOString().split('T')[0];
      if (dateStr >= startDate && dateStr <= endDate) {
        nonStudentDays.add(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
  }

  return Array.from(nonStudentDays).sort();
}

/**
 * Create a school calendar event
 */
export async function createCalendarEvent(event: SchoolCalendarEventInsert): Promise<SchoolCalendarEvent> {
  const { data, error } = await supabase
    .from('school_calendar')
    .insert(event)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SchoolCalendarEvent;
}

/**
 * Update a school calendar event
 */
export async function updateCalendarEvent(
  id: string,
  updates: SchoolCalendarEventUpdate
): Promise<SchoolCalendarEvent> {
  const { data, error } = await supabase
    .from('school_calendar')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SchoolCalendarEvent;
}

/**
 * Delete a school calendar event
 */
export async function deleteCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('school_calendar')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================
// INTERVENTION CYCLES
// ============================================

/**
 * Fetch all intervention cycles
 */
export async function fetchAllCycles(): Promise<InterventionCycle[]> {
  const { data, error } = await supabase
    .from('intervention_cycles')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as InterventionCycle[];
}

/**
 * Fetch active intervention cycles
 */
export async function fetchActiveCycles(): Promise<InterventionCycle[]> {
  const { data, error } = await supabase
    .from('intervention_cycles')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as InterventionCycle[];
}

/**
 * Fetch cycle by ID
 */
export async function fetchCycleById(id: string): Promise<InterventionCycle | null> {
  const { data, error } = await supabase
    .from('intervention_cycles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as InterventionCycle;
}

/**
 * Get the current active cycle (first active one)
 */
export async function getCurrentCycle(): Promise<InterventionCycle | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('intervention_cycles')
    .select('*')
    .eq('status', 'active')
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_date', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as InterventionCycle;
}

/**
 * Create an intervention cycle
 */
export async function createCycle(cycle: InterventionCycleInsert): Promise<InterventionCycle> {
  const { data, error } = await supabase
    .from('intervention_cycles')
    .insert(cycle)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InterventionCycle;
}

/**
 * Update an intervention cycle
 */
export async function updateCycle(
  id: string,
  updates: InterventionCycleUpdate
): Promise<InterventionCycle> {
  const { data, error } = await supabase
    .from('intervention_cycles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as InterventionCycle;
}

/**
 * Delete an intervention cycle
 */
export async function deleteCycle(id: string): Promise<void> {
  const { error } = await supabase
    .from('intervention_cycles')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Generate session dates for a cycle (excluding non-student days)
 */
export async function generateCycleSessionDates(
  cycleId: string,
  days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday')[],
  gradeLevel?: number
): Promise<{ day: string; date: string }[]> {
  const cycle = await fetchCycleById(cycleId);
  if (!cycle) throw new Error('Cycle not found');

  const nonStudentDays = await getNonStudentDaysInRange(
    cycle.start_date,
    cycle.end_date,
    gradeLevel
  );
  const nonStudentSet = new Set(nonStudentDays);

  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const sessionDates: { day: string; date: string }[] = [];
  const start = new Date(cycle.start_date);
  const end = new Date(cycle.end_date);

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dayName = Object.keys(dayMap).find(k => dayMap[k] === dayOfWeek) as string;
    const dateStr = current.toISOString().split('T')[0];

    if (days.includes(dayName as any) && !nonStudentSet.has(dateStr)) {
      sessionDates.push({ day: dayName, date: dateStr });
    }

    current.setDate(current.getDate() + 1);
  }

  return sessionDates;
}

/**
 * Generate planned sessions for a group based on its schedule
 *
 * This function creates planned sessions for the entire cycle (or custom date range)
 * based on the group's per-day schedule. It respects non-student days and
 * doesn't create duplicate sessions.
 *
 * @param groupId - The group ID to generate sessions for
 * @param schedule - The enhanced group schedule with cycle and day times
 * @param group - The group data for curriculum position
 * @returns Array of created sessions
 */
export async function generateSessionsFromSchedule(
  groupId: string,
  schedule: {
    cycle_id?: string | null;
    custom_start_date?: string | null;
    custom_end_date?: string | null;
    day_times: { day: string; time: string; enabled: boolean }[];
    duration: number;
  },
  group: { current_position: any; grade: number }
): Promise<Session[]> {
  // Get enabled days
  const enabledDays = schedule.day_times
    .filter(dt => dt.enabled && dt.time)
    .map(dt => ({ day: dt.day, time: dt.time }));

  if (enabledDays.length === 0) {
    return [];
  }

  // Determine date range
  let startDate: string;
  let endDate: string;

  if (schedule.custom_start_date && schedule.custom_end_date) {
    startDate = schedule.custom_start_date;
    endDate = schedule.custom_end_date;
  } else if (schedule.cycle_id) {
    const cycle = await fetchCycleById(schedule.cycle_id);
    if (!cycle) {
      throw new Error('Cycle not found');
    }
    startDate = schedule.custom_start_date || cycle.start_date;
    endDate = schedule.custom_end_date || cycle.end_date;
  } else {
    // No cycle selected, don't generate sessions
    return [];
  }

  // Get non-student days
  const nonStudentDays = await getNonStudentDaysInRange(startDate, endDate, group.grade);
  const nonStudentSet = new Set(nonStudentDays);

  // Get existing sessions for this group to avoid duplicates
  const existingSessions = await fetchSessionsByGroupId(groupId);
  const existingDates = new Set(existingSessions.filter(s => s.status === 'planned').map(s => s.date));

  // Generate session dates
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const sessionsToCreate: SessionInsert[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dayName = Object.keys(dayMap).find(k => dayMap[k] === dayOfWeek);
    const dateStr = current.toISOString().split('T')[0];

    // Only create future sessions
    if (current >= today) {
      // Find if this day is enabled
      const dayConfig = enabledDays.find(d => d.day === dayName);

      if (dayConfig && !nonStudentSet.has(dateStr) && !existingDates.has(dateStr)) {
        sessionsToCreate.push({
          group_id: groupId,
          date: dateStr,
          time: dayConfig.time,
          status: 'planned',
          curriculum_position: group.current_position,
          advance_after: false,
          notes: null,
          planned_otr_target: null,
          planned_response_formats: null,
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
          next_session_notes: null,
          fidelity_checklist: null,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  // Batch insert sessions
  if (sessionsToCreate.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionsToCreate)
    .select();

  if (error) throw new Error(error.message);
  return (data || []) as Session[];
}

/**
 * Remove future planned sessions for a group
 *
 * Used when regenerating sessions after schedule change.
 * Only removes sessions with status 'planned' that are in the future.
 */
export async function removeFuturePlannedSessions(groupId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('sessions')
    .delete()
    .eq('group_id', groupId)
    .eq('status', 'planned')
    .gte('date', today)
    .select('id');

  if (error) throw new Error(error.message);
  return data?.length || 0;
}

/**
 * Regenerate sessions for a group based on its schedule
 *
 * This removes existing future planned sessions and creates new ones
 * based on the updated schedule.
 */
export async function regenerateGroupSessions(
  groupId: string,
  schedule: {
    cycle_id?: string | null;
    custom_start_date?: string | null;
    custom_end_date?: string | null;
    day_times: { day: string; time: string; enabled: boolean }[];
    duration: number;
  },
  group: { current_position: any; grade: number }
): Promise<{ removed: number; created: Session[] }> {
  // Remove future planned sessions
  const removed = await removeFuturePlannedSessions(groupId);

  // Generate new sessions
  const created = await generateSessionsFromSchedule(groupId, schedule, group);

  return { removed, created };
}

// ============================================
// MATERIAL CATALOG
// ============================================

export async function fetchMaterialCatalog(): Promise<MaterialCatalog[]> {
  const { data, error } = await supabase
    .from('material_catalog')
    .select('*')
    .order('curriculum')
    .order('category')
    .order('sort_order');

  if (error) throw new Error(error.message);
  return (data || []) as MaterialCatalog[];
}

export async function fetchMaterialCatalogByCurriculum(curriculum: string): Promise<MaterialCatalog[]> {
  const { data, error } = await supabase
    .from('material_catalog')
    .select('*')
    .eq('curriculum', curriculum)
    .order('category')
    .order('sort_order');

  if (error) throw new Error(error.message);
  return (data || []) as MaterialCatalog[];
}

export async function fetchMaterialById(id: string): Promise<MaterialCatalog | null> {
  const { data, error } = await supabase
    .from('material_catalog')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data as MaterialCatalog;
}

// ============================================
// GROUP MATERIALS
// ============================================

export async function fetchGroupMaterials(groupId: string): Promise<GroupMaterialWithCatalog[]> {
  const { data, error } = await supabase
    .from('group_materials')
    .select(`
      *,
      material:material_catalog(*)
    `)
    .eq('group_id', groupId)
    .order('created_at');

  if (error) throw new Error(error.message);
  return (data || []) as GroupMaterialWithCatalog[];
}

export async function fetchGroupMaterialsSummary(groupId: string): Promise<{
  total: number;
  collected: number;
  percent: number;
}> {
  const materials = await fetchGroupMaterials(groupId);
  const total = materials.length;
  const collected = materials.filter(m => m.is_collected).length;
  const percent = total > 0 ? Math.round((collected / total) * 100) : 0;
  return { total, collected, percent };
}

export async function createGroupMaterial(material: GroupMaterialInsert): Promise<GroupMaterial> {
  const { data, error } = await supabase
    .from('group_materials')
    .insert(material)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as GroupMaterial;
}

export async function updateGroupMaterial(
  id: string,
  updates: GroupMaterialUpdate
): Promise<GroupMaterial> {
  const updateData: any = { ...updates, updated_at: new Date().toISOString() };

  // If marking as collected, set collected_at
  if (updates.is_collected === true && !updates.collected_at) {
    updateData.collected_at = new Date().toISOString();
  } else if (updates.is_collected === false) {
    updateData.collected_at = null;
  }

  const { data, error } = await supabase
    .from('group_materials')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as GroupMaterial;
}

export async function toggleGroupMaterialCollected(
  id: string,
  isCollected: boolean,
  userId?: string
): Promise<GroupMaterial> {
  const updateData: any = {
    is_collected: isCollected,
    updated_at: new Date().toISOString(),
  };

  if (isCollected) {
    updateData.collected_at = new Date().toISOString();
    if (userId) updateData.collected_by = userId;
  } else {
    updateData.collected_at = null;
    updateData.collected_by = null;
  }

  const { data, error } = await supabase
    .from('group_materials')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as GroupMaterial;
}

export async function deleteGroupMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from('group_materials')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Initialize materials for a group based on its curriculum
 * Adds all base materials (no position-specific ones) from the catalog
 */
export async function initializeGroupMaterials(
  groupId: string,
  curriculum: Curriculum
): Promise<GroupMaterial[]> {
  // Get all materials for this curriculum that apply to all positions
  const { data: catalogMaterials, error: catalogError } = await supabase
    .from('material_catalog')
    .select('id')
    .eq('curriculum', curriculum)
    .is('applicable_positions', null)
    .eq('is_essential', true);

  if (catalogError) throw new Error(catalogError.message);
  if (!catalogMaterials || catalogMaterials.length === 0) return [];

  // Check which materials already exist for this group
  const { data: existingMaterials, error: existingError } = await supabase
    .from('group_materials')
    .select('material_id')
    .eq('group_id', groupId);

  if (existingError) throw new Error(existingError.message);

  const existingMaterialIds = new Set(existingMaterials?.map(m => m.material_id) || []);

  // Create materials that don't already exist
  const newMaterials = catalogMaterials
    .filter(m => !existingMaterialIds.has(m.id))
    .map(m => ({
      group_id: groupId,
      material_id: m.id,
      is_collected: false,
      is_custom: false,
    }));

  if (newMaterials.length === 0) return [];

  const { data, error } = await supabase
    .from('group_materials')
    .insert(newMaterials)
    .select();

  if (error) throw new Error(error.message);
  return (data || []) as GroupMaterial[];
}

/**
 * Add a custom material to a group (not from catalog)
 */
export async function addCustomGroupMaterial(
  groupId: string,
  customMaterial: {
    name: string;
    description?: string;
    category: string;
  }
): Promise<GroupMaterial> {
  const { data, error } = await supabase
    .from('group_materials')
    .insert({
      group_id: groupId,
      material_id: null,
      is_collected: false,
      is_custom: true,
      custom_name: customMaterial.name,
      custom_description: customMaterial.description || null,
      custom_category: customMaterial.category,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as GroupMaterial;
}

// ============================================
// SESSION MATERIAL CHECKLISTS
// ============================================

export async function fetchSessionMaterials(sessionId: string): Promise<SessionMaterialWithCatalog[]> {
  const { data, error } = await supabase
    .from('session_material_checklists')
    .select(`
      *,
      material:material_catalog(*)
    `)
    .eq('session_id', sessionId)
    .order('created_at');

  if (error) throw new Error(error.message);
  return (data || []) as SessionMaterialWithCatalog[];
}

export async function fetchWeeklySessionMaterials(): Promise<SessionMaterialWithCatalog[]> {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('session_material_checklists')
    .select(`
      *,
      material:material_catalog(*),
      session:sessions!inner(id, date, time, status, group:groups!inner(id, name, curriculum))
    `)
    .gte('session.date', today)
    .lt('session.date', nextWeek)
    .eq('session.status', 'planned')
    .order('session(date)')
    .order('session(time)');

  if (error) throw new Error(error.message);
  return (data || []) as any[];
}

export async function createSessionMaterial(
  material: SessionMaterialChecklistInsert
): Promise<SessionMaterialChecklist> {
  const { data, error } = await supabase
    .from('session_material_checklists')
    .insert(material)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SessionMaterialChecklist;
}

export async function updateSessionMaterial(
  id: string,
  updates: SessionMaterialChecklistUpdate
): Promise<SessionMaterialChecklist> {
  const updateData: any = { ...updates };

  // If marking as prepared, set prepared_at
  if (updates.is_prepared === true && !updates.prepared_at) {
    updateData.prepared_at = new Date().toISOString();
  } else if (updates.is_prepared === false) {
    updateData.prepared_at = null;
  }

  const { data, error } = await supabase
    .from('session_material_checklists')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SessionMaterialChecklist;
}

export async function toggleSessionMaterialPrepared(
  id: string,
  isPrepared: boolean,
  userId?: string
): Promise<SessionMaterialChecklist> {
  const updateData: any = { is_prepared: isPrepared };

  if (isPrepared) {
    updateData.prepared_at = new Date().toISOString();
    if (userId) updateData.prepared_by = userId;
  } else {
    updateData.prepared_at = null;
    updateData.prepared_by = null;
  }

  const { data, error } = await supabase
    .from('session_material_checklists')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SessionMaterialChecklist;
}

export async function deleteSessionMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from('session_material_checklists')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Generate session materials based on curriculum position
 * Uses the database function get_materials_for_position
 */
export async function generateSessionMaterials(
  sessionId: string,
  curriculum: string,
  position: any
): Promise<SessionMaterialChecklist[]> {
  // First, delete existing auto-generated materials
  await supabase
    .from('session_material_checklists')
    .delete()
    .eq('session_id', sessionId)
    .eq('is_auto_generated', true);

  // Call the database function to get materials for this position
  const { data: materials, error: fnError } = await supabase
    .rpc('get_materials_for_position', {
      p_curriculum: curriculum,
      p_position: position,
    });

  if (fnError) throw new Error(fnError.message);
  if (!materials || materials.length === 0) return [];

  // Insert the materials
  const checklistItems = materials.map((m: any) => ({
    session_id: sessionId,
    material_id: m.material_id,
    specific_item: m.specific_item,
    quantity_needed: m.quantity_hint,
    is_prepared: false,
    is_auto_generated: true,
  }));

  const { data, error } = await supabase
    .from('session_material_checklists')
    .insert(checklistItems)
    .select();

  if (error) throw new Error(error.message);
  return (data || []) as SessionMaterialChecklist[];
}

/**
 * Bulk toggle prepared status for session materials
 */
export async function bulkToggleSessionMaterialsPrepared(
  sessionId: string,
  isPrepared: boolean,
  userId?: string
): Promise<number> {
  const updateData: any = { is_prepared: isPrepared };

  if (isPrepared) {
    updateData.prepared_at = new Date().toISOString();
    if (userId) updateData.prepared_by = userId;
  } else {
    updateData.prepared_at = null;
    updateData.prepared_by = null;
  }

  const { data, error } = await supabase
    .from('session_material_checklists')
    .update(updateData)
    .eq('session_id', sessionId)
    .select('id');

  if (error) throw new Error(error.message);
  return data?.length || 0;
}
