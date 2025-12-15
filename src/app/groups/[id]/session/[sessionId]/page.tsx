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
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { getStudentsForGroup, MOCK_GROUPS, MOCK_SESSIONS, MOCK_STUDENTS } from '@/lib/mock-data';
import { useErrorsStore } from '@/stores';

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

// Mock data for demonstration - in production, fetch from API/Supabase
function getMockSession(sessionId: string, groupId: string): Session {
  // Try to find actual session from mock data first
  const existingSession = MOCK_SESSIONS.find(s => s.id === sessionId);
  if (existingSession) {
    return {
      ...existingSession,
      anticipated_errors: existingSession.anticipated_errors || [
        {
          id: '1',
          error_pattern: 'Confuses b/d in reading',
          correction_protocol: 'Use sky writing and tactile letter cards',
        },
        {
          id: '2',
          error_pattern: 'Omits final consonant in blends',
          correction_protocol: 'Tap each phoneme, use finger spelling',
        },
      ],
    };
  }

  // Default session if not found
  return {
    id: sessionId,
    group_id: groupId,
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    status: 'planned',
    curriculum_position: { step: 2, substep: '2.1' },
    advance_after: false,
    planned_otr_target: 40,
    planned_response_formats: ['choral', 'individual', 'written'],
    planned_practice_items: [
      { item: 'Sound-symbol correspondence', type: 'review' },
      { item: 'Blending CVC words', type: 'new' },
    ],
    cumulative_review_items: [
      { item: 'Short vowel sounds', type: 'cumulative' },
    ],
    anticipated_errors: [
      {
        id: '1',
        error_pattern: 'Confuses b/d in reading',
        correction_protocol: 'Use sky writing and tactile letter cards',
      },
      {
        id: '2',
        error_pattern: 'Omits final consonant in blends',
        correction_protocol: 'Tap each phoneme, use finger spelling',
      },
    ],
    actual_otr_estimate: null,
    pacing: null,
    components_completed: null,
    exit_ticket_correct: null,
    exit_ticket_total: null,
    mastery_demonstrated: null,
    errors_observed: null,
    unexpected_errors: null,
    pm_score: null,
    pm_trend: null,
    dbi_adaptation_notes: null,
    notes: null,
    next_session_notes: null,
    fidelity_checklist: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function getMockGroup(groupId: string): Group {
  // Try to find actual group from mock data first
  const existingGroup = MOCK_GROUPS.find(g => g.id === groupId);
  if (existingGroup) {
    return existingGroup;
  }

  // Default group if not found
  return {
    id: groupId,
    name: 'Group A - Reading Foundations',
    curriculum: 'wilson' as Curriculum,
    tier: 2,
    grade: 3,
    current_position: { step: 2, substep: '2.1' },
    schedule: { days: ['monday', 'wednesday', 'friday'], time: '09:00', duration: 45 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

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

  useEffect(() => {
    // In production, fetch from Supabase
    const mockSession = getMockSession(params.sessionId, params.id);
    const mockGroup = getMockGroup(params.id);

    // Try to get students for this group ID
    let mockStudents = getStudentsForGroup(params.id);

    // Fallback: if no students found, try the session's group_id
    if (mockStudents.length === 0 && mockSession.group_id) {
      mockStudents = getStudentsForGroup(mockSession.group_id);
    }

    // Fallback: if still no students, try to find by group name
    if (mockStudents.length === 0 && mockGroup.name) {
      const matchingGroup = MOCK_GROUPS.find(g =>
        g.name.toLowerCase().includes(mockGroup.name.toLowerCase().split(' ')[0])
      );
      if (matchingGroup) {
        mockStudents = getStudentsForGroup(matchingGroup.id);
      }
    }

    // Last fallback: use first group's students for demo
    if (mockStudents.length === 0) {
      mockStudents = MOCK_STUDENTS.filter(s => s.group_id === 'group-1');
    }

    setSession(mockSession);
    setGroup(mockGroup);
    setStudents(mockStudents);
    setAnticipatedErrors(mockSession.anticipated_errors || []);

    // Initialize per-student OTR tracking
    const initialOTRs: Record<string, number> = {};
    mockStudents.forEach((s) => {
      initialOTRs[s.id] = 0;
    });
    setStudentOTRs(initialOTRs);

    setIsLoading(false);
  }, [params.id, params.sessionId]);

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  const handleCompleteSession = () => {
    // In production, save to Supabase
    alert('Session completed! Data would be saved.');
    router.push(`/groups/${params.id}`);
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
                  <Button variant="primary" onClick={handleCompleteSession} className="min-h-[44px] flex-1 sm:flex-initial">
                    <Check className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Complete Session</span>
                    <span className="sm:hidden">Complete</span>
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
    </div>
  );
}
