import { create } from 'zustand';
import * as supabaseService from '@/lib/supabase/services';
import type {
  MaterialCatalog,
  GroupMaterial,
  GroupMaterialWithCatalog,
  SessionMaterialChecklist,
  SessionMaterialWithCatalog,
  MaterialCategory,
  Curriculum,
} from '@/lib/supabase/types';

interface GroupMaterialsState {
  // Material Catalog (system-wide)
  catalog: MaterialCatalog[];
  catalogByCurriculum: Map<string, MaterialCatalog[]>;
  isCatalogLoading: boolean;

  // Group Materials
  groupMaterials: Map<string, GroupMaterialWithCatalog[]>;
  groupMaterialsSummary: Map<string, { total: number; collected: number; percent: number }>;
  isGroupMaterialsLoading: boolean;

  // Session Materials
  sessionMaterials: Map<string, SessionMaterialWithCatalog[]>;
  weeklyMaterials: SessionMaterialWithCatalog[];
  isSessionMaterialsLoading: boolean;

  // Error state
  error: string | null;

  // Catalog Actions
  fetchCatalog: () => Promise<void>;
  fetchCatalogByCurriculum: (curriculum: string) => Promise<MaterialCatalog[]>;

  // Group Materials Actions
  fetchGroupMaterials: (groupId: string) => Promise<void>;
  fetchGroupMaterialsSummary: (groupId: string) => Promise<void>;
  initializeGroupMaterials: (groupId: string, curriculum: Curriculum) => Promise<void>;
  toggleGroupMaterial: (groupId: string, materialId: string, isCollected: boolean, userId?: string) => Promise<void>;
  addCustomMaterial: (groupId: string, material: { name: string; description?: string; category: MaterialCategory }) => Promise<void>;
  deleteGroupMaterial: (groupId: string, materialId: string) => Promise<void>;
  updateGroupMaterialNotes: (groupId: string, materialId: string, notes: string, location?: string) => Promise<void>;

  // Session Materials Actions
  fetchSessionMaterials: (sessionId: string) => Promise<void>;
  fetchWeeklyMaterials: () => Promise<void>;
  generateSessionMaterials: (sessionId: string, curriculum: string, position: any) => Promise<void>;
  toggleSessionMaterial: (sessionId: string, materialId: string, isPrepared: boolean, userId?: string) => Promise<void>;
  bulkToggleSessionMaterials: (sessionId: string, isPrepared: boolean, userId?: string) => Promise<void>;

  // Utility Actions
  clearError: () => void;
  clearGroupMaterials: (groupId: string) => void;
}

export const useGroupMaterialsStore = create<GroupMaterialsState>((set, get) => ({
  // Initial State
  catalog: [],
  catalogByCurriculum: new Map(),
  isCatalogLoading: false,

  groupMaterials: new Map(),
  groupMaterialsSummary: new Map(),
  isGroupMaterialsLoading: false,

  sessionMaterials: new Map(),
  weeklyMaterials: [],
  isSessionMaterialsLoading: false,

  error: null,

  // ============================================
  // CATALOG ACTIONS
  // ============================================

  fetchCatalog: async () => {
    set({ isCatalogLoading: true, error: null });
    try {
      const catalog = await supabaseService.fetchMaterialCatalog();

      // Group by curriculum for quick access
      const byCurriculum = new Map<string, MaterialCatalog[]>();
      catalog.forEach((m) => {
        const existing = byCurriculum.get(m.curriculum) || [];
        existing.push(m);
        byCurriculum.set(m.curriculum, existing);
      });

      set({ catalog, catalogByCurriculum: byCurriculum, isCatalogLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isCatalogLoading: false });
    }
  },

  fetchCatalogByCurriculum: async (curriculum: string) => {
    const { catalogByCurriculum } = get();

    // Return cached if available
    if (catalogByCurriculum.has(curriculum)) {
      return catalogByCurriculum.get(curriculum)!;
    }

    try {
      const materials = await supabaseService.fetchMaterialCatalogByCurriculum(curriculum);

      // Update cache
      const newMap = new Map(catalogByCurriculum);
      newMap.set(curriculum, materials);
      set({ catalogByCurriculum: newMap });

      return materials;
    } catch (err) {
      set({ error: (err as Error).message });
      return [];
    }
  },

  // ============================================
  // GROUP MATERIALS ACTIONS
  // ============================================

  fetchGroupMaterials: async (groupId: string) => {
    set({ isGroupMaterialsLoading: true, error: null });
    try {
      const materials = await supabaseService.fetchGroupMaterials(groupId);

      const newMap = new Map(get().groupMaterials);
      newMap.set(groupId, materials);

      // Also update summary
      const total = materials.length;
      const collected = materials.filter((m) => m.is_collected).length;
      const percent = total > 0 ? Math.round((collected / total) * 100) : 0;

      const newSummaryMap = new Map(get().groupMaterialsSummary);
      newSummaryMap.set(groupId, { total, collected, percent });

      set({
        groupMaterials: newMap,
        groupMaterialsSummary: newSummaryMap,
        isGroupMaterialsLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isGroupMaterialsLoading: false });
    }
  },

  fetchGroupMaterialsSummary: async (groupId: string) => {
    try {
      const summary = await supabaseService.fetchGroupMaterialsSummary(groupId);
      const newMap = new Map(get().groupMaterialsSummary);
      newMap.set(groupId, summary);
      set({ groupMaterialsSummary: newMap });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  initializeGroupMaterials: async (groupId: string, curriculum: Curriculum) => {
    set({ isGroupMaterialsLoading: true, error: null });
    try {
      await supabaseService.initializeGroupMaterials(groupId, curriculum);
      // Refresh the materials list
      await get().fetchGroupMaterials(groupId);
    } catch (err) {
      set({ error: (err as Error).message, isGroupMaterialsLoading: false });
    }
  },

  toggleGroupMaterial: async (groupId: string, materialId: string, isCollected: boolean, userId?: string) => {
    try {
      await supabaseService.toggleGroupMaterialCollected(materialId, isCollected, userId);

      // Optimistically update the local state
      const materials = get().groupMaterials.get(groupId);
      if (materials) {
        const updated = materials.map((m) =>
          m.id === materialId
            ? {
                ...m,
                is_collected: isCollected,
                collected_at: isCollected ? new Date().toISOString() : null,
                collected_by: isCollected ? userId || null : null,
              }
            : m
        );

        const newMap = new Map(get().groupMaterials);
        newMap.set(groupId, updated);

        // Update summary
        const total = updated.length;
        const collected = updated.filter((m) => m.is_collected).length;
        const percent = total > 0 ? Math.round((collected / total) * 100) : 0;

        const newSummaryMap = new Map(get().groupMaterialsSummary);
        newSummaryMap.set(groupId, { total, collected, percent });

        set({ groupMaterials: newMap, groupMaterialsSummary: newSummaryMap });
      }
    } catch (err) {
      set({ error: (err as Error).message });
      // Refresh to get correct state
      await get().fetchGroupMaterials(groupId);
    }
  },

  addCustomMaterial: async (groupId: string, material: { name: string; description?: string; category: MaterialCategory }) => {
    try {
      await supabaseService.addCustomGroupMaterial(groupId, material);
      // Refresh the materials list
      await get().fetchGroupMaterials(groupId);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  deleteGroupMaterial: async (groupId: string, materialId: string) => {
    try {
      await supabaseService.deleteGroupMaterial(materialId);

      // Optimistically update
      const materials = get().groupMaterials.get(groupId);
      if (materials) {
        const updated = materials.filter((m) => m.id !== materialId);
        const newMap = new Map(get().groupMaterials);
        newMap.set(groupId, updated);

        // Update summary
        const total = updated.length;
        const collected = updated.filter((m) => m.is_collected).length;
        const percent = total > 0 ? Math.round((collected / total) * 100) : 0;

        const newSummaryMap = new Map(get().groupMaterialsSummary);
        newSummaryMap.set(groupId, { total, collected, percent });

        set({ groupMaterials: newMap, groupMaterialsSummary: newSummaryMap });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  updateGroupMaterialNotes: async (groupId: string, materialId: string, notes: string, location?: string) => {
    try {
      await supabaseService.updateGroupMaterial(materialId, { notes, location });

      // Optimistically update
      const materials = get().groupMaterials.get(groupId);
      if (materials) {
        const updated = materials.map((m) =>
          m.id === materialId ? { ...m, notes, location: location || m.location } : m
        );
        const newMap = new Map(get().groupMaterials);
        newMap.set(groupId, updated);
        set({ groupMaterials: newMap });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  // ============================================
  // SESSION MATERIALS ACTIONS
  // ============================================

  fetchSessionMaterials: async (sessionId: string) => {
    set({ isSessionMaterialsLoading: true, error: null });
    try {
      const materials = await supabaseService.fetchSessionMaterials(sessionId);

      const newMap = new Map(get().sessionMaterials);
      newMap.set(sessionId, materials);

      set({ sessionMaterials: newMap, isSessionMaterialsLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isSessionMaterialsLoading: false });
    }
  },

  fetchWeeklyMaterials: async () => {
    set({ isSessionMaterialsLoading: true, error: null });
    try {
      const materials = await supabaseService.fetchWeeklySessionMaterials();
      set({ weeklyMaterials: materials, isSessionMaterialsLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isSessionMaterialsLoading: false });
    }
  },

  generateSessionMaterials: async (sessionId: string, curriculum: string, position: any) => {
    set({ isSessionMaterialsLoading: true, error: null });
    try {
      await supabaseService.generateSessionMaterials(sessionId, curriculum, position);
      // Refresh the materials
      await get().fetchSessionMaterials(sessionId);
    } catch (err) {
      set({ error: (err as Error).message, isSessionMaterialsLoading: false });
    }
  },

  toggleSessionMaterial: async (sessionId: string, materialId: string, isPrepared: boolean, userId?: string) => {
    try {
      await supabaseService.toggleSessionMaterialPrepared(materialId, isPrepared, userId);

      // Optimistically update
      const materials = get().sessionMaterials.get(sessionId);
      if (materials) {
        const updated = materials.map((m) =>
          m.id === materialId
            ? {
                ...m,
                is_prepared: isPrepared,
                prepared_at: isPrepared ? new Date().toISOString() : null,
                prepared_by: isPrepared ? userId || null : null,
              }
            : m
        );

        const newMap = new Map(get().sessionMaterials);
        newMap.set(sessionId, updated);
        set({ sessionMaterials: newMap });
      }

      // Also update weekly materials if present
      const weekly = get().weeklyMaterials;
      if (weekly.length > 0) {
        const updatedWeekly = weekly.map((m) =>
          m.id === materialId
            ? {
                ...m,
                is_prepared: isPrepared,
                prepared_at: isPrepared ? new Date().toISOString() : null,
                prepared_by: isPrepared ? userId || null : null,
              }
            : m
        );
        set({ weeklyMaterials: updatedWeekly });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  bulkToggleSessionMaterials: async (sessionId: string, isPrepared: boolean, userId?: string) => {
    try {
      await supabaseService.bulkToggleSessionMaterialsPrepared(sessionId, isPrepared, userId);

      // Optimistically update
      const materials = get().sessionMaterials.get(sessionId);
      if (materials) {
        const updated = materials.map((m) => ({
          ...m,
          is_prepared: isPrepared,
          prepared_at: isPrepared ? new Date().toISOString() : null,
          prepared_by: isPrepared ? userId || null : null,
        }));

        const newMap = new Map(get().sessionMaterials);
        newMap.set(sessionId, updated);
        set({ sessionMaterials: newMap });
      }

      // Refresh weekly to get updated state
      await get().fetchWeeklyMaterials();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  // ============================================
  // UTILITY ACTIONS
  // ============================================

  clearError: () => set({ error: null }),

  clearGroupMaterials: (groupId: string) => {
    const newMaterialsMap = new Map(get().groupMaterials);
    newMaterialsMap.delete(groupId);

    const newSummaryMap = new Map(get().groupMaterialsSummary);
    newSummaryMap.delete(groupId);

    set({ groupMaterials: newMaterialsMap, groupMaterialsSummary: newSummaryMap });
  },
}));

// ============================================
// SELECTOR HOOKS
// ============================================

export function useGroupMaterialsForGroup(groupId: string) {
  return useGroupMaterialsStore((state) => state.groupMaterials.get(groupId) || []);
}

export function useGroupMaterialsSummary(groupId: string) {
  return useGroupMaterialsStore((state) => state.groupMaterialsSummary.get(groupId));
}

export function useSessionMaterialsForSession(sessionId: string) {
  return useGroupMaterialsStore((state) => state.sessionMaterials.get(sessionId) || []);
}

export function useMaterialCatalogByCurriculum(curriculum: string) {
  return useGroupMaterialsStore((state) => state.catalogByCurriculum.get(curriculum) || []);
}
