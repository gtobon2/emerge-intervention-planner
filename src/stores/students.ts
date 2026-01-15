import { create } from 'zustand';
import * as supabaseService from '@/lib/supabase/services';
import { validateStudent } from '@/lib/supabase/validation';
import type { Student, StudentInsert, StudentUpdate } from '@/lib/supabase/types';

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

    try {
      const students = await supabaseService.fetchStudentsByGroupId(groupId);
      set({ students, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        students: []
      });
    }
  },

  fetchAllStudents: async () => {
    set({ isLoading: true, error: null });

    try {
      const students = await supabaseService.fetchAllStudents();
      set({ allStudents: students, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        allStudents: []
      });
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

    try {
      const newStudent = await supabaseService.createStudent(student);

      set((state) => ({
        students: [...state.students, newStudent],
        allStudents: [...state.allStudents, newStudent],
        isLoading: false,
      }));

      return newStudent;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateStudent: async (id: string, updates: StudentUpdate) => {
    set({ isLoading: true, error: null });

    try {
      const updatedStudent = await supabaseService.updateStudent(id, updates);

      set((state) => ({
        students: state.students.map((s) => (s.id === id ? updatedStudent : s)),
        allStudents: state.allStudents.map((s) => (s.id === id ? updatedStudent : s)),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteStudent: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await supabaseService.deleteStudent(id);

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
