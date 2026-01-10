'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Select, StatusBadge } from '@/components/ui';
import { PlanSessionModal, EditSessionModal, CancelSessionModal, SessionPlanData } from '@/components/sessions';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { formatCurriculumPosition } from '@/lib/supabase/types';
import type { Session, SessionStatus } from '@/lib/supabase/types';

type FilterStatus = 'all' | SessionStatus;

export default function GroupSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { selectedGroup, fetchGroupById, isLoading: groupLoading } = useGroupsStore();
  const { sessions, fetchSessionsForGroup, createSession, updateSession, cancelSession, isLoading: sessionsLoading } = useSessionsStore();

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchSessionsForGroup(groupId);
    }
  }, [groupId, fetchGroupById, fetchSessionsForGroup]);

  const filteredSessions = useMemo(() => {
    if (filterStatus === 'all') return sessions;
    return sessions.filter(s => s.status === filterStatus);
  }, [sessions, filterStatus]);

  const handlePlanSession = async (data: SessionPlanData) => {
    await createSession({
      group_id: groupId,
      date: data.date,
      time: data.time,
      status: 'planned',
      curriculum_position: data.curriculum_position,
      advance_after: false,
      planned_otr_target: data.planned_otr_target,
      planned_practice_items: data.planned_practice_items,
      planned_response_formats: data.planned_response_formats,
      cumulative_review_items: null,
      anticipated_errors: data.anticipated_errors,
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
      notes: data.notes || null,
      next_session_notes: null,
      fidelity_checklist: null,
      wilson_lesson_plan: data.wilson_lesson_plan || null,
    });
    fetchSessionsForGroup(groupId);
  };

  const handleEditSession = async (sessionId: string, updates: any) => {
    await updateSession(sessionId, updates);
    fetchSessionsForGroup(groupId);
    setShowEditSessionModal(false);
    setSelectedSession(null);
  };

  const handleCancelSession = async (sessionId: string, reason?: string) => {
    await cancelSession(sessionId, reason);
    fetchSessionsForGroup(groupId);
    setShowCancelSessionModal(false);
    setSelectedSession(null);
  };

  const handleOpenEditSessionModal = (session: Session) => {
    setSelectedSession(session);
    setShowEditSessionModal(true);
    setOpenDropdownId(null);
  };

  const handleOpenCancelSessionModal = (session: Session) => {
    setSelectedSession(session);
    setShowCancelSessionModal(true);
    setOpenDropdownId(null);
  };

  const statusOptions = [
    { value: 'all', label: 'All Sessions' },
    { value: 'planned', label: 'Planned' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const sessionStats = useMemo(() => ({
    total: sessions.length,
    planned: sessions.filter(s => s.status === 'planned').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
  }), [sessions]);

  if (groupLoading || !selectedGroup) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface rounded" />
          <div className="h-48 bg-surface rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link href={`/groups/${groupId}`}>
            <Button variant="ghost" size="sm" className="gap-1 min-h-[44px]">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Group</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>

        {/* Title and Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              {selectedGroup.name} - Sessions
            </h1>
            <p className="text-sm md:text-base text-text-muted mt-1">
              View and manage all sessions for this group
            </p>
          </div>
          <Button
            className="gap-2 min-h-[44px]"
            onClick={() => setShowPlanModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Plan Session</span>
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-movement" />
              <span className="text-2xl font-bold text-text-primary">
                {sessionStats.total}
              </span>
            </div>
            <p className="text-sm text-text-muted">Total</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-text-primary">
                {sessionStats.planned}
              </span>
            </div>
            <p className="text-sm text-text-muted">Planned</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-text-primary">
                {sessionStats.completed}
              </span>
            </div>
            <p className="text-sm text-text-muted">Completed</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-text-primary">
                {sessionStats.cancelled}
              </span>
            </div>
            <p className="text-sm text-text-muted">Cancelled</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 p-4 bg-surface rounded-xl">
          <Filter className="w-4 h-4 text-text-muted" />
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="w-40 min-h-[44px]"
          />
          <span className="text-sm text-text-muted">
            Showing {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Sessions List */}
        <Card className="p-4">
          {sessionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-foundation rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm md:text-base mb-4">
                {filterStatus === 'all'
                  ? 'No sessions yet'
                  : `No ${filterStatus} sessions`}
              </p>
              {filterStatus === 'all' && (
                <Button
                  variant="secondary"
                  className="min-h-[44px]"
                  onClick={() => setShowPlanModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Plan First Session
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="relative p-3 md:p-4 bg-foundation rounded-lg hover:bg-foundation/80 transition-colors min-h-[60px]"
                >
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/groups/${groupId}/session/${session.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm md:text-base text-text-primary">
                          {new Date(session.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <StatusBadge status={session.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs md:text-sm text-text-muted">
                        <span>
                          {formatCurriculumPosition(selectedGroup.curriculum, session.curriculum_position)}
                        </span>
                        {session.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.time}
                          </span>
                        )}
                        {session.status === 'completed' && session.exit_ticket_correct !== null && session.exit_ticket_total !== null && (
                          <span>
                            Exit: {session.exit_ticket_correct}/{session.exit_ticket_total}
                          </span>
                        )}
                      </div>
                    </Link>

                    {session.status === 'planned' && (
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === session.id ? null : session.id)}
                          className="p-2 hover:bg-surface rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-text-muted" />
                        </button>

                        {openDropdownId === session.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-20">
                              <button
                                onClick={() => handleOpenEditSessionModal(session)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleOpenCancelSessionModal(session)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                              >
                                <XCircle className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Plan Session Modal */}
      <PlanSessionModal
        group={selectedGroup}
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSave={handlePlanSession}
      />

      {/* Edit Session Modal */}
      {selectedSession && selectedGroup && (
        <EditSessionModal
          session={selectedSession}
          group={selectedGroup}
          isOpen={showEditSessionModal}
          onClose={() => {
            setShowEditSessionModal(false);
            setSelectedSession(null);
          }}
          onSave={handleEditSession}
        />
      )}

      {/* Cancel Session Modal */}
      {selectedSession && selectedGroup && (
        <CancelSessionModal
          session={selectedSession}
          group={selectedGroup}
          isOpen={showCancelSessionModal}
          onClose={() => {
            setShowCancelSessionModal(false);
            setSelectedSession(null);
          }}
          onCancel={handleCancelSession}
        />
      )}
    </AppLayout>
  );
}
