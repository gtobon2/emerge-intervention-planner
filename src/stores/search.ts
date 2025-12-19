// @ts-nocheck
import { create } from 'zustand';
import { useGroupsStore } from './groups';
import { useStudentsStore } from './students';
import { useSessionsStore } from './sessions';
import { useErrorsStore } from './errors';
import type { Group, Student, SessionWithGroup, ErrorBankEntry } from '@/lib/supabase/types';

export interface SearchResult {
  type: 'group' | 'student' | 'session' | 'error';
  id: string;
  title: string;
  subtitle?: string;
  metadata?: string;
  badge?: string;
  data: Group | Student | SessionWithGroup | ErrorBankEntry;
}

export interface SearchResults {
  groups: SearchResult[];
  students: SearchResult[];
  sessions: SearchResult[];
  errors: SearchResult[];
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

interface SearchState {
  query: string;
  results: SearchResults;
  isSearching: boolean;
  recentSearches: RecentSearch[];

  // Actions
  search: (query: string) => void;
  clearSearch: () => void;
  addToRecent: (query: string) => void;
  clearRecentSearches: () => void;
}

// Debounce timeout
let searchTimeout: NodeJS.Timeout | null = null;

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: {
    groups: [],
    students: [],
    sessions: [],
    errors: [],
  },
  isSearching: false,
  recentSearches: [],

  search: (query: string) => {
    set({ query, isSearching: true });

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If query is empty, clear results
    if (!query.trim()) {
      set({
        results: {
          groups: [],
          students: [],
          sessions: [],
          errors: [],
        },
        isSearching: false,
      });
      return;
    }

    // Debounce search by 300ms
    searchTimeout = setTimeout(() => {
      const lowerQuery = query.toLowerCase().trim();

      // Get data from stores
      const groups = useGroupsStore.getState().groups;
      const allStudents = useStudentsStore.getState().allStudents;
      const allSessions = useSessionsStore.getState().allSessions;
      const errors = useErrorsStore.getState().errors;

      // Search groups (by name and curriculum)
      const groupResults: SearchResult[] = groups
        .filter((group) => {
          return (
            group.name.toLowerCase().includes(lowerQuery) ||
            group.curriculum.toLowerCase().includes(lowerQuery)
          );
        })
        .slice(0, 5)
        .map((group) => ({
          type: 'group' as const,
          id: group.id,
          title: group.name,
          subtitle: `Grade ${group.grade} • Tier ${group.tier}`,
          badge: group.curriculum,
          metadata: `${getStudentCount(group.id, allStudents)} students`,
          data: group,
        }));

      // Search students (by name)
      const studentResults: SearchResult[] = allStudents
        .filter((student) => student.name.toLowerCase().includes(lowerQuery))
        .slice(0, 5)
        .map((student) => {
          const group = groups.find((g) => g.id === student.group_id);
          return {
            type: 'student' as const,
            id: student.id,
            title: student.name,
            subtitle: group?.name || 'Unknown Group',
            badge: group?.curriculum,
            data: student,
          };
        });

      // Search sessions (by notes and dates)
      const sessionResults: SearchResult[] = allSessions
        .filter((session) => {
          const dateStr = new Date(session.date).toLocaleDateString();
          const groupName = session.group?.name || '';
          const notes = session.notes || '';
          const nextSessionNotes = session.next_session_notes || '';

          return (
            dateStr.includes(lowerQuery) ||
            groupName.toLowerCase().includes(lowerQuery) ||
            notes.toLowerCase().includes(lowerQuery) ||
            nextSessionNotes.toLowerCase().includes(lowerQuery)
          );
        })
        .slice(0, 5)
        .map((session) => ({
          type: 'session' as const,
          id: session.id,
          title: `${session.group?.name || 'Unknown'} - ${formatDate(session.date)}`,
          subtitle: session.notes ? truncate(session.notes, 60) : 'No notes',
          badge: session.status,
          metadata: session.group?.curriculum,
          data: session,
        }));

      // Search errors (by pattern and correction)
      const errorResults: SearchResult[] = errors
        .filter((error) => {
          return (
            error.error_pattern.toLowerCase().includes(lowerQuery) ||
            error.correction_protocol.toLowerCase().includes(lowerQuery)
          );
        })
        .slice(0, 5)
        .map((error) => ({
          type: 'error' as const,
          id: error.id,
          title: error.error_pattern,
          subtitle: truncate(error.correction_protocol, 60),
          badge: error.curriculum,
          metadata: `${error.occurrence_count} occurrences`,
          data: error,
        }));

      set({
        results: {
          groups: groupResults,
          students: studentResults,
          sessions: sessionResults,
          errors: errorResults,
        },
        isSearching: false,
      });
    }, 300);
  },

  clearSearch: () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    set({
      query: '',
      results: {
        groups: [],
        students: [],
        sessions: [],
        errors: [],
      },
      isSearching: false,
    });
  },

  addToRecent: (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    set((state) => {
      // Remove duplicates and add to beginning
      const filtered = state.recentSearches.filter((s) => s.query !== trimmedQuery);
      const newRecent = [
        { query: trimmedQuery, timestamp: Date.now() },
        ...filtered,
      ].slice(0, 5); // Keep only 5 recent searches

      return { recentSearches: newRecent };
    });
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
  },
}));

// Helper functions
function getStudentCount(groupId: string, students: Student[]): number {
  return students.filter((s) => s.group_id === groupId).length;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
