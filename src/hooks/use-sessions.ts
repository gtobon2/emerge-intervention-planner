'use client';

import { useEffect, useCallback } from 'react';
import { useSessionsStore } from '@/stores/sessions';
import type { SessionInsert, SessionUpdate } from '@/lib/supabase/types';

export function useSessions(groupId: string | undefined) {
  const store = useSessionsStore();

  useEffect(() => {
    if (groupId) {
      store.fetchSessionsForGroup(groupId);
    }
  }, [groupId, store]);

  return {
    sessions: store.sessions,
    isLoading: store.isLoading,
    error: store.error,
    refetch: () => groupId && store.fetchSessionsForGroup(groupId),
    createSession: store.createSession,
    updateSession: store.updateSession,
    deleteSession: store.deleteSession,
  };
}

export function useSession(sessionId: string | undefined) {
  const { selectedSession, fetchSessionById, isLoading, error, updateSession } = useSessionsStore();

  useEffect(() => {
    if (sessionId && (!selectedSession || selectedSession.id !== sessionId)) {
      fetchSessionById(sessionId);
    }
  }, [sessionId, selectedSession, fetchSessionById]);

  const update = useCallback(
    (updates: SessionUpdate) => {
      if (sessionId) {
        return updateSession(sessionId, updates);
      }
    },
    [sessionId, updateSession]
  );

  return {
    session: selectedSession,
    isLoading,
    error,
    refetch: () => sessionId && fetchSessionById(sessionId),
    update,
  };
}

export function useTodaySessions() {
  const { todaySessions, fetchTodaySessions, isLoading, error } = useSessionsStore();

  useEffect(() => {
    fetchTodaySessions();
  }, [fetchTodaySessions]);

  return {
    sessions: todaySessions,
    isLoading,
    error,
    refetch: fetchTodaySessions,
  };
}

export function useAllSessions() {
  const { allSessions, fetchAllSessions, isLoading, error } = useSessionsStore();

  useEffect(() => {
    fetchAllSessions();
  }, [fetchAllSessions]);

  return {
    sessions: allSessions,
    isLoading,
    error,
    refetch: fetchAllSessions,
  };
}
