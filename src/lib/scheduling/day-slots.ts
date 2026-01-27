// src/lib/scheduling/day-slots.ts
import { getWeekDayFromDate } from './time-utils';
import type { Group, Session, WeekDay, GroupSchedule, EnhancedGroupSchedule, FlexibleGroupSchedule } from '@/lib/supabase/types';
import { isFlexibleSchedule } from '@/lib/supabase/types';

/**
 * Represents a single schedulable day slot for a group
 */
export interface UnscheduledDaySlot {
  group: Group;
  day: WeekDay;
  time: string | null; // Configured time for this day
  duration: number;    // Session duration in minutes
}

/**
 * Get the configured time for a specific day from a group's schedule
 */
export function getScheduledTimeForDay(schedule: GroupSchedule | EnhancedGroupSchedule | FlexibleGroupSchedule | null, day: WeekDay): string | null {
  if (!schedule) return null;

  // FlexibleGroupSchedule - check computed_days or preferred_time
  if (isFlexibleSchedule(schedule)) {
    if (schedule.computed_days) {
      const slot = schedule.computed_days.find(dt => dt.day === day && dt.enabled);
      return slot?.time || schedule.preferred_time || null;
    }
    return schedule.preferred_time || null;
  }

  // EnhancedGroupSchedule - has day_times with per-day times
  if ('day_times' in schedule) {
    const slot = schedule.day_times.find(dt => dt.day === day && dt.enabled);
    return slot?.time || null;
  }

  // Basic GroupSchedule - same time for all days
  if (schedule.days?.includes(day)) {
    return schedule.time || null;
  }

  return null;
}

/**
 * Get duration from schedule, defaulting to 30 minutes
 */
export function getScheduleDuration(schedule: GroupSchedule | EnhancedGroupSchedule | FlexibleGroupSchedule | null): number {
  if (!schedule) return 30;
  return schedule.duration || 30;
}

/**
 * Get all scheduled days for a group
 */
export function getScheduledDays(schedule: GroupSchedule | EnhancedGroupSchedule | FlexibleGroupSchedule | null): WeekDay[] {
  if (!schedule) return [];

  // FlexibleGroupSchedule - check computed_days first
  if (isFlexibleSchedule(schedule)) {
    if (schedule.computed_days && schedule.computed_days.length > 0) {
      return schedule.computed_days.filter(dt => dt.enabled).map(dt => dt.day);
    }
    // If no computed_days, return empty - needs to be computed by scheduler
    return [];
  }

  // EnhancedGroupSchedule - has day_times
  if ('day_times' in schedule) {
    return schedule.day_times.filter(dt => dt.enabled).map(dt => dt.day);
  }

  // Basic GroupSchedule - has days array
  return (schedule.days || []) as WeekDay[];
}

/**
 * Expand groups into individual day slots based on their schedules
 */
export function expandGroupsToDaySlots(groups: Group[]): UnscheduledDaySlot[] {
  const slots: UnscheduledDaySlot[] = [];

  for (const group of groups) {
    const days = getScheduledDays(group.schedule);
    const duration = getScheduleDuration(group.schedule);

    if (days.length === 0) {
      // No schedule configured - skip (handled separately in UI)
      continue;
    }

    for (const day of days) {
      slots.push({
        group,
        day,
        time: getScheduledTimeForDay(group.schedule, day),
        duration,
      });
    }
  }

  return slots;
}

/**
 * Check if a day slot has been scheduled (has a planned session this week)
 */
export function isDaySlotScheduled(
  slot: UnscheduledDaySlot,
  sessions: Session[],
  weekDates: Map<WeekDay, string>
): boolean {
  const dateForDay = weekDates.get(slot.day);
  if (!dateForDay) return false;

  return sessions.some(s =>
    s.group_id === slot.group.id &&
    s.date === dateForDay &&
    s.status !== 'cancelled'
  );
}

/**
 * Filter to only unscheduled day slots
 */
export function getUnscheduledDaySlots(
  groups: Group[],
  sessions: Session[],
  weekDates: Map<WeekDay, string>
): UnscheduledDaySlot[] {
  const allSlots = expandGroupsToDaySlots(groups);
  return allSlots.filter(slot => !isDaySlotScheduled(slot, sessions, weekDates));
}

// ============================================
// FLEXIBLE SCHEDULING (drop on any day)
// ============================================

/**
 * Represents a group that needs more sessions scheduled this week
 */
export interface SchedulableGroup {
  group: Group;
  sessionsNeeded: number;      // Total sessions needed per week
  sessionsScheduled: number;   // Already scheduled this week
  remainingSlots: number;      // How many more to schedule
  scheduledDays: WeekDay[];    // Days already scheduled (to prevent duplicates)
  preferredTime: string | null; // Preferred time if configured
  duration: number;            // Session duration
}

/**
 * Get sessions per week for a group (from schedule config)
 */
export function getSessionsPerWeek(schedule: GroupSchedule | EnhancedGroupSchedule | FlexibleGroupSchedule | null): number {
  if (!schedule) return 3; // Default

  // FlexibleGroupSchedule has explicit sessions_per_week
  if (isFlexibleSchedule(schedule)) {
    return schedule.sessions_per_week || 3;
  }

  // EnhancedGroupSchedule - count enabled days
  if ('day_times' in schedule) {
    return schedule.day_times.filter(dt => dt.enabled).length || 3;
  }

  // Basic GroupSchedule - count days array
  return schedule.days?.length || 3;
}

/**
 * Get preferred time from schedule (for display/default)
 */
export function getPreferredTime(schedule: GroupSchedule | EnhancedGroupSchedule | FlexibleGroupSchedule | null): string | null {
  if (!schedule) return null;

  if (isFlexibleSchedule(schedule)) {
    return schedule.preferred_time || null;
  }

  if ('day_times' in schedule) {
    const firstWithTime = schedule.day_times.find(dt => dt.enabled && dt.time);
    return firstWithTime?.time || null;
  }

  return schedule.time || null;
}

/**
 * Check if a group has a session on a specific day this week
 */
export function hasSessionOnDay(
  groupId: string,
  day: WeekDay,
  sessions: Session[],
  weekDates: Map<WeekDay, string>
): boolean {
  const dateForDay = weekDates.get(day);
  if (!dateForDay) return false;

  return sessions.some(s =>
    s.group_id === groupId &&
    s.date === dateForDay &&
    s.status !== 'cancelled'
  );
}

/**
 * Get schedulable groups (groups that need more sessions this week)
 * This is for flexible scheduling where users can drop on any day
 */
export function getSchedulableGroups(
  groups: Group[],
  sessions: Session[],
  weekDates: Map<WeekDay, string>
): SchedulableGroup[] {
  const result: SchedulableGroup[] = [];
  const weekdays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  for (const group of groups) {
    const sessionsNeeded = getSessionsPerWeek(group.schedule);
    
    // Count sessions already scheduled this week for this group
    const scheduledDays: WeekDay[] = [];
    let sessionsScheduled = 0;

    for (const day of weekdays) {
      if (hasSessionOnDay(group.id, day, sessions, weekDates)) {
        scheduledDays.push(day);
        sessionsScheduled++;
      }
    }

    const remainingSlots = Math.max(0, sessionsNeeded - sessionsScheduled);

    // Only include if there are slots remaining
    if (remainingSlots > 0) {
      result.push({
        group,
        sessionsNeeded,
        sessionsScheduled,
        remainingSlots,
        scheduledDays,
        preferredTime: getPreferredTime(group.schedule),
        duration: getScheduleDuration(group.schedule),
      });
    }
  }

  // Sort by remaining slots (most needed first)
  return result.sort((a, b) => b.remainingSlots - a.remainingSlots);
}

// ============================================
// CONSTRAINT VALIDATION
// ============================================

import type { ScheduleConstraint } from '@/lib/supabase/types';

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: number, end1: number,
  start2: number, end2: number
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Check if scheduling a session would conflict with any constraints
 * Returns the conflicting constraint if found, null otherwise
 */
export function checkConstraintConflict(
  day: WeekDay,
  sessionTime: string,
  sessionDuration: number,
  grade: number,
  constraints: ScheduleConstraint[]
): ScheduleConstraint | null {
  const sessionStart = timeToMinutes(sessionTime);
  const sessionEnd = sessionStart + sessionDuration;

  for (const constraint of constraints) {
    // Check if constraint applies to this day
    if (!constraint.days.includes(day)) continue;

    // Check if constraint applies to this grade
    if (!constraint.applicable_grades.includes(grade)) continue;

    // Check for time overlap
    const constraintStart = timeToMinutes(constraint.start_time);
    const constraintEnd = timeToMinutes(constraint.end_time);

    if (timeRangesOverlap(sessionStart, sessionEnd, constraintStart, constraintEnd)) {
      return constraint;
    }
  }

  return null;
}
