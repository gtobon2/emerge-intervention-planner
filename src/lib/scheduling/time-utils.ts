/**
 * Time Utilities for Schedule Builder
 *
 * Provides helper functions for time manipulation and comparison
 */

import type { TimeBlock, WeeklyTimeBlock, WeekDay } from '@/lib/supabase/types';

/**
 * Convert time string "HH:MM" to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string "HH:MM"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Format time for display (12-hour format with AM/PM)
 */
export function formatTimeDisplay(time: string): string {
  const minutes = timeToMinutes(time);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Check if two time blocks overlap
 */
export function doTimesOverlap(a: TimeBlock, b: TimeBlock): boolean {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);

  return aStart < bEnd && bStart < aEnd;
}

/**
 * Check if a time is within a time block
 */
export function isTimeInBlock(time: string, block: TimeBlock): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(block.startTime);
  const endMinutes = timeToMinutes(block.endTime);

  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
}

/**
 * Check if a time block is fully contained within another
 */
export function isBlockContained(inner: TimeBlock, outer: TimeBlock): boolean {
  const innerStart = timeToMinutes(inner.startTime);
  const innerEnd = timeToMinutes(inner.endTime);
  const outerStart = timeToMinutes(outer.startTime);
  const outerEnd = timeToMinutes(outer.endTime);

  return innerStart >= outerStart && innerEnd <= outerEnd;
}

/**
 * Get the duration of a time block in minutes
 */
export function getBlockDuration(block: TimeBlock): number {
  return timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
}

/**
 * Generate all possible time slots for a given duration
 *
 * @param duration Duration in minutes
 * @param startHour Start hour (default 7 = 7:00 AM)
 * @param endHour End hour (default 17 = 5:00 PM)
 * @param interval Slot interval in minutes (default 15)
 */
export function generateTimeSlots(
  duration: number,
  startHour = 7,
  endHour = 17,
  interval = 15
): TimeBlock[] {
  const slots: TimeBlock[] = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  for (let start = startMinutes; start + duration <= endMinutes; start += interval) {
    slots.push({
      startTime: minutesToTime(start),
      endTime: minutesToTime(start + duration),
    });
  }

  return slots;
}

/**
 * Check if a weekly time block applies to a specific day
 */
export function appliesToDay(block: WeeklyTimeBlock, day: WeekDay): boolean {
  return block.days.includes(day);
}

/**
 * Get all blocked time ranges for a specific day from weekly blocks
 */
export function getBlockedTimesForDay(
  blocks: WeeklyTimeBlock[],
  day: WeekDay
): TimeBlock[] {
  return blocks
    .filter(block => appliesToDay(block, day))
    .map(block => ({
      startTime: block.startTime,
      endTime: block.endTime,
    }));
}

/**
 * Check if a time slot conflicts with any blocked times
 */
export function hasConflict(slot: TimeBlock, blockedTimes: TimeBlock[]): boolean {
  return blockedTimes.some(blocked => doTimesOverlap(slot, blocked));
}

/**
 * Get the day name for display
 */
export function getDayDisplayName(day: WeekDay): string {
  const names: Record<WeekDay, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
  };
  return names[day];
}

/**
 * Get short day name (3 letters)
 */
export function getDayShortName(day: WeekDay): string {
  const names: Record<WeekDay, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
  };
  return names[day];
}

/**
 * All weekdays in order
 */
export const WEEKDAYS: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

/**
 * Get the current day of week as WeekDay (or null for weekend)
 */
export function getCurrentWeekDay(): WeekDay | null {
  const dayIndex = new Date().getDay();
  if (dayIndex === 0 || dayIndex === 6) return null; // Weekend
  return WEEKDAYS[dayIndex - 1];
}

/**
 * Parse a date string and get its weekday
 * Handles timezone issues by parsing the date components directly
 */
export function getWeekDayFromDate(dateStr: string): WeekDay | null {
  // Parse as local date to avoid timezone shifts
  // dateStr format: "YYYY-MM-DD"
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  const dayIndex = date.getDay();
  if (dayIndex === 0 || dayIndex === 6) return null;
  return WEEKDAYS[dayIndex - 1];
}

/**
 * Generate time options for select dropdowns (15-min intervals)
 */
export function generateTimeOptions(startHour = 7, endHour = 17, interval = 15): string[] {
  const options: string[] = [];
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += interval) {
    options.push(minutesToTime(minutes));
  }

  return options;
}

/**
 * Calculate proximity score between two time slots (for scheduling optimization)
 * Lower score means times are closer together
 */
export function calculateTimeProximity(time1: string, time2: string): number {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  return Math.abs(minutes1 - minutes2);
}

/**
 * Score a time slot based on preferences
 * Lower score = better
 *
 * Preferences:
 * - Morning (8-11) is slightly preferred for interventions
 * - Early afternoon (12-2) is neutral
 * - Late afternoon (3+) is less preferred
 */
export function scoreTimeSlot(slot: TimeBlock): number {
  const startMinutes = timeToMinutes(slot.startTime);
  const startHour = startMinutes / 60;

  if (startHour >= 8 && startHour < 11) {
    return 0; // Morning - best
  } else if (startHour >= 11 && startHour < 14) {
    return 1; // Midday - good
  } else if (startHour >= 14 && startHour < 15) {
    return 2; // Early afternoon - ok
  } else {
    return 3; // Late afternoon or early morning - less preferred
  }
}
