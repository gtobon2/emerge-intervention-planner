'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  ArrowRightLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Modal,
  Badge,
  CurriculumBadge,
  TierBadge,
} from '@/components/ui';
import {
  fetchAllGroupsWithOwners,
  transferGroupOwnership,
  fetchStudentsByGroupId,
} from '@/lib/supabase/services';
import { fetchProfiles, type Profile } from '@/lib/supabase/profiles';
import {
  type Group,
  type Curriculum,
  getCurriculumLabel,
} from '@/lib/supabase/types';
import { isMockMode } from '@/lib/supabase/config';

interface GroupWithOwner extends Group {
  owner?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  studentCount?: number;
}

export function GroupManagementTab() {
  // State
  const [groups, setGroups] = useState<GroupWithOwner[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithOwner | null>(null);
  const [newOwnerId, setNewOwnerId] = useState<string>('');

  // Fetch data
  const fetchData = useCallback(async () => {
    if (isMockMode()) {
      // Mock data for development
      setGroups([
        {
          id: 'g1',
          name: 'Wilson Group A',
          curriculum: 'wilson' as Curriculum,
          tier: 2,
          grade: 3,
          current_position: { step: 1, substep: '1' },
          schedule: null,
          owner_id: 'user-1',
          created_by: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner: { id: 'user-1', full_name: 'Sarah Martinez', email: 'sarah@emerge.edu' },
          studentCount: 4,
        },
        {
          id: 'g2',
          name: 'Camino Level 1',
          curriculum: 'camino' as Curriculum,
          tier: 2,
          grade: 2,
          current_position: { lesson: 5 },
          schedule: null,
          owner_id: 'admin-1',
          created_by: 'admin-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner: { id: 'admin-1', full_name: 'Admin User', email: 'admin@emerge.edu' },
          studentCount: 6,
        },
      ]);
      setUsers([
        { id: 'admin-1', full_name: 'Admin User', email: 'admin@emerge.edu', role: 'admin', grade_level: null, created_at: new Date().toISOString(), created_by: null },
        { id: 'user-1', full_name: 'Sarah Martinez', email: 'sarah@emerge.edu', role: 'interventionist', grade_level: null, created_at: new Date().toISOString(), created_by: null },
        { id: 'user-2', full_name: 'Mike Thompson', email: 'mike@emerge.edu', role: 'interventionist', grade_level: null, created_at: new Date().toISOString(), created_by: null },
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [groupsData, usersData] = await Promise.all([
        fetchAllGroupsWithOwners(),
        fetchProfiles(),
      ]);

      // Fetch student counts for each group
      const groupsWithCounts = await Promise.all(
        groupsData.map(async (group) => {
          try {
            const students = await fetchStudentsByGroupId(group.id);
            return { ...group, studentCount: students.length };
          } catch {
            return { ...group, studentCount: 0 };
          }
        })
      );

      setGroups(groupsWithCounts);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-hide messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const ownerName = group.owner?.full_name?.toLowerCase() || '';
        if (!group.name.toLowerCase().includes(query) && !ownerName.includes(query)) {
          return false;
        }
      }

      // Curriculum filter
      if (selectedCurriculum !== 'all' && group.curriculum !== selectedCurriculum) {
        return false;
      }

      // Owner filter
      if (selectedOwner !== 'all') {
        if (selectedOwner === 'unassigned') {
          if (group.owner_id) return false;
        } else {
          if (group.owner_id !== selectedOwner) return false;
        }
      }

      return true;
    });
  }, [groups, searchQuery, selectedCurriculum, selectedOwner]);

  // Get unique owners for filter dropdown
  const uniqueOwners = useMemo(() => {
    const owners = new Map<string, string>();
    groups.forEach(g => {
      if (g.owner) {
        owners.set(g.owner.id, g.owner.full_name);
      }
    });
    return Array.from(owners.entries()).map(([id, name]) => ({ id, name }));
  }, [groups]);

  // Handlers
  const handleOpenTransferModal = (group: GroupWithOwner) => {
    setSelectedGroup(group);
    setNewOwnerId('');
    setShowTransferModal(true);
  };

  const handleTransferOwnership = async () => {
    if (!selectedGroup || !newOwnerId) return;

    if (isMockMode()) {
      const newOwner = users.find(u => u.id === newOwnerId);
      setGroups(prev =>
        prev.map(g =>
          g.id === selectedGroup.id
            ? {
                ...g,
                owner_id: newOwnerId,
                owner: newOwner ? { id: newOwner.id, full_name: newOwner.full_name, email: newOwner.email } : null,
              }
            : g
        )
      );
      setSuccessMessage(`Group "${selectedGroup.name}" transferred to ${newOwner?.full_name}`);
      setShowTransferModal(false);
      return;
    }

    setIsSaving(true);
    try {
      await transferGroupOwnership(selectedGroup.id, newOwnerId);
      const newOwner = users.find(u => u.id === newOwnerId);
      setSuccessMessage(`Group "${selectedGroup.name}" transferred to ${newOwner?.full_name || 'new owner'}`);
      setShowTransferModal(false);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error transferring ownership:', err);
      setError(err instanceof Error ? err.message : 'Failed to transfer ownership');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-movement" />
        <span className="ml-2 text-text-muted">Loading groups...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group Ownership Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted mb-4">
            View all intervention groups and transfer ownership between staff members.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search groups or owners..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            <Select
              value={selectedCurriculum}
              onChange={e => setSelectedCurriculum(e.target.value)}
              options={[
                { value: 'all', label: 'All Curricula' },
                { value: 'wilson', label: 'Wilson Reading' },
                { value: 'delta_math', label: 'Delta Math' },
                { value: 'camino', label: 'Camino a la Lectura' },
                { value: 'despegando', label: 'Despegando' },
                { value: 'wordgen', label: 'WordGen' },
                { value: 'amira', label: 'Amira Learning' },
              ]}
            />
            <Select
              value={selectedOwner}
              onChange={e => setSelectedOwner(e.target.value)}
              options={[
                { value: 'all', label: 'All Owners' },
                { value: 'unassigned', label: 'No Owner' },
                ...uniqueOwners.map(o => ({ value: o.id, label: o.name })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredGroups.length === 0 ? (
            <p className="text-text-muted text-center py-8">No groups found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Group Name</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Owner</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Curriculum</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Students</th>
                    <th className="text-left py-3 px-4 font-medium text-text-muted">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map(group => (
                    <tr key={group.id} className="border-b border-border/50 hover:bg-foundation">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">{group.name}</span>
                          <TierBadge tier={group.tier} />
                        </div>
                        <span className="text-xs text-text-muted">Grade {group.grade}</span>
                      </td>
                      <td className="py-3 px-4">
                        {group.owner ? (
                          <div>
                            <span className="font-medium text-text-primary">{group.owner.full_name}</span>
                            <span className="block text-xs text-text-muted">{group.owner.email}</span>
                          </div>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800">No Owner</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <CurriculumBadge curriculum={group.curriculum} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-text-muted" />
                          <span>{group.studentCount || 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-text-muted">
                          <Calendar className="w-4 h-4" />
                          {new Date(group.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenTransferModal(group)}
                          className="gap-1"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          Transfer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-text-primary">{groups.length}</div>
          <p className="text-sm text-text-muted">Total Groups</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-text-primary">
            {groups.filter(g => g.owner).length}
          </div>
          <p className="text-sm text-text-muted">With Owner</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">
            {groups.filter(g => !g.owner).length}
          </div>
          <p className="text-sm text-text-muted">No Owner</p>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-text-primary">{uniqueOwners.length}</div>
          <p className="text-sm text-text-muted">Unique Owners</p>
        </Card>
      </div>

      {/* Transfer Ownership Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title={`Transfer Ownership: ${selectedGroup?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          {selectedGroup && (
            <>
              <div className="p-4 bg-foundation rounded-lg">
                <p className="text-sm font-medium text-text-muted">Current Owner</p>
                <p className="text-lg font-medium text-text-primary">
                  {selectedGroup.owner?.full_name || 'No owner assigned'}
                </p>
                {selectedGroup.owner?.email && (
                  <p className="text-sm text-text-muted">{selectedGroup.owner.email}</p>
                )}
              </div>

              <Select
                label="Transfer to"
                value={newOwnerId}
                onChange={e => setNewOwnerId(e.target.value)}
                options={[
                  { value: '', label: 'Select a user...' },
                  ...users
                    .filter(u => u.id !== selectedGroup.owner_id)
                    .map(u => ({
                      value: u.id,
                      label: `${u.full_name} (${u.role})`,
                    })),
                ]}
              />

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  The new owner will gain full control over this group, including the ability to
                  edit, delete, and manage students within it.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowTransferModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransferOwnership}
              isLoading={isSaving}
              disabled={!newOwnerId}
            >
              Transfer Ownership
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
