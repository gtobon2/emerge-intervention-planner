// @ts-nocheck
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { validateStudent } from '@/lib/supabase/validation';
import type { Student, StudentInsert, StudentUpdate } from '@/lib/supabase/types';
import { getStudentsForGroup, MOCK_STUDENTS } from '@/lib/mock-data';

interface StudentsState {
  students: Student[];
  allStudents: Student[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStudentsForGroup: (groupId: string) => Promise<void>;
  fetchAllStudents: () => Promise<void>;
  createStudent: (student: StudentInsert) => Promise<Student | null>;
  updateStudent: (id: string, updates: StudentUpdate) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useStudentsStore = create<StudentsState>((set) => ({
  students: [],
  allStudents: [],
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

  fetchAllStudents: async () => {
    set({ isLoading: true, error: null });

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      set({ allStudents: MOCK_STUDENTS, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ allStudents: data || [], isLoading: false });
    } catch (err) {
      // Fall back to mock data
      set({ allStudents: MOCK_STUDENTS, isLoading: false });
    }
  },

  createStudent: async (student: StudentInsert) => {
    set({ isLoading: true, error: null });

    // Validate student data
    const validation = validateStudent(student);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      set({ error: errorMessage, isLoading: false });
      return null;
    }

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      const newStudent: Student = {
        ...student,
        id: `student-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        students: [...state.students, newStudent],
        allStudents: [...state.allStudents, newStudent],
        isLoading: false,
      }));

      return newStudent;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        students: [...state.students, data],
        allStudents: [...state.allStudents, data],
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

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      set((state) => ({
        students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        allStudents: state.allStudents.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        isLoading: false,
      }));
      return;
    }

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
        allStudents: state.allStudents.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteStudent: async (id: string) => {
    set({ isLoading: true, error: null });

    // Use mock data if Supabase not configured
    if (!isSupabaseConfigured()) {
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        allStudents: state.allStudents.filter((s) => s.id !== id),
        isLoading: false,
      }));
      return;
    }

    try {
      const { error } = await supabase.from('students').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        allStudents: state.allStudents.filter((s) => s.id !== id),
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
