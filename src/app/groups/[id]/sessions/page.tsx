'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import {
  Button,
  Card,
  Select,
  CurriculumBadge,
  TierBadge,
  StatusBadge,
} from '@/components/ui';
import { ScheduleSessionModal } from '@/components/forms';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { formatCurriculumPosition } from '@/lib/supabase/types';
import type { SessionStatus } from '@/lib/supabase/types';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function GroupSessionsPage() {
  const params = useParams();
  const groupId = params.id as string;

  const { selectedGroup, fetchGroupById, isLoading: groupLoading } = useGroupsStore();
  const { sessions, fetchSessionsForGroup, isLoading: sessionsLoading } = useSessionsStore();

  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [showScheduleSession, setShowScheduleSession] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchSessionsForGroup(groupId);
    }
  }, [groupId, fetchGroupById, fetchSessionsForGroup]);

  const handleSessionScheduled = () => {
    fetchSessionsForGroup(groupId);
  };

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    if (statusFilter !== 'all' && session.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Sort by date descending
  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Stats
  const stats = {
    total: sessions.length,
    planned: sessions.filter((s) => s.status === 'planned').length,
    completed: sessions.filter((s) => s.status === 'completed').length,
    cancelled: sessions.filter((s) => s.status === 'cancelled').length,
  };

  if (groupLoading || !selectedGroup) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface rounded" />
          <div className="h-24 bg-surface rounded-xl" />
          <div className="h-64 bg-surface rounded-xl" />
        </div>
      </AppLayout>
    );
  }

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

        {/* Group Info */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {selectedGroup.name} - Sessions
            </h1>
            <div className="flex items-center gap-3">
              <CurriculumBadge curriculum={selectedGroup.curriculum} />
              <TierBadge tier={selectedGroup.tier} />
            </div>
          </div>
          <Button className="gap-2" onClick={() => setShowScheduleSession(true)}>
            <Plus className="w-4 h-4" />
            Schedule Session
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-text-muted" />
              <span className="text-2xl font-bold text-text-primary">{stats.total}</span>
            </div>
            <p className="text-sm text-text-muted">Total Sessions</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-500">{stats.planned}</span>
            </div>
            <p className="text-sm text-text-muted">Planned</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-green-500">{stats.completed}</span>
            </div>
            <p className="text-sm text-text-muted">Completed</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-5 h-5 text-gray-500" />
              <span className="text-2xl font-bold text-gray-500">{stats.cancelled}</span>
            </div>
            <p className="text-sm text-text-muted">Cancelled</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
          <Filter className="w-4 h-4 text-text-muted" />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SessionStatus | 'all')}
            className="w-40"
          />
          <span className="text-sm text-text-muted">
            Showing {filteredSessions.length} of {sessions.length} sessions
          </span>
        </div>

        {/* Sessions List */}
        <Card>
          {sessionsLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-foundation rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sortedSessions.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
              <p className="text-text-muted mb-4">
                {statusFilter !== 'all'
                  ? `No ${statusFilter} sessions`
                  : 'No sessions scheduled yet'}
              </p>
              <Button onClick={() => setShowScheduleSession(true)}>
                Schedule First Session
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/groups/${groupId}/session/${session.id}`}
                  className="block p-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-text-primary">
                          {new Date(session.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        {session.time && (
                          <span className="text-sm text-text-muted">
                            at {session.time}
                          </span>
                        )}
                        <StatusBadge status={session.status} />
                      </div>
                      <p className="text-sm text-text-muted">
                        {formatCurriculumPosition(
                          selectedGroup.curriculum,
                          session.curriculum_position
                        )}
                      </p>
                      {session.status === 'completed' && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                          {session.actual_otr_count && (
                            <span>OTR: {session.actual_otr_count}</span>
                          )}
                          {session.exit_ticket_correct !== null && (
                            <span>
                              Exit: {session.exit_ticket_correct}/{session.exit_ticket_total}
                            </span>
                          )}
                          {session.mastery_demonstrated && (
                            <span className="capitalize">
                              Mastery: {session.mastery_demonstrated}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-text-muted">→</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Schedule Session Modal */}
      {selectedGroup && (
        <ScheduleSessionModal
          isOpen={showScheduleSession}
          onClose={() => setShowScheduleSession(false)}
          group={selectedGroup}
          onScheduled={handleSessionScheduled}
        />
      )}
    </AppLayout>
  );
}
