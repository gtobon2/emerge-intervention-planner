// @ts-nocheck
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  completeSession as completeSessionQuery,
  saveSessionErrors,
} from '@/lib/supabase/queries';
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
} from '@/lib/supabase/types';
import {
  MOCK_SESSIONS,
  MOCK_SESSIONS_WITH_GROUPS,
  getTodaysSessions,
  getSessionsForGroup,
} from '@/lib/mock-data';

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
  fetchTodaySessions: () => Promise<void>;
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

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      set({ allSessions: MOCK_SESSIONS_WITH_GROUPS, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          groups (*)
        `)
        .order('date', { ascending: true });

      if (error) throw error;

      const sessionsWithGroups: SessionWithGroup[] = (data || []).map((session: any) => ({
        ...session,
        group: session.groups,
      }));

      set({ allSessions: sessionsWithGroups, isLoading: false });
    } catch (err) {
      set({ allSessions: MOCK_SESSIONS_WITH_GROUPS, isLoading: false });
    }
  },

  fetchSessionsForGroup: async (groupId: string) => {
    set({ isLoading: true, error: null });

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      const mockSessions = getSessionsForGroup(groupId);
      set({ sessions: mockSessions, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false });

      if (error) throw error;
      set({ sessions: data || [], isLoading: false });
    } catch (err) {
      const mockSessions = getSessionsForGroup(groupId);
      set({ sessions: mockSessions, isLoading: false });
    }
  },

  fetchTodaySessions: async () => {
    set({ isLoading: true, error: null });

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      const todayMock = getTodaysSessions();
      const todaySessions: TodaySession[] = todayMock.map((session) => ({
        id: session.id,
        groupId: session.group_id,
        groupName: session.group.name,
        curriculum: session.group.curriculum,
        tier: session.group.tier,
        time: session.time || '',
        status: session.status,
        position: session.curriculum_position,
      }));
      set({ todaySessions, isLoading: false });
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          group_id,
          time,
          status,
          curriculum_position,
          groups!inner (
            name,
            curriculum,
            tier
          )
        `)
        .eq('date', today)
        .order('time');

      if (error) throw error;

      const todaySessions: TodaySession[] = (data || []).map((session: any) => ({
        id: session.id,
        groupId: session.group_id,
        groupName: session.groups.name,
        curriculum: session.groups.curriculum,
        tier: session.groups.tier,
        time: session.time,
        status: session.status,
        position: session.curriculum_position,
      }));

      set({ todaySessions, isLoading: false });
    } catch (err) {
      // Fall back to mock data
      const todayMock = getTodaysSessions();
      const todaySessions: TodaySession[] = todayMock.map((session) => ({
        id: session.id,
        groupId: session.group_id,
        groupName: session.group.name,
        curriculum: session.group.curriculum,
        tier: session.group.tier,
        time: session.time || '',
        status: session.status,
        position: session.curriculum_position,
      }));
      set({ todaySessions, isLoading: false });
    }
  },

  fetchSessionById: async (id: string) => {
    set({ isLoading: true, error: null });

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      const mockSession = MOCK_SESSIONS_WITH_GROUPS.find(s => s.id === id);
      set({
        selectedSession: mockSession || null,
        isLoading: false,
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          groups (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      set({
        selectedSession: {
          ...data,
          group: data.groups,
        } as SessionWithGroup,
        isLoading: false,
      });
    } catch (err) {
      const mockSession = MOCK_SESSIONS_WITH_GROUPS.find(s => s.id === id);
      set({
        selectedSession: mockSession || null,
        isLoading: false,
      });
    }
  },

  createSession: async (session: SessionInsert) => {
    set({ isLoading: true, error: null });

    // Validate session data
    const validation = validateSession(session);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      set({ error: errorMessage, isLoading: false });
      return null;
    }

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      const newSession: Session = {
        ...session,
        id: `session-${Date.now()}`,
        status: session.status || 'planned',
        advance_after: session.advance_after || false,
        actual_otr_estimate: null,
        pacing: null,
        components_completed: null,
        exit_ticket_correct: null,
        exit_ticket_total: null,
        mastery_demonstrated: null,
        errors_observed: null,
        unexpected_errors: null,
        pm_score: null,
        pm_trend: null,
        dbi_adaptation_notes: null,
        next_session_notes: null,
        fidelity_checklist: null,
        cumulative_review_items: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Session;

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        isLoading: false,
      }));

      return newSession;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        sessions: [data, ...state.sessions],
        isLoading: false,
      }));

      return data;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateSession: async (id: string, updates: SessionUpdate) => {
    set({ isLoading: true, error: null });

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
        ),
        selectedSession:
          state.selectedSession?.id === id
            ? { ...state.selectedSession, ...updates, updated_at: new Date().toISOString() }
            : state.selectedSession,
        isLoading: false,
      }));
      return;
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
        selectedSession:
          state.selectedSession?.id === id
            ? { ...state.selectedSession, ...updates }
            : state.selectedSession,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  completeSession: async (id, completionData, saveErrors = true) => {
    set({ isLoading: true, error: null });

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      const updatedSession = {
        ...completionData,
        status: 'completed' as const,
        updated_at: new Date().toISOString(),
      };

      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updatedSession } : s
        ),
        selectedSession:
          state.selectedSession?.id === id
            ? { ...state.selectedSession, ...updatedSession }
            : state.selectedSession,
        isLoading: false,
      }));

      // Return mock session
      const session = get().sessions.find((s) => s.id === id);
      return session || null;
    }

    try {
      // Complete the session using the query helper
      const { data: completedSession, error: completeError } =
        await completeSessionQuery(id, completionData);

      if (completeError) throw completeError;

      if (!completedSession) {
        throw new Error('Failed to complete session');
      }

      // Save errors to error bank if requested and errors were observed
      if (saveErrors && completionData.errors_observed && completionData.errors_observed.length > 0) {
        // Get the session to access group info
        const { data: sessionWithGroup } = await supabase
          .from('sessions')
          .select(`
            *,
            groups (curriculum)
          `)
          .eq('id', id)
          .single();

        if (sessionWithGroup && sessionWithGroup.groups) {
          const curriculum = (sessionWithGroup.groups as any).curriculum;
          const { error: saveErrorsError } = await saveSessionErrors(
            id,
            curriculum,
            completedSession.curriculum_position,
            completionData.errors_observed
          );

          if (saveErrorsError) {
            console.error('Error saving session errors:', saveErrorsError);
            // Don't fail the whole operation if error saving fails
          }
        }
      }

      // Update local state
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? completedSession : s
        ),
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
      const { error } = await supabase.from('sessions').delete().eq('id', id);

      if (error) throw error;

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
