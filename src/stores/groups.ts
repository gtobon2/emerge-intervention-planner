import { create } from 'zustand';
import type { Group, GroupInsert, GroupUpdate, Curriculum, GroupWithStudents } from '@/lib/supabase/types';

interface GroupsState {
  groups: GroupWithStudents[];
  selectedGroup: GroupWithStudents | null;
  isLoading: boolean;
  error: string | null;
  filter: {
    curriculum: Curriculum | 'all';
    searchQuery: string;
  };

  // Actions
  fetchGroups: () => Promise<void>;
  fetchGroupById: (id: string) => Promise<void>;
  createGroup: (group: GroupInsert) => Promise<Group | null>;
  updateGroup: (id: string, updates: GroupUpdate) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  setFilter: (filter: Partial<GroupsState['filter']>) => void;
  setSelectedGroup: (group: GroupWithStudents | null) => void;
  clearError: () => void;
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  selectedGroup: null,
  isLoading: false,
  error: null,
  filter: {
    curriculum: 'all',
    searchQuery: '',
  },

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/groups?include=students');
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      set({ groups: data || [], isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchGroupById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/groups/${id}`);
      if (!response.ok) throw new Error('Failed to fetch group');
      const data = await response.json();
      set({ selectedGroup: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createGroup: async (group: GroupInsert) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group),
      });
      if (!response.ok) throw new Error('Failed to create group');
      const data = await response.json();

      set((state) => ({
        groups: [{ ...data, students: [] }, ...state.groups],
        isLoading: false,
      }));

      return data;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateGroup: async (id: string, updates: GroupUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update group');

      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === id ? { ...g, ...updates } : g
        ),
        selectedGroup:
          state.selectedGroup?.id === id
            ? { ...state.selectedGroup, ...updates }
            : state.selectedGroup,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteGroup: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete group');

      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        selectedGroup:
          state.selectedGroup?.id === id ? null : state.selectedGroup,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Selector for filtered groups
export const useFilteredGroups = () => {
  const { groups, filter } = useGroupsStore();

  return groups.filter((group) => {
    // Filter by curriculum
    if (filter.curriculum !== 'all' && group.curriculum !== filter.curriculum) {
      return false;
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      return group.name.toLowerCase().includes(query);
    }

    return true;
  });
};
