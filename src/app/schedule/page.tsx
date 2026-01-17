'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Settings, Users, Calendar, Clock, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Modal, Input, Select, Card } from '@/components/ui';
import { useScheduleStore } from '@/stores/schedule';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { useCyclesStore } from '@/stores/cycles';
import { useSchoolCalendarStore } from '@/stores/school-calendar';
import { ScheduleGrid } from '@/components/schedule/ScheduleGrid';
import { InterventionistModal } from '@/components/schedule/InterventionistModal';
import { ConstraintsModal } from '@/components/schedule/ConstraintsModal';
import { SuggestionsPanel } from '@/components/schedule/SuggestionsPanel';
import { formatTimeDisplay, WEEKDAYS, getDayDisplayName } from '@/lib/scheduling/time-utils';
import type { WeekDay, Group } from '@/lib/supabase/types';

export default function SchedulePage() {
  const {
    interventionists,
    gradeLevelConstraints,
    fetchAll,
    isLoading,
    error,
    selectedInterventionistId,
    setSelectedInterventionist,
  } = useScheduleStore();

  const { groups, fetchGroups } = useGroupsStore();
  const { allSessions, fetchAllSessions, createSession } = useSessionsStore();
  const { currentCycle, fetchCurrentCycle } = useCyclesStore();
  const { events: calendarEvents, fetchAllEvents } = useSchoolCalendarStore();

  const [isInterventionistModalOpen, setIsInterventionistModalOpen] = useState(false);
  const [isConstraintsModalOpen, setIsConstraintsModalOpen] = useState(false);
  const [editingInterventionist, setEditingInterventionist] = useState<string | null>(null);

  // Drag and drop state
  const [draggingGroup, setDraggingGroup] = useState<Group | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: WeekDay; hour: number } | null>(null);

  useEffect(() => {
    fetchAll();
    fetchGroups();
    fetchAllSessions();
    fetchCurrentCycle();
    fetchAllEvents();
  }, [fetchAll, fetchGroups, fetchAllSessions, fetchCurrentCycle, fetchAllEvents]);

  // Get groups that have no upcoming sessions (planned status)
  const unscheduledGroups = useMemo(() => {
    const groupsWithSessions = new Set(
      allSessions
        .filter(s => s.status === 'planned')
        .map(s => s.group_id)
    );
    return groups.filter(g => !groupsWithSessions.has(g.id));
  }, [groups, allSessions]);

  const selectedInterventionist = useMemo(() => {
    if (!selectedInterventionistId) return null;
    return interventionists.find(i => String(i.id) === selectedInterventionistId) || null;
  }, [interventionists, selectedInterventionistId]);

  const handleAddInterventionist = () => {
    setEditingInterventionist(null);
    setIsInterventionistModalOpen(true);
  };

  const handleEditInterventionist = (id: string) => {
    setEditingInterventionist(id);
    setIsInterventionistModalOpen(true);
  };

  const interventionistOptions = useMemo(() => [
    { value: 'all', label: 'All Interventionists' },
    ...interventionists.map(i => ({ value: String(i.id), label: i.name }))
  ], [interventionists]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, group: Group) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ groupId: group.id }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingGroup(group);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingGroup(null);
    setDragOverSlot(null);
  }, []);

  const handleDrop = useCallback(async (day: WeekDay, hour: number, dateStr: string) => {
    if (!draggingGroup) return;

    // Create a session for this group at the dropped time
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;

    try {
      await createSession({
        group_id: draggingGroup.id,
        date: dateStr,
        time: timeStr,
        status: 'planned',
        curriculum_position: draggingGroup.current_position,
        advance_after: false,
        // Required nullable fields
        notes: null,
        planned_otr_target: null,
        planned_response_formats: null,
        planned_practice_items: null,
        cumulative_review_items: null,
        anticipated_errors: null,
        actual_otr_estimate: null,
        pacing: null,
        components_completed: null,
        exit_ticket_correct: null,
        exit_ticket_total: null,
        mastery_demonstrated: null,
        errors_observed: null,
        unexpected_errors: null,
        pm_score: null,
        pm_trend: null,
        dbi_adaptation_notes: null,
        next_session_notes: null,
        fidelity_checklist: null,
      });
      // Refresh sessions
      fetchAllSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }

    setDraggingGroup(null);
    setDragOverSlot(null);
  }, [draggingGroup, createSession, fetchAllSessions]);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Schedule Builder</h1>
            <p className="text-sm md:text-base text-text-muted mt-1">
              Plan intervention sessions based on availability
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setIsConstraintsModalOpen(true)}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Constraints</span>
            </Button>
            <Button className="gap-2" onClick={handleAddInterventionist}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Interventionist</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center p-4 bg-surface rounded-xl">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-text-muted" />
            <Select
              options={interventionistOptions}
              value={selectedInterventionistId || 'all'}
              onChange={(e) => setSelectedInterventionist(
                e.target.value === 'all' ? null : e.target.value
              )}
              className="w-48 min-h-[44px]"
            />
          </div>
          {interventionists.length === 0 && (
            <p className="text-sm text-text-muted">
              Add an interventionist to get started
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Schedule Grid */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              <ScheduleGrid
                interventionist={selectedInterventionist}
                groups={groups}
                constraints={gradeLevelConstraints}
                onDrop={handleDrop}
                isDragging={!!draggingGroup}
                dragOverSlot={dragOverSlot}
                onDragOver={setDragOverSlot}
              />
            </Card>
          </div>

          {/* Sidebar - Groups & Suggestions */}
          <div className="space-y-4">
            {/* Unscheduled Groups - Draggable */}
            <Card className="p-4">
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Unscheduled Groups
                {draggingGroup && (
                  <span className="text-xs bg-movement/20 text-movement px-2 py-0.5 rounded">
                    Drop on calendar
                  </span>
                )}
              </h3>
              {groups.length === 0 ? (
                <p className="text-sm text-text-muted">No groups created yet</p>
              ) : unscheduledGroups.length === 0 ? (
                <p className="text-sm text-green-600">All groups are scheduled!</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-text-muted mb-2">
                    Drag a group to the calendar to schedule
                  </p>
                  {unscheduledGroups.slice(0, 10).map(group => (
                    <div
                      key={group.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, group)}
                      onDragEnd={handleDragEnd}
                      className={`
                        p-2 bg-background rounded-lg text-sm cursor-grab
                        hover:bg-surface-hover transition-colors
                        flex items-center gap-2
                        ${draggingGroup?.id === group.id ? 'opacity-50 ring-2 ring-movement' : ''}
                      `}
                    >
                      <GripVertical className="w-4 h-4 text-text-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{group.name}</div>
                        <div className="text-text-muted text-xs">
                          Grade {group.grade} | {group.curriculum}
                        </div>
                      </div>
                    </div>
                  ))}
                  {unscheduledGroups.length > 10 && (
                    <p className="text-xs text-text-muted text-center">
                      +{unscheduledGroups.length - 10} more groups
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Suggestions Panel */}
            <SuggestionsPanel groups={groups} />
          </div>
        </div>

        {/* Interventionists Quick View */}
        {interventionists.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Interventionists
            </h3>
            <div className="flex flex-wrap gap-2">
              {interventionists.map(interventionist => (
                <button
                  key={interventionist.id}
                  onClick={() => handleEditInterventionist(String(interventionist.id))}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background hover:bg-surface-hover transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: interventionist.color }}
                  />
                  <span className="text-sm">{interventionist.name}</span>
                  {interventionist.availability.length > 0 && (
                    <span className="text-xs text-text-muted">
                      ({interventionist.availability.length} blocks)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Modals */}
        <InterventionistModal
          isOpen={isInterventionistModalOpen}
          onClose={() => {
            setIsInterventionistModalOpen(false);
            setEditingInterventionist(null);
          }}
          editingId={editingInterventionist}
        />

        <ConstraintsModal
          isOpen={isConstraintsModalOpen}
          onClose={() => setIsConstraintsModalOpen(false)}
        />
      </div>
    </AppLayout>
  );
}
