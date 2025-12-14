'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { AppLayout } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useAllSessions } from '@/hooks/use-sessions';
import type { Curriculum, SessionWithGroup } from '@/lib/supabase/types';
import { formatCurriculumPosition } from '@/lib/supabase/types';

// Curriculum color mapping based on tailwind config
const getCurriculumColorHex = (curriculum: Curriculum): string => {
  const colors: Record<Curriculum, string> = {
    wilson: '#4F46E5',      // Indigo
    delta_math: '#059669',   // Emerald
    camino: '#DC2626',       // Red
    wordgen: '#7C3AED',      // Violet
    amira: '#0891B2',        // Cyan
  };
  return colors[curriculum];
};

// Status color for event border
const getStatusColor = (status: string): string => {
  if (status === 'completed') return '#10B981'; // Green
  if (status === 'cancelled') return '#EF4444'; // Red
  return '#6B7280'; // Gray for planned
};

export default function CalendarPage() {
  const router = useRouter();
  const calendarRef = useRef<any>(null);
  const { sessions, isLoading } = useAllSessions();

  // Convert sessions to FullCalendar events
  const events = sessions.map((session: SessionWithGroup) => {
    const startTime = session.time || '09:00';
    const [hours, minutes] = startTime.split(':');
    const endDate = new Date(`${session.date}T${startTime}`);
    endDate.setMinutes(endDate.getMinutes() + 30); // Default 30 min duration
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

    return {
      id: session.id,
      title: session.group.name,
      start: `${session.date}T${startTime}`,
      end: `${session.date}T${endTime}`,
      backgroundColor: getCurriculumColorHex(session.group.curriculum),
      borderColor: getStatusColor(session.status),
      extendedProps: {
        session,
        groupId: session.group_id,
        curriculum: session.group.curriculum,
        status: session.status,
        position: formatCurriculumPosition(session.group.curriculum, session.curriculum_position),
      },
    };
  });

  const handleEventClick = (info: any) => {
    const sessionId = info.event.id;
    const groupId = info.event.extendedProps.groupId;
    router.push(`/groups/${groupId}/session/${sessionId}`);
  };

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

        {/* Legend */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4F46E5' }}></div>
              <span className="text-text-muted">Wilson</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#059669' }}></div>
              <span className="text-text-muted">Delta Math</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#DC2626' }}></div>
              <span className="text-text-muted">Camino</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#7C3AED' }}></div>
              <span className="text-text-muted">WordGen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0891B2' }}></div>
              <span className="text-text-muted">Amira</span>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2" style={{ borderColor: '#6B7280' }}></div>
                <span className="text-text-muted">Planned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2" style={{ borderColor: '#10B981' }}></div>
                <span className="text-text-muted">Completed</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Calendar */}
        <Card className="p-4 calendar-container">
          {isLoading ? (
            <div className="text-center py-16 text-text-muted">
              <p>Loading sessions...</p>
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              nowIndicator={true}
              eventContent={(eventInfo) => {
                const { status } = eventInfo.event.extendedProps;
                return (
                  <div className="fc-event-main-content p-1">
                    <div className="font-medium text-xs truncate">{eventInfo.event.title}</div>
                    <div className="text-xs opacity-90 truncate">{eventInfo.timeText}</div>
                    {status === 'completed' && (
                      <div className="text-xs opacity-75">✓ Completed</div>
                    )}
                  </div>
                );
              }}
            />
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
