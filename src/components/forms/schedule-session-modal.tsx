'use client';

import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import { useSessionsStore } from '@/stores/sessions';
import type { Group, CurriculumPosition } from '@/lib/supabase/types';

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onScheduled?: (sessionId: string) => void;
}

export function ScheduleSessionModal({
  isOpen,
  onClose,
  group,
  onScheduled,
}: ScheduleSessionModalProps) {
  const { createSession, isLoading } = useSessionsStore();

  // Default to today
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [time, setTime] = useState(group.schedule?.time || '');
  const [plannedOtr, setPlannedOtr] = useState<string>(group.tier === 3 ? '15' : '20');
  const [notes, setNotes] = useState('');

  // Position state based on curriculum
  const [position, setPosition] = useState<CurriculumPosition>(group.current_position);

  const handleSubmit = async () => {
    if (!date) return;

    const session = await createSession({
      group_id: group.id,
      date,
      time: time || null,
      status: 'planned',
      curriculum_position: position,
      advance_after: false,
      planned_otr_target: parseInt(plannedOtr) || null,
      notes: notes || null,
      // Planning fields (optional)
      planned_response_formats: null,
      planned_practice_items: null,
      cumulative_review_items: null,
      anticipated_errors: null,
      // Logging fields (filled after session)
      actual_otr_count: null,
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

    if (session) {
      // Reset form
      setDate(today);
      setTime(group.schedule?.time || '');
      setPlannedOtr(group.tier === 3 ? '15' : '20');
      setNotes('');
      onScheduled?.(session.id);
      onClose();
    }
  };

  // Render position editor based on curriculum
  const renderPositionEditor = () => {
    switch (group.curriculum) {
      case 'wilson':
        const wilsonPos = position as { step: number; substep: string };
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Step</label>
              <Select
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: String(i + 1),
                  label: `Step ${i + 1}`,
                }))}
                value={String(wilsonPos.step)}
                onChange={(e) => setPosition({ ...wilsonPos, step: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Substep</label>
              <Input
                value={wilsonPos.substep}
                onChange={(e) => setPosition({ ...wilsonPos, substep: e.target.value })}
                placeholder="e.g., 1.1"
              />
            </div>
          </div>
        );

      case 'delta_math':
        const deltaPos = position as { standard: string };
        return (
          <Input
            value={deltaPos.standard}
            onChange={(e) => setPosition({ standard: e.target.value })}
            placeholder="e.g., 3.OA.1"
          />
        );

      case 'camino':
        const caminoPos = position as { lesson: number };
        return (
          <Select
            options={Array.from({ length: 40 }, (_, i) => ({
              value: String(i + 1),
              label: `Lesson ${i + 1}`,
            }))}
            value={String(caminoPos.lesson)}
            onChange={(e) => setPosition({ lesson: parseInt(e.target.value) })}
          />
        );

      case 'wordgen':
        const wordgenPos = position as { unit: number; day: number };
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Unit</label>
              <Select
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: String(i + 1),
                  label: `Unit ${i + 1}`,
                }))}
                value={String(wordgenPos.unit)}
                onChange={(e) => setPosition({ ...wordgenPos, unit: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Day</label>
              <Select
                options={Array.from({ length: 5 }, (_, i) => ({
                  value: String(i + 1),
                  label: `Day ${i + 1}`,
                }))}
                value={String(wordgenPos.day)}
                onChange={(e) => setPosition({ ...wordgenPos, day: parseInt(e.target.value) })}
              />
            </div>
          </div>
        );

      case 'amira':
        const amiraPos = position as { level: string };
        return (
          <Select
            options={[
              { value: 'Emergent', label: 'Emergent' },
              { value: 'Beginning', label: 'Beginning' },
              { value: 'Transitional', label: 'Transitional' },
              { value: 'Fluent', label: 'Fluent' },
            ]}
            value={amiraPos.level}
            onChange={(e) => setPosition({ level: e.target.value as any })}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule Session - ${group.name}`} size="lg">
      <div className="space-y-5">
        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date *
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Time
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Curriculum Position */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Curriculum Position
          </label>
          {renderPositionEditor()}
        </div>

        {/* Planned OTR Target */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Planned OTR Target
          </label>
          <Input
            type="number"
            value={plannedOtr}
            onChange={(e) => setPlannedOtr(e.target.value)}
            min={1}
            className="w-32"
          />
          <p className="text-xs text-text-muted mt-1">
            Recommended: {group.tier === 3 ? '15+' : '20+'} for Tier {group.tier}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Planning Notes (Optional)
          </label>
          <Textarea
            placeholder="Any notes for this session..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!date}
            isLoading={isLoading}
          >
            Schedule Session
          </Button>
        </div>
      </div>
    </Modal>
  );
}
