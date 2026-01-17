import { create } from 'zustand';
import * as supabaseService from '@/lib/supabase/services';
import type {
  InterventionCycle,
  InterventionCycleInsert,
  InterventionCycleUpdate,
  CycleStatus,
  WeekDay,
} from '@/lib/supabase/types';

interface CyclesState {
  cycles: InterventionCycle[];
  activeCycles: InterventionCycle[];
  currentCycle: InterventionCycle | null;
  selectedCycle: InterventionCycle | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAllCycles: () => Promise<void>;
  fetchActiveCycles: () => Promise<void>;
  fetchCurrentCycle: () => Promise<void>;
  fetchCycleById: (id: string) => Promise<InterventionCycle | null>;
  createCycle: (cycle: InterventionCycleInsert) => Promise<InterventionCycle | null>;
  updateCycle: (id: string, updates: InterventionCycleUpdate) => Promise<void>;
  deleteCycle: (id: string) => Promise<void>;
  setSelectedCycle: (cycle: InterventionCycle | null) => void;

  // Session generation
  generateSessionDates: (
    cycleId: string,
    days: WeekDay[],
    gradeLevel?: number
  ) => Promise<{ day: string; date: string }[]>;

  clearError: () => void;
}

export const useCyclesStore = create<CyclesState>((set, get) => ({
  cycles: [],
  activeCycles: [],
  currentCycle: null,
  selectedCycle: null,
  isLoading: false,
  error: null,

  fetchAllCycles: async () => {
    set({ isLoading: true, error: null });

    try {
      const cycles = await supabaseService.fetchAllCycles();
      set({ cycles, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        cycles: [],
      });
    }
  },

  fetchActiveCycles: async () => {
    set({ isLoading: true, error: null });

    try {
      const activeCycles = await supabaseService.fetchActiveCycles();
      set({ activeCycles, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        activeCycles: [],
      });
    }
  },

  fetchCurrentCycle: async () => {
    set({ isLoading: true, error: null });

    try {
      const currentCycle = await supabaseService.getCurrentCycle();
      set({ currentCycle, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        currentCycle: null,
      });
    }
  },

  fetchCycleById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const cycle = await supabaseService.fetchCycleById(id);
      set({ selectedCycle: cycle, isLoading: false });
      return cycle;
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        selectedCycle: null,
      });
      return null;
    }
  },

  createCycle: async (cycle: InterventionCycleInsert) => {
    set({ isLoading: true, error: null });

    try {
      const newCycle = await supabaseService.createCycle(cycle);

      set((state) => ({
        cycles: [newCycle, ...state.cycles].sort(
          (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        ),
        isLoading: false,
      }));

      // Update active cycles if needed
      if (newCycle.status === 'active') {
        set((state) => ({
          activeCycles: [...state.activeCycles, newCycle].sort(
            (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          ),
        }));
      }

      return newCycle;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateCycle: async (id: string, updates: InterventionCycleUpdate) => {
    set({ isLoading: true, error: null });

    try {
      const updated = await supabaseService.updateCycle(id, updates);

      set((state) => ({
        cycles: state.cycles.map((c) => (c.id === id ? updated : c)),
        activeCycles: updates.status
          ? updates.status === 'active'
            ? [...state.activeCycles.filter((c) => c.id !== id), updated]
            : state.activeCycles.filter((c) => c.id !== id)
          : state.activeCycles.map((c) => (c.id === id ? updated : c)),
        selectedCycle: state.selectedCycle?.id === id ? updated : state.selectedCycle,
        currentCycle: state.currentCycle?.id === id ? updated : state.currentCycle,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteCycle: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await supabaseService.deleteCycle(id);

      set((state) => ({
        cycles: state.cycles.filter((c) => c.id !== id),
        activeCycles: state.activeCycles.filter((c) => c.id !== id),
        selectedCycle: state.selectedCycle?.id === id ? null : state.selectedCycle,
        currentCycle: state.currentCycle?.id === id ? null : state.currentCycle,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  setSelectedCycle: (cycle) => {
    set({ selectedCycle: cycle });
  },

  generateSessionDates: async (cycleId, days, gradeLevel) => {
    try {
      return await supabaseService.generateCycleSessionDates(cycleId, days, gradeLevel);
    } catch (err) {
      set({ error: (err as Error).message });
      return [];
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper: Calculate which week of the cycle a date falls in
export function getWeekOfCycle(cycle: InterventionCycle, date: Date | string): number {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const start = new Date(cycle.start_date);
  const diffTime = checkDate.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(1, weekNumber), cycle.weeks_count);
}

// Helper: Get cycle progress percentage
export function getCycleProgress(cycle: InterventionCycle): number {
  const now = new Date();
  const start = new Date(cycle.start_date);
  const end = new Date(cycle.end_date);

  if (now < start) return 0;
  if (now > end) return 100;

  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

  return Math.round((elapsedDays / totalDays) * 100);
}

// Helper: Check if cycle is currently active
export function isCycleActive(cycle: InterventionCycle): boolean {
  if (cycle.status !== 'active') return false;

  const now = new Date();
  const start = new Date(cycle.start_date);
  const end = new Date(cycle.end_date);

  return now >= start && now <= end;
}

// Helper: Format cycle date range for display
export function formatCycleDateRange(cycle: InterventionCycle): string {
  const start = new Date(cycle.start_date);
  const end = new Date(cycle.end_date);

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);

  return `${startStr} - ${endStr}`;
}

// Helper: Get cycle status color
export function getCycleStatusColorClass(status: CycleStatus): string {
  switch (status) {
    case 'planning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
