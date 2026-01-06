'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useScheduleStore } from '@/stores/schedule';
import {
  WEEKDAYS,
  getDayShortName,
  generateTimeOptions,
  formatTimeDisplay,
} from '@/lib/scheduling/time-utils';
import type { WeekDay, ConstraintType, WeeklyTimeBlock } from '@/lib/supabase/types';

interface ConstraintsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const constraintTypeOptions = [
  { value: 'lunch', label: 'Lunch' },
  { value: 'core_instruction', label: 'Core Instruction' },
  { value: 'specials', label: 'Specials (Art, Music, PE)' },
  { value: 'therapy', label: 'Therapy/Services' },
  { value: 'other', label: 'Other' },
];

const gradeOptions = [
  { value: '0', label: 'Kindergarten' },
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
];

const timeOptions = generateTimeOptions(7, 17, 15).map(t => ({
  value: t,
  label: formatTimeDisplay(t),
}));

interface NewConstraint {
  grade: string;
  label: string;
  type: ConstraintType;
  days: WeekDay[];
  startTime: string;
  endTime: string;
}

const emptyConstraint: NewConstraint = {
  grade: '',
  label: '',
  type: 'lunch',
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  startTime: '11:30',
  endTime: '12:00',
};

export function ConstraintsModal({ isOpen, onClose }: ConstraintsModalProps) {
  const {
    gradeLevelConstraints,
    createGradeLevelConstraint,
    deleteGradeLevelConstraint,
  } = useScheduleStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newConstraint, setNewConstraint] = useState<NewConstraint>(emptyConstraint);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());

  // Group constraints by grade
  const constraintsByGrade = gradeLevelConstraints.reduce((acc, constraint) => {
    if (!acc[constraint.grade]) {
      acc[constraint.grade] = [];
    }
    acc[constraint.grade].push(constraint);
    return acc;
  }, {} as Record<number, typeof gradeLevelConstraints>);

  const toggleGrade = (grade: number) => {
    setExpandedGrades(prev => {
      const next = new Set(prev);
      if (next.has(grade)) {
        next.delete(grade);
      } else {
        next.add(grade);
      }
      return next;
    });
  };

  const handleToggleDay = (day: WeekDay) => {
    setNewConstraint(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSave = async () => {
    if (!newConstraint.grade || !newConstraint.label.trim()) return;

    setIsSaving(true);
    try {
      await createGradeLevelConstraint({
        grade: parseInt(newConstraint.grade),
        label: newConstraint.label.trim(),
        type: newConstraint.type,
        schedule: {
          days: newConstraint.days,
          startTime: newConstraint.startTime,
          endTime: newConstraint.endTime,
        } as WeeklyTimeBlock,
      });
      setNewConstraint(emptyConstraint);
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteGradeLevelConstraint(String(id));
  };

  const isValid = newConstraint.grade && newConstraint.label.trim() && newConstraint.days.length > 0;

  // Common presets for quick setup
  const handleApplyPreset = (preset: 'elementary_lunch' | 'middle_lunch') => {
    if (preset === 'elementary_lunch') {
      // Apply typical elementary lunch times
      const lunchTimes: Record<number, { start: string; end: string }> = {
        0: { start: '11:00', end: '11:30' },
        1: { start: '11:15', end: '11:45' },
        2: { start: '11:30', end: '12:00' },
        3: { start: '11:45', end: '12:15' },
        4: { start: '12:00', end: '12:30' },
        5: { start: '12:15', end: '12:45' },
      };

      Object.entries(lunchTimes).forEach(([grade, times]) => {
        createGradeLevelConstraint({
          grade: parseInt(grade),
          label: 'Lunch',
          type: 'lunch',
          schedule: {
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            startTime: times.start,
            endTime: times.end,
          },
        });
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grade-Level Constraints"
      size="lg"
    >
      <div className="space-y-6">
        <p className="text-sm text-text-muted">
          Set times when students in each grade cannot be pulled for intervention
          (e.g., lunch, core instruction, specials).
        </p>

        {/* Quick Setup */}
        {gradeLevelConstraints.length === 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              Quick Setup
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
              Start with typical school schedule constraints:
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleApplyPreset('elementary_lunch')}
            >
              Apply Elementary Lunch Times (K-5)
            </Button>
          </div>
        )}

        {/* Existing Constraints */}
        {Object.keys(constraintsByGrade).length > 0 && (
          <div className="space-y-2">
            {Object.entries(constraintsByGrade)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([grade, constraints]) => (
                <div key={grade} className="border border-border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleGrade(parseInt(grade))}
                    className="w-full flex items-center justify-between p-3 hover:bg-surface-hover transition-colors"
                  >
                    <span className="font-medium">
                      {parseInt(grade) === 0 ? 'Kindergarten' : `Grade ${grade}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-muted">
                        {constraints.length} constraint{constraints.length !== 1 ? 's' : ''}
                      </span>
                      {expandedGrades.has(parseInt(grade)) ? (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      )}
                    </div>
                  </button>

                  {expandedGrades.has(parseInt(grade)) && (
                    <div className="border-t border-border p-3 space-y-2">
                      {constraints.map(constraint => (
                        <div
                          key={constraint.id}
                          className="flex items-center justify-between p-2 bg-surface rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-sm">{constraint.label}</div>
                            <div className="text-xs text-text-muted">
                              {constraint.schedule.days.map(d => getDayShortName(d)).join(', ')} |{' '}
                              {formatTimeDisplay(constraint.schedule.startTime)} -{' '}
                              {formatTimeDisplay(constraint.schedule.endTime)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(constraint.id!)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Add New Constraint */}
        {isAdding ? (
          <div className="p-4 bg-surface rounded-lg border border-border space-y-4">
            <h4 className="font-medium">New Constraint</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Grade"
                options={gradeOptions}
                value={newConstraint.grade}
                onChange={e => setNewConstraint(prev => ({ ...prev, grade: e.target.value }))}
              />
              <Select
                label="Type"
                options={constraintTypeOptions}
                value={newConstraint.type}
                onChange={e => setNewConstraint(prev => ({ ...prev, type: e.target.value as ConstraintType }))}
              />
            </div>

            <Input
              label="Label"
              value={newConstraint.label}
              onChange={e => setNewConstraint(prev => ({ ...prev, label: e.target.value }))}
              placeholder="e.g., Lunch, Core Reading, Specials"
            />

            {/* Days */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Days
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`
                      px-3 py-1 text-sm rounded-full transition-colors
                      ${newConstraint.days.includes(day)
                        ? 'bg-primary text-white'
                        : 'bg-background text-text-muted hover:bg-surface-hover'
                      }
                    `}
                  >
                    {getDayShortName(day)}
                  </button>
                ))}
              </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Start Time"
                options={timeOptions}
                value={newConstraint.startTime}
                onChange={e => setNewConstraint(prev => ({ ...prev, startTime: e.target.value }))}
              />
              <Select
                label="End Time"
                options={timeOptions}
                value={newConstraint.endTime}
                onChange={e => setNewConstraint(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isValid || isSaving}>
                {isSaving ? 'Saving...' : 'Add Constraint'}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4" />
            Add Constraint
          </Button>
        )}

        {/* Close */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}
