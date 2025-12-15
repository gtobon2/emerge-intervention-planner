/**
 * EMERGE Intervention Planner - Local Database Hooks
 * React hooks for reactive database operations using dexie-react-hooks
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './index';
import type {
  LocalGroup,
  LocalStudent,
  LocalSession,
  LocalProgressMonitoring,
  LocalErrorBankEntry,
  LocalGroupInsert,
  LocalStudentInsert,
  LocalSessionInsert,
  LocalProgressMonitoringInsert,
  LocalErrorBankInsert,
  LocalGroupUpdate,
  LocalStudentUpdate,
  LocalSessionUpdate,
  LocalProgressMonitoringUpdate,
  LocalErrorBankUpdate,
  LocalGroupWithStudents,
  LocalSessionWithGroup,
  Curriculum,
} from './index';

// ============================================
// GROUPS HOOKS
// ============================================

/**
 * Get all groups
 */
export function useLocalGroups() {
  const groups = useLiveQuery(() => db.groups.toArray());

  return {
    groups: groups ?? [],
    isLoading: groups === undefined,
  };
}

/**
 * Get a single group by ID
 */
export function useLocalGroup(id: number | undefined) {
  const group = useLiveQuery(
    () => (id !== undefined ? db.groups.get(id) : undefined),
    [id]
  );

  return {
    group,
    isLoading: id !== undefined && group === undefined,
  };
}

/**
 * Get a group with its students
 */
export function useLocalGroupWithStudents(id: number | undefined) {
  const data = useLiveQuery(async () => {
    if (id === undefined) return undefined;

    const group = await db.groups.get(id);
    if (!group) return undefined;

    const students = await db.students.where('group_id').equals(id).toArray();

    return {
      ...group,
      students,
    } as LocalGroupWithStudents;
  }, [id]);

  return {
    group: data,
    isLoading: id !== undefined && data === undefined,
  };
}

/**
 * Create a new group
 */
export async function createGroup(group: LocalGroupInsert): Promise<number> {
  const now = new Date().toISOString();
  return await db.groups.add({
    ...group,
    created_at: now,
    updated_at: now,
  });
}

/**
 * Update a group
 */
export async function updateGroup(id: number, updates: LocalGroupUpdate): Promise<number> {
  const now = new Date().toISOString();
  return await db.groups.update(id, {
    ...updates,
    updated_at: now,
  });
}

/**
 * Delete a group (and optionally its related data)
 */
export async function deleteGroup(id: number, deleteRelated = false): Promise<void> {
  if (deleteRelated) {
    // Delete in transaction to ensure data consistency
    await db.transaction('rw', [db.groups, db.students, db.sessions, db.progressMonitoring], async () => {
      // Delete related sessions
      await db.sessions.where('group_id').equals(id).delete();

      // Delete related progress monitoring
      await db.progressMonitoring.where('group_id').equals(id).delete();

      // Delete students in this group
      await db.students.where('group_id').equals(id).delete();

      // Finally delete the group
      await db.groups.delete(id);
    });
  } else {
    await db.groups.delete(id);
  }
}

// ============================================
// STUDENTS HOOKS
// ============================================

/**
 * Get all students
 */
export function useLocalStudents() {
  const students = useLiveQuery(() => db.students.toArray());

  return {
    students: students ?? [],
    isLoading: students === undefined,
  };
}

/**
 * Get students for a specific group
 */
export function useLocalStudentsByGroup(groupId: number | undefined) {
  const students = useLiveQuery(
    () => (groupId !== undefined ? db.students.where('group_id').equals(groupId).toArray() : []),
    [groupId]
  );

  return {
    students: students ?? [],
    isLoading: groupId !== undefined && students === undefined,
  };
}

/**
 * Get a single student by ID
 */
export function useLocalStudent(id: number | undefined) {
  const student = useLiveQuery(
    () => (id !== undefined ? db.students.get(id) : undefined),
    [id]
  );

  return {
    student,
    isLoading: id !== undefined && student === undefined,
  };
}

/**
 * Create a new student
 */
export async function createStudent(student: LocalStudentInsert): Promise<number> {
  const now = new Date().toISOString();
  return await db.students.add({
    ...student,
    created_at: now,
  });
}

/**
 * Update a student
 */
export async function updateStudent(id: number, updates: LocalStudentUpdate): Promise<number> {
  return await db.students.update(id, updates);
}

/**
 * Delete a student (and optionally their progress monitoring data)
 */
export async function deleteStudent(id: number, deleteProgress = false): Promise<void> {
  if (deleteProgress) {
    await db.transaction('rw', [db.students, db.progressMonitoring], async () => {
      await db.progressMonitoring.where('student_id').equals(id).delete();
      await db.students.delete(id);
    });
  } else {
    await db.students.delete(id);
  }
}

// ============================================
// SESSIONS HOOKS
// ============================================

/**
 * Get all sessions
 */
export function useLocalSessions() {
  const sessions = useLiveQuery(() =>
    db.sessions.orderBy('date').reverse().toArray()
  );

  return {
    sessions: sessions ?? [],
    isLoading: sessions === undefined,
  };
}

/**
 * Get sessions for a specific group
 */
export function useLocalSessionsByGroup(groupId: number | undefined) {
  const sessions = useLiveQuery(
    async () => {
      if (groupId === undefined) return [];
      return await db.sessions.where('group_id').equals(groupId).sortBy('date');
    },
    [groupId]
  );

  return {
    sessions: sessions ?? [],
    isLoading: groupId !== undefined && sessions === undefined,
  };
}

/**
 * Get sessions for a specific date
 */
export function useLocalSessionsByDate(date: string) {
  const sessions = useLiveQuery(
    () => db.sessions.where('date').equals(date).toArray(),
    [date]
  );

  return {
    sessions: sessions ?? [],
    isLoading: sessions === undefined,
  };
}

/**
 * Get a single session by ID
 */
export function useLocalSession(id: number | undefined) {
  const session = useLiveQuery(
    () => (id !== undefined ? db.sessions.get(id) : undefined),
    [id]
  );

  return {
    session,
    isLoading: id !== undefined && session === undefined,
  };
}

/**
 * Get a session with its group
 */
export function useLocalSessionWithGroup(id: number | undefined) {
  const data = useLiveQuery(async () => {
    if (id === undefined) return undefined;

    const session = await db.sessions.get(id);
    if (!session) return undefined;

    const group = await db.groups.get(session.group_id);
    if (!group) return undefined;

    return {
      ...session,
      group,
    } as LocalSessionWithGroup;
  }, [id]);

  return {
    session: data,
    isLoading: id !== undefined && data === undefined,
  };
}

/**
 * Get sessions with groups for a date range
 */
export function useLocalSessionsWithGroups(startDate?: string, endDate?: string) {
  const data = useLiveQuery(async () => {
    let query = db.sessions.toCollection();

    if (startDate && endDate) {
      query = db.sessions.where('date').between(startDate, endDate, true, true);
    } else if (startDate) {
      query = db.sessions.where('date').aboveOrEqual(startDate);
    } else if (endDate) {
      query = db.sessions.where('date').belowOrEqual(endDate);
    }

    const sessions = await query.toArray();

    // Fetch groups for all sessions
    const sessionsWithGroups: LocalSessionWithGroup[] = [];
    for (const session of sessions) {
      const group = await db.groups.get(session.group_id);
      if (group) {
        sessionsWithGroups.push({ ...session, group });
      }
    }

    return sessionsWithGroups;
  }, [startDate, endDate]);

  return {
    sessions: data ?? [],
    isLoading: data === undefined,
  };
}

/**
 * Create a new session
 */
export async function createSession(session: LocalSessionInsert): Promise<number> {
  const now = new Date().toISOString();
  return await db.sessions.add({
    ...session,
    created_at: now,
    updated_at: now,
  });
}

/**
 * Update a session
 */
export async function updateSession(id: number, updates: LocalSessionUpdate): Promise<number> {
  const now = new Date().toISOString();
  return await db.sessions.update(id, {
    ...updates,
    updated_at: now,
  });
}

/**
 * Delete a session
 */
export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id);
}

// ============================================
// PROGRESS MONITORING HOOKS
// ============================================

/**
 * Get all progress monitoring data
 */
export function useLocalProgress() {
  const progress = useLiveQuery(() =>
    db.progressMonitoring.orderBy('date').reverse().toArray()
  );

  return {
    progress: progress ?? [],
    isLoading: progress === undefined,
  };
}

/**
 * Get progress monitoring for a specific student
 */
export function useLocalProgressByStudent(studentId: number | undefined) {
  const progress = useLiveQuery(
    async () => {
      if (studentId === undefined) return [];
      return await db.progressMonitoring.where('student_id').equals(studentId).sortBy('date');
    },
    [studentId]
  );

  return {
    progress: progress ?? [],
    isLoading: studentId !== undefined && progress === undefined,
  };
}

/**
 * Get progress monitoring for a specific group
 */
export function useLocalProgressByGroup(groupId: number | undefined) {
  const progress = useLiveQuery(
    async () => {
      if (groupId === undefined) return [];
      return await db.progressMonitoring.where('group_id').equals(groupId).sortBy('date');
    },
    [groupId]
  );

  return {
    progress: progress ?? [],
    isLoading: groupId !== undefined && progress === undefined,
  };
}

/**
 * Get a single progress monitoring record by ID
 */
export function useLocalProgressRecord(id: number | undefined) {
  const record = useLiveQuery(
    () => (id !== undefined ? db.progressMonitoring.get(id) : undefined),
    [id]
  );

  return {
    record,
    isLoading: id !== undefined && record === undefined,
  };
}

/**
 * Create a new progress monitoring record
 */
export async function createProgressRecord(record: LocalProgressMonitoringInsert): Promise<number> {
  const now = new Date().toISOString();
  return await db.progressMonitoring.add({
    ...record,
    created_at: now,
  });
}

/**
 * Update a progress monitoring record
 */
export async function updateProgressRecord(id: number, updates: LocalProgressMonitoringUpdate): Promise<number> {
  return await db.progressMonitoring.update(id, updates);
}

/**
 * Delete a progress monitoring record
 */
export async function deleteProgressRecord(id: number): Promise<void> {
  await db.progressMonitoring.delete(id);
}

// ============================================
// ERROR BANK HOOKS
// ============================================

/**
 * Get all error bank entries
 */
export function useLocalErrorBank() {
  const errors = useLiveQuery(() =>
    db.errorBank.orderBy('created_at').reverse().toArray()
  );

  return {
    errors: errors ?? [],
    isLoading: errors === undefined,
  };
}

/**
 * Get error bank entries for a specific curriculum
 */
export function useLocalErrorBankByCurriculum(curriculum: Curriculum | undefined) {
  const errors = useLiveQuery(
    async () => {
      if (curriculum === undefined) return [];
      return await db.errorBank.where('curriculum').equals(curriculum).toArray();
    },
    [curriculum]
  );

  return {
    errors: errors ?? [],
    isLoading: curriculum !== undefined && errors === undefined,
  };
}

/**
 * Get a single error bank entry by ID
 */
export function useLocalErrorBankEntry(id: number | undefined) {
  const entry = useLiveQuery(
    () => (id !== undefined ? db.errorBank.get(id) : undefined),
    [id]
  );

  return {
    entry,
    isLoading: id !== undefined && entry === undefined,
  };
}

/**
 * Create a new error bank entry
 */
export async function createErrorBankEntry(entry: LocalErrorBankInsert): Promise<number> {
  const now = new Date().toISOString();
  return await db.errorBank.add({
    ...entry,
    created_at: now,
  });
}

/**
 * Update an error bank entry
 */
export async function updateErrorBankEntry(id: number, updates: LocalErrorBankUpdate): Promise<number> {
  return await db.errorBank.update(id, updates);
}

/**
 * Increment occurrence count for an error
 */
export async function incrementErrorOccurrence(id: number): Promise<number> {
  const entry = await db.errorBank.get(id);
  if (!entry) throw new Error('Error bank entry not found');

  return await db.errorBank.update(id, {
    occurrence_count: entry.occurrence_count + 1,
  });
}

/**
 * Increment effectiveness count for an error
 */
export async function incrementErrorEffectiveness(id: number): Promise<number> {
  const entry = await db.errorBank.get(id);
  if (!entry) throw new Error('Error bank entry not found');

  return await db.errorBank.update(id, {
    effectiveness_count: entry.effectiveness_count + 1,
  });
}

/**
 * Delete an error bank entry
 */
export async function deleteErrorBankEntry(id: number): Promise<void> {
  await db.errorBank.delete(id);
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Get database statistics
 */
export function useLocalDatabaseStats() {
  const stats = useLiveQuery(async () => {
    const [groupCount, studentCount, sessionCount, progressCount, errorCount] = await Promise.all([
      db.groups.count(),
      db.students.count(),
      db.sessions.count(),
      db.progressMonitoring.count(),
      db.errorBank.count(),
    ]);

    return {
      groups: groupCount,
      students: studentCount,
      sessions: sessionCount,
      progressMonitoring: progressCount,
      errorBank: errorCount,
      total: groupCount + studentCount + sessionCount + progressCount + errorCount,
    };
  });

  return {
    stats,
    isLoading: stats === undefined,
  };
}

/**
 * Check if database is empty
 */
export function useIsDatabaseEmpty() {
  const isEmpty = useLiveQuery(async () => {
    const groupCount = await db.groups.count();
    return groupCount === 0;
  });

  return {
    isEmpty: isEmpty ?? true,
    isLoading: isEmpty === undefined,
  };
}
