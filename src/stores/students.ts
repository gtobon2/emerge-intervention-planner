// @ts-nocheck
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Student, StudentInsert, StudentUpdate } from '@/lib/supabase/types';
import { getStudentsForGroup } from '@/lib/mock-data';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes('placeholder');
};

interface StudentsState {
  students: Student[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStudentsForGroup: (groupId: string) => Promise<void>;
  createStudent: (student: StudentInsert) => Promise<Student | null>;
  updateStudent: (id: string, updates: StudentUpdate) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useStudentsStore = create<StudentsState>((set) => ({
  students: [],
  isLoading: false,
  error: null,

  fetchStudentsForGroup: async (groupId: string) => {
    set({ isLoading: true, error: null });

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      const mockStudents = getStudentsForGroup(groupId);
      set({ students: mockStudents, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('group_id', groupId)
        .order('name');

      if (error) throw error;
      set({ students: data || [], isLoading: false });
    } catch (err) {
      // Fall back to mock data
      const mockStudents = getStudentsForGroup(groupId);
      set({ students: mockStudents, isLoading: false });
    }
  },

  createStudent: async (student: StudentInsert) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        students: [...state.students, data],
        isLoading: false,
      }));

      return data;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateStudent: async (id: string, updates: StudentUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteStudent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
