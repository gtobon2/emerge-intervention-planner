import { create } from 'zustand';
import { db } from '@/lib/local-db';
import {
  createSession as createSessionDB,
  updateSession as updateSessionDB,
  deleteSession as deleteSessionDB
} from '@/lib/local-db/hooks';
import { validateSession } from '@/lib/supabase/validation';
import type {
  LocalSession,
  LocalSessionInsert,
  LocalSessionUpdate,
  LocalGroup,
} from '@/lib/local-db';
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

// Map LocalSession to Session
function mapLocalToSession(local: LocalSession): Session {
  return {
    ...local,
    id: String(local.id),
    group_id: String(local.group_id),
    mastery_demonstrated: local.mastery_demonstrated as MasteryLevel | null,
  } as Session;
}

// Map LocalSession with LocalGroup to SessionWithGroup
function mapLocalToSessionWithGroup(
  local: LocalSession,
  group: LocalGroup
): SessionWithGroup {
  return {
    ...mapLocalToSession(local),
    group: {
      ...group,
      id: String(group.id),
    } as any,
  } as SessionWithGroup;
}

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
  cancelSession: (id: string, reason?: string) => Promise<void>;
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
      const localSessions = await db.sessions.orderBy('date').reverse().toArray();
      const sessionsWithGroups: SessionWithGroup[] = [];

      for (const session of localSessions) {
        const group = await db.groups.get(session.group_id);
        if (group) {
          sessionsWithGroups.push(mapLocalToSessionWithGroup(session, group));
        }
      }

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
      const numericGroupId = parseInt(groupId, 10);
      if (isNaN(numericGroupId)) {
        throw new Error('Invalid group ID');
      }

      const localSessions = await db.sessions
        .where('group_id')
        .equals(numericGroupId)
        .reverse()
        .sortBy('date');

      const sessions = localSessions.map(mapLocalToSession);
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

      const localSessions = await db.sessions
        .where('date')
        .equals(today)
        .toArray();

      const todaySessions: TodaySession[] = [];

      for (const session of localSessions) {
        const group = await db.groups.get(session.group_id);
        if (group) {
          todaySessions.push({
            id: String(session.id),
            groupId: String(session.group_id),
            groupName: group.name,
            curriculum: group.curriculum,
            tier: group.tier,
            time: session.time || '',
            status: session.status,
            position: session.curriculum_position,
          });
        }
      }

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
    set({ isLoading: true, error: null });

    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid session ID');
      }

      const session = await db.sessions.get(numericId);
      if (!session) {
        throw new Error('Session not found');
      }

      const group = await db.groups.get(session.group_id);
      if (!group) {
        throw new Error('Group not found for session');
      }

      const sessionWithGroup = mapLocalToSessionWithGroup(session, group);

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

    // Validate session data
    const validation = validateSession(session);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      set({ error: errorMessage, isLoading: false });
      return null;
    }

    try {
      const numericGroupId = parseInt(session.group_id, 10);
      if (isNaN(numericGroupId)) {
        throw new Error('Invalid group ID');
      }

      // Convert SessionInsert to LocalSessionInsert
      const localSession: LocalSessionInsert = {
        group_id: numericGroupId,
        date: session.date,
        time: session.time || null,
        status: session.status || 'planned',
        curriculum_position: session.curriculum_position,
        advance_after: session.advance_after || false,
        planned_otr_target: session.planned_otr_target || null,
        planned_response_formats: session.planned_response_formats || null,
        planned_practice_items: session.planned_practice_items || null,
        cumulative_review_items: session.cumulative_review_items || null,
        anticipated_errors: session.anticipated_errors || null,
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
        notes: session.notes || null,
        next_session_notes: null,
        fidelity_checklist: null,
      };

      const id = await createSessionDB(localSession);
      const newSession = await db.sessions.get(id);

      if (!newSession) {
        throw new Error('Failed to retrieve created session');
      }

      const mappedSession = mapLocalToSession(newSession);

      set((state) => ({
        sessions: [mappedSession, ...state.sessions],
        isLoading: false,
      }));

      return mappedSession;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateSession: async (id: string, updates: SessionUpdate) => {
    set({ isLoading: true, error: null });

    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid session ID');
      }

      // Convert updates to LocalSessionUpdate
      const localUpdates: LocalSessionUpdate = {};

      if (updates.date !== undefined) localUpdates.date = updates.date;
      if (updates.time !== undefined) localUpdates.time = updates.time;
      if (updates.status !== undefined) localUpdates.status = updates.status;
      if (updates.curriculum_position !== undefined) localUpdates.curriculum_position = updates.curriculum_position;
      if (updates.advance_after !== undefined) localUpdates.advance_after = updates.advance_after;
      if (updates.planned_otr_target !== undefined) localUpdates.planned_otr_target = updates.planned_otr_target;
      if (updates.planned_response_formats !== undefined) localUpdates.planned_response_formats = updates.planned_response_formats;
      if (updates.planned_practice_items !== undefined) localUpdates.planned_practice_items = updates.planned_practice_items;
      if (updates.cumulative_review_items !== undefined) localUpdates.cumulative_review_items = updates.cumulative_review_items;
      if (updates.anticipated_errors !== undefined) localUpdates.anticipated_errors = updates.anticipated_errors;
      if (updates.actual_otr_estimate !== undefined) localUpdates.actual_otr_estimate = updates.actual_otr_estimate;
      if (updates.pacing !== undefined) localUpdates.pacing = updates.pacing;
      if (updates.components_completed !== undefined) localUpdates.components_completed = updates.components_completed;
      if (updates.exit_ticket_correct !== undefined) localUpdates.exit_ticket_correct = updates.exit_ticket_correct;
      if (updates.exit_ticket_total !== undefined) localUpdates.exit_ticket_total = updates.exit_ticket_total;
      if (updates.mastery_demonstrated !== undefined) localUpdates.mastery_demonstrated = updates.mastery_demonstrated;
      if (updates.errors_observed !== undefined) localUpdates.errors_observed = updates.errors_observed;
      if (updates.unexpected_errors !== undefined) localUpdates.unexpected_errors = updates.unexpected_errors;
      if (updates.pm_score !== undefined) localUpdates.pm_score = updates.pm_score;
      if (updates.pm_trend !== undefined) localUpdates.pm_trend = updates.pm_trend;
      if (updates.dbi_adaptation_notes !== undefined) localUpdates.dbi_adaptation_notes = updates.dbi_adaptation_notes;
      if (updates.notes !== undefined) localUpdates.notes = updates.notes;
      if (updates.next_session_notes !== undefined) localUpdates.next_session_notes = updates.next_session_notes;
      if (updates.fidelity_checklist !== undefined) localUpdates.fidelity_checklist = updates.fidelity_checklist;

      await updateSessionDB(numericId, localUpdates);

      // Fetch updated session
      const updatedSession = await db.sessions.get(numericId);
      if (!updatedSession) {
        throw new Error('Session not found after update');
      }

      const mappedSession = mapLocalToSession(updatedSession);

      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? mappedSession : s)),
        selectedSession:
          state.selectedSession?.id === id
            ? { ...state.selectedSession, ...mappedSession }
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
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid session ID');
      }

      // Update session with completion data and set status to completed
      const localUpdates: LocalSessionUpdate = {
        ...completionData,
        status: 'completed',
      };

      await updateSessionDB(numericId, localUpdates);

      const completedSession = await db.sessions.get(numericId);
      if (!completedSession) {
        throw new Error('Failed to retrieve completed session');
      }

      // Save errors to error bank if requested
      if (saveErrors && completionData.errors_observed && completionData.errors_observed.length > 0) {
        const group = await db.groups.get(completedSession.group_id);
        if (group) {
          const curriculum = group.curriculum;
          const errorsToAdd = completionData.errors_observed.filter((e: any) => e.add_to_bank);

          for (const error of errorsToAdd) {
            // Check if error pattern already exists
            const existingErrors = await db.errorBank
              .where('curriculum')
              .equals(curriculum)
              .and((entry) => entry.error_pattern === error.error_pattern)
              .toArray();

            if (existingErrors.length > 0) {
              // Error exists - increment counters
              const existingError = existingErrors[0];
              const updates: any = {
                occurrence_count: existingError.occurrence_count + 1,
              };

              if (error.correction_worked) {
                updates.effectiveness_count = existingError.effectiveness_count + 1;
              }

              await db.errorBank.update(existingError.id!, updates);
            } else {
              // New error - create entry
              await db.errorBank.add({
                curriculum,
                curriculum_position: completedSession.curriculum_position,
                error_pattern: error.error_pattern,
                underlying_gap: null,
                correction_protocol: error.correction_used,
                correction_prompts: [error.correction_used],
                visual_cues: null,
                kinesthetic_cues: null,
                is_custom: true,
                effectiveness_count: error.correction_worked ? 1 : 0,
                occurrence_count: 1,
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      }

      const mappedSession = mapLocalToSession(completedSession);

      // Update local state
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? mappedSession : s)),
        selectedSession:
          state.selectedSession?.id === id
            ? { ...state.selectedSession, ...mappedSession }
            : state.selectedSession,
        isLoading: false,
      }));

      return mappedSession;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  deleteSession: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid session ID');
      }

      await deleteSessionDB(numericId);

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
