'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useGroupsStore } from '@/stores/groups';
import type { Curriculum, Tier, CurriculumPosition, GroupWithStudents } from '@/lib/supabase/types';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupWithStudents;
  onUpdated?: () => void;
}

const curriculumOptions = [
  { value: 'wilson', label: 'Wilson Reading System' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

const tierOptions = [
  { value: '2', label: 'Tier 2 - Targeted Intervention' },
  { value: '3', label: 'Tier 3 - Intensive Intervention' },
];

const gradeOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Grade ${i + 1}`,
}));

const dayOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
];

export function EditGroupModal({ isOpen, onClose, group, onUpdated }: EditGroupModalProps) {
  const { updateGroup, isLoading } = useGroupsStore();

  const [name, setName] = useState(group.name);
  const [curriculum, setCurriculum] = useState<Curriculum>(group.curriculum);
  const [tier, setTier] = useState<string>(String(group.tier));
  const [grade, setGrade] = useState<string>(String(group.grade));
  const [selectedDays, setSelectedDays] = useState<string[]>(group.schedule?.days || []);
  const [time, setTime] = useState(group.schedule?.time || '');

  // Reset form when group changes
  useEffect(() => {
    setName(group.name);
    setCurriculum(group.curriculum);
    setTier(String(group.tier));
    setGrade(String(group.grade));
    setSelectedDays(group.schedule?.days || []);
    setTime(group.schedule?.time || '');
  }, [group]);

  const handleSubmit = async () => {
    if (!name || !curriculum || !tier || !grade) return;

    await updateGroup(group.id, {
      name,
      curriculum,
      tier: parseInt(tier) as Tier,
      grade: parseInt(grade),
      schedule: selectedDays.length > 0 ? {
        days: selectedDays,
        time: time || undefined,
      } : null,
    });

    onUpdated?.();
    onClose();
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Group" size="lg">
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
          <p className="text-xs text-text-muted mt-1">
            Note: Changing curriculum won&apos;t update existing session positions
          </p>
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
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
