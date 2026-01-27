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
  SchedulableGroup,
  getUnscheduledDaySlots,
  getScheduledDays,
  getSchedulableGroups,
  hasSessionOnDay,
  getScheduleDuration,
  checkConstraintConflict,
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
  const { allSessions, fetchAllSessions, createSession, deleteSession, cancelSession } = useSessionsStore();
  const { currentCycle, fetchCurrentCycle } = useCyclesStore();
  const { events: calendarEvents, fetchAllEvents } = useSchoolCalendarStore();

  const [isInterventionistModalOpen, setIsInterventionistModalOpen] = useState(false);
  const [isConstraintsModalOpen, setIsConstraintsModalOpen] = useState(false);
  const [editingInterventionist, setEditingInterventionist] = useState<string | null>(null);

  // Drag and drop state - now using SchedulableGroup for flexible drops
  const [draggingGroup, setDraggingGroup] = useState<SchedulableGroup | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: WeekDay; timeStr: string } | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);

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

  // Get schedulable groups (flexible - can drop on any day)
  const schedulableGroups = useMemo(() => {
    return getSchedulableGroups(groups, allSessions, weekDates);
  }, [groups, allSessions, weekDates]);

  // Legacy: unscheduled day slots (keeping for backward compatibility)
  const unscheduledDaySlots = useMemo(() => {
    return getUnscheduledDaySlots(groups, allSessions, weekDates);
  }, [groups, allSessions, weekDates]);

  // Groups that have no schedule configured at all (sessions_per_week = 0 or no schedule)
  const groupsWithoutSchedule = useMemo(() => {
    return groups.filter(g => !g.schedule);
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

  // Drag and drop handlers - flexible scheduling
  const handleDragStart = useCallback((e: React.DragEvent, schedulable: SchedulableGroup) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      groupId: schedulable.group.id,
      time: schedulable.preferredTime,
    }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingGroup(schedulable);
    setDropError(null); // Clear any previous error when starting a new drag
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingGroup(null);
    setDragOverSlot(null);
  }, []);

  const handleDrop = useCallback(async (day: WeekDay, timeStr: string, dateStr: string) => {
    if (!draggingGroup) return;
    setDropError(null);

    // Check if group already has a session on this day (prevent duplicates)
    if (hasSessionOnDay(draggingGroup.group.id, day, allSessions, weekDates)) {
      setDropError(`${draggingGroup.group.name} already has a session on ${day}`);
      setDraggingGroup(null);
      setDragOverSlot(null);
      return;
    }

    // Use configured preferred time if available, otherwise use drop target time
    const sessionTime = draggingGroup.preferredTime || timeStr;

    // Check for constraint conflicts (lunch, core instruction, etc.)
    const conflictingConstraint = checkConstraintConflict(
      day,
      sessionTime,
      draggingGroup.duration,
      draggingGroup.group.grade,
      constraints
    );

    if (conflictingConstraint) {
      setDropError(
        `Cannot schedule Grade ${draggingGroup.group.grade} during ${conflictingConstraint.label} ` +
        `(${conflictingConstraint.start_time}-${conflictingConstraint.end_time})`
      );
      setDraggingGroup(null);
      setDragOverSlot(null);
      return;
    }

    try {
      await createSession({
        group_id: draggingGroup.group.id,
        date: dateStr,
        time: sessionTime,
        status: 'planned',
        curriculum_position: draggingGroup.group.current_position,
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

    setDraggingGroup(null);
    setDragOverSlot(null);
  }, [draggingGroup, allSessions, weekDates, constraints, createSession, fetchAllSessions]);

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

        {/* Drop Error Message */}
        {dropError && (
          <div 
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center justify-between"
            onClick={() => setDropError(null)}
          >
            <span>⚠️ {dropError}</span>
            <button 
              className="text-red-500 hover:text-red-700 ml-2"
              onClick={() => setDropError(null)}
            >
              ✕
            </button>
          </div>
        )}

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
                isDragging={!!draggingGroup}
                dragOverSlot={dragOverSlot}
                onDragOver={setDragOverSlot}
                onDeleteSession={async (id) => {
                  await deleteSession(id);
                  fetchAllSessions();
                }}
                onCancelSession={async (id) => {
                  await cancelSession(id);
                  fetchAllSessions();
                }}
              />
            </Card>
          </div>

          {/* Sidebar - Groups & Suggestions */}
          <div className="space-y-4">
            {/* Schedulable Groups - Draggable to ANY day */}
            <Card className="p-4">
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Groups to Schedule
                {draggingGroup && (
                  <span className="text-xs bg-movement/20 text-movement px-2 py-0.5 rounded">
                    Drop on any day
                  </span>
                )}
              </h3>
              {groups.length === 0 ? (
                <p className="text-sm text-text-muted">No groups created yet</p>
              ) : schedulableGroups.length === 0 && groupsWithoutSchedule.length === 0 ? (
                <p className="text-sm text-green-600">All sessions scheduled for this week! ✓</p>
              ) : (
                <div className="space-y-2">
                  {schedulableGroups.length > 0 && (
                    <>
                      <p className="text-xs text-text-muted mb-2">
                        Drag to any day column (one session per day max)
                      </p>
                      {schedulableGroups.slice(0, 15).map(item => (
                        <div
                          key={item.group.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item)}
                          onDragEnd={handleDragEnd}
                          className={`
                            p-2 bg-background rounded-lg text-sm cursor-grab
                            hover:bg-surface-hover transition-colors
                            flex items-center gap-2
                            ${draggingGroup?.group.id === item.group.id
                              ? 'opacity-50 ring-2 ring-movement' : ''}
                          `}
                        >
                          <GripVertical className="w-4 h-4 text-text-muted flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{item.group.name}</span>
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                {item.remainingSlots}/{item.sessionsNeeded}
                              </span>
                            </div>
                            <div className="text-text-muted text-xs">
                              Grade {item.group.grade} | {item.group.curriculum}
                              {item.preferredTime && ` | ${formatTimeDisplay(item.preferredTime)}`}
                            </div>
                            {item.scheduledDays.length > 0 && (
                              <div className="text-xs text-green-600 mt-0.5">
                                ✓ {item.scheduledDays.map(d => d.slice(0, 3)).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {schedulableGroups.length > 15 && (
                        <p className="text-xs text-text-muted text-center">
                          +{schedulableGroups.length - 15} more groups
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
