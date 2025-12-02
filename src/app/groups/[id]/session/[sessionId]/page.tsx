'use client';

import { useState, useEffect, use } from 'react';
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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurriculumBadge, TierBadge, Badge } from '@/components/ui/badge';
import { Timer } from '@/components/ui/timer';
import { OTRCounter } from '@/components/ui/otr-counter';
import type {
  Session,
  Group,
  Curriculum,
  Pacing,
  MasteryLevel,
  ObservedError,
  AnticipatedError,
} from '@/lib/supabase/types';
import { formatCurriculumPosition, getCurriculumLabel } from '@/lib/supabase/types';

// Mock data for demonstration - in production, fetch from API/Supabase
function getMockSession(sessionId: string, groupId: string): Session {
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
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Session tracking state
  const [anticipatedErrorsChecked, setAnticipatedErrorsChecked] = useState<Record<string, boolean>>({});
  const [correctionWorked, setCorrectionWorked] = useState<Record<string, boolean | null>>({});
  const [unexpectedErrors, setUnexpectedErrors] = useState<ObservedError[]>([]);
  const [componentsCompleted, setComponentsCompleted] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [exitTicketCorrect, setExitTicketCorrect] = useState<number | null>(null);
  const [exitTicketTotal, setExitTicketTotal] = useState<number | null>(null);
  const [pacing, setPacing] = useState<Pacing | null>(null);
  const [mastery, setMastery] = useState<MasteryLevel | null>(null);

  // UI state
  const [showErrorPanel, setShowErrorPanel] = useState(true);
  const [showNewErrorForm, setShowNewErrorForm] = useState(false);
  const [newErrorPattern, setNewErrorPattern] = useState('');
  const [newErrorCorrection, setNewErrorCorrection] = useState('');

  useEffect(() => {
    // In production, fetch from Supabase
    const mockSession = getMockSession(resolvedParams.sessionId, resolvedParams.id);
    const mockGroup = getMockGroup(resolvedParams.id);
    setSession(mockSession);
    setGroup(mockGroup);
    setIsLoading(false);
  }, [resolvedParams.id, resolvedParams.sessionId]);

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  const handleCompleteSession = () => {
    // In production, save to Supabase
    alert('Session completed! Data would be saved.');
    router.push(`/groups/${resolvedParams.id}`);
  };

  const handleAnticipatedErrorToggle = (errorId: string) => {
    setAnticipatedErrorsChecked((prev) => ({
      ...prev,
      [errorId]: !prev[errorId],
    }));
  };

  const handleCorrectionWorked = (errorId: string, worked: boolean) => {
    setCorrectionWorked((prev) => ({
      ...prev,
      [errorId]: worked,
    }));
  };

  const handleAddUnexpectedError = () => {
    if (newErrorPattern.trim()) {
      setUnexpectedErrors((prev) => [
        ...prev,
        {
          error_pattern: newErrorPattern,
          correction_used: newErrorCorrection,
          correction_worked: true,
          add_to_bank: true,
        },
      ]);
      setNewErrorPattern('');
      setNewErrorCorrection('');
      setShowNewErrorForm(false);
    }
  };

  const handleComponentToggle = (component: string) => {
    setComponentsCompleted((prev) =>
      prev.includes(component)
        ? prev.filter((c) => c !== component)
        : [...prev, component]
    );
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/groups/${group.id}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-semibold text-lg">{group.name}</h1>
                <div className="flex items-center gap-2 text-sm">
                  <CurriculumBadge curriculum={group.curriculum} />
                  <TierBadge tier={group.tier} />
                  <span className="text-gray-500">
                    {formatCurriculumPosition(group.curriculum, session.curriculum_position)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isSessionActive ? (
                <>
                  <Timer targetMinutes={group.schedule?.duration || 45} />
                  <Button variant="primary" onClick={handleCompleteSession}>
                    <Check className="w-4 h-4 mr-1" />
                    Complete Session
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={handleStartSession}>
                  <Play className="w-4 h-4 mr-1" />
                  Start Session
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
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
                        <Badge
                          variant={
                            item.type === 'new'
                              ? 'default'
                              : item.type === 'review'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
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
                      <Badge key={format} variant="secondary">
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
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Anticipated Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.anticipated_errors?.map((error) => (
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
              </CardContent>
            </Card>
          </div>
        ) : (
          // Active session view
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main tracking area */}
            <div className="lg:col-span-2 space-y-6">
              {/* OTR Counter */}
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {lessonComponents.map((component) => (
                      <button
                        key={component.name}
                        onClick={() => handleComponentToggle(component.name)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          componentsCompleted.includes(component.name)
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {componentsCompleted.includes(component.name) ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className="font-medium text-sm">
                            {component.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 ml-6">
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
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    Session Notes
                  </CardTitle>
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
                    {session.anticipated_errors?.map((error) => (
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
                            <p className="font-medium text-sm">
                              {error.error_pattern}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {error.correction_protocol}
                            </p>
                          </div>
                        </label>

                        {anticipatedErrorsChecked[error.id] && (
                          <div className="mt-2 ml-6 flex gap-2">
                            <button
                              onClick={() =>
                                handleCorrectionWorked(error.id, true)
                              }
                              className={`px-2 py-1 rounded text-xs ${
                                correctionWorked[error.id] === true
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              Worked
                            </button>
                            <button
                              onClick={() =>
                                handleCorrectionWorked(error.id, false)
                              }
                              className={`px-2 py-1 rounded text-xs ${
                                correctionWorked[error.id] === false
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              Didn&apos;t Work
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Unexpected errors */}
                    {unexpectedErrors.length > 0 && (
                      <div className="pt-3 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          New Errors Observed
                        </h4>
                        {unexpectedErrors.map((error, i) => (
                          <div
                            key={i}
                            className="p-2 bg-red-50 border border-red-200 rounded text-sm mb-2"
                          >
                            <p className="font-medium">{error.error_pattern}</p>
                            {error.correction_used && (
                              <p className="text-xs text-gray-600">
                                Correction: {error.correction_used}
                              </p>
                            )}
                          </div>
                        ))}
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
                            onClick={() => setShowNewErrorForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
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
                    <label className="text-xs text-gray-600 block mb-1">
                      Pacing
                    </label>
                    <div className="flex gap-2">
                      {(['too_slow', 'just_right', 'too_fast'] as Pacing[]).map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => setPacing(p)}
                            className={`px-2 py-1 rounded text-xs flex-1 ${
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
                    <label className="text-xs text-gray-600 block mb-1">
                      Mastery
                    </label>
                    <div className="flex gap-2">
                      {(['yes', 'partial', 'no'] as MasteryLevel[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setMastery(m)}
                          className={`px-2 py-1 rounded text-xs flex-1 ${
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
