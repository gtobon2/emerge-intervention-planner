'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Target, AlertTriangle, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Session, Group, AnticipatedError, CurriculumPosition, PracticeItem } from '@/lib/supabase/types';

interface EditSessionModalProps {
  session: Session;
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  onSave: (sessionId: string, updates: SessionUpdateData) => void;
}

export interface SessionUpdateData {
  date: string;
  time: string | null;
  curriculum_position: CurriculumPosition;
  planned_otr_target: number | null;
  planned_practice_items: PracticeItem[] | null;
  planned_response_formats: string[] | null;
  anticipated_errors: AnticipatedError[] | null;
  notes: string | null;
}

const RESPONSE_FORMATS = [
  { value: 'oral', label: 'Oral' },
  { value: 'written', label: 'Written' },
  { value: 'choral', label: 'Choral' },
  { value: 'individual', label: 'Individual' },
  { value: 'partner', label: 'Partner' },
  { value: 'tapping', label: 'Tapping' },
];

export function EditSessionModal({ session, group, isOpen, onClose, onSave }: EditSessionModalProps) {
  const [date, setDate] = useState(session.date);
  const [time, setTime] = useState(session.time || '09:00');
  const [otrTarget, setOtrTarget] = useState(session.planned_otr_target || 40);
  const [responseFormats, setResponseFormats] = useState<string[]>(session.planned_response_formats || ['oral', 'written']);
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>(
    session.planned_practice_items || [{ item: '', type: 'review' }]
  );
  const [anticipatedErrors, setAnticipatedErrors] = useState<AnticipatedError[]>(
    session.anticipated_errors || []
  );
  const [newErrorPattern, setNewErrorPattern] = useState('');
  const [newErrorCorrection, setNewErrorCorrection] = useState('');
  const [notes, setNotes] = useState(session.notes || '');

  // Reset form when session changes
  useEffect(() => {
    if (isOpen) {
      setDate(session.date);
      setTime(session.time || '09:00');
      setOtrTarget(session.planned_otr_target || 40);
      setResponseFormats(session.planned_response_formats || ['oral', 'written']);
      setPracticeItems(session.planned_practice_items || [{ item: '', type: 'review' }]);
      setAnticipatedErrors(session.anticipated_errors || []);
      setNotes(session.notes || '');
    }
  }, [session, isOpen]);

  if (!isOpen) return null;

  // Only allow editing if session is planned
  if (session.status !== 'planned') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cannot Edit Session</h2>
          <p className="text-gray-600 mb-4">
            Only planned sessions can be edited. This session has a status of &quot;{session.status}&quot;.
          </p>
          <Button variant="primary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const handleToggleFormat = (format: string) => {
    setResponseFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const handleAddPracticeItem = () => {
    setPracticeItems((prev) => [...prev, { item: '', type: 'review' }]);
  };

  const handleUpdatePracticeItem = (index: number, field: 'item' | 'type', value: string) => {
    setPracticeItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleRemovePracticeItem = (index: number) => {
    setPracticeItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddError = () => {
    if (newErrorPattern.trim()) {
      setAnticipatedErrors((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          error_pattern: newErrorPattern,
          correction_protocol: newErrorCorrection,
        },
      ]);
      setNewErrorPattern('');
      setNewErrorCorrection('');
    }
  };

  const handleRemoveError = (id: string) => {
    setAnticipatedErrors((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = () => {
    const updates: SessionUpdateData = {
      date,
      time: time || null,
      curriculum_position: session.curriculum_position,
      planned_otr_target: otrTarget,
      planned_practice_items: practiceItems.filter((p) => p.item.trim()),
      planned_response_formats: responseFormats,
      anticipated_errors: anticipatedErrors,
      notes: notes || null,
    };
    onSave(session.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Session</h2>
            <p className="text-sm text-gray-500">{group.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>

          {/* OTR Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Target className="w-4 h-4 inline mr-1" />
              OTR Target
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={otrTarget}
                onChange={(e) => setOtrTarget(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-2xl font-bold text-pink-500 w-16 text-center">
                {otrTarget}
              </span>
            </div>
          </div>

          {/* Response Formats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response Formats
            </label>
            <div className="flex flex-wrap gap-2">
              {RESPONSE_FORMATS.map((format) => (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => handleToggleFormat(format.value)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${responseFormats.includes(format.value)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          {/* Practice Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planned Practice Items
            </label>
            <div className="space-y-2">
              {practiceItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={item.type}
                    onChange={(e) => handleUpdatePracticeItem(index, 'type', e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="review">Review</option>
                    <option value="new">New</option>
                    <option value="cumulative">Cumulative</option>
                  </select>
                  <input
                    type="text"
                    value={item.item}
                    onChange={(e) => handleUpdatePracticeItem(index, 'item', e.target.value)}
                    placeholder="Practice item..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                  {practiceItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePracticeItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPracticeItem}
                className="flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600"
              >
                <Plus className="w-4 h-4" />
                Add practice item
              </button>
            </div>
          </div>

          {/* Anticipated Errors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-1 text-amber-500" />
              Anticipated Errors
            </label>

            {anticipatedErrors.length > 0 && (
              <div className="space-y-2 mb-3">
                {anticipatedErrors.map((error) => (
                  <div
                    key={error.id}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-amber-900">{error.error_pattern}</p>
                      <p className="text-xs text-amber-700">{error.correction_protocol}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveError(error.id)}
                      className="p-1 text-amber-600 hover:text-amber-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newErrorPattern}
                onChange={(e) => setNewErrorPattern(e.target.value)}
                placeholder="Error pattern (e.g., Confuses b/d)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                value={newErrorCorrection}
                onChange={(e) => setNewErrorCorrection(e.target.value)}
                placeholder="Correction strategy"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={handleAddError}
                disabled={!newErrorPattern.trim()}
                className="flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add anticipated error
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Planning Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any preparation notes..."
              className="w-full px-3 py-2 border rounded-lg text-sm h-20 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
