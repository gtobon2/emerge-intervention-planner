// src/lib/scheduling/day-slots.ts
import { getWeekDayFromDate } from './time-utils';
import type { Group, Session, WeekDay, GroupSchedule, EnhancedGroupSchedule } from '@/lib/supabase/types';

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
export function getScheduledTimeForDay(schedule: GroupSchedule | EnhancedGroupSchedule | null, day: WeekDay): string | null {
  if (!schedule) return null;

  // Check if enhanced schedule with per-day times
  if ('day_times' in schedule) {
    const slot = schedule.day_times.find(dt => dt.day === day && dt.enabled);
    return slot?.time || null;
  }

  // Basic schedule - same time for all days
  if (schedule.days?.includes(day)) {
    return schedule.time || null;
  }

  return null;
}

/**
 * Get duration from schedule, defaulting to 30 minutes
 */
export function getScheduleDuration(schedule: GroupSchedule | EnhancedGroupSchedule | null): number {
  if (!schedule) return 30;
  return schedule.duration || 30;
}

/**
 * Get all scheduled days for a group
 */
export function getScheduledDays(schedule: GroupSchedule | EnhancedGroupSchedule | null): WeekDay[] {
  if (!schedule) return [];

  if ('day_times' in schedule) {
    return schedule.day_times.filter(dt => dt.enabled).map(dt => dt.day);
  }

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
