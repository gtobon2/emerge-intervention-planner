import { useEffect } from 'react';
import {
  useGroupMaterialsStore,
  useGroupMaterialsForGroup,
  useGroupMaterialsSummary,
} from '@/stores/group-materials';
import type { Curriculum, MaterialCategory } from '@/lib/supabase/types';

/**
 * Hook for fetching and managing group materials
 *
 * @example
 * const { materials, summary, isLoading, toggleMaterial, addCustom } = useGroupMaterials(groupId, 'wilson');
 */
export function useGroupMaterials(groupId: string, curriculum?: Curriculum) {
  const materials = useGroupMaterialsForGroup(groupId);
  const summary = useGroupMaterialsSummary(groupId);

  const {
    fetchGroupMaterials,
    initializeGroupMaterials,
    toggleGroupMaterial,
    addCustomMaterial,
    deleteGroupMaterial,
    updateGroupMaterialNotes,
    isGroupMaterialsLoading: isLoading,
    error,
    clearError,
  } = useGroupMaterialsStore();

  // Fetch materials on mount or when groupId changes
  useEffect(() => {
    if (groupId) {
      fetchGroupMaterials(groupId);
    }
  }, [groupId, fetchGroupMaterials]);

  // Initialize materials if none exist and we have a curriculum
  useEffect(() => {
    if (groupId && curriculum && materials.length === 0 && !isLoading) {
      // Only initialize if we've finished loading and have no materials
      // This prevents double initialization
    }
  }, [groupId, curriculum, materials.length, isLoading]);

  const initialize = async () => {
    if (curriculum) {
      await initializeGroupMaterials(groupId, curriculum);
    }
  };

  const toggleMaterial = async (materialId: string, isCollected: boolean, userId?: string) => {
    await toggleGroupMaterial(groupId, materialId, isCollected, userId);
  };

  const addCustom = async (material: { name: string; description?: string; category: MaterialCategory }) => {
    await addCustomMaterial(groupId, material);
  };

  const deleteMaterial = async (materialId: string) => {
    await deleteGroupMaterial(groupId, materialId);
  };

  const updateNotes = async (materialId: string, notes: string, location?: string) => {
    await updateGroupMaterialNotes(groupId, materialId, notes, location);
  };

  // Group materials by category for display
  const materialsByCategory = materials.reduce((acc, m) => {
    const category = m.is_custom
      ? m.custom_category || 'other'
      : m.material?.category || 'other';

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(m);
    return acc;
  }, {} as Record<MaterialCategory, typeof materials>);

  return {
    materials,
    materialsByCategory,
    summary,
    isLoading,
    error,
    clearError,
    initialize,
    toggleMaterial,
    addCustom,
    deleteMaterial,
    updateNotes,
    refresh: () => fetchGroupMaterials(groupId),
  };
}

/**
 * Hook for fetching and managing session materials
 */
export function useSessionMaterials(sessionId: string) {
  const {
    sessionMaterials,
    fetchSessionMaterials,
    generateSessionMaterials,
    toggleSessionMaterial,
    bulkToggleSessionMaterials,
    isSessionMaterialsLoading: isLoading,
    error,
  } = useGroupMaterialsStore();

  const materials = sessionMaterials.get(sessionId) || [];

  // Fetch on mount
  useEffect(() => {
    if (sessionId) {
      fetchSessionMaterials(sessionId);
    }
  }, [sessionId, fetchSessionMaterials]);

  const toggleMaterial = async (materialId: string, isPrepared: boolean, userId?: string) => {
    await toggleSessionMaterial(sessionId, materialId, isPrepared, userId);
  };

  const bulkToggle = async (isPrepared: boolean, userId?: string) => {
    await bulkToggleSessionMaterials(sessionId, isPrepared, userId);
  };

  const generate = async (curriculum: string, position: any) => {
    await generateSessionMaterials(sessionId, curriculum, position);
  };

  // Calculate summary
  const total = materials.length;
  const prepared = materials.filter((m) => m.is_prepared).length;
  const percent = total > 0 ? Math.round((prepared / total) * 100) : 0;

  return {
    materials,
    summary: { total, prepared, percent },
    isLoading,
    error,
    toggleMaterial,
    bulkToggle,
    generate,
    refresh: () => fetchSessionMaterials(sessionId),
  };
}

/**
 * Hook for fetching weekly materials across all sessions
 */
export function useWeeklyMaterials() {
  const {
    weeklyMaterials,
    fetchWeeklyMaterials,
    toggleSessionMaterial,
    isSessionMaterialsLoading: isLoading,
    error,
  } = useGroupMaterialsStore();

  // Fetch on mount
  useEffect(() => {
    fetchWeeklyMaterials();
  }, [fetchWeeklyMaterials]);

  // Group by session date
  const materialsByDate = weeklyMaterials.reduce((acc, m) => {
    const session = (m as any).session;
    if (!session) return acc;

    const date = session.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(m);
    return acc;
  }, {} as Record<string, typeof weeklyMaterials>);

  // Calculate overall summary
  const total = weeklyMaterials.length;
  const prepared = weeklyMaterials.filter((m) => m.is_prepared).length;
  const percent = total > 0 ? Math.round((prepared / total) * 100) : 0;

  return {
    materials: weeklyMaterials,
    materialsByDate,
    summary: { total, prepared, percent },
    isLoading,
    error,
    toggleMaterial: toggleSessionMaterial,
    refresh: fetchWeeklyMaterials,
  };
}

/**
 * Hook for accessing the material catalog
 */
export function useMaterialCatalog(curriculum?: string) {
  const {
    catalog,
    catalogByCurriculum,
    fetchCatalog,
    fetchCatalogByCurriculum,
    isCatalogLoading: isLoading,
  } = useGroupMaterialsStore();

  useEffect(() => {
    if (curriculum) {
      fetchCatalogByCurriculum(curriculum);
    } else if (catalog.length === 0) {
      fetchCatalog();
    }
  }, [curriculum, catalog.length, fetchCatalog, fetchCatalogByCurriculum]);

  const materials = curriculum
    ? catalogByCurriculum.get(curriculum) || []
    : catalog;

  // Group by category
  const byCategory = materials.reduce((acc, m) => {
    if (!acc[m.category]) {
      acc[m.category] = [];
    }
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, typeof materials>);

  return {
    materials,
    byCategory,
    isLoading,
  };
}
