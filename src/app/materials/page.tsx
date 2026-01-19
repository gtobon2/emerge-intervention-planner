'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Calendar,
  Users,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  CurriculumBadge,
} from '@/components/ui';
import { WeeklyMaterialsOverview } from '@/components/materials';
import { useGroups } from '@/hooks';
import type { Group } from '@/lib/supabase/types';

export default function MaterialsPage() {
  const { groups, isLoading: groupsLoading } = useGroups();
  const [selectedTab, setSelectedTab] = useState<'weekly' | 'groups'>('weekly');

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Materials Setup</h1>
            <p className="text-text-muted mt-1">
              Prepare materials for your intervention sessions
            </p>
          </div>
          <Package className="w-8 h-8 text-movement" />
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 p-1 bg-foundation rounded-lg">
          <button
            onClick={() => setSelectedTab('weekly')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'weekly'
                ? 'bg-white dark:bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Calendar className="w-4 h-4" />
            This Week
          </button>
          <button
            onClick={() => setSelectedTab('groups')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'groups'
                ? 'bg-white dark:bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            By Group
          </button>
        </div>

        {/* Tab Content */}
        {selectedTab === 'weekly' ? (
          <WeeklyMaterialsOverview />
        ) : (
          <div className="space-y-4">
            {groupsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-foundation rounded-lg animate-pulse" />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
                    <p className="text-sm text-text-muted mb-2">No groups found</p>
                    <p className="text-xs text-text-muted mb-4">
                      Create a group to track materials
                    </p>
                    <Link href="/groups">
                      <Button variant="secondary" size="sm">
                        Go to Groups
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              groups.map((group) => (
                <GroupMaterialsCard key={group.id} group={group} />
              ))
            )}
          </div>
        )}

        {/* Tips Card */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Tips for Materials Setup
                </h3>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>
                    <strong>Group Materials:</strong> Track all materials needed for each
                    intervention group on the group detail page
                  </li>
                  <li>
                    <strong>Session Materials:</strong> When you plan a session, materials are
                    auto-generated based on the curriculum position
                  </li>
                  <li>
                    <strong>Weekly View:</strong> Use this page to see all materials needed for your
                    upcoming sessions
                  </li>
                  <li>
                    <strong>Preparation:</strong> Check off items as you prepare them for each
                    session
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

// Group Materials Card Component
function GroupMaterialsCard({ group }: { group: Group }) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover:border-movement/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-movement/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-movement" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-text-primary">{group.name}</h3>
                  <CurriculumBadge curriculum={group.curriculum} />
                </div>
                <p className="text-sm text-text-muted">
                  Grade {group.grade} · Tier {group.tier}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
