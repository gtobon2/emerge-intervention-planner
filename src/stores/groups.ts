import { create } from 'zustand';
import { db } from '@/lib/local-db';
import {
  createGroup as createGroupDB,
  updateGroup as updateGroupDB,
  deleteGroup as deleteGroupDB
} from '@/lib/local-db/hooks';
import { validateGroup } from '@/lib/supabase/validation';
import { toNumericId } from '@/lib/utils/id';
import type {
  LocalGroup,
  LocalGroupInsert,
  LocalGroupUpdate,
  Curriculum
} from '@/lib/local-db';
import type { Group, GroupInsert, GroupUpdate, GroupWithStudents, Student } from '@/lib/supabase/types';

/**
 * Map LocalGroup to Group (API type with string IDs)
 *
 * The local-first architecture uses numeric auto-increment IDs in IndexedDB,
 * while the API/UI layer uses string IDs for compatibility with Supabase UUIDs.
 */
function mapLocalToGroup(local: LocalGroup): Group {
  if (local.id === undefined) {
    throw new Error('LocalGroup id is undefined');
  }
  return {
    id: String(local.id),
    name: local.name,
    curriculum: local.curriculum,
    tier: local.tier,
    grade: local.grade,
    current_position: local.current_position,
    schedule: local.schedule,
    created_at: local.created_at,
    updated_at: local.updated_at,
  };
}

// Local student type from IndexedDB
interface LocalStudentData {
  id?: number;
  group_id: number;
  name: string;
  notes: string | null;
  created_at: string;
}

// Map Group with students
interface LocalGroupWithStudents extends LocalGroup {
  students: LocalStudentData[];
}

/**
 * Map LocalStudent to Student (API type with string IDs)
 */
function mapLocalStudent(s: LocalStudentData): Student {
  if (s.id === undefined) {
    throw new Error('LocalStudent id is undefined');
  }
  return {
    id: String(s.id),
    group_id: String(s.group_id),
    name: s.name,
    notes: s.notes,
    created_at: s.created_at,
  };
}

function mapLocalGroupWithStudents(local: LocalGroupWithStudents): GroupWithStudents {
  if (local.id === undefined) {
    throw new Error('LocalGroupWithStudents id is undefined');
  }
  return {
    ...mapLocalToGroup(local),
    students: local.students.map(mapLocalStudent),
  };
}

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
    // Clear selected group immediately to prevent stale data showing during navigation
    set({ isLoading: true, error: null, selectedGroup: null });

    try {
      const numericId = toNumericId(id);
      if (numericId === null) {
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
      const numericId = toNumericId(id);
      if (numericId === null) {
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
      const numericId = toNumericId(id);
      if (numericId === null) {
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
