'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Building2, User } from 'lucide-react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useScheduleStore, canCreateSchoolwide, getDefaultScope, canModifyConstraint } from '@/stores/schedule';
import { useAuthStore } from '@/stores/auth';
import {
  WEEKDAYS,
  getDayShortName,
  generateTimeOptions,
  formatTimeDisplay,
} from '@/lib/scheduling/time-utils';
import type { WeekDay, ConstraintType, ConstraintScope, ScheduleConstraintWithCreator } from '@/lib/supabase/types';

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
  { value: 0, label: 'K' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
];

const gradeBands = [
  { label: 'K-2', grades: [0, 1, 2] },
  { label: '3-5', grades: [3, 4, 5] },
  { label: '6-8', grades: [6, 7, 8] },
];

const timeOptions = generateTimeOptions(7, 17, 15).map(t => ({
  value: t,
  label: formatTimeDisplay(t),
}));

interface NewConstraint {
  grades: number[];
  label: string;
  type: ConstraintType;
  scope: ConstraintScope;
  days: WeekDay[];
  startTime: string;
  endTime: string;
}

export function ConstraintsModal({ isOpen, onClose }: ConstraintsModalProps) {
  const {
    constraints,
    createConstraint,
    deleteConstraint,
  } = useScheduleStore();

  const { user, userRole } = useAuthStore();
  const isAdmin = userRole === 'admin';

  const emptyConstraint: NewConstraint = {
    grades: [],
    label: '',
    type: 'lunch',
    scope: getDefaultScope(userRole || 'interventionist'),
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '11:30',
    endTime: '12:00',
  };

  const [isAdding, setIsAdding] = useState(false);
  const [newConstraint, setNewConstraint] = useState<NewConstraint>(emptyConstraint);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group constraints by scope, then by grade bands
  const groupedConstraints = useMemo(() => {
    const schoolwide = constraints.filter(c => c.scope === 'schoolwide');
    const personal = constraints.filter(c => c.scope === 'personal');
    return { schoolwide, personal };
  }, [constraints]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const handleToggleGrade = (grade: number) => {
    setNewConstraint(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade].sort((a, b) => a - b),
    }));
  };

  const handleToggleGradeBand = (bandGrades: number[]) => {
    setNewConstraint(prev => {
      const allSelected = bandGrades.every(g => prev.grades.includes(g));
      if (allSelected) {
        // Remove all grades in this band
        return {
          ...prev,
          grades: prev.grades.filter(g => !bandGrades.includes(g)),
        };
      } else {
        // Add all grades in this band
        const newGrades = [...new Set([...prev.grades, ...bandGrades])].sort((a, b) => a - b);
        return { ...prev, grades: newGrades };
      }
    });
  };

  const handleSelectAllGrades = () => {
    setNewConstraint(prev => ({
      ...prev,
      grades: prev.grades.length === gradeOptions.length
        ? []
        : gradeOptions.map(g => g.value),
    }));
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
    if (!newConstraint.grades.length || !newConstraint.label.trim() || !user?.id) return;

    // Validate scope permission
    if (newConstraint.scope === 'schoolwide' && !canCreateSchoolwide(userRole || 'interventionist')) {
      return;
    }

    setIsSaving(true);
    try {
      await createConstraint({
        scope: newConstraint.scope,
        applicable_grades: newConstraint.grades,
        label: newConstraint.label.trim(),
        type: newConstraint.type,
        days: newConstraint.days,
        start_time: newConstraint.startTime,
        end_time: newConstraint.endTime,
      }, user.id);
      setNewConstraint(emptyConstraint);
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteConstraint(id);
  };

  const formatGrades = (grades: number[]): string => {
    if (grades.length === 0) return 'No grades';
    if (grades.length === 9) return 'All grades';
    return grades.map(g => g === 0 ? 'K' : g.toString()).join(', ');
  };

  const isValid = newConstraint.grades.length > 0 && newConstraint.label.trim() && newConstraint.days.length > 0;

  const renderConstraintList = (constraintList: ScheduleConstraintWithCreator[], title: string, icon: React.ReactNode) => {
    if (constraintList.length === 0) return null;

    const isExpanded = expandedGroups.has(title);

    return (
      <div className="border border-border rounded-lg">
        <button
          type="button"
          onClick={() => toggleGroup(title)}
          className="w-full flex items-center justify-between p-3 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">
              {constraintList.length} constraint{constraintList.length !== 1 ? 's' : ''}
            </span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronRight className="w-4 h-4 text-text-muted" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-border p-3 space-y-2">
            {constraintList.map(constraint => (
              <div
                key={constraint.id}
                className="flex items-center justify-between p-2 bg-surface rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{constraint.label}</span>
                    <span className="text-xs text-text-muted bg-background px-1.5 py-0.5 rounded">
                      {formatGrades(constraint.applicable_grades)}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {constraint.days.map(d => getDayShortName(d as WeekDay)).join(', ')} |{' '}
                    {formatTimeDisplay(constraint.start_time)} - {formatTimeDisplay(constraint.end_time)}
                  </div>
                  {constraint.creator && (
                    <div className="text-xs text-text-muted mt-0.5">
                      Created by {constraint.creator.full_name}
                    </div>
                  )}
                </div>
                {user?.id && canModifyConstraint(constraint, user.id, userRole || 'interventionist') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(constraint.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Constraints"
      size="lg"
    >
      <div className="space-y-6">
        <p className="text-sm text-text-muted">
          Set times when students cannot be pulled for intervention (e.g., lunch, core instruction, specials).
          {isAdmin && ' As an admin, you can create schoolwide constraints visible to all users.'}
        </p>

        {/* Existing Constraints */}
        {constraints.length > 0 && (
          <div className="space-y-2">
            {renderConstraintList(
              groupedConstraints.schoolwide,
              'Schoolwide Constraints',
              <Building2 className="w-4 h-4 text-blue-600" />
            )}
            {renderConstraintList(
              groupedConstraints.personal,
              'Personal Constraints',
              <User className="w-4 h-4 text-green-600" />
            )}
          </div>
        )}

        {/* Add New Constraint */}
        {isAdding ? (
          <div className="p-4 bg-surface rounded-lg border border-border space-y-4">
            <h4 className="font-medium">New Constraint</h4>

            {/* Scope selector (admin only) */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Visibility
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewConstraint(prev => ({ ...prev, scope: 'schoolwide' }))}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                      ${newConstraint.scope === 'schoolwide'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                        : 'bg-background border-border text-text-muted hover:bg-surface-hover'
                      }
                    `}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Schoolwide</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewConstraint(prev => ({ ...prev, scope: 'personal' }))}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                      ${newConstraint.scope === 'personal'
                        ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                        : 'bg-background border-border text-text-muted hover:bg-surface-hover'
                      }
                    `}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Personal</span>
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {newConstraint.scope === 'schoolwide'
                    ? 'Visible to all users and blocks time for everyone'
                    : 'Only visible to you and only blocks time on your schedule'}
                </p>
              </div>
            )}

            {/* Grade Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Grades
              </label>
              {/* Quick select buttons */}
              <div className="flex flex-wrap gap-2 mb-2">
                {gradeBands.map(band => {
                  const allSelected = band.grades.every(g => newConstraint.grades.includes(g));
                  return (
                    <button
                      key={band.label}
                      type="button"
                      onClick={() => handleToggleGradeBand(band.grades)}
                      className={`
                        px-3 py-1 text-xs font-medium rounded-full transition-colors
                        ${allSelected
                          ? 'bg-primary text-white'
                          : 'bg-background text-text-muted hover:bg-surface-hover border border-border'
                        }
                      `}
                    >
                      {band.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleSelectAllGrades}
                  className={`
                    px-3 py-1 text-xs font-medium rounded-full transition-colors
                    ${newConstraint.grades.length === gradeOptions.length
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-muted hover:bg-surface-hover border border-border'
                    }
                  `}
                >
                  All
                </button>
              </div>
              {/* Individual grade checkboxes */}
              <div className="flex flex-wrap gap-2">
                {gradeOptions.map(grade => (
                  <button
                    key={grade.value}
                    type="button"
                    onClick={() => handleToggleGrade(grade.value)}
                    className={`
                      w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition-colors
                      ${newConstraint.grades.includes(grade.value)
                        ? 'bg-primary text-white'
                        : 'bg-background text-text-muted hover:bg-surface-hover border border-border'
                      }
                    `}
                  >
                    {grade.label}
                  </button>
                ))}
              </div>
              {newConstraint.grades.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Select at least one grade</p>
              )}
            </div>

            {/* Type and Label */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Type"
                options={constraintTypeOptions}
                value={newConstraint.type}
                onChange={e => setNewConstraint(prev => ({ ...prev, type: e.target.value as ConstraintType }))}
              />
              <Input
                label="Label"
                value={newConstraint.label}
                onChange={e => setNewConstraint(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Lunch, Core Reading"
              />
            </div>

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
                        : 'bg-background text-text-muted hover:bg-surface-hover border border-border'
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
