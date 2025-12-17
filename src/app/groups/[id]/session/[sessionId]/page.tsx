'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Clock,
  Target,
  AlertTriangle,
  MessageSquare,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle,
  X,
  Mic,
  Save,
  Edit,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurriculumBadge, TierBadge, Badge } from '@/components/ui/badge';
import { Timer } from '@/components/ui/timer';
import { OTRCounter } from '@/components/ui/otr-counter';
import type {
  Session,
  Group,
  Student,
  Curriculum,
  Pacing,
  MasteryLevel,
  ObservedError,
  AnticipatedError,
} from '@/lib/supabase/types';
import { formatCurriculumPosition, getCurriculumLabel } from '@/lib/supabase/types';
import { AIErrorSuggestions, AISessionSummary } from '@/components/ai';
import { EditSessionModal, CancelSessionModal, PlanSessionModal, SessionPlanData } from '@/components/sessions';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useErrorsStore, useSessionsStore, useGroupsStore, useStudentsStore } from '@/stores';
import { saveStudentSessionTracking } from '@/lib/local-db/hooks';
import { toNumericId } from '@/lib/utils/id';

// Extended ObservedError type with id for local tracking
interface ObservedErrorWithId extends ObservedError {
  id: string;
  student_id?: string;
}

// Get initials from student name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Student circle colors (rotating palette)
const STUDENT_COLORS = [
  'bg-movement text-white',
  'bg-emerald-500 text-white',
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-amber-500 text-white',
];


export default function SessionPage({
  params,
}: {
  params: { id: string; sessionId: string };
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // Store actions
  const {
    selectedSession,
    fetchSessionById,
    updateSession,
    cancelSession,
    completeSession,
    isLoading: sessionLoading
  } = useSessionsStore();
  const { selectedGroup, fetchGroupById, isLoading: groupLoading } = useGroupsStore();
  const { students: storeStudents, fetchStudentsForGroup } = useStudentsStore();

  // Session tracking state
  const [anticipatedErrors, setAnticipatedErrors] = useState<AnticipatedError[]>([]);
  const [anticipatedErrorsChecked, setAnticipatedErrorsChecked] = useState<Record<string, boolean>>({});
  const [correctionWorked, setCorrectionWorked] = useState<Record<string, Record<string, boolean | null>>>({}); // errorId -> studentId -> worked
  const [unexpectedErrors, setUnexpectedErrors] = useState<ObservedErrorWithId[]>([]);
  const [componentsCompleted, setComponentsCompleted] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [exitTicketCorrect, setExitTicketCorrect] = useState<number | null>(null);
  const [exitTicketTotal, setExitTicketTotal] = useState<number | null>(null);
  const [pacing, setPacing] = useState<Pacing | null>(null);
  const [mastery, setMastery] = useState<MasteryLevel | null>(null);

  // Per-student tracking
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null); // null = group level
  const [studentOTRs, setStudentOTRs] = useState<Record<string, number>>({}); // studentId -> count
  const [errorStudents, setErrorStudents] = useState<Record<string, string[]>>({}); // errorId -> studentIds[]

  // UI state
  const [showErrorPanel, setShowErrorPanel] = useState(true);
  const [showNewErrorForm, setShowNewErrorForm] = useState(false);
  const [newErrorPattern, setNewErrorPattern] = useState('');
  const [newErrorCorrection, setNewErrorCorrection] = useState('');
  const [newErrorStudent, setNewErrorStudent] = useState<string>('');

  // Error bank integration
  const [savedToBank, setSavedToBank] = useState<Record<string, boolean>>({}); // errorId -> isSaved
  const { createError } = useErrorsStore();

  // Voice input
  const {
    isListening,
    isSupported: isVoiceSupported,
    error: voiceError,
    toggle: toggleVoiceInput,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onTranscript: (transcript, isFinal) => {
      if (isFinal) {
        setNotes((prev) => {
          const separator = prev.trim() ? ' ' : '';
          return prev + separator + transcript;
        });
      }
    },
    onError: (error) => {
      console.error('Voice input error:', error);
    },
  });

  // Fetch session, group, and students from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch session, group, and students in parallel
        await Promise.all([
          fetchSessionById(params.sessionId),
          fetchGroupById(params.id),
          fetchStudentsForGroup(params.id),
        ]);
      } catch (error) {
        console.error('Error loading session data:', error);
      }
    };
    loadData();
  }, [params.id, params.sessionId, fetchSessionById, fetchGroupById, fetchStudentsForGroup]);

  // Update local state when store data changes
  useEffect(() => {
    if (selectedSession) {
      setSession(selectedSession);
      setAnticipatedErrors(selectedSession.anticipated_errors || []);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (selectedGroup) {
      setGroup(selectedGroup);
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (storeStudents && storeStudents.length > 0) {
      setStudents(storeStudents);
      // Initialize per-student OTR tracking
      const initialOTRs: Record<string, number> = {};
      storeStudents.forEach((s) => {
        initialOTRs[s.id] = 0;
      });
      setStudentOTRs(initialOTRs);
    }
    // Set loading to false once we have all required data
    if (selectedSession && selectedGroup) {
      setIsLoading(false);
    }
  }, [storeStudents, selectedSession, selectedGroup]);

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  /**
   * Complete the session and save all tracking data to IndexedDB
   *
   * Data saved:
   * - actual_otr_estimate: Total OTRs from all students
   * - pacing: Pacing assessment (too_slow, just_right, too_fast)
   * - mastery_demonstrated: Mastery level (yes, partial, no)
   * - components_completed: Array of completed lesson components
   * - exit_ticket_correct/total: Exit ticket scores
   * - errors_observed: Anticipated errors that were checked, with correction effectiveness
   * - unexpected_errors: New errors observed during session
   * - notes: Session notes including voice input
   *
   * Per-student tracking (saved separately):
   * - OTR count per student
   * - Errors exhibited by each student
   * - Correction effectiveness per student
   */
  const handleCompleteSession = async () => {
    if (!session) return;

    setIsSaving(true);

    try {
      // Calculate total OTRs from student tracking
      const totalOTRs = getTotalOTRs();

      // Build errors_observed from anticipated errors that were checked
      const errorsObserved: ObservedError[] = anticipatedErrors
        .filter((e) => anticipatedErrorsChecked[e.id])
        .map((e) => {
          // Calculate if correction worked overall (majority of students)
          const studentResults = correctionWorked[e.id] || {};
          const results = Object.values(studentResults).filter(r => r !== null);
          const workedCount = results.filter(r => r === true).length;
          const overallWorked = results.length === 0 ? true : workedCount >= results.length / 2;

          return {
            error_pattern: e.error_pattern,
            correction_used: e.correction_protocol,
            correction_worked: overallWorked,
            add_to_bank: savedToBank[e.id] || false,
          };
        });

      // Build completion data
      const completionData = {
        actual_otr_estimate: totalOTRs,
        pacing,
        mastery_demonstrated: mastery,
        components_completed: componentsCompleted.length > 0 ? componentsCompleted : null,
        exit_ticket_correct: exitTicketCorrect,
        exit_ticket_total: exitTicketTotal,
        errors_observed: errorsObserved.length > 0 ? errorsObserved : null,
        unexpected_errors: unexpectedErrors.length > 0 ? unexpectedErrors.map(e => ({
          error_pattern: e.error_pattern,
          correction_used: e.correction_used,
          correction_worked: e.correction_worked,
          add_to_bank: e.add_to_bank,
        })) : null,
        notes: notes || null,
      };

      // Save to IndexedDB via the sessions store
      const result = await completeSession(session.id, completionData, true);

      if (result) {
        // Build per-student tracking data
        const studentTrackingData = students.map((student) => {
          // Get errors this student exhibited (from errorStudents state)
          const studentErrors: string[] = [];
          Object.entries(errorStudents).forEach(([errorId, studentIds]) => {
            if (studentIds.includes(student.id)) {
              // Find the error pattern
              const anticipatedError = anticipatedErrors.find(e => e.id === errorId);
              const unexpectedError = unexpectedErrors.find(e => e.id === errorId);
              const errorPattern = anticipatedError?.error_pattern || unexpectedError?.error_pattern;
              if (errorPattern) {
                studentErrors.push(errorPattern);
              }
            }
          });

          // Get correction effectiveness for this student
          const studentCorrections: Record<string, boolean> = {};
          Object.entries(correctionWorked).forEach(([errorId, studentResults]) => {
            const studentResult = studentResults[student.id];
            if (studentResult !== undefined && studentResult !== null) {
              const anticipatedError = anticipatedErrors.find(e => e.id === errorId);
              if (anticipatedError) {
                studentCorrections[anticipatedError.error_pattern] = studentResult;
              }
            }
          });

          const numericStudentId = toNumericId(student.id);
          if (numericStudentId === null) return null;

          return {
            studentId: numericStudentId,
            otrCount: studentOTRs[student.id] || 0,
            errorsExhibited: studentErrors,
            correctionEffectiveness: studentCorrections,
          };
        }).filter((data): data is NonNullable<typeof data> => data !== null);

        // Save per-student tracking data
        const numericSessionId = toNumericId(session.id);
        if (numericSessionId !== null && studentTrackingData.length > 0) {
          await saveStudentSessionTracking(numericSessionId, studentTrackingData);
        }

        // Success - navigate back to group page
        router.push(`/groups/${params.id}`);
      } else {
        throw new Error('Failed to complete session');
      }
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to save session data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnticipatedErrorToggle = (errorId: string) => {
    setAnticipatedErrorsChecked((prev) => ({
      ...prev,
      [errorId]: !prev[errorId],
    }));
  };

  const handleCorrectionWorked = (errorId: string, studentId: string, worked: boolean) => {
    setCorrectionWorked((prev) => ({
      ...prev,
      [errorId]: {
        ...(prev[errorId] || {}),
        [studentId]: worked,
      },
    }));
  };

  const handleAddUnexpectedError = () => {
    if (newErrorPattern.trim()) {
      const errorId = `unexpected-${Date.now()}`;
      setUnexpectedErrors((prev) => [
        ...prev,
        {
          id: errorId,
          error_pattern: newErrorPattern,
          correction_used: newErrorCorrection,
          correction_worked: true,
          add_to_bank: true,
          student_id: newErrorStudent || undefined,
        },
      ]);
      setNewErrorPattern('');
      setNewErrorCorrection('');
      setNewErrorStudent('');
      setShowNewErrorForm(false);
    }
  };

  // Toggle student association with an error
  const handleToggleErrorStudent = (errorId: string, studentId: string) => {
    setErrorStudents((prev) => {
      const currentStudents = prev[errorId] || [];
      if (currentStudents.includes(studentId)) {
        return {
          ...prev,
          [errorId]: currentStudents.filter((id) => id !== studentId),
        };
      } else {
        return {
          ...prev,
          [errorId]: [...currentStudents, studentId],
        };
      }
    });
  };

  // Increment OTR for a specific student
  const handleStudentOTR = (studentId: string) => {
    setStudentOTRs((prev) => ({
      ...prev,
      [studentId]: (prev[studentId] || 0) + 1,
    }));
  };

  // Get total OTRs across all students
  const getTotalOTRs = () => {
    return Object.values(studentOTRs).reduce((sum, count) => sum + count, 0);
  };

  const handleComponentToggle = (component: string) => {
    setComponentsCompleted((prev) =>
      prev.includes(component)
        ? prev.filter((c) => c !== component)
        : [...prev, component]
    );
  };

  // AI handler functions
  const handleAddAIError = (error: AnticipatedError) => {
    setAnticipatedErrors((prev) => [...prev, error]);
  };

  const handleAddAllAIErrors = (errors: AnticipatedError[]) => {
    setAnticipatedErrors((prev) => [...prev, ...errors]);
  };

  const handleSaveSummaryToNotes = (summary: string) => {
    setNotes((prev) => {
      if (prev.trim()) {
        return `${prev}\n\n--- AI Generated Summary ---\n${summary}`;
      }
      return summary;
    });
  };

  // Save error to error bank
  const handleEditSession = async (sessionId: string, updates: any) => {
    await updateSession(sessionId, updates);
    // Refresh session data
    if (session) {
      setSession({ ...session, ...updates });
    }
  };

  const handleCancelSession = async (sessionId: string, reason?: string) => {
    await cancelSession(sessionId, reason);
    // Navigate back to group page
    router.push(`/groups/${params.id}`);
  };

  const handleRescheduleSession = async (sessionId: string, reason?: string) => {
    // First cancel the current session
    await cancelSession(sessionId, reason);
    // Then open the plan session modal with pre-filled data
    setShowRescheduleModal(true);
  };

  const handleCreateRescheduledSession = async (data: SessionPlanData) => {
    // In production, create a new session with the data
    // For now, just navigate back to group page
    router.push(`/groups/${params.id}`);
  };

  const handleSaveToBank = async (
    errorId: string,
    errorPattern: string,
    correctionProtocol: string,
    isUnexpected: boolean = false
  ) => {
    if (!group) return;

    // Get students who made this error
    const studentsWhoMadeError = errorStudents[errorId] || [];
    const correctionResults = correctionWorked[errorId] || {};

    // Calculate effectiveness
    const studentResults = Object.values(correctionResults).filter(r => r !== null);
    const workedCount = studentResults.filter(r => r === true).length;
    const effectivenessCount = studentResults.length > 0 ? workedCount : 0;

    // Get student names for metadata
    const studentNames = studentsWhoMadeError
      .map(id => students.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    try {
      const errorBankEntry = await createError({
        curriculum: group.curriculum,
        curriculum_position: session?.curriculum_position || null,
        error_pattern: errorPattern,
        correction_protocol: correctionProtocol,
        underlying_gap: null,
        correction_prompts: null,
        visual_cues: null,
        kinesthetic_cues: null,
        is_custom: true,
        effectiveness_count: effectivenessCount,
        occurrence_count: 1,
      });

      if (errorBankEntry) {
        // Mark as saved
        setSavedToBank(prev => ({ ...prev, [errorId]: true }));

        // Add to notes for context
        const errorNote = `\n[Error saved to bank: "${errorPattern}" - Students: ${studentNames || 'All'} - Session: ${session?.date}]`;
        setNotes(prev => prev + errorNote);
      }
    } catch (error) {
      console.error('Failed to save error to bank:', error);
      alert('Failed to save error to bank. Please try again.');
    }
  };

  if (isLoading || !session || !group) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const lessonComponents = [
    { name: 'Quickdrill', duration: 5 },
    { name: 'Sound Cards', duration: 3 },
    { name: 'Word Cards', duration: 5 },
    { name: 'Word List', duration: 5 },
    { name: 'Sentence Reading', duration: 5 },
    { name: 'Dictation', duration: 10 },
    { name: 'Passage Reading', duration: 10 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Link
                href={`/groups/${group.id}`}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="font-semibold text-base sm:text-lg truncate">{group.name}</h1>
                <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                  <CurriculumBadge curriculum={group.curriculum} />
                  <TierBadge tier={group.tier} />
                  <span className="text-gray-500 hidden sm:inline truncate">
                    {formatCurriculumPosition(group.curriculum, session.curriculum_position)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {!isSessionActive && session.status === 'planned' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    className="gap-1 min-h-[44px]"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                    className="gap-1 min-h-[44px] text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                </>
              )}
              {isSessionActive ? (
                <>
                  <Timer targetMinutes={group.schedule?.duration || 45} />
                  <div className="hidden md:block">
                    <AISessionSummary
                      session={{
                        ...session,
                        components_completed: componentsCompleted,
                        actual_otr_estimate: null,
                        exit_ticket_correct: exitTicketCorrect,
                        exit_ticket_total: exitTicketTotal,
                        pacing,
                        mastery_demonstrated: mastery,
                        errors_observed: anticipatedErrors
                          .filter((e) => anticipatedErrorsChecked[e.id])
                          .map((e) => {
                            // Calculate if correction worked overall (majority of students)
                            const studentResults = correctionWorked[e.id] || {};
                            const results = Object.values(studentResults).filter(r => r !== null);
                            const workedCount = results.filter(r => r === true).length;
                            const overallWorked = results.length === 0 ? true : workedCount >= results.length / 2;
                            return {
                              error_pattern: e.error_pattern,
                              correction_used: e.correction_protocol,
                              correction_worked: overallWorked,
                            };
                          }),
                        unexpected_errors: unexpectedErrors,
                        notes,
                      }}
                      groupName={group.name}
                      onSaveToNotes={handleSaveSummaryToNotes}
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleCompleteSession}
                    disabled={isSaving}
                    className="min-h-[44px] flex-1 sm:flex-initial"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin sm:mr-1" />
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">Saving</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Complete Session</span>
                        <span className="sm:hidden">Complete</span>
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={handleStartSession} className="min-h-[44px] w-full sm:w-auto">
                  <Play className="w-4 h-4 mr-1" />
                  Start Session
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {!isSessionActive ? (
          // Pre-session view
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-movement" />
                  Session Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    Planned Practice Items
                  </h4>
                  <ul className="space-y-1">
                    {session.planned_practice_items?.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Badge variant="default">
                          {item.type}
                        </Badge>
                        {item.item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    Response Formats
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {session.planned_response_formats?.map((format) => (
                      <Badge key={format} variant="default">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    OTR Target
                  </h4>
                  <p className="text-2xl font-bold text-movement">
                    {session.planned_otr_target}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Anticipated Errors */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Anticipated Errors
                  </CardTitle>
                  <AIErrorSuggestions
                    curriculum={group.curriculum}
                    position={session.curriculum_position}
                    previousErrors={anticipatedErrors.map((e) => e.error_pattern)}
                    onAddError={handleAddAIError}
                    onAddAllErrors={handleAddAllAIErrors}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {anticipatedErrors.length > 0 ? (
                  <div className="space-y-3">
                    {anticipatedErrors.map((error) => (
                      <div
                        key={error.id}
                        className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
                      >
                        <p className="font-medium text-amber-900">
                          {error.error_pattern}
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          <strong>Correction:</strong> {error.correction_protocol}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No anticipated errors yet. Use AI to generate suggestions or add manually.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Active session view
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main tracking area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Student Circles - Per-student tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Students in Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {students.map((student, index) => (
                      <button
                        key={student.id}
                        onClick={() => handleStudentOTR(student.id)}
                        className={`
                          flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                          hover:bg-gray-50 active:scale-95 min-w-[70px]
                        `}
                        title={`${student.name} - Click to add OTR`}
                      >
                        <div
                          className={`
                            w-12 h-12 rounded-full flex items-center justify-center
                            text-lg font-bold shadow-md transition-transform
                            hover:scale-110 cursor-pointer
                            ${STUDENT_COLORS[index % STUDENT_COLORS.length]}
                          `}
                        >
                          {getInitials(student.name)}
                        </div>
                        <span className="text-xs text-gray-600 font-medium truncate max-w-[70px]">
                          {student.name.split(' ')[0]}
                        </span>
                        <span className="text-xs font-bold text-movement">
                          {studentOTRs[student.id] || 0} OTRs
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-sm text-gray-500">Total OTRs</p>
                    <p className="text-3xl font-bold text-movement">{getTotalOTRs()}</p>
                    <p className="text-xs text-gray-400">
                      Target: {session.planned_otr_target || 40}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* OTR Counter - Group level */}
              <Card>
                <CardContent className="py-6">
                  <OTRCounter target={session.planned_otr_target || 40} />
                </CardContent>
              </Card>

              {/* Lesson Components Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Lesson Components
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {lessonComponents.map((component) => (
                      <button
                        key={component.name}
                        onClick={() => handleComponentToggle(component.name)}
                        className={`p-3 md:p-4 rounded-lg border text-left transition-all min-h-[60px] ${
                          componentsCompleted.includes(component.name)
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-gray-200 hover:border-gray-300 active:scale-98'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {componentsCompleted.includes(component.name) ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                          )}
                          <span className="font-medium text-sm md:text-base">
                            {component.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 ml-7">
                          {component.duration} min
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      Session Notes
                    </CardTitle>
                    {isVoiceSupported && (
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                          ${
                            isListening
                              ? 'bg-red-500 text-white animate-pulse shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                        title={isListening ? 'Stop voice input' : 'Click to start voice input'}
                      >
                        <Mic className="w-4 h-4" />
                        {isListening && (
                          <>
                            <span className="w-2 h-2 bg-white rounded-full" />
                            <span className="text-sm font-medium">Recording</span>
                          </>
                        )}
                        {!isListening && <span className="text-sm">Voice Input</span>}
                      </button>
                    )}
                  </div>
                  {isListening && (
                    <p className="text-sm text-movement mt-2 animate-pulse">
                      Listening... speak now
                    </p>
                  )}
                  {voiceError && (
                    <p className="text-sm text-red-500 mt-2">{voiceError}</p>
                  )}
                  {!isVoiceSupported && (
                    <p className="text-xs text-gray-500 mt-2">
                      Voice input not supported in this browser. Use Chrome, Edge, or Safari for voice features.
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-movement focus:border-movement"
                    placeholder="Add observations, student responses, or notes for next session..."
                  />
                </CardContent>
              </Card>
            </div>

            {/* Side panel - Error tracking */}
            <div className="space-y-4">
              {/* Anticipated Errors */}
              <Card>
                <CardHeader>
                  <button
                    onClick={() => setShowErrorPanel(!showErrorPanel)}
                    className="w-full flex items-center justify-between"
                  >
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Error Tracking
                    </CardTitle>
                    {showErrorPanel ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </CardHeader>
                {showErrorPanel && (
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-500 mb-3">
                      Check errors observed and note if correction worked
                    </p>
                    {anticipatedErrors.map((error) => (
                      <div
                        key={error.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          anticipatedErrorsChecked[error.id]
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={anticipatedErrorsChecked[error.id] || false}
                            onChange={() =>
                              handleAnticipatedErrorToggle(error.id)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">
                              {error.error_pattern}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">Correction:</span> {error.correction_protocol}
                            </p>
                          </div>
                        </label>

                        {anticipatedErrorsChecked[error.id] && (
                          <>
                            {/* Who made this error + did correction work? */}
                            <div className="mt-2 ml-6">
                              <p className="text-xs text-gray-500 mb-2">Who made this error? Did correction work?</p>
                              <div className="space-y-2">
                                {students.map((student, index) => {
                                  const isSelected = (errorStudents[error.id] || []).includes(student.id);
                                  const studentCorrectionResult = correctionWorked[error.id]?.[student.id];
                                  return (
                                    <div key={student.id} className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleToggleErrorStudent(error.id, student.id)}
                                        className={`
                                          w-8 h-8 rounded-full flex items-center justify-center
                                          text-xs font-bold transition-all flex-shrink-0
                                          ${isSelected
                                            ? STUDENT_COLORS[index % STUDENT_COLORS.length]
                                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                          }
                                        `}
                                        title={`${student.name} - click to toggle`}
                                      >
                                        {getInitials(student.name)}
                                      </button>
                                      {isSelected && (
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => handleCorrectionWorked(error.id, student.id, true)}
                                            className={`px-2 py-1 rounded text-xs ${
                                              studentCorrectionResult === true
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                          >
                                            ✓
                                          </button>
                                          <button
                                            onClick={() => handleCorrectionWorked(error.id, student.id, false)}
                                            className={`px-2 py-1 rounded text-xs ${
                                              studentCorrectionResult === false
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                          >
                                            ✗
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            {/* Save to Error Bank button */}
                            <div className="mt-3 ml-6">
                              {savedToBank[error.id] ? (
                                <div className="flex items-center gap-1 text-xs text-emerald-600">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Saved to Error Bank</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSaveToBank(
                                    error.id,
                                    error.error_pattern,
                                    error.correction_protocol
                                  )}
                                  className="flex items-center gap-1 px-2 py-1 text-xs bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>Save to Bank</span>
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Unexpected errors */}
                    {unexpectedErrors.length > 0 && (
                      <div className="pt-3 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          New Errors Observed
                        </h4>
                        {unexpectedErrors.map((error, i) => {
                          const errorId = error.id;
                          const errorStudent = students.find(s => s.id === (error as any).student_id);
                          const studentIndex = students.findIndex(s => s.id === (error as any).student_id);
                          return (
                            <div
                              key={i}
                              className="p-2 bg-red-50 border border-red-200 rounded text-sm mb-2"
                            >
                              <div className="flex items-start gap-2">
                                {errorStudent && (
                                  <div
                                    className={`
                                      w-6 h-6 rounded-full flex items-center justify-center
                                      text-xs font-bold flex-shrink-0
                                      ${STUDENT_COLORS[studentIndex % STUDENT_COLORS.length]}
                                    `}
                                    title={errorStudent.name}
                                  >
                                    {getInitials(errorStudent.name)}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{error.error_pattern}</p>
                                  {error.correction_used && (
                                    <p className="text-xs text-gray-600">
                                      Correction: {error.correction_used}
                                    </p>
                                  )}
                                  {/* Save to Error Bank button */}
                                  <div className="mt-2">
                                    {savedToBank[errorId] ? (
                                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Saved to Error Bank</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleSaveToBank(
                                          errorId,
                                          error.error_pattern,
                                          error.correction_used || 'No correction specified',
                                          true
                                        )}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
                                      >
                                        <Save className="w-3 h-3" />
                                        <span>Save to Bank</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add new error form */}
                    {showNewErrorForm ? (
                      <div className="p-3 bg-gray-100 rounded-lg space-y-2">
                        <input
                          type="text"
                          placeholder="Error pattern observed..."
                          value={newErrorPattern}
                          onChange={(e) => setNewErrorPattern(e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Correction used..."
                          value={newErrorCorrection}
                          onChange={(e) => setNewErrorCorrection(e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                        {/* Student selector */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Who made this error?</p>
                          <div className="flex flex-wrap gap-1">
                            {students.map((student, index) => (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => setNewErrorStudent(
                                  newErrorStudent === student.id ? '' : student.id
                                )}
                                className={`
                                  w-8 h-8 rounded-full flex items-center justify-center
                                  text-xs font-bold transition-all
                                  ${newErrorStudent === student.id
                                    ? STUDENT_COLORS[index % STUDENT_COLORS.length]
                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                  }
                                `}
                                title={student.name}
                              >
                                {getInitials(student.name)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={handleAddUnexpectedError}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowNewErrorForm(false);
                              setNewErrorStudent('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowNewErrorForm(true)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Log New Error
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Exit Ticket */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Exit Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={exitTicketCorrect || ''}
                      onChange={(e) =>
                        setExitTicketCorrect(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-center"
                      placeholder="0"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      min="0"
                      value={exitTicketTotal || ''}
                      onChange={(e) =>
                        setExitTicketTotal(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-16 px-2 py-1 border rounded text-center"
                      placeholder="0"
                    />
                    <span className="text-sm text-gray-500">correct</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick assessments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-2">
                      Pacing
                    </label>
                    <div className="flex gap-2">
                      {(['too_slow', 'just_right', 'too_fast'] as Pacing[]).map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => setPacing(p)}
                            className={`px-3 py-2 rounded text-xs flex-1 min-h-[44px] ${
                              pacing === p
                                ? 'bg-movement text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {p.replace('_', ' ')}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 block mb-2">
                      Mastery
                    </label>
                    <div className="flex gap-2">
                      {(['yes', 'partial', 'no'] as MasteryLevel[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setMastery(m)}
                          className={`px-3 py-2 rounded text-xs flex-1 min-h-[44px] ${
                            mastery === m
                              ? m === 'yes'
                                ? 'bg-emerald-500 text-white'
                                : m === 'partial'
                                ? 'bg-amber-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Edit Session Modal */}
      {session && group && (
        <EditSessionModal
          session={session}
          group={group}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSession}
        />
      )}

      {/* Cancel Session Modal */}
      {session && group && (
        <CancelSessionModal
          session={session}
          group={group}
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onCancel={handleCancelSession}
          onReschedule={handleRescheduleSession}
        />
      )}

      {/* Reschedule Modal (Plan Session with pre-filled data) */}
      {session && group && (
        <PlanSessionModal
          group={group}
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          onSave={handleCreateRescheduledSession}
        />
      )}
    </div>
  );
}
