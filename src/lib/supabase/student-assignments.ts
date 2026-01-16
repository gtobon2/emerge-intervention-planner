/**
 * Student Assignments Service
 * CRUD operations for student-to-interventionist assignments
 */

import { supabase } from './client';
import type {
  StudentAssignment,
  StudentAssignmentInsert,
  StudentWithAssignments,
  StudentGroupStatus,
  Curriculum,
} from './types';

// ============================================
// STUDENT ASSIGNMENTS
// ============================================

/**
 * Fetch all assignments for a specific student
 */
export async function fetchAssignmentsForStudent(studentId: string): Promise<StudentAssignment[]> {
  const { data, error } = await supabase
    .from('student_assignments')
    .select('*')
    .eq('student_id', studentId)
    .order('assigned_at', { ascending: false });

  if (error) {
    console.error('Error fetching student assignments:', error);
    throw error;
  }

  return (data || []) as StudentAssignment[];
}

/**
 * Fetch all assignments for a specific interventionist
 */
export async function fetchAssignmentsForInterventionist(interventionistId: string): Promise<StudentAssignment[]> {
  const { data, error } = await supabase
    .from('student_assignments')
    .select('*')
    .eq('interventionist_id', interventionistId)
    .order('assigned_at', { ascending: false });

  if (error) {
    console.error('Error fetching interventionist assignments:', error);
    throw error;
  }

  return (data || []) as StudentAssignment[];
}

/**
 * Fetch students assigned to an interventionist with full student details
 */
export async function fetchStudentsForInterventionist(interventionistId: string): Promise<StudentWithAssignments[]> {
  const { data, error } = await supabase
    .from('student_assignments')
    .select(`
      *,
      students (*)
    `)
    .eq('interventionist_id', interventionistId);

  if (error) {
    console.error('Error fetching students for interventionist:', error);
    throw error;
  }

  // Transform the data to extract students
  const studentMap = new Map<string, StudentWithAssignments>();

  for (const row of (data || [])) {
    const student = (row as any).students;
    if (!student) continue;

    if (!studentMap.has(student.id)) {
      studentMap.set(student.id, {
        ...student,
        assignments: [],
      });
    }

    const existing = studentMap.get(student.id)!;
    existing.assignments.push({
      id: row.id,
      student_id: row.student_id,
      interventionist_id: row.interventionist_id,
      assigned_by: row.assigned_by,
      assigned_at: row.assigned_at,
      created_at: row.created_at,
    });
  }

  return Array.from(studentMap.values());
}

/**
 * Fetch all students with their assignments and interventionist info
 */
export async function fetchAllStudentsWithAssignments(): Promise<StudentWithAssignments[]> {
  // First fetch all students
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .order('name');

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    throw studentsError;
  }

  // Then fetch all assignments with interventionist info
  const { data: assignments, error: assignmentsError } = await supabase
    .from('student_assignments')
    .select(`
      *,
      profiles:interventionist_id (id, full_name)
    `);

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
    throw assignmentsError;
  }

  // Build assignment map by student_id
  const assignmentsByStudent = new Map<string, { assignments: StudentAssignment[]; interventionists: { id: string; full_name: string }[] }>();

  for (const assignment of (assignments || [])) {
    const studentId = assignment.student_id;
    if (!assignmentsByStudent.has(studentId)) {
      assignmentsByStudent.set(studentId, { assignments: [], interventionists: [] });
    }

    const entry = assignmentsByStudent.get(studentId)!;
    entry.assignments.push({
      id: assignment.id,
      student_id: assignment.student_id,
      interventionist_id: assignment.interventionist_id,
      assigned_by: assignment.assigned_by,
      assigned_at: assignment.assigned_at,
      created_at: assignment.created_at,
    });

    const profile = (assignment as any).profiles;
    if (profile && !entry.interventionists.some(i => i.id === profile.id)) {
      entry.interventionists.push({
        id: profile.id,
        full_name: profile.full_name,
      });
    }
  }

  // Combine students with their assignments
  return (students || []).map(student => ({
    ...student,
    assignments: assignmentsByStudent.get(student.id)?.assignments || [],
    interventionists: assignmentsByStudent.get(student.id)?.interventionists || [],
  })) as StudentWithAssignments[];
}

/**
 * Create a new student assignment
 */
export async function createStudentAssignment(assignment: StudentAssignmentInsert): Promise<StudentAssignment> {
  const { data, error } = await supabase
    .from('student_assignments')
    .insert(assignment)
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation
    if (error.code === '23505') {
      throw new Error('This student is already assigned to this interventionist');
    }
    console.error('Error creating student assignment:', error);
    throw error;
  }

  return data as StudentAssignment;
}

/**
 * Delete a student assignment
 */
export async function deleteStudentAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('student_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    console.error('Error deleting student assignment:', error);
    throw error;
  }
}

/**
 * Delete all assignments for a student
 */
export async function deleteAllAssignmentsForStudent(studentId: string): Promise<void> {
  const { error } = await supabase
    .from('student_assignments')
    .delete()
    .eq('student_id', studentId);

  if (error) {
    console.error('Error deleting student assignments:', error);
    throw error;
  }
}

/**
 * Assign multiple students to an interventionist
 */
export async function assignStudentsToInterventionist(
  studentIds: string[],
  interventionistId: string,
  assignedBy: string | null
): Promise<StudentAssignment[]> {
  const assignments = studentIds.map(studentId => ({
    student_id: studentId,
    interventionist_id: interventionistId,
    assigned_by: assignedBy,
  }));

  const { data, error } = await supabase
    .from('student_assignments')
    .insert(assignments)
    .select();

  if (error) {
    console.error('Error assigning students:', error);
    throw error;
  }

  return (data || []) as StudentAssignment[];
}

/**
 * Remove a student's assignment from an interventionist
 */
export async function unassignStudentFromInterventionist(
  studentId: string,
  interventionistId: string
): Promise<void> {
  const { error } = await supabase
    .from('student_assignments')
    .delete()
    .eq('student_id', studentId)
    .eq('interventionist_id', interventionistId);

  if (error) {
    console.error('Error unassigning student:', error);
    throw error;
  }
}

// ============================================
// INTERVENTION CONFLICT CHECKING
// ============================================

/**
 * Check if a student is already in a group with the same intervention type
 * This prevents scheduling conflicts (same intervention twice)
 */
export async function checkInterventionConflict(
  studentId: string,
  curriculum: Curriculum,
  excludeGroupId?: string
): Promise<{
  hasConflict: boolean;
  conflictingGroupName?: string;
  interventionistName?: string;
}> {
  // Build query to check for existing group membership with same curriculum
  let query = supabase
    .from('students')
    .select(`
      id,
      group_id,
      groups!inner (
        id,
        name,
        curriculum,
        created_by,
        profiles:created_by (full_name)
      )
    `)
    .eq('id', studentId)
    .eq('groups.curriculum', curriculum);

  // Exclude the current group if provided (for editing scenarios)
  if (excludeGroupId) {
    query = query.neq('group_id', excludeGroupId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking intervention conflict:', error);
    throw error;
  }

  if (data && data.length > 0) {
    const group = (data[0] as any).groups;
    const profile = group?.profiles;
    return {
      hasConflict: true,
      conflictingGroupName: group?.name,
      interventionistName: profile?.full_name,
    };
  }

  return { hasConflict: false };
}

/**
 * Check intervention conflicts for multiple students
 */
export async function checkInterventionConflictsForStudents(
  studentIds: string[],
  curriculum: Curriculum,
  excludeGroupId?: string
): Promise<Map<string, { conflictingGroupName: string; interventionistName?: string }>> {
  const conflicts = new Map<string, { conflictingGroupName: string; interventionistName?: string }>();

  // Build query
  let query = supabase
    .from('students')
    .select(`
      id,
      group_id,
      groups!inner (
        id,
        name,
        curriculum,
        created_by,
        profiles:created_by (full_name)
      )
    `)
    .in('id', studentIds)
    .eq('groups.curriculum', curriculum);

  if (excludeGroupId) {
    query = query.neq('group_id', excludeGroupId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking intervention conflicts:', error);
    throw error;
  }

  for (const row of (data || [])) {
    const group = (row as any).groups;
    const profile = group?.profiles;
    conflicts.set(row.id, {
      conflictingGroupName: group?.name,
      interventionistName: profile?.full_name,
    });
  }

  return conflicts;
}

// ============================================
// ROLE-BASED STUDENT FILTERING
// ============================================

/**
 * Fetch students visible to a teacher (by grade level)
 */
export async function fetchStudentsForTeacher(teacherGradeLevel: string): Promise<StudentWithAssignments[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('grade_level', teacherGradeLevel)
    .order('name');

  if (error) {
    console.error('Error fetching students for teacher:', error);
    throw error;
  }

  return (data || []).map(student => ({
    ...student,
    assignments: [],
    interventionists: [],
  })) as StudentWithAssignments[];
}

/**
 * Get student group status for interventionist view
 * Shows whether a student is in another interventionist's group
 * without revealing sensitive details
 */
export async function getStudentGroupStatusForInterventionist(
  interventionistId: string
): Promise<StudentGroupStatus[]> {
  // First get students assigned to this interventionist
  const assignedStudents = await fetchStudentsForInterventionist(interventionistId);
  const assignedStudentIds = new Set(assignedStudents.map(s => s.id));

  // Then get full student list with group info
  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      name,
      grade_level,
      group_id,
      groups (
        name,
        curriculum,
        created_by
      )
    `)
    .order('name');

  if (error) {
    console.error('Error fetching student group status:', error);
    throw error;
  }

  return (data || []).map(student => {
    const group = (student as any).groups;
    const isOwnGroup = group?.created_by === interventionistId;

    return {
      student_id: student.id,
      student_name: student.name,
      grade_level: student.grade_level,
      group_id: student.group_id,
      // Only show group details if it's their own group
      current_group_name: isOwnGroup ? group?.name : (group ? 'In another group' : null),
      current_curriculum: isOwnGroup ? group?.curriculum : null,
      group_owner_id: group?.created_by || null,
      is_in_group: !!group,
    };
  }) as StudentGroupStatus[];
}
