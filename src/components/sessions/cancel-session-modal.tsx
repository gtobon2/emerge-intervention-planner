'use client';

import { useState } from 'react';
import { X, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Session, Group } from '@/lib/supabase/types';

interface CancelSessionModalProps {
  session: Session;
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  onCancel: (sessionId: string, reason?: string) => void;
  onReschedule?: (sessionId: string, reason?: string) => void;
}

export function CancelSessionModal({
  session,
  group,
  isOpen,
  onClose,
  onCancel,
  onReschedule,
}: CancelSessionModalProps) {
  const [reason, setReason] = useState('');
  const [willReschedule, setWillReschedule] = useState(false);

  if (!isOpen) return null;

  // Only allow cancelling if session is planned
  if (session.status !== 'planned') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cannot Cancel Session</h2>
          <p className="text-gray-600 mb-4">
            Only planned sessions can be cancelled. This session has a status of &quot;{session.status}&quot;.
          </p>
          <Button variant="primary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const handleCancel = () => {
    if (willReschedule && onReschedule) {
      onReschedule(session.id, reason || undefined);
    } else {
      onCancel(session.id, reason || undefined);
    }
    onClose();
  };

  const sessionDate = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cancel Session</h2>
              <p className="text-sm text-gray-600">{group.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Session Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Session Date:</span>
            </div>
            <p className="text-gray-900 font-medium">{sessionDate}</p>
            {session.time && (
              <p className="text-sm text-gray-600 mt-1">
                Time: {session.time}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Note:</strong> This will mark the session as cancelled. This action can be reversed by editing the session status.
            </p>
          </div>

          {/* Cancellation Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Student absence, school event, illness..."
              className="w-full px-3 py-2 border rounded-lg text-sm h-20 resize-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          {/* Reschedule Option */}
          {onReschedule && (
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={willReschedule}
                  onChange={(e) => setWillReschedule(e.target.checked)}
                  className="mt-1 w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Reschedule this session
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    After cancelling, you&apos;ll be able to plan a new session with the same details
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3 rounded-b-xl">
          <Button variant="secondary" onClick={onClose}>
            Keep Session
          </Button>
          <Button
            variant="primary"
            onClick={handleCancel}
            className="bg-red-500 hover:bg-red-600"
          >
            {willReschedule ? 'Cancel & Reschedule' : 'Cancel Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}
