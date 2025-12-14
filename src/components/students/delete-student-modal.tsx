'use client';

import { ConfirmModal } from '@/components/ui/modal';
import type { Student } from '@/lib/supabase/types';

export interface DeleteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  student: Student | null;
  isLoading?: boolean;
}

export function DeleteStudentModal({
  isOpen,
  onClose,
  onConfirm,
  student,
  isLoading = false,
}: DeleteStudentModalProps) {
  if (!student) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Student"
      message={`Are you sure you want to remove ${student.name} from this group? This action cannot be undone.`}
      confirmText="Delete Student"
      cancelText="Cancel"
      variant="danger"
      isLoading={isLoading}
    />
  );
}
