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

// ============================================
// STUDENT SESSION TRACKING HOOKS
// ============================================

/**
 * Get per-student tracking data for a session
 *
 * Returns array of tracking records for each student in the session
 */
export function useLocalStudentSessionTracking(sessionId: number | undefined) {
  const data = useLiveQuery(
    async () => {
      if (sessionId === undefined) return [];
      return await db.studentSessionTracking
        .where('session_id')
        .equals(sessionId)
        .toArray();
    },
    [sessionId]
  );

  return {
    tracking: data ?? [],
    isLoading: sessionId !== undefined && data === undefined,
  };
}

/**
 * Get historical session tracking for a student across all sessions
 *
 * Useful for viewing a student's OTR and error history over time
 */
export function useLocalStudentTrackingHistory(studentId: number | undefined) {
  const data = useLiveQuery(
    async () => {
      if (studentId === undefined) return [];

      // Get all tracking records for this student
      const trackingRecords = await db.studentSessionTracking
        .where('student_id')
        .equals(studentId)
        .toArray();

      // Fetch session dates for each record
      const recordsWithDates = await Promise.all(
        trackingRecords.map(async (record) => {
          const session = await db.sessions.get(record.session_id);
          return {
            ...record,
            session_date: session?.date || '',
          };
        })
      );

      // Sort by session date descending
      return recordsWithDates.sort((a, b) => b.session_date.localeCompare(a.session_date));
    },
    [studentId]
  );

  return {
    history: data ?? [],
    isLoading: studentId !== undefined && data === undefined,
  };
}

/**
 * Save per-student tracking data for a session
 *
 * This is a bulk operation that saves tracking data for multiple students.
 * If records already exist for the session, they will be replaced.
 *
 * @param sessionId - The session ID
 * @param studentTracking - Array of student tracking data
 */
export async function saveStudentSessionTracking(
  sessionId: number,
  studentTracking: Array<{
    studentId: number;
    otrCount: number;
    errorsExhibited: string[];
    correctionEffectiveness: Record<string, boolean>;
    notes?: string;
  }>
): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction('rw', db.studentSessionTracking, async () => {
    // Delete any existing tracking for this session
    await db.studentSessionTracking
      .where('session_id')
      .equals(sessionId)
      .delete();

    // Insert new tracking records
    const records = studentTracking.map((tracking) => ({
      session_id: sessionId,
      student_id: tracking.studentId,
      otr_count: tracking.otrCount,
      errors_exhibited: tracking.errorsExhibited,
      correction_effectiveness: tracking.correctionEffectiveness,
      notes: tracking.notes || null,
      created_at: now,
    }));

    await db.studentSessionTracking.bulkAdd(records);
  });
}

/**
 * Get a single student's tracking for a specific session
 */
export async function getStudentTrackingForSession(
  sessionId: number,
  studentId: number
): Promise<LocalStudentSessionTracking | undefined> {
  return await db.studentSessionTracking
    .where('[session_id+student_id]')
    .equals([sessionId, studentId])
    .first();
}

/**
 * Calculate average OTRs per student for a group across sessions
 *
 * Useful for reports showing student engagement over time
 */
export async function getStudentOTRStats(studentId: number): Promise<{
  totalSessions: number;
  totalOTRs: number;
  averageOTRs: number;
  recentTrend: 'improving' | 'stable' | 'declining' | null;
}> {
  const trackingRecords = await db.studentSessionTracking
    .where('student_id')
    .equals(studentId)
    .toArray();

  if (trackingRecords.length === 0) {
    return {
      totalSessions: 0,
      totalOTRs: 0,
      averageOTRs: 0,
      recentTrend: null,
    };
  }

  const totalOTRs = trackingRecords.reduce((sum, r) => sum + r.otr_count, 0);
  const averageOTRs = totalOTRs / trackingRecords.length;

  // Calculate trend from last 3 sessions
  if (trackingRecords.length < 3) {
    return {
      totalSessions: trackingRecords.length,
      totalOTRs,
      averageOTRs: Math.round(averageOTRs),
      recentTrend: null,
    };
  }

  // Get session dates to sort properly
  const recordsWithDates = await Promise.all(
    trackingRecords.map(async (record) => {
      const session = await db.sessions.get(record.session_id);
      return { ...record, date: session?.date || '' };
    })
  );

  const sortedRecords = recordsWithDates
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  const recentOTRs = sortedRecords.map((r) => r.otr_count);
  const firstOTR = recentOTRs[recentOTRs.length - 1];
  const lastOTR = recentOTRs[0];

  const change = ((lastOTR - firstOTR) / firstOTR) * 100;
  let recentTrend: 'improving' | 'stable' | 'declining' | null;

  if (change > 10) {
    recentTrend = 'improving';
  } else if (change < -10) {
    recentTrend = 'declining';
  } else {
    recentTrend = 'stable';
  }

  return {
    totalSessions: trackingRecords.length,
    totalOTRs,
    averageOTRs: Math.round(averageOTRs),
    recentTrend,
  };
}

// Import the type for export
import type {
  LocalStudentSessionTracking,
  LocalInterventionist,
  LocalGradeLevelConstraint,
  LocalStudentConstraint,
  LocalInterventionistInsert,
  LocalInterventionistUpdate,
  LocalGradeLevelConstraintInsert,
  LocalStudentConstraintInsert,
  LocalGroupWithInterventionist,
} from './index';

// ============================================
// INTERVENTIONIST HOOKS
// ============================================

/**
 * Get all interventionists
 */
export function useLocalInterventionists() {
  const interventionists = useLiveQuery(() =>
    db.interventionists.orderBy('name').toArray()
  );

  return {
    interventionists: interventionists ?? [],
    isLoading: interventionists === undefined,
  };
}

/**
 * Get a single interventionist by ID
 */
export function useLocalInterventionist(id: number | undefined) {
  const interventionist = useLiveQuery(
    () => (id !== undefined ? db.interventionists.get(id) : undefined),
    [id]
  );

  return {
    interventionist,
    isLoading: id !== undefined && interventionist === undefined,
  };
}

/**
 * Create a new interventionist
 */
export async function createInterventionist(interventionist: LocalInterventionistInsert): Promise<number> {
  const now = new Date().toISOString();
  return await db.interventionists.add({
    ...interventionist,
    created_at: now,
    updated_at: now,
  });
}

/**
 * Update an interventionist
 */
export async function updateInterventionist(id: number, updates: LocalInterventionistUpdate): Promise<number> {
  const now = new Date().toISOString();
  return await db.interventionists.update(id, {
    ...updates,
    updated_at: now,
  });
}

/**
 * Delete an interventionist
 */
export async function deleteInterventionist(id: number): Promise<void> {
  // Also clear interventionist_id from any groups
  await db.transaction('rw', [db.interventionists, db.groups], async () => {
    // Clear references in groups
    const groups = await db.groups.where('interventionist_id').equals(id).toArray();
    for (const group of groups) {
      if (group.id) {
        await db.groups.update(group.id, { interventionist_id: undefined });
      }
    }
    // Delete the interventionist
    await db.interventionists.delete(id);
  });
}

/**
 * Get groups for an interventionist
 */
export function useLocalGroupsByInterventionist(interventionistId: number | undefined) {
  const groups = useLiveQuery(
    async () => {
      if (interventionistId === undefined) return [];
      return await db.groups.where('interventionist_id').equals(interventionistId).toArray();
    },
    [interventionistId]
  );

  return {
    groups: groups ?? [],
    isLoading: interventionistId !== undefined && groups === undefined,
  };
}

/**
 * Get all groups with their interventionist data
 */
export function useLocalGroupsWithInterventionists() {
  const data = useLiveQuery(async () => {
    const groups = await db.groups.toArray();
    const interventionists = await db.interventionists.toArray();

    return groups.map((group): LocalGroupWithInterventionist => ({
      ...group,
      interventionist: group.interventionist_id
        ? interventionists.find(i => i.id === group.interventionist_id) || null
        : null,
    }));
  });

  return {
    groups: data ?? [],
    isLoading: data === undefined,
  };
}

// ============================================
// GRADE-LEVEL CONSTRAINT HOOKS
// ============================================

/**
 * Get all grade-level constraints
 */
export function useLocalGradeLevelConstraints() {
  const constraints = useLiveQuery(() =>
    db.gradeLevelConstraints.orderBy('grade').toArray()
  );

  return {
    constraints: constraints ?? [],
    isLoading: constraints === undefined,
  };
}

/**
 * Get constraints for a specific grade
 */
export function useLocalConstraintsByGrade(grade: number | undefined) {
  const constraints = useLiveQuery(
    async () => {
      if (grade === undefined) return [];
      return await db.gradeLevelConstraints.where('grade').equals(grade).toArray();
    },
    [grade]
  );

  return {
    constraints: constraints ?? [],
    isLoading: grade !== undefined && constraints === undefined,
  };
}

/**
 * Create a new grade-level constraint
 */
export async function createGradeLevelConstraint(constraint: LocalGradeLevelConstraintInsert): Promise<number> {
  const now = new Date().toISOString();
  return await db.gradeLevelConstraints.add({
    ...constraint,
    created_at: now,
  });
}

/**
 * Update a grade-level constraint
 */
export async function updateGradeLevelConstraint(
  id: number,
  updates: Partial<LocalGradeLevelConstraintInsert>
): Promise<number> {
  return await db.gradeLevelConstraints.update(id, updates);
}

/**
 * Delete a grade-level constraint
 */
export async function deleteGradeLevelConstraint(id: number): Promise<void> {
  await db.gradeLevelConstraints.delete(id);
}

// ============================================
// STUDENT CONSTRAINT HOOKS
// ============================================

/**
 * Get all student constraints
 */
export function useLocalStudentConstraints() {
  const constraints = useLiveQuery(() =>
    db.studentConstraints.toArray()
  );

  return {
    constraints: constraints ?? [],
    isLoading: constraints === undefined,
  };
}

/**
 * Get constraints for a specific student
 */
export function useLocalConstraintsByStudent(studentId: number | undefined) {
  const constraints = useLiveQuery(
    async () => {
      if (studentId === undefined) return [];
      return await db.studentConstraints.where('student_id').equals(studentId).toArray();
    },
    [studentId]
  );

  return {
    constraints: constraints ?? [],
    isLoading: studentId !== undefined && constraints === undefined,
  };
}

/**
 * Create a new student constraint
 */
export async function createStudentConstraint(constraint: LocalStudentConstraintInsert): Promise<number> {
  const now = new Date().toISOString();
  return await db.studentConstraints.add({
    ...constraint,
    created_at: now,
  });
}

/**
 * Update a student constraint
 */
export async function updateStudentConstraint(
  id: number,
  updates: Partial<LocalStudentConstraintInsert>
): Promise<number> {
  return await db.studentConstraints.update(id, updates);
}

/**
 * Delete a student constraint
 */
export async function deleteStudentConstraint(id: number): Promise<void> {
  await db.studentConstraints.delete(id);
}

/**
 * Get all constraints that apply to a student (grade-level + individual)
 */
export async function getAllConstraintsForStudent(studentId: number): Promise<{
  gradeLevelConstraints: LocalGradeLevelConstraint[];
  individualConstraints: LocalStudentConstraint[];
}> {
  // Get the student to find their grade
  const student = await db.students.get(studentId);
  if (!student) {
    return { gradeLevelConstraints: [], individualConstraints: [] };
  }

  // Get the group to find the grade
  const group = await db.groups.get(student.group_id);
  if (!group) {
    return { gradeLevelConstraints: [], individualConstraints: [] };
  }

  // Get grade-level constraints
  const gradeLevelConstraints = await db.gradeLevelConstraints
    .where('grade')
    .equals(group.grade)
    .toArray();

  // Get individual constraints
  const individualConstraints = await db.studentConstraints
    .where('student_id')
    .equals(studentId)
    .toArray();

  return { gradeLevelConstraints, individualConstraints };
}
