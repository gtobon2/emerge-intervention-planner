'use client';

import { useState } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { Modal, Button, Input, Textarea } from '@/components/ui';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onStudentsAdded?: () => void;
}

interface StudentInput {
  name: string;
  notes: string;
}

export function AddStudentModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  onStudentsAdded,
}: AddStudentModalProps) {
  const [students, setStudents] = useState<StudentInput[]>([{ name: '', notes: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStudentRow = () => {
    setStudents([...students, { name: '', notes: '' }]);
  };

  const removeStudentRow = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const updateStudent = (index: number, field: keyof StudentInput, value: string) => {
    setStudents(students.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    ));
  };

  const handleSubmit = async () => {
    const validStudents = students.filter(s => s.name.trim());
    if (validStudents.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add each student
      for (const student of validStudents) {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: groupId,
            name: student.name.trim(),
            notes: student.notes.trim() || null,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add student');
        }
      }

      // Reset form
      setStudents([{ name: '', notes: '' }]);
      onStudentsAdded?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const validCount = students.filter(s => s.name.trim()).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Students to ${groupName}`} size="lg">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <p className="text-text-muted text-sm">
          Add one or more students to this group. You can add notes for each student (optional).
        </p>

        {/* Student Rows */}
        <div className="space-y-3">
          {students.map((student, index) => (
            <div key={index} className="flex gap-3 items-start p-3 bg-foundation rounded-lg">
              <User className="w-5 h-5 text-text-muted mt-2.5" />
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Student name *"
                  value={student.name}
                  onChange={(e) => updateStudent(index, 'name', e.target.value)}
                />
                <Input
                  placeholder="Notes (optional)"
                  value={student.notes}
                  onChange={(e) => updateStudent(index, 'notes', e.target.value)}
                />
              </div>
              {students.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStudentRow(index)}
                  className="text-tier3 mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add Another Button */}
        <Button
          variant="secondary"
          onClick={addStudentRow}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Another Student
        </Button>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={validCount === 0}
            isLoading={isLoading}
          >
            Add {validCount} Student{validCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
