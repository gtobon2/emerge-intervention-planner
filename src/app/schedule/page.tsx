'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus, Settings, Users, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Modal, Input, Select, Card } from '@/components/ui';
import { useScheduleStore } from '@/stores/schedule';
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { ScheduleGrid } from '@/components/schedule/ScheduleGrid';
import { InterventionistModal } from '@/components/schedule/InterventionistModal';
import { ConstraintsModal } from '@/components/schedule/ConstraintsModal';
import { SuggestionsPanel } from '@/components/schedule/SuggestionsPanel';
import { formatTimeDisplay, WEEKDAYS, getDayDisplayName } from '@/lib/scheduling/time-utils';
import type { WeekDay } from '@/lib/supabase/types';

export default function SchedulePage() {
  const {
    interventionists,
    gradeLevelConstraints,
    fetchAll,
    isLoading,
    error,
    selectedInterventionistId,
    setSelectedInterventionist,
  } = useScheduleStore();

  const { groups, fetchGroups } = useGroupsStore();
  const { allSessions, fetchAllSessions } = useSessionsStore();

  const [isInterventionistModalOpen, setIsInterventionistModalOpen] = useState(false);
  const [isConstraintsModalOpen, setIsConstraintsModalOpen] = useState(false);
  const [editingInterventionist, setEditingInterventionist] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    fetchGroups();
    fetchAllSessions();
  }, [fetchAll, fetchGroups, fetchAllSessions]);

  // Get groups that have no upcoming sessions (planned status)
  const unscheduledGroups = useMemo(() => {
    const groupsWithSessions = new Set(
      allSessions
        .filter(s => s.status === 'planned')
        .map(s => s.group_id)
    );
    return groups.filter(g => !groupsWithSessions.has(g.id));
  }, [groups, allSessions]);

  const selectedInterventionist = useMemo(() => {
    if (!selectedInterventionistId) return null;
    return interventionists.find(i => String(i.id) === selectedInterventionistId) || null;
  }, [interventionists, selectedInterventionistId]);

  const handleAddInterventionist = () => {
    setEditingInterventionist(null);
    setIsInterventionistModalOpen(true);
  };

  const handleEditInterventionist = (id: string) => {
    setEditingInterventionist(id);
    setIsInterventionistModalOpen(true);
  };

  const interventionistOptions = useMemo(() => [
    { value: 'all', label: 'All Interventionists' },
    ...interventionists.map(i => ({ value: String(i.id), label: i.name }))
  ], [interventionists]);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Schedule Builder</h1>
            <p className="text-sm md:text-base text-text-muted mt-1">
              Plan intervention sessions based on availability
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setIsConstraintsModalOpen(true)}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Constraints</span>
            </Button>
            <Button className="gap-2" onClick={handleAddInterventionist}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Interventionist</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center p-4 bg-surface rounded-xl">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-text-muted" />
            <Select
              options={interventionistOptions}
              value={selectedInterventionistId || 'all'}
              onChange={(e) => setSelectedInterventionist(
                e.target.value === 'all' ? null : e.target.value
              )}
              className="w-48 min-h-[44px]"
            />
          </div>
          {interventionists.length === 0 && (
            <p className="text-sm text-text-muted">
              Add an interventionist to get started
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Schedule Grid */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              <ScheduleGrid
                interventionist={selectedInterventionist}
                groups={groups}
                constraints={gradeLevelConstraints}
              />
            </Card>
          </div>

          {/* Sidebar - Groups & Suggestions */}
          <div className="space-y-4">
            {/* Unscheduled Groups */}
            <Card className="p-4">
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Unscheduled Groups
              </h3>
              {groups.length === 0 ? (
                <p className="text-sm text-text-muted">No groups created yet</p>
              ) : unscheduledGroups.length === 0 ? (
                <p className="text-sm text-green-600">All groups are scheduled!</p>
              ) : (
                <div className="space-y-2">
                  {unscheduledGroups.slice(0, 5).map(group => (
                    <div
                      key={group.id}
                      className="p-2 bg-background rounded-lg text-sm"
                    >
                      <div className="font-medium">{group.name}</div>
                      <div className="text-text-muted text-xs">
                        Grade {group.grade} | {group.curriculum}
                      </div>
                    </div>
                  ))}
                  {unscheduledGroups.length > 5 && (
                    <p className="text-xs text-text-muted text-center">
                      +{unscheduledGroups.length - 5} more groups
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Suggestions Panel */}
            <SuggestionsPanel groups={groups} />
          </div>
        </div>

        {/* Interventionists Quick View */}
        {interventionists.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Interventionists
            </h3>
            <div className="flex flex-wrap gap-2">
              {interventionists.map(interventionist => (
                <button
                  key={interventionist.id}
                  onClick={() => handleEditInterventionist(String(interventionist.id))}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background hover:bg-surface-hover transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: interventionist.color }}
                  />
                  <span className="text-sm">{interventionist.name}</span>
                  {interventionist.availability.length > 0 && (
                    <span className="text-xs text-text-muted">
                      ({interventionist.availability.length} blocks)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Modals */}
        <InterventionistModal
          isOpen={isInterventionistModalOpen}
          onClose={() => {
            setIsInterventionistModalOpen(false);
            setEditingInterventionist(null);
          }}
          editingId={editingInterventionist}
        />

        <ConstraintsModal
          isOpen={isConstraintsModalOpen}
          onClose={() => setIsConstraintsModalOpen(false)}
        />
      </div>
    </AppLayout>
  );
}
