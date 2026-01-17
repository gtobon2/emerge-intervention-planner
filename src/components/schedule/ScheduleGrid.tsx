'use client';

import { useMemo, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import {
  WEEKDAYS,
  getDayShortName,
  getDayDisplayName,
  formatTimeDisplay,
  generateTimeSlots,
  timeToMinutes,
  getWeekDayFromDate,
} from '@/lib/scheduling/time-utils';
import { useSessionsStore } from '@/stores/sessions';
import type { LocalInterventionist, LocalGradeLevelConstraint } from '@/lib/local-db';
import type { WeekDay, TimeBlock, Group, SessionWithGroup } from '@/lib/supabase/types';

interface ScheduleGridProps {
  interventionist: LocalInterventionist | null;
  groups: Group[];
  constraints: LocalGradeLevelConstraint[];
  // Drag and drop props
  onDrop?: (day: WeekDay, hour: number, dateStr: string) => void;
  isDragging?: boolean;
  dragOverSlot?: { day: WeekDay; hour: number } | null;
  onDragOver?: (slot: { day: WeekDay; hour: number } | null) => void;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7); // 7 AM to 5 PM

// Get dates for current week (Monday-Friday)
function getCurrentWeekDates(): Map<WeekDay, string> {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate Monday of current week
  const monday = new Date(today);
  const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + daysFromMonday);

  const dates = new Map<WeekDay, string>();
  WEEKDAYS.forEach((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    // Format as YYYY-MM-DD using local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayNum = String(date.getDate()).padStart(2, '0');
    dates.set(day, `${year}-${month}-${dayNum}`);
  });

  return dates;
}

// Format date for display
function formatDateShort(dateStr: string): string {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${month}/${day}`;
}

export function ScheduleGrid({
  interventionist,
  groups,
  constraints,
  onDrop,
  isDragging = false,
  dragOverSlot,
  onDragOver,
}: ScheduleGridProps) {
  const { allSessions, fetchAllSessions } = useSessionsStore();

  // Fetch sessions on mount
  useEffect(() => {
    fetchAllSessions();
  }, [fetchAllSessions]);

  // Get current week dates
  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  // Group constraints by day
  const constraintsByDay = useMemo(() => {
    const byDay = new Map<WeekDay, LocalGradeLevelConstraint[]>();
    WEEKDAYS.forEach(day => byDay.set(day, []));

    constraints.forEach(constraint => {
      constraint.schedule.days.forEach(day => {
        byDay.get(day)?.push(constraint);
      });
    });

    return byDay;
  }, [constraints]);

  // Get interventionist availability by day
  const availabilityByDay = useMemo(() => {
    if (!interventionist) return new Map<WeekDay, TimeBlock[]>();

    const byDay = new Map<WeekDay, TimeBlock[]>();
    WEEKDAYS.forEach(day => byDay.set(day, []));

    interventionist.availability.forEach(block => {
      block.days.forEach(day => {
        byDay.get(day)?.push({
          startTime: block.startTime,
          endTime: block.endTime,
        });
      });
    });

    return byDay;
  }, [interventionist]);

  // Group sessions by day and hour for current week
  const sessionsByDayAndHour = useMemo(() => {
    const map = new Map<string, SessionWithGroup[]>();

    allSessions.forEach(session => {
      if (session.status === 'cancelled') return;

      const sessionDate = session.date;
      const weekDay = getWeekDayFromDate(sessionDate);
      if (!weekDay) return;

      // Check if session is in current week
      const expectedDate = weekDates.get(weekDay);
      if (sessionDate !== expectedDate) return;

      // Get the hour from session time
      if (!session.time) return;
      const hour = parseInt(session.time.split(':')[0]);

      const key = `${weekDay}-${hour}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(session);
    });

    return map;
  }, [allSessions, weekDates]);

  // Check if a time slot is blocked by constraints
  const isTimeBlocked = (day: WeekDay, time: string, duration: number = 30): boolean => {
    const dayConstraints = constraintsByDay.get(day) || [];
    const slotStart = timeToMinutes(time);
    const slotEnd = slotStart + duration;

    return dayConstraints.some(constraint => {
      const constraintStart = timeToMinutes(constraint.schedule.startTime);
      const constraintEnd = timeToMinutes(constraint.schedule.endTime);
      return slotStart < constraintEnd && slotEnd > constraintStart;
    });
  };

  // Check if interventionist is available at this time
  const isAvailable = (day: WeekDay, time: string, duration: number = 30): boolean => {
    if (!interventionist) return true;
    if (interventionist.availability.length === 0) return true;

    const dayBlocks = availabilityByDay.get(day) || [];
    if (dayBlocks.length === 0) return false;

    const slotStart = timeToMinutes(time);
    const slotEnd = slotStart + duration;

    return dayBlocks.some(block => {
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      return slotStart >= blockStart && slotEnd <= blockEnd;
    });
  };

  // Get constraint label for a time slot
  const getConstraintLabel = (day: WeekDay, time: string): string | null => {
    const dayConstraints = constraintsByDay.get(day) || [];
    const slotStart = timeToMinutes(time);

    const constraint = dayConstraints.find(c => {
      const constraintStart = timeToMinutes(c.schedule.startTime);
      const constraintEnd = timeToMinutes(c.schedule.endTime);
      return slotStart >= constraintStart && slotStart < constraintEnd;
    });

    return constraint?.label || null;
  };

  // Get sessions for a specific day and hour
  const getSessionsForSlot = (day: WeekDay, hour: number): SessionWithGroup[] => {
    return sessionsByDayAndHour.get(`${day}-${hour}`) || [];
  };

  // Get color for a group (based on curriculum)
  const getGroupColor = (session: SessionWithGroup): string => {
    const colors: Record<string, string> = {
      wilson: 'bg-blue-500',
      delta_math: 'bg-green-500',
      camino: 'bg-orange-500',
      wordgen: 'bg-purple-500',
      amira: 'bg-pink-500',
    };
    return colors[session.group.curriculum] || 'bg-gray-500';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header row with days */}
        <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
          <div className="flex items-center justify-center p-2 text-sm font-medium text-text-muted">
            <Clock className="w-4 h-4" />
          </div>
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className="text-center p-2 bg-surface rounded-lg"
            >
              <div className="font-semibold text-sm text-text-primary">
                {getDayShortName(day)}
              </div>
              <div className="text-xs text-text-muted">
                {formatDateShort(weekDates.get(day)!)}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
              {/* Time label */}
              <div className="flex items-start justify-end pr-2 text-xs text-text-muted pt-1">
                {formatTimeDisplay(`${hour.toString().padStart(2, '0')}:00`)}
              </div>

              {/* Day columns */}
              {WEEKDAYS.map(day => {
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                const blocked = isTimeBlocked(day, timeStr);
                const available = isAvailable(day, timeStr);
                const label = getConstraintLabel(day, timeStr);
                const sessions = getSessionsForSlot(day, hour);
                const dateStr = weekDates.get(day)!;
                const isDragOver = dragOverSlot?.day === day && dragOverSlot?.hour === hour;
                const canDrop = isDragging && !blocked && sessions.length === 0 && (available || !interventionist);

                return (
                  <div
                    key={`${day}-${hour}`}
                    onDragOver={(e) => {
                      if (canDrop) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        onDragOver?.({ day, hour });
                      }
                    }}
                    onDragLeave={() => {
                      if (isDragOver) {
                        onDragOver?.(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (canDrop && onDrop) {
                        onDrop(day, hour, dateStr);
                      }
                    }}
                    className={`
                      min-h-[60px] rounded-lg border transition-colors relative
                      ${isDragOver && canDrop
                        ? 'bg-movement/20 border-movement border-2 scale-[1.02]'
                        : sessions.length > 0
                          ? 'bg-white border-gray-300 dark:bg-gray-900 dark:border-gray-600'
                          : blocked
                            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                            : available
                              ? `bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800
                                 ${isDragging ? 'hover:bg-green-100 hover:border-green-300' : 'hover:bg-green-100'}
                                 dark:hover:bg-green-900/30 cursor-pointer`
                              : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                      }
                      ${isDragging && canDrop ? 'ring-1 ring-movement/30' : ''}
                    `}
                  >
                    {/* Drop indicator */}
                    {isDragOver && canDrop && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-xs font-medium text-movement bg-white/90 px-2 py-1 rounded shadow-sm">
                          Drop here
                        </span>
                      </div>
                    )}

                    {/* Show scheduled sessions */}
                    {sessions.length > 0 && (
                      <div className="absolute inset-1 flex flex-col gap-1">
                        {sessions.map(session => (
                          <Link
                            key={session.id}
                            href={`/groups/${session.group_id}`}
                            className={`
                              ${getGroupColor(session)} text-white
                              rounded px-2 py-1 text-xs font-medium
                              hover:opacity-90 transition-opacity
                              truncate
                            `}
                            title={`${session.group.name} - ${formatTimeDisplay(session.time || '')}`}
                          >
                            {session.group.name}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Show constraint label */}
                    {sessions.length === 0 && blocked && label && !isDragOver && (
                      <div className="absolute inset-0 flex items-center justify-center p-1">
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium text-center">
                          {label}
                        </span>
                      </div>
                    )}

                    {/* Show unavailable for interventionist */}
                    {sessions.length === 0 && !blocked && !available && interventionist && !isDragOver && (
                      <div className="absolute inset-0 flex items-center justify-center p-1">
                        <span className="text-xs text-gray-400 text-center">
                          Unavailable
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span>Wilson</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Delta Math</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span>Camino</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
            <span>Blocked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
