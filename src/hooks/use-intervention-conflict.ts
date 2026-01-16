/**
 * Hook for checking intervention conflicts
 * Used when adding students to groups to prevent duplicate interventions
 */

import { useState, useCallback } from 'react';
import {
  checkInterventionConflict,
  checkInterventionConflictsForStudents,
} from '@/lib/supabase/student-assignments';
import type { Curriculum } from '@/lib/supabase/types';

export interface ConflictInfo {
  studentId: string;
  studentName?: string;
  conflictingGroupName: string;
  interventionistName?: string;
}

export function useInterventionConflict() {
  const [isChecking, setIsChecking] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if a single student has a conflict with a curriculum
   */
  const checkSingleStudent = useCallback(
    async (
      studentId: string,
      curriculum: Curriculum,
      excludeGroupId?: string
    ): Promise<boolean> => {
      setIsChecking(true);
      setError(null);

      try {
        const result = await checkInterventionConflict(studentId, curriculum, excludeGroupId);

        if (result.hasConflict) {
          setConflicts([
            {
              studentId,
              conflictingGroupName: result.conflictingGroupName || 'Unknown group',
              interventionistName: result.interventionistName,
            },
          ]);
          return true;
        }

        setConflicts([]);
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check conflict');
        return false;
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  /**
   * Check multiple students for conflicts with a curriculum
   * Returns a map of student IDs to their conflict info
   */
  const checkMultipleStudents = useCallback(
    async (
      studentIds: string[],
      curriculum: Curriculum,
      excludeGroupId?: string
    ): Promise<Map<string, ConflictInfo>> => {
      setIsChecking(true);
      setError(null);

      try {
        const conflictMap = await checkInterventionConflictsForStudents(
          studentIds,
          curriculum,
          excludeGroupId
        );

        const conflictInfos: ConflictInfo[] = [];
        const resultMap = new Map<string, ConflictInfo>();

        for (const [studentId, conflict] of conflictMap.entries()) {
          const info: ConflictInfo = {
            studentId,
            conflictingGroupName: conflict.conflictingGroupName,
            interventionistName: conflict.interventionistName,
          };
          conflictInfos.push(info);
          resultMap.set(studentId, info);
        }

        setConflicts(conflictInfos);
        return resultMap;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check conflicts');
        return new Map();
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  /**
   * Clear all conflicts
   */
  const clearConflicts = useCallback(() => {
    setConflicts([]);
    setError(null);
  }, []);

  /**
   * Format conflict message for display
   */
  const formatConflictMessage = useCallback((conflict: ConflictInfo): string => {
    const parts: string[] = [];

    if (conflict.studentName) {
      parts.push(conflict.studentName);
    }

    parts.push(`is already receiving this intervention in "${conflict.conflictingGroupName}"`);

    if (conflict.interventionistName) {
      parts.push(`from ${conflict.interventionistName}`);
    }

    return parts.join(' ');
  }, []);

  return {
    isChecking,
    conflicts,
    error,
    checkSingleStudent,
    checkMultipleStudents,
    clearConflicts,
    formatConflictMessage,
    hasConflicts: conflicts.length > 0,
  };
}
