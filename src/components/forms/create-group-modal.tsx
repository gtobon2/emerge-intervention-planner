'use client';

import { useState } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useGroupsStore } from '@/stores/groups';
import type { Curriculum, Tier, CurriculumPosition } from '@/lib/supabase/types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (groupId: string) => void;
}

const curriculumOptions = [
  { value: '', label: 'Select curriculum...' },
  { value: 'wilson', label: 'Wilson Reading System' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

const tierOptions = [
  { value: '', label: 'Select tier...' },
  { value: '2', label: 'Tier 2 - Targeted Intervention' },
  { value: '3', label: 'Tier 3 - Intensive Intervention' },
];

const gradeOptions = [
  { value: '', label: 'Select grade...' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Grade ${i + 1}`,
  })),
];

const dayOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
];

function getDefaultPosition(curriculum: Curriculum): CurriculumPosition {
  switch (curriculum) {
    case 'wilson':
      return { step: 1, substep: '1.1' };
    case 'delta_math':
      return { standard: '1.OA.1' };
    case 'camino':
      return { lesson: 1 };
    case 'wordgen':
      return { unit: 1, day: 1 };
    case 'amira':
      return { level: 'Emergent' };
  }
}

export function CreateGroupModal({ isOpen, onClose, onCreated }: CreateGroupModalProps) {
  const { createGroup, isLoading } = useGroupsStore();

  const [name, setName] = useState('');
  const [curriculum, setCurriculum] = useState<Curriculum | ''>('');
  const [tier, setTier] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [time, setTime] = useState('');

  const handleSubmit = async () => {
    if (!name || !curriculum || !tier || !grade) return;

    const group = await createGroup({
      name,
      curriculum,
      tier: parseInt(tier) as Tier,
      grade: parseInt(grade),
      current_position: getDefaultPosition(curriculum),
      schedule: selectedDays.length > 0 ? {
        days: selectedDays,
        time: time || undefined,
      } : null,
    });

    if (group) {
      // Reset form
      setName('');
      setCurriculum('');
      setTier('');
      setGrade('');
      setSelectedDays([]);
      setTime('');
      onCreated?.(group.id);
      onClose();
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const isValid = name && curriculum && tier && grade;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group" size="lg">
      <div className="space-y-5">
        {/* Group Name */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Group Name *
          </label>
          <Input
            placeholder="e.g., Wilson Group A, Delta Math 3rd Grade"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Curriculum */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Curriculum *
          </label>
          <Select
            options={curriculumOptions}
            value={curriculum}
            onChange={(e) => setCurriculum(e.target.value as Curriculum)}
          />
        </div>

        {/* Tier & Grade Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tier *
            </label>
            <Select
              options={tierOptions}
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Grade *
            </label>
            <Select
              options={gradeOptions}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
        </div>

        {/* Schedule (Optional) */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Schedule (Optional)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {dayOptions.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedDays.includes(day.value)
                    ? 'bg-movement text-white'
                    : 'bg-foundation text-text-muted hover:text-text-primary'
                }`}
              >
                {day.label.slice(0, 3)}
              </button>
            ))}
          </div>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="Session time"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            isLoading={isLoading}
          >
            Create Group
          </Button>
        </div>
      </div>
    </Modal>
  );
}
