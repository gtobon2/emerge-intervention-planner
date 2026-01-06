/**
 * Schedule Builder - Scheduling Algorithm
 *
 * Finds optimal time slots for intervention sessions based on:
 * - Interventionist availability
 * - Student constraints (grade-level and individual)
 * - Existing sessions
 */

import { db } from '@/lib/local-db';
import type {
  LocalGroup,
  LocalStudent,
  LocalSession,
  LocalInterventionist,
  LocalGradeLevelConstraint,
  LocalStudentConstraint,
} from '@/lib/local-db';
import type {
  WeekDay,
  TimeBlock,
  WeeklyTimeBlock,
  SuggestedTimeSlot,
  ScheduleConflict,
} from '@/lib/supabase/types';
import {
  generateTimeSlots,
  getBlockedTimesForDay,
  hasConflict,
  doTimesOverlap,
  scoreTimeSlot,
  WEEKDAYS,
  timeToMinutes,
} from './time-utils';

// ============================================
// TYPES
// ============================================

export interface SchedulingContext {
  group: LocalGroup;
  students: LocalStudent[];
  interventionist: LocalInterventionist | null;
  gradeLevelConstraints: LocalGradeLevelConstraint[];
  studentConstraints: LocalStudentConstraint[];
  existingSessions: LocalSession[];
}

export interface SchedulingOptions {
  sessionsPerWeek: number;
  sessionDuration: number;  // minutes
  preferredDays?: WeekDay[];
  startHour?: number;
  endHour?: number;
}

// ============================================
// CORE ALGORITHM
// ============================================

/**
 * Find available time slots for a group
 *
 * Returns a list of suggested time slots ranked by score (lower = better)
 */
export async function findAvailableSlots(
  groupId: number,
  options: SchedulingOptions
): Promise<SuggestedTimeSlot[]> {
  // Load all relevant data
  const context = await loadSchedulingContext(groupId);
  if (!context) return [];

  const {
    group,
    students,
    interventionist,
    gradeLevelConstraints,
    studentConstraints,
    existingSessions,
  } = context;

  const {
    sessionDuration,
    preferredDays = WEEKDAYS,
    startHour = 7,
    endHour = 17,
  } = options;

  const suggestions: SuggestedTimeSlot[] = [];

  // Generate all possible time slots
  const allSlots = generateTimeSlots(sessionDuration, startHour, endHour);

  // Check each day and slot
  for (const day of preferredDays) {
    // Get interventionist availability for this day
    const interventionistBlocked = interventionist
      ? getInterventionistBlockedTimes(interventionist, day)
      : [];

    // Get constraints for all students in the group
    const studentBlocked = getStudentBlockedTimes(
      students,
      group.grade,
      gradeLevelConstraints,
      studentConstraints,
      day
    );

    // Get existing session times for this day
    const existingBlocked = getExistingSessionTimes(existingSessions, day);

    for (const slot of allSlots) {
      const conflicts: ScheduleConflict[] = [];

      // Check interventionist availability
      if (interventionist) {
        if (!isInterventionistAvailable(interventionist, day, slot)) {
          conflicts.push({
            type: 'interventionist_unavailable',
            description: `${interventionist.name} is not available`,
          });
        }
      }

      // Check student constraints
      for (const student of students) {
        const studentBlocks = studentBlocked.get(student.id!) || [];
        if (hasConflict(slot, studentBlocks)) {
          const conflictingBlock = studentBlocks.find(b => doTimesOverlap(slot, b));
          conflicts.push({
            type: 'student_unavailable',
            description: `${student.name} has a conflict`,
            studentId: String(student.id),
            studentName: student.name,
          });
        }
      }

      // Check existing sessions
      if (hasConflict(slot, existingBlocked)) {
        conflicts.push({
          type: 'existing_session',
          description: 'Another session is already scheduled',
        });
      }

      // Calculate score
      const baseScore = scoreTimeSlot(slot);
      const conflictPenalty = conflicts.length * 10;
      const score = baseScore + conflictPenalty;

      suggestions.push({
        day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        score,
        conflicts,
      });
    }
  }

  // Sort by score (lower is better) and return top results
  return suggestions
    .sort((a, b) => a.score - b.score)
    .slice(0, 20); // Return top 20 suggestions
}

/**
 * Get optimal schedule suggestions for a group
 *
 * Tries to find the best combination of slots that meets the sessions-per-week requirement
 */
export async function suggestSchedule(
  groupId: number,
  options: SchedulingOptions
): Promise<SuggestedTimeSlot[]> {
  const { sessionsPerWeek } = options;

  // Get all available slots
  const allSlots = await findAvailableSlots(groupId, options);

  // Filter to only conflict-free slots
  const perfectSlots = allSlots.filter(s => s.conflicts.length === 0);

  // If we have enough perfect slots, return them spread across days
  if (perfectSlots.length >= sessionsPerWeek) {
    return selectBestSlots(perfectSlots, sessionsPerWeek);
  }

  // Otherwise, include slots with minor conflicts
  const acceptableSlots = allSlots.filter(s => s.score < 20);
  return selectBestSlots(acceptableSlots, sessionsPerWeek);
}

/**
 * Select the best slots while trying to spread across different days
 */
function selectBestSlots(slots: SuggestedTimeSlot[], count: number): SuggestedTimeSlot[] {
  const selected: SuggestedTimeSlot[] = [];
  const usedDays = new Set<WeekDay>();

  // First pass: one slot per day
  for (const slot of slots) {
    if (selected.length >= count) break;
    if (!usedDays.has(slot.day)) {
      selected.push(slot);
      usedDays.add(slot.day);
    }
  }

  // Second pass: fill remaining slots (allowing same day)
  for (const slot of slots) {
    if (selected.length >= count) break;
    if (!selected.includes(slot)) {
      selected.push(slot);
    }
  }

  return selected.slice(0, count);
}

// ============================================
// DATA LOADING
// ============================================

/**
 * Load all data needed for scheduling a group
 */
async function loadSchedulingContext(groupId: number): Promise<SchedulingContext | null> {
  const group = await db.groups.get(groupId);
  if (!group) return null;

  const students = await db.students.where('group_id').equals(groupId).toArray();

  // Load interventionist if assigned
  const interventionist = group.interventionist_id
    ? await db.interventionists.get(group.interventionist_id)
    : null;

  // Load grade-level constraints for this grade
  const gradeLevelConstraints = await db.gradeLevelConstraints
    .where('grade')
    .equals(group.grade)
    .toArray();

  // Load individual student constraints
  const studentIds = students.map(s => s.id!).filter(Boolean);
  const studentConstraints = await db.studentConstraints
    .where('student_id')
    .anyOf(studentIds)
    .toArray();

  // Load ALL existing sessions (not just this group) to avoid conflicts
  const existingSessions = await db.sessions.toArray();

  return {
    group,
    students,
    interventionist: interventionist || null,
    gradeLevelConstraints,
    studentConstraints,
    existingSessions,
  };
}

// ============================================
// CONSTRAINT CHECKING
// ============================================

/**
 * Get times when interventionist is NOT available for a day
 * (inverse of their availability blocks)
 */
function getInterventionistBlockedTimes(
  interventionist: LocalInterventionist,
  day: WeekDay
): TimeBlock[] {
  // Get availability blocks for this day
  const availableBlocks = interventionist.availability
    .filter(block => block.days.includes(day))
    .map(block => ({
      startTime: block.startTime,
      endTime: block.endTime,
    }))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // If no availability defined, assume available all day
  if (availableBlocks.length === 0) {
    return [];
  }

  // Calculate blocked times (gaps between available blocks)
  const blocked: TimeBlock[] = [];
  let currentTime = 7 * 60; // Start at 7 AM
  const endOfDay = 17 * 60; // End at 5 PM

  for (const block of availableBlocks) {
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);

    // Add blocked time before this available block
    if (currentTime < blockStart) {
      blocked.push({
        startTime: minutesToTimeLocal(currentTime),
        endTime: minutesToTimeLocal(blockStart),
      });
    }

    currentTime = Math.max(currentTime, blockEnd);
  }

  // Add blocked time after last available block
  if (currentTime < endOfDay) {
    blocked.push({
      startTime: minutesToTimeLocal(currentTime),
      endTime: minutesToTimeLocal(endOfDay),
    });
  }

  return blocked;
}

function minutesToTimeLocal(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if interventionist is available for a specific slot
 */
function isInterventionistAvailable(
  interventionist: LocalInterventionist,
  day: WeekDay,
  slot: TimeBlock
): boolean {
  // If no availability blocks defined, assume available
  if (interventionist.availability.length === 0) {
    return true;
  }

  // Check if slot falls within any availability block
  return interventionist.availability.some(block => {
    if (!block.days.includes(day)) return false;

    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);

    return slotStart >= blockStart && slotEnd <= blockEnd;
  });
}

/**
 * Get blocked times for all students in a group
 */
function getStudentBlockedTimes(
  students: LocalStudent[],
  grade: number,
  gradeLevelConstraints: LocalGradeLevelConstraint[],
  studentConstraints: LocalStudentConstraint[],
  day: WeekDay
): Map<number, TimeBlock[]> {
  const blockedByStudent = new Map<number, TimeBlock[]>();

  // Get grade-level constraints that apply to this day
  const gradeBlocks = gradeLevelConstraints
    .filter(c => c.schedule.days.includes(day))
    .map(c => ({
      startTime: c.schedule.startTime,
      endTime: c.schedule.endTime,
    }));

  for (const student of students) {
    const blocked: TimeBlock[] = [...gradeBlocks]; // Start with grade-level constraints

    // Add individual student constraints
    const individualConstraints = studentConstraints.filter(
      c => c.student_id === student.id && c.schedule.days.includes(day)
    );

    for (const constraint of individualConstraints) {
      blocked.push({
        startTime: constraint.schedule.startTime,
        endTime: constraint.schedule.endTime,
      });
    }

    blockedByStudent.set(student.id!, blocked);
  }

  return blockedByStudent;
}

/**
 * Get times blocked by existing sessions
 */
function getExistingSessionTimes(sessions: LocalSession[], day: WeekDay): TimeBlock[] {
  // Filter to sessions that are on this day of the week
  return sessions
    .filter(session => {
      if (!session.time || session.status === 'cancelled') return false;
      // Parse date as local to avoid timezone issues
      const [year, month, dayNum] = session.date.split('-').map(Number);
      const sessionDate = new Date(year, month - 1, dayNum);
      const sessionDayIndex = sessionDate.getDay();
      const dayIndex = WEEKDAYS.indexOf(day) + 1; // Monday = 1
      return sessionDayIndex === dayIndex;
    })
    .map(session => ({
      startTime: session.time!,
      endTime: addMinutesToTime(session.time!, 30), // Assume 30-min default
    }));
}

function addMinutesToTime(time: string, minutes: number): string {
  const total = timeToMinutes(time) + minutes;
  return minutesToTimeLocal(total);
}

// ============================================
// EXPORTS
// ============================================

export {
  loadSchedulingContext,
  isInterventionistAvailable,
};
