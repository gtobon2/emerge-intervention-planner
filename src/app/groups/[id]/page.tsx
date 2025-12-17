'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  Settings,
  TrendingUp,
  Clock,
  BookOpen,
  Trash2,
  Edit,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent, CurriculumBadge, TierBadge, StatusBadge } from '@/components/ui';
import { PlanSessionModal, EditSessionModal, CancelSessionModal, SessionPlanData } from '@/components/sessions';
import { EditGroupModal, DeleteGroupModal } from '@/components/groups';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { formatCurriculumPosition } from '@/lib/supabase/types';
import { db } from '@/lib/local-db';
import type { Session, PMTrend } from '@/lib/supabase/types';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { selectedGroup, fetchGroupById, updateGroup, deleteGroup, isLoading: groupLoading } = useGroupsStore();
  const { sessions, fetchSessionsForGroup, createSession, updateSession, cancelSession, isLoading: sessionsLoading } = useSessionsStore();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showCancelSessionModal, setShowCancelSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pmTrend, setPmTrend] = useState<PMTrend | null>(null);

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchSessionsForGroup(groupId);
    }
  }, [groupId, fetchGroupById, fetchSessionsForGroup]);

  /**
   * Calculate PM Trend for the group
   *
   * Uses last 3 PM data points to determine trend:
   * - 'improving': Most recent scores show upward movement (>5% increase)
   * - 'flat': Scores relatively stable (within 5% variance)
   * - 'declining': Most recent scores show downward movement (>5% decrease)
   * - null: Not enough data points (less than 2)
   */
  useEffect(() => {
    async function calculatePMTrend() {
      if (!groupId) return;

      try {
        const numericGroupId = parseInt(groupId, 10);
        if (isNaN(numericGroupId)) return;

        // Get PM records for this group, sorted by date descending
        const pmRecords = await db.progressMonitoring
          .where('group_id')
          .equals(numericGroupId)
          .toArray();

        if (pmRecords.length < 2) {
          setPmTrend(null);
          return;
        }

        // Sort by date descending (most recent first)
        const sortedRecords = pmRecords.sort((a, b) => b.date.localeCompare(a.date));

        // Take last 3 records (or all if less than 3)
        const recentRecords = sortedRecords.slice(0, 3);

        // Calculate trend based on score changes
        // Compare most recent to oldest in the sample
        const mostRecent = recentRecords[0].score;
        const oldest = recentRecords[recentRecords.length - 1].score;
        const percentChange = ((mostRecent - oldest) / oldest) * 100;

        if (percentChange > 5) {
          setPmTrend('improving');
        } else if (percentChange < -5) {
          setPmTrend('declining');
        } else {
          setPmTrend('flat');
        }
      } catch (error) {
        console.error('Error calculating PM trend:', error);
        setPmTrend(null);
      }
    }

    calculatePMTrend();
  }, [groupId, sessions]); // Re-calculate when sessions change (might have new PM data)

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
    });
    // Refresh sessions list
    fetchSessionsForGroup(groupId);
  };

  const handleEditGroup = async (id: string, updates: any) => {
    setIsSaving(true);
    try {
      await updateGroup(id, updates);
      // Refresh group data
      await fetchGroupById(groupId);
      setShowEditGroupModal(false);
    } catch (err) {
      console.error('Failed to update group:', err);
    } finally {
      setIsSaving(false);
    }
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

  const handleDeleteGroup = async () => {
    setIsSaving(true);
    try {
      await deleteGroup(groupId);
      // Redirect to groups page after successful deletion
      router.push('/groups');
    } catch (err) {
      console.error('Failed to delete group:', err);
      setIsSaving(false);
    }
  };

  if (groupLoading || !selectedGroup) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface rounded" />
          <div className="h-48 bg-surface rounded-xl" />
          <div className="h-64 bg-surface rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  const positionLabel = formatCurriculumPosition(
    selectedGroup.curriculum,
    selectedGroup.current_position
  );

  const recentSessions = sessions.slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/groups">
            <Button variant="ghost" size="sm" className="gap-1 min-h-[44px]">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
        </div>

        {/* Group Info */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
              {selectedGroup.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
              <CurriculumBadge curriculum={selectedGroup.curriculum} />
              <TierBadge tier={selectedGroup.tier} />
              <span className="text-sm md:text-base text-text-muted">Grade {selectedGroup.grade}</span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base text-text-muted">
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Current Position: {positionLabel}</span>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="secondary"
              className="gap-2 flex-1 md:flex-initial min-h-[44px]"
              onClick={() => setShowEditGroupModal(true)}
            >
              <Settings className="w-4 h-4" />
              <span>Edit</span>
            </Button>
            <Button
              variant="secondary"
              className="gap-2 min-h-[44px]"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Delete</span>
            </Button>
            <Button
              className="gap-2 flex-1 md:flex-initial min-h-[44px]"
              onClick={() => setShowPlanModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Plan Session</span>
              <span className="sm:hidden">Plan</span>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-movement" />
              <span className="text-2xl font-bold text-text-primary">
                {selectedGroup.students?.length || 0}
              </span>
            </div>
            <p className="text-sm text-text-muted">Students</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-movement" />
              <span className="text-2xl font-bold text-text-primary">
                {sessions.length}
              </span>
            </div>
            <p className="text-sm text-text-muted">Total Sessions</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-movement" />
              <span className="text-2xl font-bold text-text-primary">
                {sessions.filter(s => s.status === 'completed').length}
              </span>
            </div>
            <p className="text-sm text-text-muted">Completed</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-5 h-5 ${
                pmTrend === 'improving' ? 'text-emerald-500' :
                pmTrend === 'declining' ? 'text-red-500' :
                pmTrend === 'flat' ? 'text-amber-500' :
                'text-movement'
              }`} />
              <span className={`text-2xl font-bold ${
                pmTrend === 'improving' ? 'text-emerald-600' :
                pmTrend === 'declining' ? 'text-red-600' :
                pmTrend === 'flat' ? 'text-amber-600' :
                'text-text-primary'
              }`}>
                {pmTrend ? (
                  pmTrend === 'improving' ? '↑' :
                  pmTrend === 'declining' ? '↓' :
                  '→'
                ) : '--'}
              </span>
            </div>
            <p className="text-sm text-text-muted">
              {pmTrend ? `PM: ${pmTrend === 'flat' ? 'Stable' : pmTrend.charAt(0).toUpperCase() + pmTrend.slice(1)}` : 'PM Trend'}
            </p>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Sessions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base md:text-lg">
                  <span>Recent Sessions</span>
                  <Link href={`/groups/${groupId}/sessions`}>
                    <Button variant="ghost" size="sm" className="min-h-[44px]">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-foundation rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm md:text-base">No sessions yet</p>
                    <Button variant="secondary" className="mt-4 min-h-[44px]">
                      Plan First Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
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
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <StatusBadge status={session.status} />
                            </div>
                            <p className="text-xs md:text-sm text-text-muted truncate">
                              {formatCurriculumPosition(selectedGroup.curriculum, session.curriculum_position)}
                            </p>
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
              </CardContent>
            </Card>
          </div>

          {/* Students */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base md:text-lg">
                  <span>Students</span>
                  <Link href={`/groups/${groupId}/students`}>
                    <Button variant="ghost" size="sm" className="gap-1 min-h-[44px]">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Manage</span>
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedGroup.students?.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-2 text-sm md:text-base">No students added</p>
                    <Link href={`/groups/${groupId}/students`}>
                      <Button variant="secondary" size="sm" className="gap-1 min-h-[44px]">
                        <Plus className="w-4 h-4" />
                        Add Students
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {selectedGroup.students?.slice(0, 5).map((student) => (
                        <div
                          key={student.id}
                          className="p-3 bg-foundation rounded-lg min-h-[44px] flex items-center"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm md:text-base text-text-primary truncate block">{student.name}</span>
                            {student.notes && (
                              <p className="text-xs text-text-muted mt-1 line-clamp-1">
                                {student.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedGroup.students && selectedGroup.students.length > 5 && (
                      <Link href={`/groups/${groupId}/students`}>
                        <Button variant="ghost" size="sm" className="w-full min-h-[44px]">
                          View all {selectedGroup.students.length} students
                        </Button>
                      </Link>
                    )}
                    <Link href={`/groups/${groupId}/students`}>
                      <Button variant="secondary" size="sm" className="w-full gap-1 min-h-[44px]">
                        Manage Students
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Plan Session Modal */}
      <PlanSessionModal
        group={selectedGroup}
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSave={handlePlanSession}
      />

      {/* Edit Group Modal */}
      <EditGroupModal
        isOpen={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        onSave={handleEditGroup}
        group={selectedGroup}
        isLoading={isSaving}
      />

      {/* Delete Group Modal */}
      <DeleteGroupModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGroup}
        group={selectedGroup}
        sessionCount={sessions.length}
        isLoading={isSaving}
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
