'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Users,
  Settings,
  TrendingUp,
  Clock,
  BookOpen
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent, CurriculumBadge, TierBadge, StatusBadge } from '@/components/ui';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { formatCurriculumPosition } from '@/lib/supabase/types';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const { selectedGroup, fetchGroupById, isLoading: groupLoading } = useGroupsStore();
  const { sessions, fetchSessionsForGroup, isLoading: sessionsLoading } = useSessionsStore();

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchSessionsForGroup(groupId);
    }
  }, [groupId, fetchGroupById, fetchSessionsForGroup]);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/groups">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>

        {/* Group Info */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {selectedGroup.name}
            </h1>
            <div className="flex items-center gap-3 mb-3">
              <CurriculumBadge curriculum={selectedGroup.curriculum} />
              <TierBadge tier={selectedGroup.tier} />
              <span className="text-text-muted">Grade {selectedGroup.grade}</span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <BookOpen className="w-4 h-4" />
              <span>Current Position: {positionLabel}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="gap-2">
              <Settings className="w-4 h-4" />
              Edit
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Plan Session
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
              <TrendingUp className="w-5 h-5 text-movement" />
              <span className="text-2xl font-bold text-text-primary">--</span>
            </div>
            <p className="text-sm text-text-muted">PM Trend</p>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sessions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Sessions</span>
                  <Link href={`/groups/${groupId}/sessions`}>
                    <Button variant="ghost" size="sm">View All</Button>
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
                    <p>No sessions yet</p>
                    <Button variant="secondary" className="mt-4">
                      Plan First Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <Link
                        key={session.id}
                        href={`/groups/${groupId}/session/${session.id}`}
                        className="block p-3 bg-foundation rounded-lg hover:bg-foundation/80 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-text-primary">
                            {new Date(session.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <StatusBadge status={session.status} />
                        </div>
                        <p className="text-sm text-text-muted">
                          {formatCurriculumPosition(selectedGroup.curriculum, session.curriculum_position)}
                        </p>
                      </Link>
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
                <CardTitle className="flex items-center justify-between">
                  <span>Students</span>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedGroup.students?.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No students added</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedGroup.students?.map((student) => (
                      <div
                        key={student.id}
                        className="p-2 bg-foundation rounded-lg flex items-center justify-between"
                      >
                        <span className="text-text-primary">{student.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
