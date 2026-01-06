'use client';

import { useState } from 'react';
import { Lightbulb, ChevronRight, AlertCircle, CheckCircle, Clock, Calendar, Plus } from 'lucide-react';
import { Button, Card, Select, Input, Modal } from '@/components/ui';
import { useScheduleStore } from '@/stores/schedule';
import { useSessionsStore } from '@/stores/sessions';
import { useGroupsStore } from '@/stores/groups';
import {
  formatTimeDisplay,
  getDayDisplayName,
  getDayShortName,
  WEEKDAYS,
} from '@/lib/scheduling/time-utils';
import type { SuggestedTimeSlot, Group, WeekDay } from '@/lib/supabase/types';

interface SuggestionsPanelProps {
  groups: Group[];
}

export function SuggestionsPanel({ groups }: SuggestionsPanelProps) {
  const {
    suggestions,
    suggestionsGroupId,
    isCalculating,
    calculateSuggestions,
    clearSuggestions,
  } = useScheduleStore();

  const { createSession } = useSessionsStore();
  const { groups: allGroups } = useGroupsStore();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [sessionsPerWeek, setSessionsPerWeek] = useState('3');
  const [sessionDuration, setSessionDuration] = useState('30');

  // Scheduling modal state
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<SuggestedTimeSlot[]>([]);
  const [weeksToSchedule, setWeeksToSchedule] = useState('4');
  const [isCreatingSessions, setIsCreatingSessions] = useState(false);

  const groupOptions = [
    { value: '', label: 'Select a group...' },
    ...groups.map(g => ({ value: String(g.id), label: g.name })),
  ];

  const handleCalculate = () => {
    if (!selectedGroupId) return;

    calculateSuggestions(selectedGroupId, {
      sessionsPerWeek: parseInt(sessionsPerWeek),
      sessionDuration: parseInt(sessionDuration),
    });
  };

  const selectedGroup = groups.find(g => String(g.id) === selectedGroupId);

  // Toggle slot selection
  const toggleSlotSelection = (slot: SuggestedTimeSlot) => {
    setSelectedSlots(prev => {
      const exists = prev.some(s => s.day === slot.day && s.startTime === slot.startTime);
      if (exists) {
        return prev.filter(s => !(s.day === slot.day && s.startTime === slot.startTime));
      }
      return [...prev, slot];
    });
  };

  const isSlotSelected = (slot: SuggestedTimeSlot) => {
    return selectedSlots.some(s => s.day === slot.day && s.startTime === slot.startTime);
  };

  // Open scheduling modal with selected slots
  const handleOpenScheduleModal = () => {
    // Pre-select top N slots based on sessions per week
    const topSlots = suggestions
      .filter(s => s.conflicts.length === 0)
      .slice(0, parseInt(sessionsPerWeek));
    setSelectedSlots(topSlots);
    setIsSchedulingModalOpen(true);
  };

  // Get next date for a given weekday
  const getNextDateForDay = (day: WeekDay, weeksFromNow: number = 0): string => {
    const today = new Date();
    const dayIndex = WEEKDAYS.indexOf(day) + 1; // Monday = 1
    const todayIndex = today.getDay();

    // Calculate days until next occurrence
    let daysUntil = dayIndex - todayIndex;
    if (daysUntil <= 0) daysUntil += 7;

    // Add weeks offset
    daysUntil += weeksFromNow * 7;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);

    return targetDate.toISOString().split('T')[0];
  };

  // Create sessions for selected slots
  const handleCreateSessions = async () => {
    if (!selectedGroupId || selectedSlots.length === 0) return;

    setIsCreatingSessions(true);

    try {
      const group = allGroups.find(g => g.id === selectedGroupId);
      if (!group) throw new Error('Group not found');

      const weeks = parseInt(weeksToSchedule);
      let sessionsCreated = 0;

      // Create sessions for each selected slot across all weeks
      for (let week = 0; week < weeks; week++) {
        for (const slot of selectedSlots) {
          const date = getNextDateForDay(slot.day, week);

          await createSession({
            group_id: selectedGroupId,
            date,
            time: slot.startTime,
            status: 'planned',
            curriculum_position: group.current_position,
            advance_after: false,
            planned_otr_target: null,
            planned_practice_items: null,
            planned_response_formats: null,
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
            notes: null,
            next_session_notes: null,
            fidelity_checklist: null,
          });

          sessionsCreated++;
        }
      }

      // Close modal and clear suggestions
      setIsSchedulingModalOpen(false);
      setSelectedSlots([]);
      clearSuggestions();

      // Show success (could add a toast notification here)
      console.log(`Created ${sessionsCreated} sessions`);
    } catch (error) {
      console.error('Error creating sessions:', error);
    } finally {
      setIsCreatingSessions(false);
    }
  };

  return (
    <>
      <Card className="p-4">
        <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Schedule Suggestions
        </h3>

        {/* Configuration */}
        <div className="space-y-3 mb-4">
          <Select
            options={groupOptions}
            value={selectedGroupId}
            onChange={e => {
              setSelectedGroupId(e.target.value);
              clearSuggestions();
            }}
            className="w-full"
          />

          {selectedGroupId && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-text-muted block mb-1">Sessions/Week</label>
                  <Select
                    options={[
                      { value: '1', label: '1' },
                      { value: '2', label: '2' },
                      { value: '3', label: '3' },
                      { value: '4', label: '4' },
                      { value: '5', label: '5' },
                    ]}
                    value={sessionsPerWeek}
                    onChange={e => setSessionsPerWeek(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">Duration (min)</label>
                  <Select
                    options={[
                      { value: '20', label: '20 min' },
                      { value: '30', label: '30 min' },
                      { value: '45', label: '45 min' },
                      { value: '60', label: '60 min' },
                    ]}
                    value={sessionDuration}
                    onChange={e => setSessionDuration(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleCalculate}
                disabled={isCalculating}
              >
                {isCalculating ? 'Calculating...' : 'Find Available Slots'}
              </Button>
            </>
          )}
        </div>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                Showing best {Math.min(suggestions.length, parseInt(sessionsPerWeek))} slots for {selectedGroup?.name}
              </span>
              <button
                onClick={clearSuggestions}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Clear
              </button>
            </div>

            {suggestions.slice(0, parseInt(sessionsPerWeek)).map((slot, idx) => (
              <SuggestionCard key={`${slot.day}-${slot.startTime}`} slot={slot} rank={idx + 1} />
            ))}

            {suggestions.length > parseInt(sessionsPerWeek) && (
              <details className="group">
                <summary className="text-xs text-text-muted cursor-pointer hover:text-text-primary py-2">
                  Show {suggestions.length - parseInt(sessionsPerWeek)} more options...
                </summary>
                <div className="space-y-2 pt-2">
                  {suggestions.slice(parseInt(sessionsPerWeek)).map((slot, idx) => (
                    <SuggestionCard
                      key={`${slot.day}-${slot.startTime}`}
                      slot={slot}
                      rank={idx + parseInt(sessionsPerWeek) + 1}
                    />
                  ))}
                </div>
              </details>
            )}

            {/* Schedule Button */}
            <Button
              className="w-full mt-4 gap-2"
              onClick={handleOpenScheduleModal}
            >
              <Plus className="w-4 h-4" />
              Schedule These Sessions
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!selectedGroupId && groups.length > 0 && (
          <p className="text-sm text-text-muted text-center py-4">
            Select a group to find optimal scheduling slots
          </p>
        )}

        {groups.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">
            Create intervention groups first to get scheduling suggestions
          </p>
        )}
      </Card>

      {/* Scheduling Confirmation Modal */}
      <Modal
        isOpen={isSchedulingModalOpen}
        onClose={() => setIsSchedulingModalOpen(false)}
        title="Schedule Sessions"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Create recurring sessions for <strong>{selectedGroup?.name}</strong> based on the suggested time slots.
          </p>

          {/* Selected Slots */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">
              Selected Time Slots
            </label>
            <div className="space-y-2">
              {suggestions.slice(0, 5).map((slot) => (
                <label
                  key={`${slot.day}-${slot.startTime}`}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${isSlotSelected(slot)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-surface-hover'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSlotSelected(slot)}
                    onChange={() => toggleSlotSelection(slot)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {getDayDisplayName(slot.day)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                    </div>
                  </div>
                  {slot.conflicts.length === 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Weeks to Schedule */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">
              Schedule for how many weeks?
            </label>
            <Select
              options={[
                { value: '1', label: '1 week' },
                { value: '2', label: '2 weeks' },
                { value: '4', label: '4 weeks' },
                { value: '6', label: '6 weeks' },
                { value: '8', label: '8 weeks' },
                { value: '12', label: '12 weeks (quarter)' },
              ]}
              value={weeksToSchedule}
              onChange={e => setWeeksToSchedule(e.target.value)}
            />
          </div>

          {/* Summary */}
          <div className="p-3 bg-surface rounded-lg">
            <div className="text-sm">
              <strong>{selectedSlots.length * parseInt(weeksToSchedule)}</strong> sessions will be created
            </div>
            <div className="text-xs text-text-muted mt-1">
              {selectedSlots.length} session{selectedSlots.length !== 1 ? 's' : ''} per week for {weeksToSchedule} week{parseInt(weeksToSchedule) !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setIsSchedulingModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSessions}
              disabled={selectedSlots.length === 0 || isCreatingSessions}
            >
              {isCreatingSessions ? 'Creating...' : 'Create Sessions'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface SuggestionCardProps {
  slot: SuggestedTimeSlot;
  rank: number;
}

function SuggestionCard({ slot, rank }: SuggestionCardProps) {
  const hasConflicts = slot.conflicts.length > 0;

  return (
    <div
      className={`
        p-3 rounded-lg border transition-colors
        ${hasConflicts
          ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
          : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          ${hasConflicts
            ? 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-200'
            : 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-200'
          }
        `}>
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3 h-3 text-text-muted" />
            <span className="font-medium text-sm">
              {getDayDisplayName(slot.day)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock className="w-3 h-3" />
            <span>
              {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
            </span>
          </div>

          {hasConflicts && (
            <div className="mt-2 space-y-1">
              {slot.conflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"
                >
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{conflict.description}</span>
                </div>
              ))}
            </div>
          )}

          {!hasConflicts && (
            <div className="mt-1 flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
              <CheckCircle className="w-3 h-3" />
              <span>No conflicts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
