'use client';

import { useEffect, useState, useMemo } from 'react';
import { UserCheck, Users, Calendar, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { fetchInterventionists, type Profile } from '@/lib/supabase/profiles';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { isMockMode } from '@/lib/supabase/config';

const MOCK_INTERVENTIONISTS: Profile[] = [
  {
    id: 'interventionist-1',
    full_name: 'Sarah Martinez',
    email: 'sarah@emerge.edu',
    role: 'interventionist',
    grade_level: null,
    created_at: new Date().toISOString(),
    created_by: null,
  },
  {
    id: 'interventionist-2',
    full_name: 'James Wilson',
    email: 'james@emerge.edu',
    role: 'interventionist',
    grade_level: null,
    created_at: new Date().toISOString(),
    created_by: null,
  },
];

interface InterventionistRow {
  id: string;
  name: string;
  groupCount: number;
  studentCount: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  status: 'active' | 'idle';
}

export function InterventionistRoster() {
  const [interventionists, setInterventionists] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const groups = useGroupsStore((s) => s.groups);
  const allSessions = useSessionsStore((s) => s.allSessions);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (isMockMode()) {
          setInterventionists(MOCK_INTERVENTIONISTS);
        } else {
          const data = await fetchInterventionists();
          if (!cancelled) setInterventionists(data);
        }
      } catch {
        // Non-critical, show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const rows: InterventionistRow[] = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return interventionists.map((intv) => {
      const ownGroups = groups.filter((g) => g.owner_id === intv.id);
      const groupIds = new Set(ownGroups.map((g) => g.id));

      // Count unique students across owned groups
      // We don't have direct student data here, so use groups
      const studentCount = 0; // Will be estimated from allSessions or groups

      const weekSessions = allSessions.filter(
        (s) => groupIds.has(s.group_id) && new Date(s.date) >= startOfWeek
      );
      const completed = weekSessions.filter(
        (s) => s.status === 'completed'
      ).length;
      const planned = weekSessions.filter(
        (s) => s.status === 'planned'
      ).length;

      return {
        id: intv.id,
        name: intv.full_name,
        groupCount: ownGroups.length,
        studentCount,
        sessionsCompleted: completed,
        sessionsPlanned: planned,
        status: ownGroups.length > 0 ? ('active' as const) : ('idle' as const),
      };
    });
  }, [interventionists, groups, allSessions]);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 pb-3 border-b border-border flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-movement" />
        <h3 className="text-lg font-semibold text-text-primary">
          Interventionists
        </h3>
      </div>

      <div className="p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">
            No interventionists found.
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="p-3 rounded-lg bg-foundation flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {row.name}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      row.status === 'active'
                        ? 'bg-green-500/15 text-green-500'
                        : 'bg-gray-500/15 text-gray-400'
                    }`}
                  >
                    {row.status === 'active' ? 'Active' : 'Idle'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {row.groupCount} groups
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {row.sessionsCompleted}/{row.sessionsCompleted + row.sessionsPlanned} sessions
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
