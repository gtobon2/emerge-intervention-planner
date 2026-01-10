'use client';

import { useEffect, useCallback } from 'react';
import { useSessionsStore } from '@/stores/sessions';
import type { SessionInsert, SessionUpdate } from '@/lib/supabase/types';

export function useSessions(groupId: string | undefined) {
  const sessions = useSessionsStore((state) => state.sessions);
  const isLoading = useSessionsStore((state) => state.isLoading);
  const error = useSessionsStore((state) => state.error);
  const fetchSessionsForGroup = useSessionsStore((state) => state.fetchSessionsForGroup);
  const createSession = useSessionsStore((state) => state.createSession);
  const updateSession = useSessionsStore((state) => state.updateSession);
  const deleteSession = useSessionsStore((state) => state.deleteSession);

  useEffect(() => {
    if (groupId) {
      fetchSessionsForGroup(groupId);
    }
  }, [groupId, fetchSessionsForGroup]);

  return {
    sessions,
    isLoading,
    error,
    refetch: () => groupId && fetchSessionsForGroup(groupId),
    createSession,
    updateSession,
    deleteSession,
  };
}

export function useSession(sessionId: string | undefined) {
  const selectedSession = useSessionsStore((state) => state.selectedSession);
  const isLoading = useSessionsStore((state) => state.isLoading);
  const error = useSessionsStore((state) => state.error);
  const fetchSessionById = useSessionsStore((state) => state.fetchSessionById);
  const updateSession = useSessionsStore((state) => state.updateSession);

  useEffect(() => {
    if (sessionId) {
      fetchSessionById(sessionId);
    }
  }, [sessionId, fetchSessionById]);

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
  const todaySessions = useSessionsStore((state) => state.todaySessions);
  const isLoading = useSessionsStore((state) => state.isLoading);
  const error = useSessionsStore((state) => state.error);
  const fetchTodaySessions = useSessionsStore((state) => state.fetchTodaySessions);

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
  const allSessions = useSessionsStore((state) => state.allSessions);
  const isLoading = useSessionsStore((state) => state.isLoading);
  const error = useSessionsStore((state) => state.error);
  const fetchAllSessions = useSessionsStore((state) => state.fetchAllSessions);

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
