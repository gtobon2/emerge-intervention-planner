/**
 * Schedule Builder - Scheduling Algorithm
 *
 * Finds optimal time slots for intervention sessions based on:
 * - Interventionist availability
 * - Student constraints (grade-level and individual)
 * - Existing sessions
 * - School calendar (non-student days)
 * - Intervention cycles
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
  InterventionCycle,
} from '@/lib/supabase/types';
import {
  generateTimeSlots,
  getBlockedTimesForDay,
  hasConflict,
  doTimesOverlap,
  scoreTimeSlot,
  WEEKDAYS,
  timeToMinutes,
  getWeekDayFromDate,
} from './time-utils';
import {
  fetchCycleById,
  getCurrentCycle,
  getNonStudentDaysInRange,
} from '@/lib/supabase/services';

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

export interface CycleSchedulingOptions {
  cycleId?: string;          // Use specific cycle, or auto-detect current
  sessionDuration: number;   // minutes
  preferredDays: WeekDay[];  // Days to schedule sessions
  preferredTime?: string;    // Preferred start time (e.g., "09:00")
  startHour?: number;        // Earliest hour (default 7)
  endHour?: number;          // Latest hour (default 17)
  balanceWorkload?: boolean; // Balance across interventionists
}

export interface CycleScheduleResult {
  dates: ScheduledSession[];
  totalSessions: number;
  skippedDates: string[];    // Non-student days that were skipped
  conflicts: ScheduleConflict[];
}

export interface ScheduledSession {
  date: string;              // YYYY-MM-DD
  day: WeekDay;
  time: string;              // HH:MM
  endTime: string;           // HH:MM
  conflicts: ScheduleConflict[];
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
// CYCLE-AWARE SCHEDULING
// ============================================

/**
 * Generate a schedule for a group across an entire intervention cycle
 *
 * This function:
 * 1. Gets the cycle date range
 * 2. Skips non-student days (holidays, PD days, etc.)
 * 3. Finds available slots on scheduled days
 * 4. Optionally balances workload across interventionists
 */
export async function generateCycleSchedule(
  groupId: number,
  options: CycleSchedulingOptions
): Promise<CycleScheduleResult> {
  const {
    cycleId,
    sessionDuration,
    preferredDays,
    preferredTime,
    startHour = 7,
    endHour = 17,
  } = options;

  // Load scheduling context
  const context = await loadSchedulingContext(groupId);
  if (!context) {
    return {
      dates: [],
      totalSessions: 0,
      skippedDates: [],
      conflicts: [{ type: 'group_not_found', description: 'Group not found' }],
    };
  }

  const { group, students, interventionist, gradeLevelConstraints, studentConstraints, existingSessions } = context;

  // Get the cycle (specified or current)
  let cycle: InterventionCycle | null = null;
  try {
    if (cycleId) {
      cycle = await fetchCycleById(cycleId);
    } else {
      cycle = await getCurrentCycle();
    }
  } catch (error) {
    console.error('Failed to fetch cycle:', error);
  }

  if (!cycle) {
    return {
      dates: [],
      totalSessions: 0,
      skippedDates: [],
      conflicts: [{ type: 'no_cycle', description: 'No active intervention cycle found' }],
    };
  }

  // Get non-student days in the cycle range
  let nonStudentDays: string[] = [];
  try {
    nonStudentDays = await getNonStudentDaysInRange(
      cycle.start_date,
      cycle.end_date,
      group.grade
    );
  } catch (error) {
    console.error('Failed to fetch non-student days:', error);
  }
  const nonStudentSet = new Set(nonStudentDays);

  // Generate all dates in the cycle that fall on preferred days
  const allDates = generateCycleDates(cycle.start_date, cycle.end_date, preferredDays);

  // Separate into valid and skipped dates
  const validDates = allDates.filter(d => !nonStudentSet.has(d.date));
  const skippedDates = allDates.filter(d => nonStudentSet.has(d.date)).map(d => d.date);

  // Find the best time slot for each valid date
  const scheduledSessions: ScheduledSession[] = [];
  const allSlots = generateTimeSlots(sessionDuration, startHour, endHour);

  for (const { date, day } of validDates) {
    // Get blocked times for this specific date
    const interventionistBlocked = interventionist
      ? getInterventionistBlockedTimes(interventionist, day)
      : [];

    const studentBlocked = getStudentBlockedTimes(
      students,
      group.grade,
      gradeLevelConstraints,
      studentConstraints,
      day
    );

    // Get existing sessions on this specific date
    const existingOnDate = existingSessions
      .filter(s => s.date === date && s.status !== 'cancelled' && s.time)
      .map(s => ({
        startTime: s.time!,
        endTime: addMinutesToTime(s.time!, sessionDuration),
      }));

    // Find the best slot for this date
    let bestSlot: { slot: TimeBlock; conflicts: ScheduleConflict[] } | null = null;
    let bestScore = Infinity;

    for (const slot of allSlots) {
      const conflicts: ScheduleConflict[] = [];

      // Check interventionist availability
      if (interventionist && !isInterventionistAvailable(interventionist, day, slot)) {
        conflicts.push({
          type: 'interventionist_unavailable',
          description: `${interventionist.name} is not available`,
        });
      }

      // Check student constraints
      for (const student of students) {
        const blocks = studentBlocked.get(student.id!) || [];
        if (hasConflict(slot, blocks)) {
          conflicts.push({
            type: 'student_unavailable',
            description: `${student.name} has a conflict`,
            studentId: String(student.id),
            studentName: student.name,
          });
        }
      }

      // Check existing sessions on this date
      if (hasConflict(slot, existingOnDate)) {
        conflicts.push({
          type: 'existing_session',
          description: 'Another session is already scheduled',
        });
      }

      // Calculate score
      let score = scoreTimeSlot(slot) + conflicts.length * 10;

      // Bonus for matching preferred time
      if (preferredTime && slot.startTime === preferredTime) {
        score -= 5;
      }

      // Prefer consistency - if we have scheduled sessions, prefer same time
      if (scheduledSessions.length > 0) {
        const lastTime = scheduledSessions[scheduledSessions.length - 1].time;
        if (slot.startTime === lastTime) {
          score -= 3; // Prefer consistent times
        }
      }

      if (score < bestScore) {
        bestScore = score;
        bestSlot = { slot, conflicts };
      }
    }

    if (bestSlot) {
      scheduledSessions.push({
        date,
        day,
        time: bestSlot.slot.startTime,
        endTime: bestSlot.slot.endTime,
        conflicts: bestSlot.conflicts,
      });
    }
  }

  return {
    dates: scheduledSessions,
    totalSessions: scheduledSessions.length,
    skippedDates,
    conflicts: [],
  };
}

/**
 * Generate all dates in a range that fall on specific weekdays
 */
function generateCycleDates(
  startDate: string,
  endDate: string,
  days: WeekDay[]
): { date: string; day: WeekDay }[] {
  const results: { date: string; day: WeekDay }[] = [];

  // Parse dates (avoiding timezone issues)
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

  const current = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  while (current <= end) {
    const dayIndex = current.getDay();

    // Convert Sunday=0, Monday=1, etc. to weekday names
    if (dayIndex >= 1 && dayIndex <= 5) {
      const weekDay = WEEKDAYS[dayIndex - 1];
      if (days.includes(weekDay)) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        results.push({ date: `${year}-${month}-${day}`, day: weekDay });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return results;
}

/**
 * Auto-schedule multiple groups for a cycle with workload balancing
 *
 * Distributes sessions evenly across interventionists and time slots
 */
export async function autoScheduleGroupsForCycle(
  groupIds: number[],
  cycleId: string,
  options: Omit<CycleSchedulingOptions, 'cycleId'>
): Promise<Map<number, CycleScheduleResult>> {
  const results = new Map<number, CycleScheduleResult>();

  // Track time slots used per interventionist per date for workload balancing
  const usedSlots = new Map<string, Set<string>>(); // key: `${interventionistId}-${date}`, value: Set of times

  for (const groupId of groupIds) {
    const context = await loadSchedulingContext(groupId);
    if (!context) {
      results.set(groupId, {
        dates: [],
        totalSessions: 0,
        skippedDates: [],
        conflicts: [{ type: 'group_not_found', description: 'Group not found' }],
      });
      continue;
    }

    // Generate schedule for this group
    const schedule = await generateCycleSchedule(groupId, {
      ...options,
      cycleId,
    });

    // If balancing is enabled, try to distribute times
    if (options.balanceWorkload && context.interventionist) {
      const interventionistId = context.interventionist.id;

      // Adjust any conflicting times
      for (const session of schedule.dates) {
        const slotKey = `${interventionistId}-${session.date}`;
        const usedTimes = usedSlots.get(slotKey) || new Set();

        // If this time is already used, try to find an alternative
        if (usedTimes.has(session.time)) {
          const allSlots = generateTimeSlots(
            options.sessionDuration,
            options.startHour || 7,
            options.endHour || 17
          );

          // Find next available slot
          for (const slot of allSlots) {
            if (!usedTimes.has(slot.startTime)) {
              session.time = slot.startTime;
              session.endTime = slot.endTime;
              break;
            }
          }
        }

        // Mark this slot as used
        usedTimes.add(session.time);
        usedSlots.set(slotKey, usedTimes);
      }
    }

    results.set(groupId, schedule);
  }

  return results;
}

/**
 * Get scheduling statistics for an interventionist
 */
export async function getInterventionistWorkload(
  interventionistId: number,
  startDate: string,
  endDate: string
): Promise<{
  totalSessions: number;
  sessionsByDay: Map<WeekDay, number>;
  sessionsByHour: Map<number, number>;
  averagePerDay: number;
}> {
  const sessions = await db.sessions
    .where('date')
    .between(startDate, endDate)
    .toArray();

  // Filter to sessions for groups with this interventionist
  const groups = await db.groups
    .where('interventionist_id')
    .equals(interventionistId)
    .toArray();
  const groupIds = new Set(groups.map(g => g.id));

  const relevantSessions = sessions.filter(
    s => groupIds.has(s.group_id) && s.status !== 'cancelled' && s.time
  );

  const sessionsByDay = new Map<WeekDay, number>();
  const sessionsByHour = new Map<number, number>();
  WEEKDAYS.forEach(day => sessionsByDay.set(day, 0));

  for (const session of relevantSessions) {
    const weekDay = getWeekDayFromDate(session.date);
    if (weekDay) {
      sessionsByDay.set(weekDay, (sessionsByDay.get(weekDay) || 0) + 1);
    }

    const hour = parseInt(session.time!.split(':')[0]);
    sessionsByHour.set(hour, (sessionsByHour.get(hour) || 0) + 1);
  }

  // Calculate average per school day
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const schoolDays = Math.ceil(daysDiff * (5 / 7)); // Approximate weekdays

  return {
    totalSessions: relevantSessions.length,
    sessionsByDay,
    sessionsByHour,
    averagePerDay: schoolDays > 0 ? relevantSessions.length / schoolDays : 0,
  };
}

/**
 * Suggest optimal times for a new group based on existing schedules
 *
 * Finds gaps in the interventionist's schedule to minimize overlap
 */
export async function suggestOptimalTimes(
  groupId: number,
  options: {
    sessionDuration: number;
    preferredDays: WeekDay[];
    startHour?: number;
    endHour?: number;
  }
): Promise<SuggestedTimeSlot[]> {
  const context = await loadSchedulingContext(groupId);
  if (!context) return [];

  const { group, interventionist, existingSessions } = context;

  const suggestions: SuggestedTimeSlot[] = [];
  const { sessionDuration, preferredDays, startHour = 7, endHour = 17 } = options;
  const allSlots = generateTimeSlots(sessionDuration, startHour, endHour);

  // Count how many sessions are scheduled at each time across all days
  const timePopularity = new Map<string, number>();
  for (const session of existingSessions) {
    if (session.time && session.status !== 'cancelled') {
      const count = timePopularity.get(session.time) || 0;
      timePopularity.set(session.time, count + 1);
    }
  }

  for (const day of preferredDays) {
    // Get availability constraints
    const interventionistBlocked = interventionist
      ? getInterventionistBlockedTimes(interventionist, day)
      : [];

    // Get existing sessions for this day
    const dayExisting = existingSessions
      .filter(s => {
        if (!s.time || s.status === 'cancelled') return false;
        const weekDay = getWeekDayFromDate(s.date);
        return weekDay === day;
      })
      .map(s => ({
        startTime: s.time!,
        endTime: addMinutesToTime(s.time!, sessionDuration),
      }));

    for (const slot of allSlots) {
      const conflicts: ScheduleConflict[] = [];

      // Check interventionist availability
      if (interventionist && !isInterventionistAvailable(interventionist, day, slot)) {
        conflicts.push({
          type: 'interventionist_unavailable',
          description: `${interventionist.name} is not available`,
        });
      }

      // Check for overlap with existing sessions
      if (hasConflict(slot, dayExisting)) {
        conflicts.push({
          type: 'existing_session',
          description: 'Overlaps with existing session',
        });
      }

      // Calculate score - lower is better
      let score = scoreTimeSlot(slot);

      // Penalty for popular times (helps balance workload)
      const popularity = timePopularity.get(slot.startTime) || 0;
      score += popularity * 2;

      // Penalty for conflicts
      score += conflicts.length * 10;

      suggestions.push({
        day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        score,
        conflicts,
      });
    }
  }

  // Sort by score and return top suggestions
  return suggestions
    .sort((a, b) => a.score - b.score)
    .slice(0, 30);
}

// ============================================
// EXPORTS
// ============================================

export {
  loadSchedulingContext,
  isInterventionistAvailable,
  generateCycleDates,
};
