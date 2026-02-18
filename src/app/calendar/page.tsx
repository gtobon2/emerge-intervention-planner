'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Ban, School, AlertTriangle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import { useAllSessions } from '@/hooks/use-sessions';
import { useSchoolCalendarStore, isDateInEvents, expandEventDates } from '@/stores/school-calendar';
import type { SessionWithGroup, SchoolCalendarEvent, NonStudentDayType } from '@/lib/supabase/types';
import { formatCurriculumPosition } from '@/lib/supabase/types';

// Status color mapping
const getStatusColor = (status: string): string => {
  if (status === 'completed') return 'bg-green-500 text-green-100 border-green-400';
  if (status === 'cancelled') return 'bg-gray-500 text-gray-100 border-gray-400';
  return 'bg-blue-500 text-blue-100 border-blue-400'; // planned
};

const getStatusBadgeColor = (status: string): string => {
  if (status === 'completed') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (status === 'cancelled') return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return 'bg-blue-500/20 text-blue-400 border-blue-500/30'; // planned
};

// Non-student day type styling
const getNonStudentDayStyle = (type: NonStudentDayType): { bg: string; text: string; icon: typeof Ban } => {
  switch (type) {
    case 'holiday':
      return { bg: 'bg-red-100', text: 'text-red-700', icon: Ban };
    case 'pd_day':
      return { bg: 'bg-purple-100', text: 'text-purple-700', icon: School };
    case 'institute_day':
      return { bg: 'bg-purple-100', text: 'text-purple-700', icon: School };
    case 'early_dismissal':
      return { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock };
    case 'late_start':
      return { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock };
    case 'testing_day':
      return { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertTriangle };
    case 'emergency_closure':
      return { bg: 'bg-red-200', text: 'text-red-800', icon: AlertTriangle };
    case 'break':
      return { bg: 'bg-red-100', text: 'text-red-700', icon: Ban };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', icon: Ban };
  }
};

// Month and day names
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  sessions: SessionWithGroup[];
  calendarEvents: SchoolCalendarEvent[];
  isNonStudentDay: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const { sessions, isLoading } = useAllSessions();
  const { events: calendarEvents, fetchAllEvents } = useSchoolCalendarStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch school calendar events on mount
  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  // Expand calendar events to individual dates for fast lookup
  const eventsByDate = useMemo(() => {
    return expandEventDates(calendarEvents);
  }, [calendarEvents]);

  // Get calendar days for the current month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Previous month days to show
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = eventsByDate.get(dateStr) || [];
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        sessions: [],
        calendarEvents: dayEvents,
        isNonStudentDay: dayEvents.length > 0,
      });
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = sessions.filter(s => s.date === dateStr);
      const dayEvents = eventsByDate.get(dateStr) || [];

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        sessions: daySessions,
        calendarEvents: dayEvents,
        isNonStudentDay: dayEvents.length > 0,
      });
    }

    // Add next month days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = eventsByDate.get(dateStr) || [];
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        sessions: [],
        calendarEvents: dayEvents,
        isNonStudentDay: dayEvents.length > 0,
      });
    }

    return days;
  }, [currentDate, sessions, eventsByDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSessionClick = (session: SessionWithGroup) => {
    router.push(`/groups/${session.group_id}/session/${session.id}`);
  };

  const currentMonthYear = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Count sessions by status
  const sessionCounts = useMemo(() => {
    const currentMonthSessions = sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate.getMonth() === currentDate.getMonth() &&
             sessionDate.getFullYear() === currentDate.getFullYear();
    });

    return {
      total: currentMonthSessions.length,
      planned: currentMonthSessions.filter(s => s.status === 'planned').length,
      completed: currentMonthSessions.filter(s => s.status === 'completed').length,
    };
  }, [sessions, currentDate]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
            <p className="text-text-muted mt-1">
              View and manage your intervention sessions
            </p>
          </div>

          {/* Month Stats */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-text-muted">{sessionCounts.planned} Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-text-muted">{sessionCounts.completed} Completed</span>
            </div>
          </div>
        </div>

        {/* Calendar Navigation */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">
              {currentMonthYear}
            </h2>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={goToToday}
                className="gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Today</span>
              </Button>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousMonth}
                  className="w-9 h-9 p-0"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextMonth}
                  className="w-9 h-9 p-0"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-16 text-text-muted">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-movement border-t-transparent rounded-full animate-spin"></div>
                <p>Loading sessions...</p>
              </div>
            </div>
          ) : isMobile ? (
            /* Mobile: Agenda/List View */
            <div className="space-y-2">
              {calendarDays
                .filter(day => day.isCurrentMonth && (day.sessions.length > 0 || day.isNonStudentDay))
                .map((day, index) => {
                  const primaryEvent = day.calendarEvents[0];
                  const eventStyle = primaryEvent ? getNonStudentDayStyle(primaryEvent.type) : null;
                  return (
                    <div
                      key={index}
                      className={`
                        p-3 rounded-lg border transition-colors
                        ${day.isNonStudentDay && eventStyle
                          ? `${eventStyle.bg} border-transparent`
                          : 'bg-surface/50 border-text-muted/10'
                        }
                        ${day.isToday ? 'ring-2 ring-movement' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`
                            text-sm font-semibold
                            ${day.isNonStudentDay && eventStyle
                              ? eventStyle.text
                              : day.isToday
                                ? 'text-movement'
                                : 'text-text-primary'
                            }
                          `}
                        >
                          {DAY_NAMES[day.date.getDay()]}, {MONTH_NAMES[day.date.getMonth()].slice(0, 3)} {day.date.getDate()}
                        </span>
                        <div className="flex items-center gap-2">
                          {day.isNonStudentDay && eventStyle && (
                            <Ban className={`w-4 h-4 ${eventStyle.text}`} />
                          )}
                          {day.sessions.length > 0 && (
                            <span className="text-xs bg-movement/20 text-movement px-2 py-0.5 rounded-full font-medium">
                              {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {day.isNonStudentDay && primaryEvent && (
                        <div className={`text-sm font-medium mb-2 ${eventStyle?.text}`}>
                          {primaryEvent.title}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {day.sessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => handleSessionClick(session)}
                            className={`
                              w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                              border transition-all active:scale-[0.98] min-h-[44px]
                              flex items-center justify-between
                              ${getStatusColor(session.status)}
                            `}
                          >
                            <span className="font-semibold truncate">{session.group.name}</span>
                            {session.time && (
                              <span className="text-xs opacity-90 ml-2 shrink-0">{session.time}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              }
              {calendarDays.filter(day => day.isCurrentMonth && (day.sessions.length > 0 || day.isNonStudentDay)).length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">
                  No sessions or events this month
                </div>
              )}
            </div>
          ) : (
            /* Desktop: Calendar Grid View */
            <>
              {/* Day Names Header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {DAY_NAMES.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-text-muted py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  // Get primary event for background styling
                  const primaryEvent = day.calendarEvents[0];
                  const eventStyle = primaryEvent ? getNonStudentDayStyle(primaryEvent.type) : null;

                  return (
                  <div
                    key={index}
                    className={`
                      min-h-[100px] sm:min-h-[120px] p-2 rounded-lg border transition-colors relative
                      ${day.isNonStudentDay && eventStyle
                        ? `${eventStyle.bg} border-transparent`
                        : day.isCurrentMonth
                          ? 'bg-surface/50 border-text-muted/10'
                          : 'bg-foundation border-text-muted/5'
                      }
                      ${day.isToday
                        ? 'ring-2 ring-movement'
                        : ''
                      }
                    `}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`
                          text-sm font-medium
                          ${day.isNonStudentDay && eventStyle
                            ? eventStyle.text
                            : day.isCurrentMonth
                              ? day.isToday
                                ? 'text-movement font-bold'
                                : 'text-text-primary'
                              : 'text-text-muted'
                          }
                        `}
                      >
                        {day.date.getDate()}
                      </span>

                      <div className="flex items-center gap-1">
                        {day.isNonStudentDay && eventStyle && (
                          <span className={`text-xs ${eventStyle.text}`}>
                            <Ban className="w-3 h-3" />
                          </span>
                        )}
                        {day.sessions.length > 0 && (
                          <span className="text-xs bg-movement/20 text-movement px-1.5 py-0.5 rounded-full font-medium">
                            {day.sessions.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Non-student day label */}
                    {day.isNonStudentDay && primaryEvent && (
                      <div className={`text-xs font-medium truncate mb-1 ${eventStyle?.text}`} title={primaryEvent.title}>
                        {primaryEvent.title}
                      </div>
                    )}

                    {/* Sessions */}
                    <div className="space-y-1">
                      {day.sessions.slice(0, day.isNonStudentDay ? 2 : 3).map((session) => (
                        <button
                          key={session.id}
                          onClick={() => handleSessionClick(session)}
                          className={`
                            w-full text-left px-2 py-1 rounded text-xs font-medium
                            border transition-all hover:scale-105 hover:shadow-md
                            ${getStatusColor(session.status)}
                          `}
                        >
                          <div className="truncate font-semibold">
                            {session.group.name}
                          </div>
                          {session.time && (
                            <div className="text-xs opacity-90 truncate">
                              {session.time}
                            </div>
                          )}
                        </button>
                      ))}

                      {day.sessions.length > (day.isNonStudentDay ? 2 : 3) && (
                        <div className="text-xs text-center text-text-muted pt-1">
                          +{day.sessions.length - (day.isNonStudentDay ? 2 : 3)} more
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* Legend */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Legend</h3>
          <div className="space-y-3">
            {/* Session status legend */}
            <div>
              <div className="text-xs text-text-muted mb-2 uppercase tracking-wide">Session Status</div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded border ${getStatusBadgeColor('planned')}`}></div>
                  <span className="text-text-muted">Planned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded border ${getStatusBadgeColor('completed')}`}></div>
                  <span className="text-text-muted">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded border ${getStatusBadgeColor('cancelled')}`}></div>
                  <span className="text-text-muted">Cancelled</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg border-2 border-movement"></div>
                  <span className="text-text-muted">Today</span>
                </div>
              </div>
            </div>
            {/* Non-student day legend */}
            <div>
              <div className="text-xs text-text-muted mb-2 uppercase tracking-wide">Non-Student Days</div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-100 border border-red-200 flex items-center justify-center">
                    <Ban className="w-3 h-3 text-red-700" />
                  </div>
                  <span className="text-text-muted">Holiday/Break</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-purple-100 border border-purple-200 flex items-center justify-center">
                    <School className="w-3 h-3 text-purple-700" />
                  </div>
                  <span className="text-text-muted">PD/Institute Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-100 border border-amber-200 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-amber-700" />
                  </div>
                  <span className="text-text-muted">Early/Late Schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-orange-100 border border-orange-200 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-orange-700" />
                  </div>
                  <span className="text-text-muted">Testing</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Empty State */}
        {!isLoading && sessions.length === 0 && (
          <Card className="p-8 text-center">
            <CalendarIcon className="w-16 h-16 mx-auto text-text-muted/30 mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No Sessions Scheduled
            </h3>
            <p className="text-text-muted mb-4">
              Start by creating a group and scheduling your first intervention session
            </p>
            <Button onClick={() => router.push('/groups')} className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              Go to Groups
            </Button>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
