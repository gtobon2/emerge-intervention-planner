'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Student, StudentInsert } from '@/lib/supabase/types';

export interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<StudentInsert, 'group_id'>) => Promise<void>;
  mode: 'create' | 'edit';
  student?: Student;
  isLoading?: boolean;
}

export function StudentFormModal({
  isOpen,
  onClose,
  onSave,
  mode,
  student,
  isLoading = false,
}: StudentFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
  });
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Reset form when modal opens/closes or student changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && student) {
        setFormData({
          name: student.name,
          notes: student.notes || '',
        });
      } else {
        setFormData({
          name: '',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, student]);

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Student name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave({
        name: formData.name.trim(),
        notes: formData.notes.trim() || null,
      });
      onClose();
    } catch (err) {
      // Error handling is done in the parent component
      console.error('Failed to save student:', err);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Add Student' : 'Edit Student'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Student Name"
          placeholder="Enter student name"
          value={formData.name}
          onChange={handleChange('name')}
          error={errors.name}
          disabled={isLoading}
          required
          autoFocus
        />

        <Textarea
          label="Notes"
          placeholder="Add any notes about this student (optional)"
          value={formData.notes}
          onChange={handleChange('notes')}
          disabled={isLoading}
          rows={4}
        />

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {mode === 'create' ? 'Add Student' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
