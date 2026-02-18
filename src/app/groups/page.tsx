'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Filter, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Input, Select, Modal } from '@/components/ui';
import { GroupCard } from '@/components/dashboard';
import { useGroupsStore, useFilteredGroups } from '@/stores/groups';
import { useAuthStore } from '@/stores/auth';
import type { Curriculum, CurriculumPosition } from '@/lib/supabase/types';

const curriculumOptions = [
  { value: 'all', label: 'All Curricula' },
  { value: 'wilson', label: 'Wilson Reading' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'despegando', label: 'Despegando' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

const tierOptions = [
  { value: 'all', label: 'All Tiers' },
  { value: '2', label: 'Tier 2' },
  { value: '3', label: 'Tier 3' },
];

// Default curriculum positions
function getDefaultPosition(curriculum: Curriculum): CurriculumPosition {
  switch (curriculum) {
    case 'wilson':
      return { step: 1, substep: '1' };
    case 'delta_math':
      return { standard: '1.OA.1', session: 1, phase: 'concrete' };
    case 'camino':
      return { lesson: 1 };
    case 'despegando':
      return { phase: 1, lesson: 1 };
    case 'wordgen':
      return { unit: 1, day: 1 };
    case 'amira':
      return { level: 'Emergent' };
    default:
      return { step: 1, substep: '1' };
  }
}

export default function GroupsPage() {
  const { fetchGroupsWithVisibility, createGroupWithOwner, isLoading, error, filter, setFilter, visibleGroups } = useGroupsStore();
  const filteredGroups = useFilteredGroups();
  const { user, userRole } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form state — initialize with real defaults so formData matches the visible UI
  const [formData, setFormData] = useState({
    name: '',
    curriculum: 'wilson' as Curriculum | '',
    tier: '2' as '2' | '3' | '',
    grade: '',
  });

  // Fetch groups based on user role
  useEffect(() => {
    if (user && userRole) {
      fetchGroupsWithVisibility(userRole as 'admin' | 'interventionist' | 'teacher', user.id);
    }
  }, [fetchGroupsWithVisibility, user, userRole]);

  const handleCreateGroup = async () => {
    if (!formData.name || !formData.curriculum || !formData.tier || !formData.grade || !user) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await createGroupWithOwner(
        {
          name: formData.name,
          curriculum: formData.curriculum as Curriculum,
          tier: parseInt(formData.tier) as 2 | 3,
          grade: parseInt(formData.grade),
          current_position: getDefaultPosition(formData.curriculum as Curriculum),
          schedule: null,
        },
        user.id
      );

      if (result) {
        setIsCreateModalOpen(false);
        setFormData({ name: '', curriculum: 'wilson', tier: '2', grade: '' });
        setSuccessMessage(`Group "${formData.name}" created successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.name && formData.curriculum && formData.tier && formData.grade;

  // Check if user has no groups and is not admin
  const hasNoGroups = filteredGroups.length === 0 && !isLoading;
  const isNonAdmin = userRole !== 'admin';

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">My Groups</h1>
            <p className="text-sm md:text-base text-text-muted mt-1">
              {userRole === 'admin'
                ? 'Manage all intervention groups'
                : 'Manage your intervention groups'}
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto min-h-[44px]" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>New Group</span>
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
            {successMessage}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center p-4 bg-surface rounded-xl">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <Input
                placeholder="Search groups..."
                value={filter.searchQuery}
                onChange={(e) => setFilter({ searchQuery: e.target.value })}
                className="pl-10 min-h-[44px]"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select
              options={curriculumOptions}
              value={filter.curriculum}
              onChange={(e) => setFilter({ curriculum: e.target.value as Curriculum | 'all' })}
              className="flex-1 sm:w-48 min-h-[44px]"
            />
            <Select
              options={tierOptions}
              value={filter.tier === 'all' ? 'all' : String(filter.tier)}
              onChange={(e) => {
                const value = e.target.value;
                setFilter({
                  tier: value === 'all' ? 'all' : (parseInt(value) as 2 | 3)
                });
              }}
              className="flex-1 sm:w-32 min-h-[44px]"
            />
          </div>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-surface rounded-xl animate-pulse" />
            ))}
          </div>
        ) : hasNoGroups ? (
          <div className="text-center py-12 md:py-16 bg-surface rounded-xl px-4">
            {filter.searchQuery || filter.curriculum !== 'all' || filter.tier !== 'all' ? (
              <>
                <p className="text-text-muted mb-4">No groups match your filters</p>
                <Button
                  variant="secondary"
                  onClick={() => setFilter({ searchQuery: '', curriculum: 'all', tier: 'all' })}
                  className="min-h-[44px]"
                >
                  Clear Filters
                </Button>
              </>
            ) : isNonAdmin ? (
              <>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
                <p className="text-lg font-medium text-text-primary mb-2">No groups yet</p>
                <p className="text-text-muted mb-4 max-w-md mx-auto">
                  Create a group using students assigned to you by your administrator.
                  Groups you create will appear here.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)} className="min-h-[44px]">
                  Create Your First Group
                </Button>
              </>
            ) : (
              <>
                <p className="text-text-muted mb-4">No groups yet</p>
                <Button onClick={() => setIsCreateModalOpen(true)} className="min-h-[44px]">
                  Create Your First Group
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                studentCount={0}
              />
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Group"
          size="md"
        >
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <Input
              label="Group Name"
              placeholder="e.g., Wilson Group A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Select
              label="Curriculum"
              options={curriculumOptions.filter(o => o.value !== 'all')}
              value={formData.curriculum}
              onChange={(e) => setFormData({ ...formData, curriculum: e.target.value as Curriculum })}
            />
            <Select
              label="Tier"
              options={[
                { value: '2', label: 'Tier 2' },
                { value: '3', label: 'Tier 3' },
              ]}
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value as '2' | '3' })}
            />
            <Input
              label="Grade"
              type="number"
              placeholder="e.g., 3"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            />
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={!isFormValid || isSaving}>
                {isSaving ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
