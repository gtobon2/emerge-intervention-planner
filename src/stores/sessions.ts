import { create } from 'zustand';
import type {
  Session,
  SessionInsert,
  SessionUpdate,
  SessionWithGroup,
  TodaySession,
  ObservedError,
  Pacing,
  MasteryLevel,
} from '@/lib/supabase/types';

// Student error for per-student tracking
export interface StudentErrorInput {
  student_id: string;
  error_pattern: string;
  correction_used?: string;
  correction_worked?: boolean;
  notes?: string;
}

// Session completion data
export interface SessionCompletionData {
  actual_otr_count?: number;
  pacing?: Pacing;
  components_completed?: string[];
  exit_ticket_correct?: number;
  exit_ticket_total?: number;
  mastery_demonstrated?: MasteryLevel;
  errors_observed?: ObservedError[];
  unexpected_errors?: ObservedError[];
  notes?: string;
  next_session_notes?: string;
  // Per-student errors
  student_errors?: StudentErrorInput[];
}

interface SessionsState {
  sessions: Session[];
  todaySessions: TodaySession[];
  selectedSession: SessionWithGroup | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessionsForGroup: (groupId: string) => Promise<void>;
  fetchTodaySessions: () => Promise<void>;
  fetchSessionById: (id: string) => Promise<void>;
  createSession: (session: SessionInsert) => Promise<Session | null>;
  updateSession: (id: string, updates: SessionUpdate) => Promise<void>;
  completeSession: (id: string, data: SessionCompletionData) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  setSelectedSession: (session: SessionWithGroup | null) => void;
  clearError: () => void;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  todaySessions: [],
  selectedSession: null,
  isLoading: false,
  error: null,

  fetchSessionsForGroup: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/sessions?groupId=${groupId}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      set({ sessions: data || [], isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchTodaySessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/sessions/today');
      if (!response.ok) throw new Error('Failed to fetch today sessions');
      const data = await response.json();
      set({ todaySessions: data || [], isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchSessionById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/sessions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch session');
      const data = await response.json();
      set({ selectedSession: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createSession: async (session: SessionInsert) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (!response.ok) throw new Error('Failed to create session');
      const data = await response.json();

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
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update session');

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

  // Complete a session with all collected data
  completeSession: async (id: string, data: SessionCompletionData) => {
    set({ isLoading: true, error: null });
    try {
      // First, save any per-student errors
      if (data.student_errors && data.student_errors.length > 0) {
        const errorsToSave = data.student_errors.map(err => ({
          ...err,
          session_id: id,
        }));

        await fetch('/api/student-errors', {
          method: 'PUT', // Bulk insert
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ errors: errorsToSave }),
        });
      }

      // Update session with completion data
      const sessionUpdates: SessionUpdate = {
        status: 'completed',
        actual_otr_count: data.actual_otr_count,
        pacing: data.pacing,
        components_completed: data.components_completed,
        exit_ticket_correct: data.exit_ticket_correct,
        exit_ticket_total: data.exit_ticket_total,
        mastery_demonstrated: data.mastery_demonstrated,
        errors_observed: data.errors_observed,
        unexpected_errors: data.unexpected_errors,
        notes: data.notes,
        next_session_notes: data.next_session_notes,
      };

      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionUpdates),
      });

      if (!response.ok) throw new Error('Failed to complete session');

      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...sessionUpdates } : s
        ),
        selectedSession:
          state.selectedSession?.id === id
            ? { ...state.selectedSession, ...sessionUpdates }
            : state.selectedSession,
        todaySessions: state.todaySessions.map((s) =>
          s.id === id ? { ...s, status: 'completed' } : s
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteSession: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete session');

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
