// @ts-nocheck
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  Session,
  SessionInsert,
  SessionUpdate,
  SessionWithGroup,
  TodaySession,
} from '@/lib/supabase/types';

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
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchSessionsForGroup: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false });

      if (error) throw error;
      set({ sessions: data || [], isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchTodaySessions: async () => {
    set({ isLoading: true, error: null });
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
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchSessionById: async (id: string) => {
    set({ isLoading: true, error: null });
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
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createSession: async (session: SessionInsert) => {
    set({ isLoading: true, error: null });
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
