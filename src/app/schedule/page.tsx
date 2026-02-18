'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Settings, Users, Calendar, Clock, ChevronLeft, ChevronRight, GripVertical, Download, FileText, CheckSquare, X, Trash2, Ban } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Modal, Input, Select, Card, Checkbox } from '@/components/ui';
import { ConfirmModal } from '@/components/ui/modal';
import { useScheduleStore } from '@/stores/schedule';
import { db } from '@/lib/local-db';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { useCyclesStore } from '@/stores/cycles';
import { useSchoolCalendarStore } from '@/stores/school-calendar';
import { ScheduleGrid } from '@/components/schedule/ScheduleGrid';
import { InterventionistModal } from '@/components/schedule/InterventionistModal';
import { ConstraintsModal } from '@/components/schedule/ConstraintsModal';
import { SuggestionsPanel } from '@/components/schedule/SuggestionsPanel';
import { formatTimeDisplay, WEEKDAYS, getDayDisplayName, getCycleDatesForWeekday, formatDateShort, getWeekDayFromDate } from '@/lib/scheduling/time-utils';
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
import type { WeekDay, Group, SessionWithGroup } from '@/lib/supabase/types';

export default function SchedulePage() {
  const {
    interventionists,
    constraints,
    studentConstraints,
    fetchAll,
    isLoading,
    error,
    selectedInterventionistId,
    setSelectedInterventionist,
  } = useScheduleStore();

  const { groups, fetchGroups } = useGroupsStore();
  const { allSessions, fetchAllSessions, createSession, updateSession, deleteSession, cancelSession, rescheduleSession } = useSessionsStore();
  const { currentCycle, fetchCurrentCycle } = useCyclesStore();
  const { events: calendarEvents, fetchAllEvents } = useSchoolCalendarStore();

  const [isInterventionistModalOpen, setIsInterventionistModalOpen] = useState(false);
  const [isConstraintsModalOpen, setIsConstraintsModalOpen] = useState(false);
  const [editingInterventionist, setEditingInterventionist] = useState<string | null>(null);

  // Drag and drop state - now using SchedulableGroup for flexible drops
  const [draggingGroup, setDraggingGroup] = useState<SchedulableGroup | null>(null);
  const [draggingSession, setDraggingSession] = useState<SessionWithGroup | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: WeekDay; timeStr: string } | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  
  // Cycle scheduling confirmation modal
  const [pendingDrop, setPendingDrop] = useState<{
    group: SchedulableGroup;
    day: WeekDay;
    time: string;
    date: string;
    cycleDates: string[]; // All dates in cycle for this weekday
  } | null>(null);
  const [isCreatingSessions, setIsCreatingSessions] = useState(false);

  // Session reschedule confirmation modal
  const [pendingReschedule, setPendingReschedule] = useState<{
    session: SessionWithGroup;
    newDay: WeekDay;
    newTime: string;
    newDate: string;
    originalDay: WeekDay;
    futureSessionsCount: number; // How many future sessions on the original weekday
  } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Confirmation dialog state for cancel/delete operations
  const [cancelConfirm, setCancelConfirm] = useState<{ sessionId: string; sessionName?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ sessionId: string; sessionName?: string } | null>(null);
  const [bulkCancelConfirm, setBulkCancelConfirm] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchGroups();
    fetchAllSessions();
    fetchCurrentCycle();
    fetchAllEvents();
  }, [fetchAll, fetchGroups, fetchAllSessions, fetchCurrentCycle, fetchAllEvents]);

  // Student names for student constraint display
  const [studentNames, setStudentNames] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    const loadStudentNames = async () => {
      if (studentConstraints.length === 0) return;
      const studentIds = [...new Set(studentConstraints.map(sc => sc.student_id))];
      const students = await Promise.all(
        studentIds.map(id => db.students.get(id))
      );
      const names = new Map<number, string>();
      students.forEach(s => { if (s) names.set(s.id!, s.name); });
      setStudentNames(names);
    };
    loadStudentNames();
  }, [studentConstraints]);

  // Bulk selection state
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());

  const toggleSessionSelection = useCallback((sessionId: string) => {
    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }, []);

  const exitBulkSelect = useCallback(() => {
    setBulkSelectMode(false);
    setSelectedSessionIds(new Set());
  }, []);

  const handleBulkCancel = useCallback(async () => {
    if (selectedSessionIds.size === 0) return;
    setBulkCancelConfirm(true);
  }, [selectedSessionIds]);

  const executeBulkCancel = useCallback(async () => {
    for (const id of selectedSessionIds) {
      await cancelSession(id);
    }
    fetchAllSessions();
    exitBulkSelect();
    setBulkCancelConfirm(false);
  }, [selectedSessionIds, cancelSession, fetchAllSessions, exitBulkSelect]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedSessionIds.size === 0) return;
    setBulkDeleteConfirm(true);
  }, [selectedSessionIds]);

  const executeBulkDelete = useCallback(async () => {
    for (const id of selectedSessionIds) {
      await deleteSession(id);
    }
    fetchAllSessions();
    exitBulkSelect();
    setBulkDeleteConfirm(false);
  }, [selectedSessionIds, deleteSession, fetchAllSessions, exitBulkSelect]);

  // Week navigation state
  const [weekOffset, setWeekOffset] = useState(0);

  // Get dates for selected week (Monday-Friday)
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + daysFromMonday);
    
    // Apply week offset
    monday.setDate(monday.getDate() + (weekOffset * 7));

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
  }, [weekOffset]);

  // Week navigation handlers
  const goToPreviousWeek = useCallback(() => setWeekOffset(prev => prev - 1), []);
  const goToNextWeek = useCallback(() => setWeekOffset(prev => prev + 1), []);
  const goToCurrentWeek = useCallback(() => setWeekOffset(0), []);

  // Sessions for the current week (used for exports)
  const weekSessions = useMemo(() => {
    const weekDateSet = new Set(weekDates.values());
    const groupMap = new Map(groups.map(g => [g.id, g]));
    return allSessions
      .filter(s => weekDateSet.has(s.date))
      .map(s => ({ ...s, group: groupMap.get(s.group_id)! }))
      .filter(s => s.group) as SessionWithGroup[];
  }, [allSessions, weekDates, groups]);

  // Format week range for display
  const weekRangeDisplay = useMemo(() => {
    const mondayDate = weekDates.get('monday')!;
    const fridayDate = weekDates.get('friday')!;
    return `${formatDateShort(mondayDate)} – ${formatDateShort(fridayDate)}`;
  }, [weekDates]);

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

  // Session rescheduling handlers
  const handleSessionDragStart = useCallback((session: SessionWithGroup) => {
    setDraggingSession(session);
    setDropError(null);
  }, []);

  const handleSessionDragEnd = useCallback(() => {
    setDraggingSession(null);
    setDragOverSlot(null);
  }, []);

  const handleDrop = useCallback(async (day: WeekDay, timeStr: string, dateStr: string) => {
    setDropError(null);

    // Handle session rescheduling (dragging existing session)
    if (draggingSession) {
      // Check if dropping on the same slot (no change needed)
      const currentDay = getWeekDayFromDate(draggingSession.date);
      const currentTime = draggingSession.time;
      if (currentDay === day && currentTime === timeStr) {
        setDraggingSession(null);
        setDragOverSlot(null);
        return;
      }

      // Check if group already has a different session on this day
      const otherSessionOnDay = allSessions.find(s => 
        s.group_id === draggingSession.group_id && 
        s.id !== draggingSession.id &&
        getWeekDayFromDate(s.date) === day &&
        weekDates.get(day) === s.date
      );
      
      if (otherSessionOnDay) {
        setDropError(`${draggingSession.group.name} already has another session on ${day}`);
        setDraggingSession(null);
        setDragOverSlot(null);
        return;
      }

      // Check for constraint conflicts
      const duration = getScheduleDuration(draggingSession.group.schedule);
      const conflictingConstraint = checkConstraintConflict(
        day,
        timeStr,
        duration,
        draggingSession.group.grade,
        constraints
      );

      if (conflictingConstraint) {
        setDropError(
          `Cannot reschedule Grade ${draggingSession.group.grade} during ${conflictingConstraint.label} ` +
          `(${conflictingConstraint.start_time}-${conflictingConstraint.end_time})`
        );
        setDraggingSession(null);
        setDragOverSlot(null);
        return;
      }

      // Count future sessions for this group on the original weekday
      const originalDay = currentDay!;
      const futureSessionsOnOriginalDay = allSessions.filter(s => {
        if (s.group_id !== draggingSession.group_id) return false;
        if (s.id === draggingSession.id) return false;
        if (s.status === 'cancelled' || s.status === 'completed') return false;
        if (s.date <= draggingSession.date) return false;
        
        const sessionDay = getWeekDayFromDate(s.date);
        return sessionDay === originalDay;
      }).length;

      // If there are future sessions on the same weekday, show the confirmation modal
      if (futureSessionsOnOriginalDay > 0) {
        setPendingReschedule({
          session: draggingSession,
          newDay: day,
          newTime: timeStr,
          newDate: dateStr,
          originalDay,
          futureSessionsCount: futureSessionsOnOriginalDay,
        });
        setDraggingSession(null);
        setDragOverSlot(null);
        return;
      }

      // No future sessions, just reschedule this one session
      try {
        await rescheduleSession(draggingSession.id, dateStr, timeStr, false);
      } catch (error) {
        console.error('Failed to reschedule session:', error);
        setDropError('Failed to reschedule session. Please try again.');
      }

      setDraggingSession(null);
      setDragOverSlot(null);
      return;
    }

    // Handle new group scheduling (dragging from sidebar)
    if (!draggingGroup) return;

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

    // If there's a current cycle, show confirmation modal to schedule for whole cycle
    if (currentCycle) {
      const cycleDates = getCycleDatesForWeekday(
        currentCycle.start_date,
        currentCycle.end_date,
        day
      );
      
      // Only show modal if there are future dates in the cycle
      if (cycleDates.length > 1) {
        setPendingDrop({
          group: draggingGroup,
          day,
          time: sessionTime,
          date: dateStr,
          cycleDates,
        });
        setDraggingGroup(null);
        setDragOverSlot(null);
        return;
      }
    }

    // No cycle or single date - create session directly
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
  }, [draggingGroup, draggingSession, allSessions, weekDates, constraints, currentCycle, createSession, updateSession, fetchAllSessions]);

  // Handle creating sessions for the cycle
  const handleCreateCycleSessions = useCallback(async (forEntireCycle: boolean) => {
    if (!pendingDrop) return;
    
    setIsCreatingSessions(true);
    
    try {
      const datesToSchedule = forEntireCycle 
        ? pendingDrop.cycleDates 
        : [pendingDrop.date];
      
      // Create sessions for each date
      for (const date of datesToSchedule) {
        await createSession({
          group_id: pendingDrop.group.group.id,
          date,
          time: pendingDrop.time,
          status: 'planned',
          curriculum_position: pendingDrop.group.group.current_position,
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
      }
      
      fetchAllSessions();
    } catch (error) {
      console.error('Failed to create sessions:', error);
      setDropError('Failed to create sessions. Please try again.');
    } finally {
      setIsCreatingSessions(false);
      setPendingDrop(null);
    }
  }, [pendingDrop, createSession, fetchAllSessions]);

  // Handle rescheduling sessions (single or all future)
  const handleRescheduleConfirm = useCallback(async (applyToFuture: boolean) => {
    if (!pendingReschedule) return;
    
    setIsRescheduling(true);
    
    try {
      const result = await rescheduleSession(
        pendingReschedule.session.id,
        pendingReschedule.newDate,
        pendingReschedule.newTime,
        applyToFuture
      );
      
      if (result) {
        // Success - could add a toast notification here
      }
    } catch (error) {
      console.error('Failed to reschedule sessions:', error);
      setDropError('Failed to reschedule sessions. Please try again.');
    } finally {
      setIsRescheduling(false);
      setPendingReschedule(null);
    }
  }, [pendingReschedule, rescheduleSession]);

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

        {/* Week Navigation */}
        <div className="flex items-center justify-center gap-2 p-3 bg-surface rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousWeek}
            className="p-2"
            title="Previous Week"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-text-muted" />
            <span className="font-semibold text-text-primary min-w-[140px] text-center">
              {weekRangeDisplay}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextWeek}
            className="p-2"
            title="Next Week"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          
          {weekOffset !== 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={goToCurrentWeek}
              className="ml-2"
            >
              Today
            </Button>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => { const { exportScheduleToPDF } = await import('@/lib/export'); exportScheduleToPDF(weekSessions, weekRangeDisplay); }}
              className="p-2"
              title="Export PDF"
              disabled={weekSessions.length === 0}
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => { const { exportScheduleToCSV } = await import('@/lib/export'); exportScheduleToCSV(weekSessions, weekRangeDisplay); }}
              className="p-2"
              title="Export CSV"
              disabled={weekSessions.length === 0}
            >
              <Download className="w-4 h-4" />
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

          <div className="sm:ml-auto">
            <Button
              variant={bulkSelectMode ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => bulkSelectMode ? exitBulkSelect() : setBulkSelectMode(true)}
              className="gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              {bulkSelectMode ? 'Exit Select' : 'Select'}
            </Button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {bulkSelectMode && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedSessionIds.size} session{selectedSessionIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkCancel}
                disabled={selectedSessionIds.size === 0}
                className="gap-1.5 text-yellow-700"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedSessionIds.size === 0}
                className="gap-1.5 text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitBulkSelect}
                className="p-1.5"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

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
                weekDates={weekDates}
                onDrop={handleDrop}
                isDragging={!!draggingGroup}
                dragOverSlot={dragOverSlot}
                onDragOver={setDragOverSlot}
                onSessionDragStart={handleSessionDragStart}
                onSessionDragEnd={handleSessionDragEnd}
                draggingSession={draggingSession}
                onDeleteSession={(id, name) => {
                  setDeleteConfirm({ sessionId: id, sessionName: name });
                }}
                onCancelSession={(id, name) => {
                  setCancelConfirm({ sessionId: id, sessionName: name });
                }}
                bulkSelectMode={bulkSelectMode}
                selectedSessionIds={selectedSessionIds}
                onToggleSessionSelection={toggleSessionSelection}
                studentConstraints={studentConstraints}
                studentNames={studentNames}
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

        {/* Cycle Scheduling Confirmation Modal */}
        <Modal
          isOpen={!!pendingDrop}
          onClose={() => !isCreatingSessions && setPendingDrop(null)}
          title="Schedule for Entire Cycle?"
          size="sm"
        >
          {pendingDrop && (
            <div className="space-y-4">
              <p className="text-text-secondary">
                <strong>{pendingDrop.group.group.name}</strong> on{' '}
                <strong>{getDayDisplayName(pendingDrop.day)}s</strong> at{' '}
                <strong>{formatTimeDisplay(pendingDrop.time)}</strong>
              </p>
              
              {currentCycle && (
                <div className="p-3 bg-surface rounded-lg">
                  <p className="text-sm text-text-muted mb-2">
                    <strong>{currentCycle.name}</strong>: {formatDateShort(currentCycle.start_date)} – {formatDateShort(currentCycle.end_date)}
                  </p>
                  <p className="text-sm">
                    This will create <strong>{pendingDrop.cycleDates.length} sessions</strong> for every {getDayDisplayName(pendingDrop.day)} in the cycle.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => handleCreateCycleSessions(false)}
                  disabled={isCreatingSessions}
                  className="flex-1"
                >
                  Just This Week
                </Button>
                <Button
                  onClick={() => handleCreateCycleSessions(true)}
                  disabled={isCreatingSessions}
                  isLoading={isCreatingSessions}
                  className="flex-1"
                >
                  Entire Cycle ({pendingDrop.cycleDates.length})
                </Button>
              </div>

              <button
                onClick={() => setPendingDrop(null)}
                disabled={isCreatingSessions}
                className="w-full text-center text-sm text-text-muted hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </Modal>

        {/* Session Reschedule Confirmation Modal */}
        <Modal
          isOpen={!!pendingReschedule}
          onClose={() => !isRescheduling && setPendingReschedule(null)}
          title="Apply to Future Sessions?"
          size="sm"
        >
          {pendingReschedule && (
            <div className="space-y-4">
              <p className="text-text-secondary">
                Moving <strong>{pendingReschedule.session.group.name}</strong> from{' '}
                <strong>{getDayDisplayName(pendingReschedule.originalDay)}</strong> to{' '}
                <strong>{getDayDisplayName(pendingReschedule.newDay)}</strong> at{' '}
                <strong>{formatTimeDisplay(pendingReschedule.newTime)}</strong>
              </p>

              <div className="p-3 bg-surface rounded-lg">
                <p className="text-sm">
                  There {pendingReschedule.futureSessionsCount === 1 ? 'is' : 'are'}{' '}
                  <strong>{pendingReschedule.futureSessionsCount}</strong> future{' '}
                  {pendingReschedule.futureSessionsCount === 1 ? 'session' : 'sessions'} for this group on{' '}
                  {getDayDisplayName(pendingReschedule.originalDay)}s.
                </p>
                <p className="text-sm text-text-muted mt-2">
                  Would you like to move all future {getDayDisplayName(pendingReschedule.originalDay)} sessions
                  to {getDayDisplayName(pendingReschedule.newDay)}?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => handleRescheduleConfirm(false)}
                  disabled={isRescheduling}
                  className="flex-1"
                >
                  Just This One
                </Button>
                <Button
                  onClick={() => handleRescheduleConfirm(true)}
                  disabled={isRescheduling}
                  isLoading={isRescheduling}
                  className="flex-1"
                >
                  All Future ({pendingReschedule.futureSessionsCount + 1})
                </Button>
              </div>

              <button
                onClick={() => setPendingReschedule(null)}
                disabled={isRescheduling}
                className="w-full text-center text-sm text-text-muted hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </Modal>

        {/* Cancel Session Confirmation Modal */}
        <ConfirmModal
          isOpen={!!cancelConfirm}
          onClose={() => setCancelConfirm(null)}
          onConfirm={async () => {
            if (cancelConfirm) {
              await cancelSession(cancelConfirm.sessionId);
              fetchAllSessions();
              setCancelConfirm(null);
            }
          }}
          title="Cancel Session?"
          message={`This will mark the session${cancelConfirm?.sessionName ? ` for ${cancelConfirm.sessionName}` : ''} as cancelled. You can reschedule it later if needed.`}
          confirmText="Cancel Session"
          variant="danger"
        />

        {/* Delete Session Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={async () => {
            if (deleteConfirm) {
              await deleteSession(deleteConfirm.sessionId);
              fetchAllSessions();
              setDeleteConfirm(null);
            }
          }}
          title="Delete Session?"
          message={`This will permanently delete the session${deleteConfirm?.sessionName ? ` for ${deleteConfirm.sessionName}` : ''}. This action cannot be undone.`}
          confirmText="Delete Session"
          variant="danger"
        />

        {/* Bulk Cancel Confirmation Modal */}
        <ConfirmModal
          isOpen={bulkCancelConfirm}
          onClose={() => setBulkCancelConfirm(false)}
          onConfirm={executeBulkCancel}
          title="Cancel Selected Sessions?"
          message={`This will mark ${selectedSessionIds.size} session${selectedSessionIds.size !== 1 ? 's' : ''} as cancelled. You can reschedule them later if needed.`}
          confirmText={`Cancel ${selectedSessionIds.size} Session${selectedSessionIds.size !== 1 ? 's' : ''}`}
          variant="danger"
        />

        {/* Bulk Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={bulkDeleteConfirm}
          onClose={() => setBulkDeleteConfirm(false)}
          onConfirm={executeBulkDelete}
          title="Delete Selected Sessions?"
          message={`This will permanently delete ${selectedSessionIds.size} session${selectedSessionIds.size !== 1 ? 's' : ''}. This action cannot be undone.`}
          confirmText={`Delete ${selectedSessionIds.size} Session${selectedSessionIds.size !== 1 ? 's' : ''}`}
          variant="danger"
        />
      </div>
    </AppLayout>
  );
}
