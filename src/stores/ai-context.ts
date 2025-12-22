import { create } from 'zustand';

interface StudentContext {
  id: string;
  name: string;
  groupName?: string;
  curriculum?: string;
  tier?: string;
  notes?: string | null;
}

interface GroupContext {
  name: string;
  curriculum: string;
  tier: string;
  grade: string;
}

interface SessionContext {
  date: string;
  studentNames?: string[];
  errorsLogged?: number;
  otrCount?: number;
  exitTicketScore?: number;
  notes?: string;
}

interface AIContextState {
  // Current page context
  students: StudentContext[];
  group: GroupContext | null;
  recentSessions: SessionContext[];

  // Page identification
  currentPage: string | null;

  // Additional context (free-form text for reports, analysis, etc.)
  additionalContext: string | null;

  // Actions
  setStudents: (students: StudentContext[]) => void;
  setGroup: (group: GroupContext | null) => void;
  setRecentSessions: (sessions: SessionContext[]) => void;
  setCurrentPage: (page: string) => void;
  setAdditionalContext: (context: string | null) => void;

  // Convenience method to set full context at once
  setContext: (context: {
    students?: StudentContext[];
    group?: GroupContext | null;
    recentSessions?: SessionContext[];
    currentPage?: string;
    additionalContext?: string | null;
  }) => void;

  // Clear context (e.g., when navigating away)
  clearContext: () => void;
}

export const useAIContextStore = create<AIContextState>((set) => ({
  // Initial state
  students: [],
  group: null,
  recentSessions: [],
  currentPage: null,
  additionalContext: null,

  // Actions
  setStudents: (students) => set({ students }),
  setGroup: (group) => set({ group }),
  setRecentSessions: (sessions) => set({ recentSessions: sessions }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setAdditionalContext: (context) => set({ additionalContext: context }),

  setContext: (context) => set((state) => ({
    students: context.students ?? state.students,
    group: context.group !== undefined ? context.group : state.group,
    recentSessions: context.recentSessions ?? state.recentSessions,
    currentPage: context.currentPage ?? state.currentPage,
    additionalContext: context.additionalContext !== undefined ? context.additionalContext : state.additionalContext,
  })),

  clearContext: () => set({
    students: [],
    group: null,
    recentSessions: [],
    currentPage: null,
    additionalContext: null,
  }),
}));

// Export types for use in components
export type { StudentContext, GroupContext, SessionContext };
