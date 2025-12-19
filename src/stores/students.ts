import { create } from 'zustand';
import { db } from '@/lib/local-db';
import {
  createStudent as createStudentDB,
  updateStudent as updateStudentDB,
  deleteStudent as deleteStudentDB
} from '@/lib/local-db/hooks';
import { validateStudent } from '@/lib/supabase/validation';
import { toNumericId } from '@/lib/utils/id';
import type { LocalStudent, LocalStudentInsert, LocalStudentUpdate } from '@/lib/local-db';
import type { Student, StudentInsert, StudentUpdate } from '@/lib/supabase/types';

// Map LocalStudent to Student (for compatibility with existing code)
function mapLocalToStudent(local: LocalStudent): Student {
  return {
    ...local,
    id: String(local.id),
    group_id: String(local.group_id),
  } as Student;
}

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
      const numericGroupId = toNumericId(groupId);
      if (numericGroupId === null) {
        throw new Error('Invalid group ID');
      }

      const localStudents = await db.students
        .where('group_id')
        .equals(numericGroupId)
        .toArray();

      const students = localStudents.map(mapLocalToStudent);
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
      const localStudents = await db.students.toArray();
      const students = localStudents.map(mapLocalToStudent);
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
      // Convert StudentInsert to LocalStudentInsert
      const numericGroupId = toNumericId(student.group_id);
      if (numericGroupId === null) {
        throw new Error('Invalid group ID');
      }

      const localStudent: LocalStudentInsert = {
        group_id: numericGroupId,
        name: student.name,
        notes: student.notes || null,
      };

      const id = await createStudentDB(localStudent);
      const newStudent = await db.students.get(id);

      if (!newStudent) {
        throw new Error('Failed to retrieve created student');
      }

      const mappedStudent = mapLocalToStudent(newStudent);

      set((state) => ({
        students: [...state.students, mappedStudent],
        allStudents: [...state.allStudents, mappedStudent],
        isLoading: false,
      }));

      return mappedStudent;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return null;
    }
  },

  updateStudent: async (id: string, updates: StudentUpdate) => {
    set({ isLoading: true, error: null });

    try {
      const numericId = toNumericId(id);
      if (numericId === null) {
        throw new Error('Invalid student ID');
      }

      // Convert updates to LocalStudentUpdate
      const numericGroupId = updates.group_id !== undefined ? toNumericId(updates.group_id) : undefined;
      const localUpdates: LocalStudentUpdate = {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(numericGroupId !== undefined && numericGroupId !== null && { group_id: numericGroupId }),
      };

      await updateStudentDB(numericId, localUpdates);

      // Fetch updated student
      const updatedStudent = await db.students.get(numericId);
      if (!updatedStudent) {
        throw new Error('Student not found after update');
      }

      const mappedStudent = mapLocalToStudent(updatedStudent);

      set((state) => ({
        students: state.students.map((s) => (s.id === id ? mappedStudent : s)),
        allStudents: state.allStudents.map((s) => (s.id === id ? mappedStudent : s)),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteStudent: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const numericId = toNumericId(id);
      if (numericId === null) {
        throw new Error('Invalid student ID');
      }

      // Delete student and related progress monitoring data
      await deleteStudentDB(numericId, true);

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
