'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type {
  Group,
  GroupUpdate,
  Curriculum,
  Tier,
  WilsonPosition,
  DeltaMathPosition,
  CaminoPosition,
  WordGenPosition,
  AmiraPosition,
  DespegandoPosition,
  CurriculumPosition,
} from '@/lib/supabase/types';

export interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: GroupUpdate) => Promise<void>;
  group: Group | null;
  isLoading?: boolean;
}

const curriculumOptions = [
  { value: 'wilson', label: 'Wilson Reading System' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
  { value: 'despegando', label: 'Despegando (Spanish)' },
];

const tierOptions = [
  { value: '2', label: 'Tier 2' },
  { value: '3', label: 'Tier 3' },
];

const dayOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
];

export function EditGroupModal({
  isOpen,
  onClose,
  onSave,
  group,
  isLoading = false,
}: EditGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    curriculum: 'wilson' as Curriculum,
    tier: 2 as Tier,
    grade: 1,
    schedule_days: [] as string[],
    schedule_time: '',
    schedule_duration: 30,
    notes: '',
  });

  // Curriculum position fields
  const [wilsonPosition, setWilsonPosition] = useState({ step: 1, substep: '1' });
  const [deltaMathPosition, setDeltaMathPosition] = useState({ standard: '' });
  const [caminoPosition, setCaminoPosition] = useState({ lesson: 1 });
  const [wordgenPosition, setWordgenPosition] = useState({ unit: 1, day: 1 });
  const [amiraPosition, setAmiraPosition] = useState<AmiraPosition>({ level: 'Emergent' });
  const [despegandoPosition, setDespegandoPosition] = useState<DespegandoPosition>({ phase: 1, lesson: 1 });

  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});

  // Reset form when modal opens/closes or group changes
  useEffect(() => {
    if (isOpen && group) {
      setFormData({
        name: group.name,
        curriculum: group.curriculum,
        tier: group.tier,
        grade: group.grade,
        schedule_days: group.schedule?.days || [],
        schedule_time: group.schedule?.time || '',
        schedule_duration: group.schedule?.duration || 30,
        notes: '',
      });

      // Set curriculum position based on curriculum type
      if (group.curriculum === 'wilson') {
        const pos = group.current_position as WilsonPosition;
        setWilsonPosition(pos);
      } else if (group.curriculum === 'delta_math') {
        const pos = group.current_position as DeltaMathPosition;
        setDeltaMathPosition({ standard: pos.standard });
      } else if (group.curriculum === 'camino') {
        const pos = group.current_position as CaminoPosition;
        setCaminoPosition(pos);
      } else if (group.curriculum === 'wordgen') {
        const pos = group.current_position as WordGenPosition;
        setWordgenPosition(pos);
      } else if (group.curriculum === 'amira') {
        const pos = group.current_position as AmiraPosition;
        setAmiraPosition(pos);
      }

      setErrors({});
    }
  }, [isOpen, group]);

  const validateForm = () => {
    const newErrors: { [key: string]: string | undefined } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }

    if (formData.grade < 0 || formData.grade > 12) {
      newErrors.grade = 'Grade must be between 0 and 12';
    }

    // Validate curriculum position based on type
    if (formData.curriculum === 'wilson') {
      if (wilsonPosition.step < 1 || wilsonPosition.step > 12) {
        newErrors.wilsonStep = 'Step must be between 1 and 12';
      }
      if (!wilsonPosition.substep.trim()) {
        newErrors.wilsonSubstep = 'Substep is required';
      }
    } else if (formData.curriculum === 'delta_math') {
      if (!deltaMathPosition.standard.trim()) {
        newErrors.deltaMathStandard = 'Standard is required';
      }
    } else if (formData.curriculum === 'camino') {
      if (caminoPosition.lesson < 1) {
        newErrors.caminoLesson = 'Lesson must be at least 1';
      }
    } else if (formData.curriculum === 'wordgen') {
      if (wordgenPosition.unit < 1) {
        newErrors.wordgenUnit = 'Unit must be at least 1';
      }
      if (wordgenPosition.day < 1 || wordgenPosition.day > 5) {
        newErrors.wordgenDay = 'Day must be between 1 and 5';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCurrentPosition = (): CurriculumPosition => {
    switch (formData.curriculum) {
      case 'wilson':
        return wilsonPosition;
      case 'delta_math':
        return deltaMathPosition;
      case 'camino':
        return caminoPosition;
      case 'wordgen':
        return wordgenPosition;
      case 'amira':
        return amiraPosition;
      case 'despegando':
        return despegandoPosition;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!group || !validateForm()) {
      return;
    }

    try {
      const updates: GroupUpdate = {
        name: formData.name.trim(),
        curriculum: formData.curriculum,
        tier: formData.tier,
        grade: formData.grade,
        current_position: getCurrentPosition(),
        schedule: {
          days: formData.schedule_days.length > 0 ? formData.schedule_days : undefined,
          time: formData.schedule_time || undefined,
          duration: formData.schedule_duration || undefined,
        },
      };

      await onSave(group.id, updates);
      onClose();
    } catch (err) {
      console.error('Failed to update group:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter((d) => d !== day)
        : [...prev.schedule_days, day],
    }));
  };

  if (!group) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Group"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Basic Information
          </h3>

          <Input
            label="Group Name"
            placeholder="e.g., Wilson Group A"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            disabled={isLoading}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Curriculum"
              options={curriculumOptions}
              value={formData.curriculum}
              onChange={(e) => handleChange('curriculum', e.target.value as Curriculum)}
              disabled={isLoading}
              required
            />

            <Select
              label="Tier"
              options={tierOptions}
              value={String(formData.tier)}
              onChange={(e) => handleChange('tier', parseInt(e.target.value) as Tier)}
              disabled={isLoading}
              required
            />

            <Input
              label="Grade"
              type="number"
              min="0"
              max="12"
              placeholder="e.g., 3"
              value={formData.grade}
              onChange={(e) => handleChange('grade', parseInt(e.target.value) || 0)}
              error={errors.grade}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Curriculum Position */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Current Position
          </h3>

          {formData.curriculum === 'wilson' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Step"
                type="number"
                min="1"
                max="12"
                placeholder="e.g., 3"
                value={wilsonPosition.step}
                onChange={(e) =>
                  setWilsonPosition({ ...wilsonPosition, step: parseInt(e.target.value) || 1 })
                }
                error={errors.wilsonStep}
                disabled={isLoading}
                required
              />
              <Input
                label="Substep"
                placeholder="e.g., 2"
                value={wilsonPosition.substep}
                onChange={(e) =>
                  setWilsonPosition({ ...wilsonPosition, substep: e.target.value })
                }
                error={errors.wilsonSubstep}
                disabled={isLoading}
                required
              />
            </div>
          )}

          {formData.curriculum === 'delta_math' && (
            <Input
              label="Standard"
              placeholder="e.g., 4.NF.1"
              value={deltaMathPosition.standard}
              onChange={(e) =>
                setDeltaMathPosition({ ...deltaMathPosition, standard: e.target.value })
              }
              error={errors.deltaMathStandard}
              disabled={isLoading}
              required
            />
          )}

          {formData.curriculum === 'camino' && (
            <Input
              label="Lesson"
              type="number"
              min="1"
              placeholder="e.g., 25"
              value={caminoPosition.lesson}
              onChange={(e) =>
                setCaminoPosition({ lesson: parseInt(e.target.value) || 1 })
              }
              error={errors.caminoLesson}
              disabled={isLoading}
              required
            />
          )}

          {formData.curriculum === 'wordgen' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Unit"
                type="number"
                min="1"
                placeholder="e.g., 3"
                value={wordgenPosition.unit}
                onChange={(e) =>
                  setWordgenPosition({ ...wordgenPosition, unit: parseInt(e.target.value) || 1 })
                }
                error={errors.wordgenUnit}
                disabled={isLoading}
                required
              />
              <Input
                label="Day"
                type="number"
                min="1"
                max="5"
                placeholder="e.g., 2"
                value={wordgenPosition.day}
                onChange={(e) =>
                  setWordgenPosition({ ...wordgenPosition, day: parseInt(e.target.value) || 1 })
                }
                error={errors.wordgenDay}
                disabled={isLoading}
                required
              />
            </div>
          )}

          {formData.curriculum === 'amira' && (
            <Select
              label="Level"
              options={[
                { value: 'Emergent', label: 'Emergent' },
                { value: 'Beginning', label: 'Beginning' },
                { value: 'Transitional', label: 'Transitional' },
                { value: 'Fluent', label: 'Fluent' },
              ]}
              value={amiraPosition.level}
              onChange={(e) =>
                setAmiraPosition({ level: e.target.value as AmiraPosition['level'] })
              }
              disabled={isLoading}
              required
            />
          )}
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Schedule (Optional)
          </h3>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Meeting Days
            </label>
            <div className="flex flex-wrap gap-2">
              {dayOptions.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDayToggle(day.value)}
                  disabled={isLoading}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      formData.schedule_days.includes(day.value)
                        ? 'bg-movement text-white'
                        : 'bg-foundation border border-text-muted/20 text-text-muted hover:bg-surface'
                    }
                  `}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Time"
              type="time"
              value={formData.schedule_time}
              onChange={(e) => handleChange('schedule_time', e.target.value)}
              disabled={isLoading}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              min="10"
              max="120"
              placeholder="e.g., 40"
              value={formData.schedule_duration || ''}
              onChange={(e) => handleChange('schedule_duration', parseInt(e.target.value) || 30)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-text-muted/10">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
