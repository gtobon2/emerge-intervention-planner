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
} from '@/components/ui';
import { Timer, OTRCounter } from '@/components/ui';
import { EndSessionModal } from '@/components/session';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { useUIStore } from '@/stores/ui';
import { formatCurriculumPosition } from '@/lib/supabase/types';

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

  useEffect(() => {
    if (groupId) fetchGroupById(groupId);
    if (sessionId) fetchSessionById(sessionId);
  }, [groupId, sessionId, fetchGroupById, fetchSessionById]);

  // Reset counters when page loads
  useEffect(() => {
    resetOTR();
    resetTimer();
  }, [resetOTR, resetTimer]);

  const handleStartSession = async () => {
    setSessionStarted(true);
    // Optionally update session status to 'in_progress' if you add that status
  };

  const handleEndSession = () => {
    setShowEndModal(true);
  };

  const handleSessionComplete = () => {
    router.push(`/groups/${groupId}`);
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
              <StatusBadge status={selectedSession.status} />
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
            ) : !sessionStarted ? (
              <Button onClick={handleStartSession} className="gap-2">
                <Clock className="w-4 h-4" />
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

        {/* Completed Session Summary */}
        {isCompleted && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-text-muted">OTR Count</p>
                  <p className="text-xl font-bold text-text-primary">
                    {selectedSession.actual_otr_estimate || '-'}
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
        {!isCompleted && sessionStarted && (
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
                <OTRCounter target={selectedGroup.tier === 3 ? 15 : 20} />
              </CardContent>
            </Card>
          </div>
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
                {selectedGroup.students?.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 bg-foundation rounded-lg text-center"
                  >
                    <span className="text-text-primary font-medium">
                      {student.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Waiting to Start */}
        {!isCompleted && !sessionStarted && (
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
                <Clock className="w-5 h-5" />
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
      />
    </AppLayout>
  );
}
