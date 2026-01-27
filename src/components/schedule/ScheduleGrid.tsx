'use client';

import { useMemo, useEffect, useState } from 'react';
import { Clock, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  WEEKDAYS,
  getDayShortName,
  formatTimeDisplay,
  timeToMinutes,
  getWeekDayFromDate,
} from '@/lib/scheduling/time-utils';
import { useSessionsStore } from '@/stores/sessions';
import type { LocalInterventionist } from '@/lib/local-db';
import type { WeekDay, TimeBlock, Group, SessionWithGroup, ScheduleConstraint } from '@/lib/supabase/types';

interface ScheduleGridProps {
  interventionist: LocalInterventionist | null;
  groups: Group[];
  constraints: ScheduleConstraint[];
  // Drag and drop props - now uses timeStr instead of hour
  onDrop?: (day: WeekDay, timeStr: string, dateStr: string) => void;
  isDragging?: boolean;
  dragOverSlot?: { day: WeekDay; timeStr: string } | null;
  onDragOver?: (slot: { day: WeekDay; timeStr: string } | null) => void;
  draggingDay?: WeekDay | null; // The specific day being dragged
  // Session management
  onCancelSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

// Generate 30-minute time slots from 7:00 AM to 5:00 PM
const TIME_SLOTS: string[] = [];
for (let hour = 7; hour <= 17; hour++) {
  TIME_SLOTS.push(`${hour.toString().padStart(2, '0')}:00`);
  if (hour < 17) {
    TIME_SLOTS.push(`${hour.toString().padStart(2, '0')}:30`);
  }
}

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

// Format grades for display
function formatGrades(grades: number[]): string {
  if (grades.length === 0) return '';
  if (grades.length === 9) return 'All grades';
  return `Gr ${grades.map(g => g === 0 ? 'K' : g).join(', ')}`;
}

export function ScheduleGrid({
  interventionist,
  groups,
  constraints,
  onDrop,
  isDragging = false,
  dragOverSlot,
  onDragOver,
  draggingDay = null,
  onCancelSession,
  onDeleteSession,
}: ScheduleGridProps) {
  const { allSessions, fetchAllSessions } = useSessionsStore();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    sessionId: string;
    sessionName: string;
    x: number;
    y: number;
  } | null>(null);

  // Fetch sessions on mount
  useEffect(() => {
    fetchAllSessions();
  }, [fetchAllSessions]);

  // Get current week dates
  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  // Get unique grades from visible groups
  const visibleGrades = useMemo(() => {
    return [...new Set(groups.map(g => g.grade))];
  }, [groups]);

  // Filter constraints to only those relevant to visible groups
  // Schoolwide constraints always show (they affect everyone)
  // Personal constraints only show when their grades match visible groups
  const relevantConstraints = useMemo(() => {
    return constraints.filter(c => {
      // Schoolwide constraints always visible
      if (c.scope === 'schoolwide') return true;
      // Personal constraints: show if no groups visible OR grades overlap
      if (visibleGrades.length === 0) return true;
      return c.applicable_grades.some(grade => visibleGrades.includes(grade));
    });
  }, [constraints, visibleGrades]);

  // Group constraints by day
  const constraintsByDay = useMemo(() => {
    const byDay = new Map<WeekDay, ScheduleConstraint[]>();
    WEEKDAYS.forEach(day => byDay.set(day, []));

    relevantConstraints.forEach(constraint => {
      constraint.days.forEach(day => {
        byDay.get(day as WeekDay)?.push(constraint);
      });
    });

    return byDay;
  }, [relevantConstraints]);

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

  // Group sessions by day and time slot for current week
  const sessionsBySlot = useMemo(() => {
    const map = new Map<string, SessionWithGroup[]>();

    allSessions.forEach(session => {
      if (session.status === 'cancelled') return;

      const sessionDate = session.date;
      const weekDay = getWeekDayFromDate(sessionDate);
      if (!weekDay) return;

      // Check if session is in current week
      const expectedDate = weekDates.get(weekDay);
      if (sessionDate !== expectedDate) return;

      // Get the time slot - round to nearest 30 min
      if (!session.time) return;
      const [hours, mins] = session.time.split(':').map(Number);
      const roundedMins = mins < 30 ? '00' : '30';
      const timeSlot = `${hours.toString().padStart(2, '0')}:${roundedMins}`;

      const key = `${weekDay}-${timeSlot}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(session);
    });

    return map;
  }, [allSessions, weekDates]);

  // Check if a time slot is blocked by constraints
  // Duration is 30 minutes to match the grid rows
  // Schoolwide constraints always block; personal constraints only block if grades match
  const isTimeBlocked = (day: WeekDay, time: string, duration: number = 30): boolean => {
    const dayConstraints = constraintsByDay.get(day) || [];
    const slotStart = timeToMinutes(time);
    const slotEnd = slotStart + duration;

    return dayConstraints.some(constraint => {
      const constraintStart = timeToMinutes(constraint.start_time);
      const constraintEnd = timeToMinutes(constraint.end_time);
      const timesOverlap = slotStart < constraintEnd && slotEnd > constraintStart;
      if (!timesOverlap) return false;

      // Schoolwide constraints always block
      if (constraint.scope === 'schoolwide') return true;
      // Personal constraints only block if grades overlap with visible groups
      if (visibleGrades.length === 0) return true;
      return constraint.applicable_grades.some(g => visibleGrades.includes(g));
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

  // Get constraint info for a time slot (for tooltip/display)
  // Uses same overlap logic as isTimeBlocked for consistency
  // Schoolwide constraints always show; personal constraints only show if grades match
  const getConstraintInfo = (day: WeekDay, time: string): { label: string; grades: string } | null => {
    const dayConstraints = constraintsByDay.get(day) || [];
    const slotStart = timeToMinutes(time);
    const slotEnd = slotStart + 30; // Match the 30-minute grid

    const constraint = dayConstraints.find(c => {
      const constraintStart = timeToMinutes(c.start_time);
      const constraintEnd = timeToMinutes(c.end_time);
      const timesOverlap = slotStart < constraintEnd && slotEnd > constraintStart;
      if (!timesOverlap) return false;

      // Schoolwide constraints always show
      if (c.scope === 'schoolwide') return true;
      // Personal constraints only show if grades overlap
      if (visibleGrades.length === 0) return true;
      return c.applicable_grades.some(g => visibleGrades.includes(g));
    });

    if (!constraint) return null;

    return {
      label: constraint.label,
      grades: formatGrades(constraint.applicable_grades),
    };
  };

  // Get sessions for a specific day and time slot
  const getSessionsForSlot = (day: WeekDay, timeStr: string): SessionWithGroup[] => {
    return sessionsBySlot.get(`${day}-${timeStr}`) || [];
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

  // Check if this is the start of an hour (for visual grouping)
  const isHourStart = (timeStr: string): boolean => {
    return timeStr.endsWith(':00');
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header row with days */}
        <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-1 mb-1">
          <div className="flex items-center justify-center p-2 text-sm font-medium text-text-muted">
            <Clock className="w-4 h-4" />
          </div>
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className={`
                text-center p-2 rounded-lg transition-colors
                ${isDragging && draggingDay === day
                  ? 'bg-movement/20 ring-2 ring-movement'
                  : 'bg-surface'}
              `}
            >
              <div className={`font-semibold text-sm ${isDragging && draggingDay === day ? 'text-movement' : 'text-text-primary'}`}>
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
          {TIME_SLOTS.map(timeStr => (
            <div
              key={timeStr}
              className={`grid grid-cols-[60px_repeat(5,1fr)] gap-1 ${isHourStart(timeStr) ? 'mt-1' : ''}`}
            >
              {/* Time label - only show on hour marks */}
              <div className="flex items-start justify-end pr-2 text-xs text-text-muted pt-0.5">
                {isHourStart(timeStr) ? formatTimeDisplay(timeStr) : ''}
              </div>

              {/* Day columns */}
              {WEEKDAYS.map(day => {
                const blocked = isTimeBlocked(day, timeStr);
                const available = isAvailable(day, timeStr);
                const constraintInfo = getConstraintInfo(day, timeStr);
                const sessions = getSessionsForSlot(day, timeStr);
                const dateStr = weekDates.get(day)!;
                const isDragOver = dragOverSlot?.day === day && dragOverSlot?.timeStr === timeStr;
                // Allow drop on any day (flexible scheduling) - drop handler validates constraints
                // Visual blocking is just a hint; the real validation happens in handleDrop
                const canDrop = isDragging && sessions.length === 0 && (available || !interventionist);

                return (
                  <div
                    key={`${day}-${timeStr}`}
                    onDragOver={(e) => {
                      if (canDrop) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        onDragOver?.({ day, timeStr });
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
                        onDrop(day, timeStr, dateStr);
                      }
                    }}
                    className={`
                      min-h-[32px] rounded border transition-colors relative
                      ${isHourStart(timeStr) ? 'rounded-t-lg' : 'rounded-t-none border-t-0'}
                      ${timeStr.endsWith(':30') ? 'rounded-b-lg' : 'rounded-b-none'}
                      ${isDragOver && canDrop
                        ? 'bg-movement/20 border-movement border-2 scale-[1.02]'
                        : sessions.length > 0
                          ? 'bg-white border-gray-300 dark:bg-gray-900 dark:border-gray-600'
                          : blocked
                            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                            : false
                              ? 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600 opacity-40' // Unused - flexible scheduling allows any day
                              : available
                                ? `bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800
                                   ${isDragging && canDrop ? 'hover:bg-green-100 hover:border-green-300' : 'hover:bg-green-100'}
                                   dark:hover:bg-green-900/30 cursor-pointer`
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                      }
                      ${isDragging && canDrop ? 'ring-1 ring-movement/30' : ''}
                    `}
                    title={constraintInfo ? `${constraintInfo.label} (${constraintInfo.grades})` : formatTimeDisplay(timeStr)}
                  >
                    {/* Drop indicator */}
                    {isDragOver && canDrop && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <span className="text-[10px] font-medium text-movement bg-white/90 px-1 py-0.5 rounded shadow-sm">
                          {formatTimeDisplay(timeStr)}
                        </span>
                      </div>
                    )}

                    {/* Show scheduled sessions */}
                    {sessions.length > 0 && (
                      <div className="absolute inset-0.5 flex flex-col gap-0.5">
                        {sessions.map(session => (
                          <div
                            key={session.id}
                            className={`
                              ${getGroupColor(session)} text-white
                              rounded px-1.5 py-0.5 text-[10px] font-medium
                              transition-opacity relative group/session
                              truncate cursor-pointer
                            `}
                            title={`${session.group.name} - ${formatTimeDisplay(session.time || '')} (right-click for options)`}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({
                                sessionId: session.id,
                                sessionName: session.group.name,
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }}
                            onClick={() => {
                              // Navigate to group on click
                              window.location.href = `/groups/${session.group_id}`;
                            }}
                          >
                            {session.group.name}
                            {/* Delete button on hover */}
                            {onDeleteSession && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete session for ${session.group.name}?`)) {
                                    onDeleteSession(session.id);
                                  }
                                }}
                                className="absolute -right-1 -top-1 hidden group-hover/session:flex
                                  w-4 h-4 bg-red-500 rounded-full items-center justify-center
                                  hover:bg-red-600 transition-colors shadow-sm"
                                title="Delete session"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show constraint label with grades - only on hour marks to avoid repetition */}
                    {sessions.length === 0 && blocked && constraintInfo && isHourStart(timeStr) && !isDragOver && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5">
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-medium text-center leading-tight">
                          {constraintInfo.label}
                        </span>
                      </div>
                    )}

                    {/* Show constraint continuation indicator on :30 slots */}
                    {sessions.length === 0 && blocked && constraintInfo && !isHourStart(timeStr) && !isDragOver && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[8px] text-red-400">
                          {constraintInfo.grades}
                        </span>
                      </div>
                    )}

                    {/* Show unavailable for interventionist */}
                    {sessions.length === 0 && !blocked && !available && interventionist && !isDragOver && isHourStart(timeStr) && (
                      <div className="absolute inset-0 flex items-center justify-center p-0.5">
                        <span className="text-[10px] text-gray-400 text-center">
                          N/A
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

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          {/* Menu */}
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-medium text-text-muted">{contextMenu.sessionName}</span>
            </div>
            {onCancelSession && (
              <button
                onClick={() => {
                  onCancelSession(contextMenu.sessionId);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel Session
              </button>
            )}
            {onDeleteSession && (
              <button
                onClick={() => {
                  if (confirm(`Delete session for ${contextMenu.sessionName}?`)) {
                    onDeleteSession(contextMenu.sessionId);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Session
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
