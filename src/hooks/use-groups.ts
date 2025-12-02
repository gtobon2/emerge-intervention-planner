'use client';

import { useEffect, useCallback } from 'react';
import { useGroupsStore } from '@/stores/groups';
import type { GroupInsert, GroupUpdate } from '@/lib/supabase/types';

export function useGroups() {
  const store = useGroupsStore();

  useEffect(() => {
    if (store.groups.length === 0 && !store.isLoading) {
      store.fetchGroups();
    }
  }, [store]);

  return {
    groups: store.groups,
    isLoading: store.isLoading,
    error: store.error,
    refetch: store.fetchGroups,
    createGroup: store.createGroup,
    updateGroup: store.updateGroup,
    deleteGroup: store.deleteGroup,
    setFilter: store.setFilter,
    filter: store.filter,
  };
}

export function useGroup(groupId: string | undefined) {
  const { selectedGroup, fetchGroupById, isLoading, error, updateGroup } = useGroupsStore();

  useEffect(() => {
    if (groupId && (!selectedGroup || selectedGroup.id !== groupId)) {
      fetchGroupById(groupId);
    }
  }, [groupId, selectedGroup, fetchGroupById]);

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
