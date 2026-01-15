import { create } from 'zustand';
import * as supabaseService from '@/lib/supabase/services';
import { validateGroup } from '@/lib/supabase/validation';
import type { Curriculum } from '@/lib/local-db';
import type { Group, GroupInsert, GroupUpdate, GroupWithStudents, Student } from '@/lib/supabase/types';

interface GroupsState {
  groups: Group[];
  selectedGroup: GroupWithStudents | null;
  isLoading: boolean;
  error: string | null;
  filter: {
    curriculum: Curriculum | 'all';
    tier: 2 | 3 | 'all';
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
    tier: 'all',
    searchQuery: '',
  },

  fetchGroups: async () => {
    set({ isLoading: true, error: null });

    try {
      const groups = await supabaseService.fetchAllGroups();
      set({ groups, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        groups: []
      });
    }
  },

  fetchGroupById: async (id: string) => {
    // Clear selected group immediately to prevent stale data showing during navigation
    set({ isLoading: true, error: null, selectedGroup: null });

    try {
      const group = await supabaseService.fetchGroupById(id);
      if (!group) {
        throw new Error('Group not found');
      }

      const students = await supabaseService.fetchStudentsByGroupId(id);

      const groupWithStudents: GroupWithStudents = {
        ...group,
        students,
      };

      set({
        selectedGroup: groupWithStudents,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        selectedGroup: null
      });
    }
  },

  createGroup: async (group: GroupInsert) => {
    set({ isLoading: true, error: null });

    // Validate group data
    const validation = validateGroup(group);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      set({ error: errorMessage, isLoading: false });
      return null;
    }

    try {
      const newGroup = await supabaseService.createGroup(group);

      set((state) => ({
        groups: [newGroup, ...state.groups],
        isLoading: false,
      }));

      return newGroup;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateGroup: async (id: string, updates: GroupUpdate) => {
    set({ isLoading: true, error: null });

    try {
      const updatedGroup = await supabaseService.updateGroup(id, updates);

      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === id ? updatedGroup : g
        ),
        selectedGroup:
          state.selectedGroup?.id === id
            ? { ...state.selectedGroup, ...updatedGroup }
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
      await supabaseService.deleteGroup(id);

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

/**
 * Selector for filtered groups
 *
 * Filters groups by:
 * - curriculum: Filter by specific curriculum or 'all'
 * - tier: Filter by tier 2, tier 3, or 'all'
 * - searchQuery: Case-insensitive search on group name
 */
export const useFilteredGroups = () => {
  const { groups, filter } = useGroupsStore();

  return groups.filter((group) => {
    // Filter by curriculum
    if (filter.curriculum !== 'all' && group.curriculum !== filter.curriculum) {
      return false;
    }

    // Filter by tier
    if (filter.tier !== 'all' && group.tier !== filter.tier) {
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
