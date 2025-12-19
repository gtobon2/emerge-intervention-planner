/**
 * EMERGE Intervention Planner - Backup & Restore
 * Utilities for exporting and importing database data
 */

import { db } from './index';
import type {
  LocalGroup,
  LocalStudent,
  LocalSession,
  LocalProgressMonitoring,
  LocalErrorBankEntry,
} from './index';

// ============================================
// TYPES
// ============================================

export interface DatabaseBackup {
  version: number;
  timestamp: string;
  appVersion?: string;
  data: {
    groups: LocalGroup[];
    students: LocalStudent[];
    sessions: LocalSession[];
    progressMonitoring: LocalProgressMonitoring[];
    errorBank: LocalErrorBankEntry[];
  };
  stats: {
    groups: number;
    students: number;
    sessions: number;
    progressMonitoring: number;
    errorBank: number;
    total: number;
  };
}

export interface ImportResult {
  success: boolean;
  stats: {
    groups: number;
    students: number;
    sessions: number;
    progressMonitoring: number;
    errorBank: number;
    total: number;
  };
  errors: string[];
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export entire database to JSON object
 */
export async function exportAllData(): Promise<DatabaseBackup> {
  const [groups, students, sessions, progressMonitoring, errorBank] = await Promise.all([
    db.groups.toArray(),
    db.students.toArray(),
    db.sessions.toArray(),
    db.progressMonitoring.toArray(),
    db.errorBank.toArray(),
  ]);

  const backup: DatabaseBackup = {
    version: 1,
    timestamp: new Date().toISOString(),
    appVersion: '1.0.0',
    data: {
      groups,
      students,
      sessions,
      progressMonitoring,
      errorBank,
    },
    stats: {
      groups: groups.length,
      students: students.length,
      sessions: sessions.length,
      progressMonitoring: progressMonitoring.length,
      errorBank: errorBank.length,
      total: groups.length + students.length + sessions.length + progressMonitoring.length + errorBank.length,
    },
  };

  return backup;
}

/**
 * Export database and download as JSON file
 */
export async function exportToFile(filename?: string): Promise<void> {
  const backup = await exportAllData();

  const defaultFilename = `emerge-backup-${new Date().toISOString().split('T')[0]}.json`;
  const finalFilename = filename || defaultFilename;

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Export specific date range
 */
export async function exportDateRange(startDate: string, endDate: string): Promise<DatabaseBackup> {
  const [groups, students, sessions, progressMonitoring, errorBank] = await Promise.all([
    db.groups.toArray(),
    db.students.toArray(),
    db.sessions.where('date').between(startDate, endDate, true, true).toArray(),
    db.progressMonitoring.where('date').between(startDate, endDate, true, true).toArray(),
    db.errorBank.toArray(),
  ]);

  const backup: DatabaseBackup = {
    version: 1,
    timestamp: new Date().toISOString(),
    appVersion: '1.0.0',
    data: {
      groups,
      students,
      sessions,
      progressMonitoring,
      errorBank,
    },
    stats: {
      groups: groups.length,
      students: students.length,
      sessions: sessions.length,
      progressMonitoring: progressMonitoring.length,
      errorBank: errorBank.length,
      total: groups.length + students.length + sessions.length + progressMonitoring.length + errorBank.length,
    },
  };

  return backup;
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

/**
 * Import data from JSON backup
 * @param backup - The backup object to import
 * @param options - Import options
 */
export async function importData(
  backup: DatabaseBackup,
  options: {
    clearExisting?: boolean;
    skipDuplicates?: boolean;
    remapIds?: boolean;
  } = {}
): Promise<ImportResult> {
  const { clearExisting = false, skipDuplicates = true, remapIds = true } = options;

  const result: ImportResult = {
    success: false,
    stats: {
      groups: 0,
      students: 0,
      sessions: 0,
      progressMonitoring: 0,
      errorBank: 0,
      total: 0,
    },
    errors: [],
  };

  try {
    await db.transaction(
      'rw',
      [db.groups, db.students, db.sessions, db.progressMonitoring, db.errorBank],
      async () => {
        // Clear existing data if requested
        if (clearExisting) {
          await db.groups.clear();
          await db.students.clear();
          await db.sessions.clear();
          await db.progressMonitoring.clear();
          await db.errorBank.clear();
        }

        // Track ID mappings for foreign key updates
        const groupIdMap = new Map<number, number>();
        const studentIdMap = new Map<number, number>();

        // Import groups
        for (const group of backup.data.groups) {
          try {
            const oldId = group.id;
            const groupData = remapIds ? { ...group, id: undefined } : group;

            const newId = await db.groups.add(groupData);
            if (oldId !== undefined) {
              groupIdMap.set(oldId, newId);
            }
            result.stats.groups++;
          } catch (error) {
            if (!skipDuplicates) {
              result.errors.push(`Failed to import group: ${error}`);
            }
          }
        }

        // Import students (with remapped group_ids)
        for (const student of backup.data.students) {
          try {
            const oldId = student.id;
            const oldGroupId = student.group_id;
            const newGroupId = groupIdMap.get(oldGroupId) ?? oldGroupId;

            const studentData = remapIds
              ? { ...student, id: undefined, group_id: newGroupId }
              : { ...student, group_id: newGroupId };

            const newId = await db.students.add(studentData);
            if (oldId !== undefined) {
              studentIdMap.set(oldId, newId);
            }
            result.stats.students++;
          } catch (error) {
            if (!skipDuplicates) {
              result.errors.push(`Failed to import student: ${error}`);
            }
          }
        }

        // Import sessions (with remapped group_ids)
        for (const session of backup.data.sessions) {
          try {
            const oldGroupId = session.group_id;
            const newGroupId = groupIdMap.get(oldGroupId) ?? oldGroupId;

            const sessionData = remapIds
              ? { ...session, id: undefined, group_id: newGroupId }
              : { ...session, group_id: newGroupId };

            await db.sessions.add(sessionData);
            result.stats.sessions++;
          } catch (error) {
            if (!skipDuplicates) {
              result.errors.push(`Failed to import session: ${error}`);
            }
          }
        }

        // Import progress monitoring (with remapped student_ids and group_ids)
        for (const pm of backup.data.progressMonitoring) {
          try {
            const oldGroupId = pm.group_id;
            const oldStudentId = pm.student_id;

            const newGroupId = groupIdMap.get(oldGroupId) ?? oldGroupId;
            const newStudentId = oldStudentId !== null ? (studentIdMap.get(oldStudentId) ?? oldStudentId) : null;

            const pmData = remapIds
              ? { ...pm, id: undefined, group_id: newGroupId, student_id: newStudentId }
              : { ...pm, group_id: newGroupId, student_id: newStudentId };

            await db.progressMonitoring.add(pmData);
            result.stats.progressMonitoring++;
          } catch (error) {
            if (!skipDuplicates) {
              result.errors.push(`Failed to import progress monitoring: ${error}`);
            }
          }
        }

        // Import error bank entries
        for (const error of backup.data.errorBank) {
          try {
            const errorData = remapIds ? { ...error, id: undefined } : error;

            await db.errorBank.add(errorData);
            result.stats.errorBank++;
          } catch (err) {
            if (!skipDuplicates) {
              result.errors.push(`Failed to import error bank entry: ${err}`);
            }
          }
        }

        result.stats.total =
          result.stats.groups +
          result.stats.students +
          result.stats.sessions +
          result.stats.progressMonitoring +
          result.stats.errorBank;

        result.success = true;
      }
    );
  } catch (error) {
    result.errors.push(`Transaction failed: ${error}`);
    result.success = false;
  }

  return result;
}

/**
 * Import data from a JSON file
 */
export async function importFromFile(
  file: File,
  options?: {
    clearExisting?: boolean;
    skipDuplicates?: boolean;
    remapIds?: boolean;
  }
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const backup = JSON.parse(json) as DatabaseBackup;

        // Validate backup structure
        if (!backup.version || !backup.data) {
          reject(new Error('Invalid backup file format'));
          return;
        }

        const result = await importData(backup, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate a backup file
 */
export function validateBackup(backup: unknown): backup is DatabaseBackup {
  if (typeof backup !== 'object' || backup === null) {
    return false;
  }

  const b = backup as Partial<DatabaseBackup>;

  return (
    typeof b.version === 'number' &&
    typeof b.timestamp === 'string' &&
    typeof b.data === 'object' &&
    b.data !== null &&
    Array.isArray((b.data as DatabaseBackup['data']).groups) &&
    Array.isArray((b.data as DatabaseBackup['data']).students) &&
    Array.isArray((b.data as DatabaseBackup['data']).sessions) &&
    Array.isArray((b.data as DatabaseBackup['data']).progressMonitoring) &&
    Array.isArray((b.data as DatabaseBackup['data']).errorBank)
  );
}

// ============================================
// CLEAR FUNCTIONS
// ============================================

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.groups, db.students, db.sessions, db.progressMonitoring, db.errorBank], async () => {
    await db.groups.clear();
    await db.students.clear();
    await db.sessions.clear();
    await db.progressMonitoring.clear();
    await db.errorBank.clear();
  });
}

/**
 * Clear data with confirmation prompt
 */
export async function clearAllDataWithConfirmation(): Promise<boolean> {
  const confirmed = window.confirm(
    'Are you sure you want to clear all data? This action cannot be undone.\n\n' +
      'Consider exporting a backup first.'
  );

  if (confirmed) {
    const doubleConfirm = window.confirm(
      'This will permanently delete all groups, students, sessions, and progress data.\n\n' +
        'Are you absolutely sure?'
    );

    if (doubleConfirm) {
      await clearAllData();
      return true;
    }
  }

  return false;
}

/**
 * Clear only sessions (keep groups and students)
 */
export async function clearSessions(): Promise<void> {
  await db.sessions.clear();
}

/**
 * Clear only progress monitoring data
 */
export async function clearProgressMonitoring(): Promise<void> {
  await db.progressMonitoring.clear();
}

/**
 * Clear sessions older than a specific date
 */
export async function clearSessionsBeforeDate(date: string): Promise<number> {
  return await db.sessions.where('date').below(date).delete();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get database size estimate (in bytes)
 */
export async function getDatabaseSize(): Promise<number> {
  const backup = await exportAllData();
  const json = JSON.stringify(backup);
  return new Blob([json]).size;
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const [groups, students, sessions, progressMonitoring, errorBank] = await Promise.all([
    db.groups.count(),
    db.students.count(),
    db.sessions.count(),
    db.progressMonitoring.count(),
    db.errorBank.count(),
  ]);

  return {
    groups,
    students,
    sessions,
    progressMonitoring,
    errorBank,
    total: groups + students + sessions + progressMonitoring + errorBank,
  };
}

/**
 * Create a backup with metadata
 */
export async function createBackupWithMetadata(metadata?: Record<string, unknown>): Promise<DatabaseBackup> {
  const backup = await exportAllData();

  return {
    ...backup,
    ...metadata,
  };
}
