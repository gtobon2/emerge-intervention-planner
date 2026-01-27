import { create } from 'zustand';
import * as supabaseService from '@/lib/supabase/services';
import { validateSession } from '@/lib/supabase/validation';
import type {
  Session,
  SessionInsert,
  SessionUpdate,
  SessionWithGroup,
  TodaySession,
  ObservedError,
  Pacing,
  MasteryLevel,
  PMTrend,
  Group,
} from '@/lib/supabase/types';

type UserRole = 'admin' | 'interventionist' | 'teacher';

interface SessionsState {
  sessions: Session[];
  allSessions: SessionWithGroup[];
  todaySessions: TodaySession[];
  selectedSession: SessionWithGroup | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessionsForGroup: (groupId: string) => Promise<void>;
  fetchAllSessions: () => Promise<void>;
  fetchSessionsByRole: (role: UserRole, userId: string) => Promise<void>;
  fetchTodaySessions: () => Promise<void>;
  fetchTodaySessionsByRole: (role: UserRole, userId: string) => Promise<void>;
  fetchSessionById: (id: string) => Promise<void>;
  createSession: (session: SessionInsert) => Promise<Session | null>;
  updateSession: (id: string, updates: SessionUpdate) => Promise<void>;
  completeSession: (
    id: string,
    completionData: {
      actual_otr_estimate?: number | null;
      pacing?: Pacing | null;
      components_completed?: string[] | null;
      exit_ticket_correct?: number | null;
      exit_ticket_total?: number | null;
      mastery_demonstrated?: MasteryLevel | null;
      errors_observed?: ObservedError[] | null;
      unexpected_errors?: ObservedError[] | null;
      pm_score?: number | null;
      pm_trend?: PMTrend | null;
      dbi_adaptation_notes?: string | null;
      notes?: string | null;
      next_session_notes?: string | null;
      fidelity_checklist?: any[] | null;
    },
    saveErrors?: boolean
  ) => Promise<Session | null>;
  deleteSession: (id: string) => Promise<void>;
  cancelSession: (id: string, reason?: string) => Promise<void>;
  rescheduleSession: (
    sessionId: string,
    newDate: string,
    newTime?: string,
    applyToFuture?: boolean
  ) => Promise<{ updated: Session[]; count: number } | null>;
  setSelectedSession: (session: SessionWithGroup | null) => void;
  clearError: () => void;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  allSessions: [],
  todaySessions: [],
  selectedSession: null,
  isLoading: false,
  error: null,

  fetchAllSessions: async () => {
    set({ isLoading: true, error: null });

    try {
      const sessions = await supabaseService.fetchAllSessions();
      const groups = await supabaseService.fetchAllGroups();

      const groupMap = new Map(groups.map(g => [g.id, g]));

      const sessionsWithGroups: SessionWithGroup[] = sessions
        .map(session => {
          const group = groupMap.get(session.group_id);
          if (!group) return null;
          return { ...session, group };
        })
        .filter((s): s is SessionWithGroup => s !== null);

      set({ allSessions: sessionsWithGroups, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        allSessions: []
      });
    }
  },

  fetchSessionsByRole: async (role: UserRole, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const sessions = await supabaseService.fetchSessionsByRole(role, userId);
      const groups = await supabaseService.fetchGroupsByRole(role, userId);

      const groupMap = new Map(groups.map(g => [g.id, g]));

      const sessionsWithGroups: SessionWithGroup[] = sessions
        .map(session => {
          const group = groupMap.get(session.group_id);
          if (!group) return null;
          return { ...session, group };
        })
        .filter((s): s is SessionWithGroup => s !== null);

      set({ allSessions: sessionsWithGroups, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        allSessions: []
      });
    }
  },

  fetchSessionsForGroup: async (groupId: string) => {
    set({ isLoading: true, error: null });

    try {
      const sessions = await supabaseService.fetchSessionsByGroupId(groupId);
      set({ sessions, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        sessions: []
      });
    }
  },

  fetchTodaySessions: async () => {
    set({ isLoading: true, error: null });

    try {
      const today = new Date().toISOString().split('T')[0];
      const allSessions = await supabaseService.fetchAllSessions();
      const todaySessionsRaw = allSessions.filter(s => s.date === today);

      const groups = await supabaseService.fetchAllGroups();
      const groupMap = new Map(groups.map(g => [g.id, g]));

      const todaySessions: TodaySession[] = todaySessionsRaw
        .map(session => {
          const group = groupMap.get(session.group_id);
          if (!group) return null;
          return {
            id: session.id,
            groupId: session.group_id,
            groupName: group.name,
            curriculum: group.curriculum,
            tier: group.tier,
            time: session.time || '',
            status: session.status,
            position: session.curriculum_position,
          } as TodaySession;
        })
        .filter((s): s is TodaySession => s !== null);

      // Sort by time
      todaySessions.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });

      set({ todaySessions, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        todaySessions: []
      });
    }
  },

  fetchTodaySessionsByRole: async (role: UserRole, userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const today = new Date().toISOString().split('T')[0];
      const sessions = await supabaseService.fetchSessionsByRole(role, userId);
      const todaySessionsRaw = sessions.filter(s => s.date === today);

      const groups = await supabaseService.fetchGroupsByRole(role, userId);
      const groupMap = new Map(groups.map(g => [g.id, g]));

      const todaySessions: TodaySession[] = todaySessionsRaw
        .map(session => {
          const group = groupMap.get(session.group_id);
          if (!group) return null;
          return {
            id: session.id,
            groupId: session.group_id,
            groupName: group.name,
            curriculum: group.curriculum,
            tier: group.tier,
            time: session.time || '',
            status: session.status,
            position: session.curriculum_position,
          } as TodaySession;
        })
        .filter((s): s is TodaySession => s !== null);

      // Sort by time
      todaySessions.sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });

      set({ todaySessions, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        todaySessions: []
      });
    }
  },

  fetchSessionById: async (id: string) => {
    set({ isLoading: true, error: null, selectedSession: null });

    try {
      const session = await supabaseService.fetchSessionById(id);
      if (!session) {
        throw new Error('Session not found');
      }

      const group = await supabaseService.fetchGroupById(session.group_id);
      if (!group) {
        throw new Error('Group not found for session');
      }

      const sessionWithGroup: SessionWithGroup = { ...session, group };

      set({
        selectedSession: sessionWithGroup,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        selectedSession: null
      });
    }
  },

  createSession: async (session: SessionInsert) => {
    set({ isLoading: true, error: null });

    const validation = validateSession(session);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      set({ error: errorMessage, isLoading: false });
      return null;
    }

    try {
      const newSession = await supabaseService.createSession(session);

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        isLoading: false,
      }));

      return newSession;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateSession: async (id: string, updates: SessionUpdate) => {
    set({ isLoading: true, error: null });

    try {
      const updatedSession = await supabaseService.updateSession(id, updates);

      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? updatedSession : s)),
        selectedSession:
          state.selectedSession?.id === id
            ? { ...state.selectedSession, ...updatedSession }
            : state.selectedSession,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  completeSession: async (id, completionData, saveErrors = true) => {
    set({ isLoading: true, error: null });

    try {
      const session = await supabaseService.fetchSessionById(id);
      if (!session) {
        throw new Error('Session not found');
      }

      // Update session with completion data and set status to completed
      const updates: SessionUpdate = {
        ...completionData,
        status: 'completed',
      };

      const completedSession = await supabaseService.updateSession(id, updates);

      // Save errors to error bank if requested
      if (saveErrors && completionData.errors_observed && completionData.errors_observed.length > 0) {
        const group = await supabaseService.fetchGroupById(session.group_id);
        if (group) {
          const curriculum = group.curriculum;
          const errorsToAdd = completionData.errors_observed.filter((e: any) => e.add_to_bank);

          for (const error of errorsToAdd) {
            // Check if error pattern already exists
            const existingErrors = await supabaseService.fetchErrorsByCurriculum(curriculum);
            const existingError = existingErrors.find(e => e.error_pattern === error.error_pattern);

            if (existingError) {
              // Error exists - increment counters
              const updates: any = {
                occurrence_count: existingError.occurrence_count + 1,
              };

              if (error.correction_worked) {
                updates.effectiveness_count = existingError.effectiveness_count + 1;
              }

              await supabaseService.updateError(existingError.id, updates);
            } else {
              // New error - create entry
              await supabaseService.createError({
                curriculum,
                curriculum_position: session.curriculum_position,
                error_pattern: error.error_pattern,
                underlying_gap: null,
                correction_protocol: error.correction_used,
                correction_prompts: [error.correction_used],
                visual_cues: null,
                kinesthetic_cues: null,
                is_custom: true,
                effectiveness_count: error.correction_worked ? 1 : 0,
                occurrence_count: 1,
              });
            }
          }
        }
      }

      // Update local state
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? completedSession : s)),
        selectedSession:
          state.selectedSession?.id === id
            ? { ...state.selectedSession, ...completedSession }
            : state.selectedSession,
        isLoading: false,
      }));

      return completedSession;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  deleteSession: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await supabaseService.deleteSession(id);

      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        selectedSession:
          state.selectedSession?.id === id ? null : state.selectedSession,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  cancelSession: async (id: string, reason?: string) => {
    set({ isLoading: true, error: null });

    const updates: SessionUpdate = {
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
    };

    try {
      await get().updateSession(id, updates);
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  rescheduleSession: async (
    sessionId: string,
    newDate: string,
    newTime?: string,
    applyToFuture: boolean = false
  ) => {
    set({ isLoading: true, error: null });

    try {
      const result = await supabaseService.rescheduleSession(
        sessionId,
        newDate,
        newTime,
        applyToFuture
      );

      // Refresh all sessions to get updated state
      await get().fetchAllSessions();
      
      set({ isLoading: false });
      return result;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  setSelectedSession: (session) => {
    set({ selectedSession: session });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper to get sessions for a specific week
export const getSessionsForWeek = (sessions: Session[], weekStart: Date) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    return sessionDate >= weekStart && sessionDate < weekEnd;
  });
};
