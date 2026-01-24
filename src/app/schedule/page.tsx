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
import {
  UnscheduledDaySlot,
  getUnscheduledDaySlots,
  getScheduledDays,
} from '@/lib/scheduling/day-slots';
import Link from 'next/link';
import type { WeekDay, Group } from '@/lib/supabase/types';

export default function SchedulePage() {
  const {
    interventionists,
    constraints,
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
  const [draggingSlot, setDraggingSlot] = useState<UnscheduledDaySlot | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: WeekDay; timeStr: string } | null>(null);

  useEffect(() => {
    fetchAll();
    fetchGroups();
    fetchAllSessions();
    fetchCurrentCycle();
    fetchAllEvents();
  }, [fetchAll, fetchGroups, fetchAllSessions, fetchCurrentCycle, fetchAllEvents]);

  // Get dates for current week (Monday-Friday) - matching ScheduleGrid
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + daysFromMonday);

    const dates = new Map<WeekDay, string>();
    WEEKDAYS.forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayNum = String(date.getDate()).padStart(2, '0');
      dates.set(day, `${year}-${month}-${dayNum}`);
    });

    return dates;
  }, []);

  // Get unscheduled day slots (one per group per scheduled day)
  const unscheduledDaySlots = useMemo(() => {
    return getUnscheduledDaySlots(groups, allSessions, weekDates);
  }, [groups, allSessions, weekDates]);

  // Also keep track of groups without any schedule configured
  const groupsWithoutSchedule = useMemo(() => {
    return groups.filter(g => {
      const days = getScheduledDays(g.schedule);
      return days.length === 0;
    });
  }, [groups]);

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
  const handleDragStart = useCallback((e: React.DragEvent, slot: UnscheduledDaySlot) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      groupId: slot.group.id,
      day: slot.day,
      time: slot.time,
    }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingSlot(slot);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingSlot(null);
    setDragOverSlot(null);
  }, []);

  const handleDrop = useCallback(async (day: WeekDay, timeStr: string, dateStr: string) => {
    if (!draggingSlot) return;

    // Validate day matches (must drop on the correct day column)
    if (draggingSlot.day !== day) {
      console.warn(`Cannot drop ${draggingSlot.group.name} (${draggingSlot.day}) on ${day}`);
      setDraggingSlot(null);
      setDragOverSlot(null);
      return;
    }

    // Use configured time if available, otherwise use drop target time
    const sessionTime = draggingSlot.time || timeStr;

    try {
      await createSession({
        group_id: draggingSlot.group.id,
        date: dateStr,
        time: sessionTime,
        status: 'planned',
        curriculum_position: draggingSlot.group.current_position,
        advance_after: false,
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
      fetchAllSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }

    setDraggingSlot(null);
    setDragOverSlot(null);
  }, [draggingSlot, createSession, fetchAllSessions]);

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
                constraints={constraints}
                onDrop={handleDrop}
                isDragging={!!draggingSlot}
                dragOverSlot={dragOverSlot}
                onDragOver={setDragOverSlot}
              />
            </Card>
          </div>

          {/* Sidebar - Groups & Suggestions */}
          <div className="space-y-4">
            {/* Unscheduled Day Slots - Draggable */}
            <Card className="p-4">
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Unscheduled Sessions
                {draggingSlot && (
                  <span className="text-xs bg-movement/20 text-movement px-2 py-0.5 rounded">
                    Drop on {getDayDisplayName(draggingSlot.day)}
                  </span>
                )}
              </h3>
              {groups.length === 0 ? (
                <p className="text-sm text-text-muted">No groups created yet</p>
              ) : unscheduledDaySlots.length === 0 && groupsWithoutSchedule.length === 0 ? (
                <p className="text-sm text-green-600">All sessions scheduled for this week!</p>
              ) : (
                <div className="space-y-2">
                  {unscheduledDaySlots.length > 0 && (
                    <>
                      <p className="text-xs text-text-muted mb-2">
                        Drag to matching day column to schedule
                      </p>
                      {unscheduledDaySlots.slice(0, 15).map(slot => (
                        <div
                          key={`${slot.group.id}-${slot.day}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, slot)}
                          onDragEnd={handleDragEnd}
                          className={`
                            p-2 bg-background rounded-lg text-sm cursor-grab
                            hover:bg-surface-hover transition-colors
                            flex items-center gap-2
                            ${draggingSlot?.group.id === slot.group.id && draggingSlot?.day === slot.day
                              ? 'opacity-50 ring-2 ring-movement' : ''}
                          `}
                        >
                          <GripVertical className="w-4 h-4 text-text-muted flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{slot.group.name}</span>
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                {getDayDisplayName(slot.day).slice(0, 3)}
                              </span>
                            </div>
                            <div className="text-text-muted text-xs">
                              Grade {slot.group.grade} | {slot.group.curriculum}
                              {slot.time && ` | ${formatTimeDisplay(slot.time)}`}
                            </div>
                          </div>
                        </div>
                      ))}
                      {unscheduledDaySlots.length > 15 && (
                        <p className="text-xs text-text-muted text-center">
                          +{unscheduledDaySlots.length - 15} more sessions
                        </p>
                      )}
                    </>
                  )}

                  {/* Groups without schedule configured */}
                  {groupsWithoutSchedule.length > 0 && (
                    <>
                      <div className="border-t border-border my-3 pt-3">
                        <p className="text-xs text-text-muted mb-2">
                          Groups needing schedule setup:
                        </p>
                        {groupsWithoutSchedule.slice(0, 5).map(group => (
                          <Link
                            key={group.id}
                            href={`/groups/${group.id}`}
                            className="block p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm hover:bg-yellow-100 dark:hover:bg-yellow-900/30 mb-2"
                          >
                            <div className="font-medium">{group.name}</div>
                            <div className="text-text-muted text-xs">
                              Click to configure schedule
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
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
