'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Users,
  CheckCircle,
  StopCircle,
  BookOpen,
  AlertTriangle,
  Target,
  ListChecks,
  Plus,
  Trash2,
  Sparkles,
  Play,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CurriculumBadge,
  TierBadge,
  StatusBadge,
  Input,
  Select,
  Checkbox,
} from '@/components/ui';
import { Timer, OTRCounter } from '@/components/ui';
import { EndSessionModal } from '@/components/session';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { useUIStore } from '@/stores/ui';
import { formatCurriculumPosition } from '@/lib/supabase/types';
import type { AnticipatedError, ObservedError, Student } from '@/lib/supabase/types';

interface LiveError {
  id: string;
  studentId: string;
  studentName: string;
  errorPattern: string;
  correctionUsed: string;
  correctionWorked: boolean;
  timestamp: Date;
}

export default function SessionRunPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const sessionId = params.sessionId as string;

  const { selectedGroup, fetchGroupById, isLoading: groupLoading } = useGroupsStore();
  const { selectedSession, fetchSessionById, updateSession, isLoading: sessionLoading } = useSessionsStore();
  const { resetOTR, resetTimer } = useUIStore();

  const [showEndModal, setShowEndModal] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Live error tracking
  const [liveErrors, setLiveErrors] = useState<LiveError[]>([]);
  const [newError, setNewError] = useState({
    studentId: '',
    errorPattern: '',
    correctionUsed: '',
    correctionWorked: true,
  });

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (groupId) fetchGroupById(groupId);
    if (sessionId) fetchSessionById(sessionId);
  }, [groupId, sessionId, fetchGroupById, fetchSessionById]);

  // Reset counters when page loads
  useEffect(() => {
    resetOTR();
    resetTimer();
  }, [resetOTR, resetTimer]);

  // Check if session is already in progress
  useEffect(() => {
    if (selectedSession?.status === 'in_progress') {
      setSessionStarted(true);
    }
  }, [selectedSession]);

  const handleStartSession = async () => {
    setSessionStarted(true);
    // Update session status to in_progress
    await updateSession(sessionId, { status: 'in_progress' });
  };

  const handleEndSession = () => {
    setShowEndModal(true);
  };

  const handleSessionComplete = () => {
    router.push(`/groups/${groupId}`);
  };

  // Live error management
  const addLiveError = () => {
    if (!newError.studentId || !newError.errorPattern) return;

    const student = selectedGroup?.students?.find(s => s.id === newError.studentId);
    setLiveErrors([
      ...liveErrors,
      {
        id: `error-${Date.now()}`,
        studentId: newError.studentId,
        studentName: student?.name || 'Unknown',
        errorPattern: newError.errorPattern,
        correctionUsed: newError.correctionUsed,
        correctionWorked: newError.correctionWorked,
        timestamp: new Date(),
      },
    ]);
    setNewError({
      studentId: '',
      errorPattern: '',
      correctionUsed: '',
      correctionWorked: true,
    });
  };

  const removeLiveError = (id: string) => {
    setLiveErrors(liveErrors.filter(e => e.id !== id));
  };

  // Fetch AI error suggestions
  const fetchAiSuggestions = async () => {
    if (!selectedGroup || !selectedSession) return;

    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/suggest-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculum: selectedGroup.curriculum,
          position: selectedSession.curriculum_position,
          previousErrors: liveErrors.map(e => e.errorPattern),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const isLoading = groupLoading || sessionLoading;

  if (isLoading || !selectedGroup || !selectedSession) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface rounded" />
          <div className="h-64 bg-surface rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  const isCompleted = selectedSession.status === 'completed';
  const isInProgress = selectedSession.status === 'in_progress' || sessionStarted;
  const positionLabel = formatCurriculumPosition(
    selectedGroup.curriculum,
    selectedSession.curriculum_position
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/groups/${groupId}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Group
            </Button>
          </Link>
        </div>

        {/* Session Info */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {selectedGroup.name}
            </h1>
            <div className="flex items-center gap-3 mb-2">
              <CurriculumBadge curriculum={selectedGroup.curriculum} />
              <TierBadge tier={selectedGroup.tier} />
              <StatusBadge status={isInProgress && !isCompleted ? 'in_progress' : selectedSession.status} />
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <BookOpen className="w-4 h-4" />
              <span>{positionLabel}</span>
            </div>
          </div>

          {/* Session Actions */}
          <div className="flex gap-3">
            {isCompleted ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Session Completed</span>
              </div>
            ) : !isInProgress ? (
              <Button onClick={handleStartSession} className="gap-2">
                <Play className="w-4 h-4" />
                Start Session
              </Button>
            ) : (
              <Button onClick={handleEndSession} variant="danger" className="gap-2">
                <StopCircle className="w-4 h-4" />
                End Session
              </Button>
            )}
          </div>
        </div>

        {/* Planning Details - Show before and during session */}
        {!isCompleted && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-movement" />
                Session Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* OTR Target */}
                <div>
                  <h4 className="text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    OTR Target
                  </h4>
                  <p className="text-2xl font-bold text-text-primary">
                    {selectedSession.planned_otr_target || '--'}
                  </p>
                </div>

                {/* Response Formats */}
                {selectedSession.planned_response_formats && selectedSession.planned_response_formats.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-text-muted mb-2">Response Formats</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.planned_response_formats.map((format, i) => (
                        <span key={i} className="px-2 py-1 bg-foundation rounded text-sm text-text-primary">
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practice Items */}
                {selectedSession.planned_practice_items && selectedSession.planned_practice_items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-text-muted mb-2">Practice Items</h4>
                    <ul className="text-sm text-text-primary space-y-1">
                      {selectedSession.planned_practice_items.slice(0, 5).map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            item.type === 'new' ? 'bg-green-500' :
                            item.type === 'review' ? 'bg-blue-500' : 'bg-purple-500'
                          }`} />
                          {item.item}
                        </li>
                      ))}
                      {selectedSession.planned_practice_items.length > 5 && (
                        <li className="text-text-muted">+{selectedSession.planned_practice_items.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Anticipated Errors */}
              {selectedSession.anticipated_errors && selectedSession.anticipated_errors.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Anticipated Errors
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedSession.anticipated_errors.map((error, i) => (
                      <div key={i} className="p-3 bg-tier3/10 border border-tier3/20 rounded-lg">
                        <p className="font-medium text-text-primary">{error.error_pattern}</p>
                        <p className="text-sm text-text-muted mt-1">
                          Correction: {error.correction_protocol}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completed Session Summary */}
        {isCompleted && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-text-muted">OTR Count</p>
                  <p className="text-xl font-bold text-text-primary">
                    {selectedSession.actual_otr_count || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Exit Ticket</p>
                  <p className="text-xl font-bold text-text-primary">
                    {selectedSession.exit_ticket_correct !== null
                      ? `${selectedSession.exit_ticket_correct}/${selectedSession.exit_ticket_total}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Pacing</p>
                  <p className="text-xl font-bold text-text-primary capitalize">
                    {selectedSession.pacing?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Mastery</p>
                  <p className="text-xl font-bold text-text-primary capitalize">
                    {selectedSession.mastery_demonstrated || '-'}
                  </p>
                </div>
              </div>
              {selectedSession.notes && (
                <div className="mt-4 pt-4 border-t border-green-500/20">
                  <p className="text-sm text-text-muted mb-1">Notes</p>
                  <p className="text-text-primary">{selectedSession.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Session Tools */}
        {!isCompleted && isInProgress && (
          <>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Timer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-movement" />
                    Session Timer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Timer
                    component="Session"
                    targetMinutes={selectedGroup.tier === 3 ? 30 : 45}
                  />
                </CardContent>
              </Card>

              {/* OTR Counter */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-movement" />
                    OTR Counter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OTRCounter target={selectedSession.planned_otr_target || (selectedGroup.tier === 3 ? 15 : 20)} />
                </CardContent>
              </Card>
            </div>

            {/* Live Error Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-tier3" />
                    Live Error Tracking
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={fetchAiSuggestions}
                    disabled={loadingSuggestions}
                    className="gap-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    {loadingSuggestions ? 'Loading...' : 'AI Suggestions'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* AI Suggestions */}
                {aiSuggestions && (
                  <div className="mb-4 p-4 bg-movement/10 border border-movement/20 rounded-lg">
                    <p className="text-sm font-medium text-movement mb-2">AI Error Suggestions</p>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">{aiSuggestions}</p>
                  </div>
                )}

                {/* Logged Errors */}
                {liveErrors.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {liveErrors.map((error) => (
                      <div
                        key={error.id}
                        className="flex items-center gap-3 p-3 bg-foundation rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-primary">
                              {error.studentName}
                            </span>
                            <span className="text-xs text-text-muted">
                              {error.timestamp.toLocaleTimeString()}
                            </span>
                            {error.correctionWorked ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-tier3" />
                            )}
                          </div>
                          <p className="text-sm text-text-muted">{error.errorPattern}</p>
                          {error.correctionUsed && (
                            <p className="text-xs text-text-muted mt-1">
                              Correction: {error.correctionUsed}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLiveError(error.id)}
                          className="text-tier3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Error Form */}
                <div className="p-4 border border-border rounded-lg space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Select
                      options={[
                        { value: '', label: 'Select student...' },
                        ...(selectedGroup.students?.map(s => ({ value: s.id, label: s.name })) || []),
                      ]}
                      value={newError.studentId}
                      onChange={(e) => setNewError({ ...newError, studentId: e.target.value })}
                    />
                    <Input
                      placeholder="Error pattern (e.g., 'b/d reversal')"
                      value={newError.errorPattern}
                      onChange={(e) => setNewError({ ...newError, errorPattern: e.target.value })}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
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
                        onClick={addLiveError}
                        disabled={!newError.studentId || !newError.errorPattern}
                        className="gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Log Error
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Students in Group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-movement" />
              Students ({selectedGroup.students?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedGroup.students?.length === 0 ? (
              <div className="text-center py-6 text-text-muted">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No students in this group</p>
                <p className="text-sm mt-1">Add students to track per-student errors</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedGroup.students?.map((student) => {
                  const errorCount = liveErrors.filter(e => e.studentId === student.id).length;
                  return (
                    <div
                      key={student.id}
                      className="p-3 bg-foundation rounded-lg text-center relative"
                    >
                      <span className="text-text-primary font-medium">
                        {student.name}
                      </span>
                      {errorCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-tier3 text-white text-xs rounded-full flex items-center justify-center">
                          {errorCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Waiting to Start */}
        {!isCompleted && !isInProgress && (
          <Card className="border-movement/20 bg-movement/5">
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-movement" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Ready to Begin
              </h3>
              <p className="text-text-muted mb-6">
                Click &quot;Start Session&quot; to begin the timer and OTR counter
              </p>
              <Button onClick={handleStartSession} size="lg" className="gap-2">
                <Play className="w-5 h-5" />
                Start Session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* End Session Modal */}
      <EndSessionModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        sessionId={sessionId}
        students={selectedGroup.students || []}
        onComplete={handleSessionComplete}
        prefilledErrors={liveErrors.map(e => ({
          student_id: e.studentId,
          error_pattern: e.errorPattern,
          correction_used: e.correctionUsed || undefined,
          correction_worked: e.correctionWorked,
        }))}
      />
    </AppLayout>
  );
}
