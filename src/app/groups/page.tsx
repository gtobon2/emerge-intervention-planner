'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Input, Select, Modal } from '@/components/ui';
import { GroupCard } from '@/components/dashboard';
import { useGroupsStore, useFilteredGroups } from '@/stores/groups';
import type { Curriculum } from '@/lib/supabase/types';

const curriculumOptions = [
  { value: 'all', label: 'All Curricula' },
  { value: 'wilson', label: 'Wilson Reading' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

const tierOptions = [
  { value: 'all', label: 'All Tiers' },
  { value: '2', label: 'Tier 2' },
  { value: '3', label: 'Tier 3' },
];

export default function GroupsPage() {
  const { fetchGroups, isLoading, filter, setFilter } = useGroupsStore();
  const filteredGroups = useFilteredGroups();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Groups</h1>
            <p className="text-text-muted">
              Manage your intervention groups
            </p>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Group
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-surface rounded-xl">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search groups..."
                value={filter.searchQuery}
                onChange={(e) => setFilter({ searchQuery: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            options={curriculumOptions}
            value={filter.curriculum}
            onChange={(e) => setFilter({ curriculum: e.target.value as Curriculum | 'all' })}
            className="w-48"
          />
          <Select
            options={tierOptions}
            value="all"
            onChange={() => {}}
            className="w-32"
          />
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-surface rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-xl">
            <p className="text-text-muted mb-4">
              {filter.searchQuery || filter.curriculum !== 'all'
                ? 'No groups match your filters'
                : 'No groups yet'}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Your First Group
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <Input label="Group Name" placeholder="e.g., Wilson Group A" />
            <Select
              label="Curriculum"
              options={curriculumOptions.filter(o => o.value !== 'all')}
              placeholder="Select curriculum"
            />
            <Select
              label="Tier"
              options={[
                { value: '2', label: 'Tier 2' },
                { value: '3', label: 'Tier 3' },
              ]}
              placeholder="Select tier"
            />
            <Input label="Grade" type="number" placeholder="e.g., 3" />
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button>Create Group</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
