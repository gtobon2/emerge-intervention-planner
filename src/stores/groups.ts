// @ts-nocheck
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { validateGroup } from '@/lib/supabase/validation';
import type { Group, GroupInsert, GroupUpdate, Curriculum, GroupWithStudents } from '@/lib/supabase/types';
import { MOCK_GROUPS, MOCK_GROUPS_WITH_STUDENTS, getGroupWithStudents } from '@/lib/mock-data';

interface GroupsState {
  groups: Group[];
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

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      set({ groups: MOCK_GROUPS, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ groups: data || [], isLoading: false });
    } catch (err) {
      // Fall back to mock data on error
      set({ groups: MOCK_GROUPS, isLoading: false });
    }
  },

  fetchGroupById: async (id: string) => {
    set({ isLoading: true, error: null });

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      const mockGroup = getGroupWithStudents(id);
      set({
        selectedGroup: mockGroup || null,
        isLoading: false,
      });
      return;
    }

    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('group_id', id)
        .order('name');

      if (studentsError) throw studentsError;

      set({
        selectedGroup: { ...group, students: students || [] },
        isLoading: false,
      });
    } catch (err) {
      // Fall back to mock data
      const mockGroup = getGroupWithStudents(id);
      set({
        selectedGroup: mockGroup || null,
        isLoading: false,
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

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      const newGroup: Group = {
        ...group,
        id: `group-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set((state) => ({
        groups: [...state.groups, newGroup],
        isLoading: false,
      }));

      return newGroup;
    }

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert(group)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        groups: [...state.groups, data],
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

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      const updatedAt = new Date().toISOString();
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === id ? { ...g, ...updates, updated_at: updatedAt } : g
        ),
        selectedGroup:
          state.selectedGroup?.id === id
            ? { ...state.selectedGroup, ...updates, updated_at: updatedAt }
            : state.selectedGroup,
        isLoading: false,
      }));
      return;
    }

    try {
      const { error } = await supabase
        .from('groups')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

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

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        selectedGroup:
          state.selectedGroup?.id === id ? null : state.selectedGroup,
        isLoading: false,
      }));
      return;
    }

    try {
      const { error } = await supabase.from('groups').delete().eq('id', id);

      if (error) throw error;

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
