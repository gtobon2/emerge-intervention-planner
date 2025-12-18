'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Plus, Trash2, User, Mic, Sparkles } from 'lucide-react';
import { Modal, Button, Input, Textarea, Select, Checkbox } from '@/components/ui';
import { VoiceButton } from '@/components/ui/voice-input';
import { useUIStore } from '@/stores/ui';
import { useSessionsStore, type StudentErrorInput, type SessionCompletionData } from '@/stores/sessions';
import type { Student, Pacing, MasteryLevel } from '@/lib/supabase/types';

interface StudentExitTicket {
  studentId: string;
  correct: number;
  total: number;
}

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  students: Student[];
  onComplete?: () => void;
  prefilledErrors?: StudentErrorInput[];
}

const pacingOptions = [
  { value: '', label: 'Select pacing...' },
  { value: 'too_slow', label: 'Too Slow - Needed more time' },
  { value: 'just_right', label: 'Just Right - Perfect timing' },
  { value: 'too_fast', label: 'Too Fast - Rushed through' },
];

const masteryOptions = [
  { value: '', label: 'Select mastery level...' },
  { value: 'yes', label: 'Yes - Students demonstrated mastery' },
  { value: 'partial', label: 'Partial - Some students need more practice' },
  { value: 'no', label: 'No - Skill not yet mastered' },
];

export function EndSessionModal({
  isOpen,
  onClose,
  sessionId,
  students,
  onComplete,
  prefilledErrors = [],
}: EndSessionModalProps) {
  const { otrCount, resetOTR } = useUIStore();
  const { completeSession, isLoading } = useSessionsStore();

  // Form state
  const [actualOtr, setActualOtr] = useState(otrCount);
  const [pacing, setPacing] = useState<Pacing | ''>('');
  const [mastery, setMastery] = useState<MasteryLevel | ''>('');
  const [notes, setNotes] = useState('');
  const [nextSessionNotes, setNextSessionNotes] = useState('');

  // AI summary
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);

  // Per-student errors - initialize with prefilled
  const [studentErrors, setStudentErrors] = useState<StudentErrorInput[]>(prefilledErrors);
  const [newError, setNewError] = useState({
    studentId: '',
    errorPattern: '',
    correctionUsed: '',
    correctionWorked: true,
  });

  // Per-student exit tickets
  const [exitTickets, setExitTickets] = useState<StudentExitTicket[]>(
    students.map(s => ({ studentId: s.id, correct: 0, total: 0 }))
  );

  // Sync OTR from store when modal opens
  useEffect(() => {
    if (isOpen) {
      setActualOtr(otrCount);
      setExitTickets(students.map(s => ({ studentId: s.id, correct: 0, total: 0 })));
      // Merge prefilled errors
      if (prefilledErrors.length > 0) {
        setStudentErrors(prefilledErrors);
      }
    }
  }, [isOpen, otrCount, students, prefilledErrors]);

  const addStudentError = () => {
    if (!newError.studentId || !newError.errorPattern) return;

    setStudentErrors([
      ...studentErrors,
      {
        student_id: newError.studentId,
        error_pattern: newError.errorPattern,
        correction_used: newError.correctionUsed || undefined,
        correction_worked: newError.correctionWorked,
      },
    ]);

    setNewError({
      studentId: '',
      errorPattern: '',
      correctionUsed: '',
      correctionWorked: true,
    });
  };

  const removeStudentError = (index: number) => {
    setStudentErrors(studentErrors.filter((_, i) => i !== index));
  };

  const updateExitTicket = (studentId: string, field: 'correct' | 'total', value: number) => {
    setExitTickets(exitTickets.map(et =>
      et.studentId === studentId ? { ...et, [field]: value } : et
    ));
  };

  // Voice input handlers
  const handleVoiceNotes = (text: string) => {
    setNotes(prev => prev ? `${prev} ${text}` : text);
  };

  const handleVoiceNextNotes = (text: string) => {
    setNextSessionNotes(prev => prev ? `${prev} ${text}` : text);
  };

  // Generate AI summary
  const generateAiSummary = async () => {
    setLoadingAiSummary(true);
    try {
      const response = await fetch('/api/ai/session-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otrCount: actualOtr,
          pacing,
          mastery,
          exitTickets,
          studentErrors,
          notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
        // Optionally append to notes
        if (data.summary) {
          setNotes(prev => prev ? `${prev}\n\nAI Summary: ${data.summary}` : `AI Summary: ${data.summary}`);
        }
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
    } finally {
      setLoadingAiSummary(false);
    }
  };

  const handleComplete = async () => {
    // Calculate group exit ticket totals
    const totalCorrect = exitTickets.reduce((sum, et) => sum + et.correct, 0);
    const totalQuestions = exitTickets.reduce((sum, et) => sum + et.total, 0);

    const data: SessionCompletionData = {
      actual_otr_count: actualOtr,
      pacing: pacing || undefined,
      mastery_demonstrated: mastery || undefined,
      exit_ticket_correct: totalCorrect,
      exit_ticket_total: totalQuestions,
      notes: notes || undefined,
      next_session_notes: nextSessionNotes || undefined,
      student_errors: studentErrors.length > 0 ? studentErrors : undefined,
    };

    await completeSession(sessionId, data);
    resetOTR();
    onComplete?.();
    onClose();
  };

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.name || 'Unknown';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="End Session" size="xl">
      <div className="space-y-6">
        {/* OTR Count */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Opportunities to Respond (OTR)
          </label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={actualOtr}
              onChange={(e) => setActualOtr(parseInt(e.target.value) || 0)}
              className="w-32"
              min={0}
            />
            <span className="text-text-muted text-sm">
              Counted during session: {otrCount}
            </span>
          </div>
        </div>

        {/* Pacing */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Session Pacing
          </label>
          <Select
            options={pacingOptions}
            value={pacing}
            onChange={(e) => setPacing(e.target.value as Pacing)}
            className="w-full"
          />
        </div>

        {/* Per-Student Exit Tickets */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Exit Tickets (Per Student)
          </label>
          <div className="bg-foundation rounded-lg p-4 space-y-3">
            {students.length === 0 ? (
              <p className="text-text-muted text-sm">No students in this group</p>
            ) : (
              students.map((student) => {
                const ticket = exitTickets.find(et => et.studentId === student.id);
                return (
                  <div key={student.id} className="flex items-center gap-3">
                    <User className="w-4 h-4 text-text-muted" />
                    <span className="text-text-primary flex-1 min-w-0 truncate">
                      {student.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={ticket?.correct || 0}
                        onChange={(e) => updateExitTicket(student.id, 'correct', parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                        min={0}
                        placeholder="0"
                      />
                      <span className="text-text-muted">/</span>
                      <Input
                        type="number"
                        value={ticket?.total || 0}
                        onChange={(e) => updateExitTicket(student.id, 'total', parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                        min={0}
                        placeholder="0"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mastery */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Mastery Demonstrated
          </label>
          <Select
            options={masteryOptions}
            value={mastery}
            onChange={(e) => setMastery(e.target.value as MasteryLevel)}
            className="w-full"
          />
        </div>

        {/* Per-Student Errors */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Student Errors Observed ({studentErrors.length})
          </label>

          {/* Existing errors */}
          {studentErrors.length > 0 && (
            <div className="space-y-2 mb-4">
              {studentErrors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-foundation rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {getStudentName(error.student_id)}
                      </span>
                      {error.correction_worked ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-tier3" />
                      )}
                    </div>
                    <p className="text-sm text-text-muted">{error.error_pattern}</p>
                    {error.correction_used && (
                      <p className="text-xs text-text-muted mt-1">
                        Correction: {error.correction_used}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStudentError(index)}
                    className="text-tier3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new error form */}
          <div className="p-4 border border-border rounded-lg space-y-3">
            <Select
              options={[
                { value: '', label: 'Select student...' },
                ...students.map(s => ({ value: s.id, label: s.name })),
              ]}
              value={newError.studentId}
              onChange={(e) => setNewError({ ...newError, studentId: e.target.value })}
              className="w-full"
            />
            <Input
              placeholder="Error pattern (e.g., 'Confused b/d reversal')"
              value={newError.errorPattern}
              onChange={(e) => setNewError({ ...newError, errorPattern: e.target.value })}
            />
            <Input
              placeholder="Correction used (optional)"
              value={newError.correctionUsed}
              onChange={(e) => setNewError({ ...newError, correctionUsed: e.target.value })}
            />
            <div className="flex items-center justify-between">
              <Checkbox
                label="Correction worked"
                checked={newError.correctionWorked}
                onChange={(e) => setNewError({ ...newError, correctionWorked: e.target.checked })}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={addStudentError}
                disabled={!newError.studentId || !newError.errorPattern}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Error
              </Button>
            </div>
          </div>
        </div>

        {/* Notes with Voice Input */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Session Notes
          </label>
          <div className="flex gap-2">
            <Textarea
              placeholder="Any observations from today's session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="flex-1"
            />
            <div className="flex flex-col gap-2">
              <VoiceButton onTranscript={handleVoiceNotes} />
              <Button
                variant="secondary"
                size="sm"
                onClick={generateAiSummary}
                disabled={loadingAiSummary}
                title="Generate AI summary"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Next Session Notes with Voice Input */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Notes for Next Session
          </label>
          <div className="flex gap-2">
            <Textarea
              placeholder="What to remember or focus on next time..."
              value={nextSessionNotes}
              onChange={(e) => setNextSessionNotes(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <VoiceButton onTranscript={handleVoiceNextNotes} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleComplete} isLoading={isLoading}>
            Complete Session
          </Button>
        </div>
      </div>
    </Modal>
  );
}
