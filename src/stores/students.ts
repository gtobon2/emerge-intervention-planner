// @ts-nocheck
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Student, StudentInsert, StudentUpdate } from '@/lib/supabase/types';

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
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('group_id', groupId)
        .order('name');

      if (error) throw error;
      set({ students: data || [], isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
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
