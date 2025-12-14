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
            <Button variant="secondary" className="gap-2 flex-1 md:flex-initial min-h-[44px]">
              <Settings className="w-4 h-4" />
              <span>Edit</span>
            </Button>
            <Button className="gap-2 flex-1 md:flex-initial min-h-[44px]">
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
              <TrendingUp className="w-5 h-5 text-movement" />
              <span className="text-2xl font-bold text-text-primary">--</span>
            </div>
            <p className="text-sm text-text-muted">PM Trend</p>
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
                      <Link
                        key={session.id}
                        href={`/groups/${groupId}/session/${session.id}`}
                        className="block p-3 md:p-4 bg-foundation rounded-lg hover:bg-foundation/80 transition-colors min-h-[60px]"
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
    </AppLayout>
  );
}
