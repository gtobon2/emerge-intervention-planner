import { create } from 'zustand';
import * as supabaseService from '@/lib/supabase/services';
import type {
  SessionAttendance,
  SessionAttendanceInsert,
  AttendanceStatus,
  Student,
} from '@/lib/supabase/types';

interface AttendanceState {
  // Current session attendance
  sessionAttendance: SessionAttendance[];
  // Student attendance history (for viewing individual student records)
  studentAttendanceHistory: SessionAttendance[];
  // Attendance stats for a student
  studentStats: {
    total: number;
    present: number;
    absent: number;
    tardy: number;
    excused: number;
    attendanceRate: number;
  } | null;

  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAttendanceForSession: (sessionId: string) => Promise<void>;
  fetchAttendanceForStudent: (studentId: string) => Promise<void>;
  fetchStudentStats: (studentId: string) => Promise<void>;
  markAttendance: (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    notes?: string,
    markedBy?: string
  ) => Promise<void>;
  markAllPresent: (sessionId: string, students: Student[], markedBy?: string) => Promise<void>;
  bulkMarkAttendance: (
    sessionId: string,
    attendances: { studentId: string; status: AttendanceStatus; notes?: string }[],
    markedBy?: string
  ) => Promise<void>;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  sessionAttendance: [],
  studentAttendanceHistory: [],
  studentStats: null,
  isLoading: false,
  error: null,

  fetchAttendanceForSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });

    try {
      const attendance = await supabaseService.fetchAttendanceBySessionId(sessionId);
      set({ sessionAttendance: attendance, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        sessionAttendance: [],
      });
    }
  },

  fetchAttendanceForStudent: async (studentId: string) => {
    set({ isLoading: true, error: null });

    try {
      const attendance = await supabaseService.fetchAttendanceByStudentId(studentId);
      set({ studentAttendanceHistory: attendance, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        studentAttendanceHistory: [],
      });
    }
  },

  fetchStudentStats: async (studentId: string) => {
    set({ isLoading: true, error: null });

    try {
      const stats = await supabaseService.getStudentAttendanceStats(studentId);
      set({ studentStats: stats, isLoading: false });
    } catch (err) {
      set({
        error: (err as Error).message,
        isLoading: false,
        studentStats: null,
      });
    }
  },

  markAttendance: async (sessionId, studentId, status, notes, markedBy) => {
    set({ isLoading: true, error: null });

    try {
      const attendanceRecord: SessionAttendanceInsert = {
        session_id: sessionId,
        student_id: studentId,
        status,
        notes: notes || null,
        marked_by: markedBy || null,
      };

      const saved = await supabaseService.upsertAttendance(attendanceRecord);

      // Update local state
      set((state) => {
        const existing = state.sessionAttendance.findIndex(
          (a) => a.student_id === studentId
        );
        const newAttendance =
          existing >= 0
            ? state.sessionAttendance.map((a, i) => (i === existing ? saved : a))
            : [...state.sessionAttendance, saved];

        return { sessionAttendance: newAttendance, isLoading: false };
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  markAllPresent: async (sessionId, students, markedBy) => {
    set({ isLoading: true, error: null });

    try {
      const attendances: SessionAttendanceInsert[] = students.map((student) => ({
        session_id: sessionId,
        student_id: student.id,
        status: 'present' as AttendanceStatus,
        notes: null,
        marked_by: markedBy || null,
      }));

      const saved = await supabaseService.bulkUpsertAttendance(attendances);
      set({ sessionAttendance: saved, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  bulkMarkAttendance: async (sessionId, attendances, markedBy) => {
    set({ isLoading: true, error: null });

    try {
      const attendanceRecords: SessionAttendanceInsert[] = attendances.map((a) => ({
        session_id: sessionId,
        student_id: a.studentId,
        status: a.status,
        notes: a.notes || null,
        marked_by: markedBy || null,
      }));

      const saved = await supabaseService.bulkUpsertAttendance(attendanceRecords);
      set({ sessionAttendance: saved, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helper to get attendance status for a specific student
export function getStudentAttendanceStatus(
  sessionAttendance: SessionAttendance[],
  studentId: string
): AttendanceStatus | null {
  const record = sessionAttendance.find((a) => a.student_id === studentId);
  return record?.status || null;
}

// Helper to check if all students have attendance marked
export function isAttendanceComplete(
  sessionAttendance: SessionAttendance[],
  studentIds: string[]
): boolean {
  const markedIds = new Set(sessionAttendance.map((a) => a.student_id));
  return studentIds.every((id) => markedIds.has(id));
}
