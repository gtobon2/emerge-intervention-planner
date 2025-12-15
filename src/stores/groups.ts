import { create } from 'zustand';
import { db } from '@/lib/local-db';
import {
  createGroup as createGroupDB,
  updateGroup as updateGroupDB,
  deleteGroup as deleteGroupDB
} from '@/lib/local-db/hooks';
import { validateGroup } from '@/lib/supabase/validation';
import type {
  LocalGroup,
  LocalGroupInsert,
  LocalGroupUpdate,
  Curriculum
} from '@/lib/local-db';
import type { Group, GroupInsert, GroupUpdate, GroupWithStudents } from '@/lib/supabase/types';

// Map LocalGroup to Group (for compatibility with existing code)
function mapLocalToGroup(local: LocalGroup): Group {
  return {
    ...local,
    id: String(local.id),
  } as Group;
}

// Map Group with students
interface LocalGroupWithStudents extends LocalGroup {
  students: Array<{
    id?: number;
    group_id: number;
    name: string;
    notes: string | null;
    created_at: string;
  }>;
}

function mapLocalGroupWithStudents(local: LocalGroupWithStudents): GroupWithStudents {
  return {
    ...local,
    id: String(local.id),
    students: local.students.map(s => ({
      ...s,
      id: String(s.id),
      group_id: String(s.group_id),
    })) as any,
  } as GroupWithStudents;
}

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

    try {
      const localGroups = await db.groups.toArray();
      const groups = localGroups.map(mapLocalToGroup);
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
    set({ isLoading: true, error: null });

    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid group ID');
      }

      const group = await db.groups.get(numericId);
      if (!group) {
        throw new Error('Group not found');
      }

      const students = await db.students.where('group_id').equals(numericId).toArray();

      const groupWithStudents = mapLocalGroupWithStudents({
        ...group,
        students,
      });

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
      // Convert GroupInsert to LocalGroupInsert
      const localGroup: LocalGroupInsert = {
        name: group.name,
        curriculum: group.curriculum,
        tier: group.tier,
        grade: group.grade,
        current_position: group.current_position,
        schedule: group.schedule || null,
      };

      const id = await createGroupDB(localGroup);
      const newGroup = await db.groups.get(id);

      if (!newGroup) {
        throw new Error('Failed to retrieve created group');
      }

      const mappedGroup = mapLocalToGroup(newGroup);

      set((state) => ({
        groups: [...state.groups, mappedGroup],
        isLoading: false,
      }));

      return mappedGroup;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateGroup: async (id: string, updates: GroupUpdate) => {
    set({ isLoading: true, error: null });

    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid group ID');
      }

      // Convert updates to LocalGroupUpdate
      const localUpdates: LocalGroupUpdate = {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.curriculum !== undefined && { curriculum: updates.curriculum }),
        ...(updates.tier !== undefined && { tier: updates.tier }),
        ...(updates.grade !== undefined && { grade: updates.grade }),
        ...(updates.current_position !== undefined && { current_position: updates.current_position }),
        ...(updates.schedule !== undefined && { schedule: updates.schedule }),
      };

      await updateGroupDB(numericId, localUpdates);

      // Fetch updated group
      const updatedGroup = await db.groups.get(numericId);
      if (!updatedGroup) {
        throw new Error('Group not found after update');
      }

      const mappedGroup = mapLocalToGroup(updatedGroup);

      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === id ? mappedGroup : g
        ),
        selectedGroup:
          state.selectedGroup?.id === id
            ? { ...state.selectedGroup, ...mappedGroup }
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
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid group ID');
      }

      // Delete group and all related data
      await deleteGroupDB(numericId, true);

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
