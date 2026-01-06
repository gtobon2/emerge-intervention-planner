'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Modal, Button, Input, Select, Checkbox } from '@/components/ui';
import { useScheduleStore } from '@/stores/schedule';
import {
  WEEKDAYS,
  getDayShortName,
  generateTimeOptions,
  formatTimeDisplay,
} from '@/lib/scheduling/time-utils';
import type { WeekDay, WeeklyTimeBlock } from '@/lib/supabase/types';

interface InterventionistModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const timeOptions = generateTimeOptions(7, 17, 15).map(t => ({
  value: t,
  label: formatTimeDisplay(t),
}));

interface AvailabilityBlock {
  id: string;
  days: WeekDay[];
  startTime: string;
  endTime: string;
}

export function InterventionistModal({ isOpen, onClose, editingId }: InterventionistModalProps) {
  const {
    interventionists,
    createInterventionist,
    updateInterventionist,
    deleteInterventionist,
  } = useScheduleStore();

  const editingInterventionist = useMemo(() => {
    if (!editingId) return null;
    return interventionists.find(i => String(i.id) === editingId) || null;
  }, [interventionists, editingId]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when modal opens/closes or editing changes
  useEffect(() => {
    if (editingInterventionist) {
      setName(editingInterventionist.name);
      setEmail(editingInterventionist.email || '');
      setColor(editingInterventionist.color);
      setAvailability(
        editingInterventionist.availability.map((block, idx) => ({
          id: `block-${idx}`,
          days: block.days,
          startTime: block.startTime,
          endTime: block.endTime,
        }))
      );
    } else {
      setName('');
      setEmail('');
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setAvailability([]);
    }
  }, [editingInterventionist, isOpen]);

  const handleAddAvailabilityBlock = () => {
    setAvailability(prev => [
      ...prev,
      {
        id: `block-${Date.now()}`,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '08:00',
        endTime: '15:00',
      },
    ]);
  };

  const handleUpdateBlock = (id: string, updates: Partial<AvailabilityBlock>) => {
    setAvailability(prev =>
      prev.map(block => (block.id === id ? { ...block, ...updates } : block))
    );
  };

  const handleRemoveBlock = (id: string) => {
    setAvailability(prev => prev.filter(block => block.id !== id));
  };

  const handleToggleDay = (blockId: string, day: WeekDay) => {
    setAvailability(prev =>
      prev.map(block => {
        if (block.id !== blockId) return block;
        const days = block.days.includes(day)
          ? block.days.filter(d => d !== day)
          : [...block.days, day];
        return { ...block, days };
      })
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        email: email.trim() || undefined,
        color,
        availability: availability.map(block => ({
          days: block.days,
          startTime: block.startTime,
          endTime: block.endTime,
        })) as WeeklyTimeBlock[],
      };

      if (editingId) {
        await updateInterventionist(editingId, data);
      } else {
        await createInterventionist(data);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;

    setIsDeleting(true);
    try {
      await deleteInterventionist(editingId);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'Edit Interventionist' : 'Add Interventionist'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Ms. Johnson"
          />
          <Input
            label="Email (optional)"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="e.g., johnson@school.edu"
          />
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`
                  w-8 h-8 rounded-full transition-all
                  ${color === c ? 'ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'}
                `}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-secondary">
              Availability
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddAvailabilityBlock}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Time Block
            </Button>
          </div>

          {availability.length === 0 ? (
            <p className="text-sm text-text-muted p-4 bg-surface rounded-lg text-center">
              No availability set. Add a time block to specify when this interventionist is available.
            </p>
          ) : (
            <div className="space-y-4">
              {availability.map(block => (
                <div
                  key={block.id}
                  className="p-4 bg-surface rounded-lg border border-border"
                >
                  {/* Days */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {WEEKDAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(block.id, day)}
                        className={`
                          px-3 py-1 text-sm rounded-full transition-colors
                          ${block.days.includes(day)
                            ? 'bg-primary text-white'
                            : 'bg-background text-text-muted hover:bg-surface-hover'
                          }
                        `}
                      >
                        {getDayShortName(day)}
                      </button>
                    ))}
                  </div>

                  {/* Times */}
                  <div className="flex items-center gap-2">
                    <Select
                      options={timeOptions}
                      value={block.startTime}
                      onChange={e => handleUpdateBlock(block.id, { startTime: e.target.value })}
                      className="flex-1"
                    />
                    <span className="text-text-muted">to</span>
                    <Select
                      options={timeOptions}
                      value={block.endTime}
                      onChange={e => handleUpdateBlock(block.id, { endTime: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBlock(block.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-border">
          {editingId ? (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isValid || isSaving}>
              {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Interventionist'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
