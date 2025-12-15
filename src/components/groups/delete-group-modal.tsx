'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { GroupWithStudents } from '@/lib/supabase/types';

export interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  group: GroupWithStudents | null;
  sessionCount?: number;
  isLoading?: boolean;
}

export function DeleteGroupModal({
  isOpen,
  onClose,
  onConfirm,
  group,
  sessionCount = 0,
  isLoading = false,
}: DeleteGroupModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setError('');
    }
  }, [isOpen]);

  if (!group) return null;

  const studentCount = group.students?.length || 0;
  const canDelete = confirmText === group.name;

  const handleConfirm = async () => {
    if (!canDelete) {
      setError('Group name does not match');
      return;
    }

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError('Failed to delete group. Please try again.');
      console.error('Failed to delete group:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Group"
      size="md"
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-red-100">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>

        {/* Warning Message */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Delete "{group.name}"?
          </h3>
          <p className="text-sm text-text-muted">
            This action cannot be undone. This will permanently delete the group and all associated data.
          </p>
        </div>

        {/* Impact Summary */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-red-900">
            This will affect:
          </p>
          <ul className="text-sm text-red-800 space-y-1 ml-4">
            <li className="list-disc">
              <strong>{studentCount}</strong> student{studentCount !== 1 ? 's' : ''} will be removed from this group
            </li>
            <li className="list-disc">
              <strong>{sessionCount}</strong> session{sessionCount !== 1 ? 's' : ''} will be deleted
            </li>
            <li className="list-disc">
              All progress monitoring data for this group
            </li>
          </ul>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">
            Type <span className="font-bold text-red-600">{group.name}</span> to confirm:
          </label>
          <Input
            placeholder={group.name}
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              if (error) setError('');
            }}
            error={error}
            disabled={isLoading}
            autoFocus
          />
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
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={!canDelete || isLoading}
            isLoading={isLoading}
          >
            Delete Group
          </Button>
        </div>
      </div>
    </Modal>
  );
}
