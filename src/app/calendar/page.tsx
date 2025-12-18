'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AppLayout } from '@/components/layout';
import { Button, Card, Select } from '@/components/ui';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import type { Session, Curriculum } from '@/lib/supabase/types';

// Curriculum colors for calendar events
const curriculumColors: Record<Curriculum, { bg: string; border: string; text: string }> = {
  wilson: { bg: '#3B82F6', border: '#2563EB', text: '#FFFFFF' },
  delta_math: { bg: '#10B981', border: '#059669', text: '#FFFFFF' },
  camino: { bg: '#F59E0B', border: '#D97706', text: '#000000' },
  wordgen: { bg: '#8B5CF6', border: '#7C3AED', text: '#FFFFFF' },
  amira: { bg: '#EC4899', border: '#DB2777', text: '#FFFFFF' },
};

// Status colors
const statusColors: Record<string, string> = {
  planned: '#3B82F6',
  completed: '#10B981',
  cancelled: '#6B7280',
};

export default function CalendarPage() {
  const router = useRouter();
  const { groups, fetchGroups } = useGroupsStore();
  const { sessions, fetchSessionsForGroup } = useSessionsStore();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [allSessions, setAllSessions] = useState<Array<Session & { groupName: string; curriculum: Curriculum }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all groups on mount
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Fetch sessions for all groups
  useEffect(() => {
    const fetchAllSessions = async () => {
      if (groups.length === 0) return;

      setIsLoading(true);
      const sessionsPromises = groups.map(async (group) => {
        const response = await fetch(`/api/sessions?groupId=${group.id}`);
        if (response.ok) {
          const data = await response.json();
          return data.map((s: Session) => ({
            ...s,
            groupName: group.name,
            curriculum: group.curriculum,
          }));
        }
        return [];
      });

      const results = await Promise.all(sessionsPromises);
      setAllSessions(results.flat());
      setIsLoading(false);
    };

    fetchAllSessions();
  }, [groups]);

  // Filter sessions based on selected group
  const filteredSessions = useMemo(() => {
    if (selectedGroupId === 'all') return allSessions;
    return allSessions.filter((s) => s.group_id === selectedGroupId);
  }, [allSessions, selectedGroupId]);

  // Convert sessions to FullCalendar events
  const calendarEvents = useMemo(() => {
    return filteredSessions.map((session) => {
      const colors = curriculumColors[session.curriculum] || curriculumColors.wilson;
      const statusColor = statusColors[session.status] || statusColors.planned;

      // Parse date and time
      let start = session.date;
      if (session.time) {
        start = `${session.date}T${session.time}`;
      }

      return {
        id: session.id,
        title: session.groupName,
        start,
        allDay: !session.time,
        backgroundColor: session.status === 'completed' ? statusColors.completed : colors.bg,
        borderColor: session.status === 'completed' ? '#059669' : colors.border,
        textColor: colors.text,
        extendedProps: {
          groupId: session.group_id,
          status: session.status,
          curriculum: session.curriculum,
        },
      };
    });
  }, [filteredSessions]);

  // Handle event click - navigate to session
  const handleEventClick = (info: any) => {
    const { groupId } = info.event.extendedProps;
    const sessionId = info.event.id;
    router.push(`/groups/${groupId}/session/${sessionId}`);
  };

  // Handle date click - could open schedule modal
  const handleDateClick = (info: any) => {
    // Could open a schedule session modal here
    console.log('Date clicked:', info.dateStr);
  };

  const groupOptions = [
    { value: 'all', label: 'All Groups' },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
            <p className="text-text-muted">
              Schedule and manage your intervention sessions
            </p>
          </div>
          <Button className="gap-2" onClick={() => router.push('/groups')}>
            <Plus className="w-4 h-4" />
            Schedule Session
          </Button>
        </div>

        {/* Filters and Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface rounded-xl">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-4 h-4 text-text-muted" />
            <Select
              options={groupOptions}
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-48"
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-text-muted">Curricula:</span>
            {Object.entries(curriculumColors).map(([curriculum, colors]) => (
              <div key={curriculum} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors.bg }}
                />
                <span className="text-text-muted capitalize">
                  {curriculum.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <Card className="p-4">
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="animate-pulse text-text-muted">Loading calendar...</div>
            </div>
          ) : (
            <div className="calendar-container">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                height="auto"
                aspectRatio={1.8}
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short',
                }}
                dayMaxEvents={3}
                moreLinkClick="popover"
                nowIndicator={true}
                editable={false}
                selectable={true}
                selectMirror={true}
              />
            </div>
          )}
        </Card>

        {/* Session Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-text-muted">Total Sessions</p>
            <p className="text-2xl font-bold text-text-primary">{filteredSessions.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-muted">Planned</p>
            <p className="text-2xl font-bold text-blue-500">
              {filteredSessions.filter((s) => s.status === 'planned').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-muted">Completed</p>
            <p className="text-2xl font-bold text-green-500">
              {filteredSessions.filter((s) => s.status === 'completed').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-muted">This Week</p>
            <p className="text-2xl font-bold text-text-primary">
              {filteredSessions.filter((s) => {
                const sessionDate = new Date(s.date);
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                return sessionDate >= weekStart && sessionDate < weekEnd;
              }).length}
            </p>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .calendar-container {
          --fc-border-color: #374151;
          --fc-button-bg-color: #1F2937;
          --fc-button-border-color: #374151;
          --fc-button-hover-bg-color: #374151;
          --fc-button-hover-border-color: #4B5563;
          --fc-button-active-bg-color: #4B5563;
          --fc-button-active-border-color: #6B7280;
          --fc-button-text-color: #F3F4F6;
          --fc-today-bg-color: rgba(59, 130, 246, 0.1);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: #1F2937;
          --fc-list-event-hover-bg-color: #374151;
          --fc-highlight-color: rgba(59, 130, 246, 0.2);
        }

        .calendar-container .fc {
          font-family: inherit;
        }

        .calendar-container .fc-theme-standard td,
        .calendar-container .fc-theme-standard th {
          border-color: #374151;
        }

        .calendar-container .fc-col-header-cell-cushion,
        .calendar-container .fc-daygrid-day-number {
          color: #9CA3AF;
        }

        .calendar-container .fc-day-today .fc-daygrid-day-number {
          color: #3B82F6;
          font-weight: 600;
        }

        .calendar-container .fc-toolbar-title {
          color: #F3F4F6;
          font-size: 1.25rem;
        }

        .calendar-container .fc-event {
          cursor: pointer;
          font-size: 0.75rem;
          padding: 2px 4px;
          border-radius: 4px;
        }

        .calendar-container .fc-event:hover {
          opacity: 0.9;
        }

        .calendar-container .fc-daygrid-more-link {
          color: #9CA3AF;
        }

        .calendar-container .fc-popover {
          background-color: #1F2937;
          border-color: #374151;
        }

        .calendar-container .fc-popover-header {
          background-color: #374151;
          color: #F3F4F6;
        }

        .calendar-container .fc-timegrid-slot-label {
          color: #9CA3AF;
        }

        .calendar-container .fc-timegrid-axis {
          color: #9CA3AF;
        }
      `}</style>
    </AppLayout>
  );
}
