'use client';

import { useEffect, useCallback } from 'react';
import { useGroupsStore } from '@/stores/groups';
import type { GroupInsert, GroupUpdate } from '@/lib/supabase/types';

export function useGroups() {
  const groups = useGroupsStore((state) => state.groups);
  const isLoading = useGroupsStore((state) => state.isLoading);
  const error = useGroupsStore((state) => state.error);
  const filter = useGroupsStore((state) => state.filter);
  const fetchGroups = useGroupsStore((state) => state.fetchGroups);
  const createGroup = useGroupsStore((state) => state.createGroup);
  const updateGroup = useGroupsStore((state) => state.updateGroup);
  const deleteGroup = useGroupsStore((state) => state.deleteGroup);
  const setFilter = useGroupsStore((state) => state.setFilter);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    isLoading,
    error,
    refetch: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    setFilter,
    filter,
  };
}

export function useGroup(groupId: string | undefined) {
  const selectedGroup = useGroupsStore((state) => state.selectedGroup);
  const isLoading = useGroupsStore((state) => state.isLoading);
  const error = useGroupsStore((state) => state.error);
  const fetchGroupById = useGroupsStore((state) => state.fetchGroupById);
  const updateGroup = useGroupsStore((state) => state.updateGroup);

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
    }
  }, [groupId, fetchGroupById]);

  const update = useCallback(
    (updates: GroupUpdate) => {
      if (groupId) {
        return updateGroup(groupId, updates);
      }
    },
    [groupId, updateGroup]
  );

  return {
    group: selectedGroup,
    isLoading,
    error,
    refetch: () => groupId && fetchGroupById(groupId),
    update,
  };
}
