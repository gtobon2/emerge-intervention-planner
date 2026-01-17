'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, FileCheck, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAttendanceStore } from '@/stores/attendance';
import type {
  Student,
  AttendanceStatus,
  SessionAttendance,
} from '@/lib/supabase/types';
import {
  getAttendanceStatusLabel,
  getAttendanceStatusIcon,
  getAttendanceStatusColor,
} from '@/lib/supabase/types';

interface AttendancePanelProps {
  sessionId: string;
  students: Student[];
  disabled?: boolean;
  onAttendanceChange?: (attendance: SessionAttendance[]) => void;
}

const STUDENT_COLORS = [
  'bg-movement text-white',
  'bg-emerald-500 text-white',
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-amber-500 text-white',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_BUTTONS: { status: AttendanceStatus; icon: React.ReactNode; label: string; color: string; hoverColor: string }[] = [
  {
    status: 'present',
    icon: <Check className="w-4 h-4" />,
    label: 'P',
    color: 'bg-green-500 text-white border-green-500',
    hoverColor: 'hover:bg-green-100 hover:border-green-300',
  },
  {
    status: 'absent',
    icon: <X className="w-4 h-4" />,
    label: 'A',
    color: 'bg-red-500 text-white border-red-500',
    hoverColor: 'hover:bg-red-100 hover:border-red-300',
  },
  {
    status: 'tardy',
    icon: <Clock className="w-4 h-4" />,
    label: 'T',
    color: 'bg-yellow-500 text-white border-yellow-500',
    hoverColor: 'hover:bg-yellow-100 hover:border-yellow-300',
  },
  {
    status: 'excused',
    icon: <FileCheck className="w-4 h-4" />,
    label: 'E',
    color: 'bg-blue-500 text-white border-blue-500',
    hoverColor: 'hover:bg-blue-100 hover:border-blue-300',
  },
];

export function AttendancePanel({
  sessionId,
  students,
  disabled = false,
  onAttendanceChange,
}: AttendancePanelProps) {
  const {
    sessionAttendance,
    isLoading,
    fetchAttendanceForSession,
    markAttendance,
    markAllPresent,
  } = useAttendanceStore();

  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch attendance when component mounts
  useEffect(() => {
    fetchAttendanceForSession(sessionId);
  }, [sessionId, fetchAttendanceForSession]);

  // Sync store attendance to local state
  useEffect(() => {
    const attendanceMap: Record<string, AttendanceStatus> = {};
    sessionAttendance.forEach((a) => {
      attendanceMap[a.student_id] = a.status;
    });
    setLocalAttendance(attendanceMap);
  }, [sessionAttendance]);

  // Notify parent of attendance changes
  useEffect(() => {
    if (onAttendanceChange) {
      onAttendanceChange(sessionAttendance);
    }
  }, [sessionAttendance, onAttendanceChange]);

  const handleStatusChange = async (studentId: string, status: AttendanceStatus) => {
    if (disabled) return;

    // Optimistic update
    setLocalAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));

    try {
      await markAttendance(sessionId, studentId, status);
    } catch (error) {
      // Revert on error
      const record = sessionAttendance.find((a) => a.student_id === studentId);
      setLocalAttendance((prev) => ({
        ...prev,
        [studentId]: record?.status || 'present',
      }));
    }
  };

  const handleMarkAllPresent = async () => {
    if (disabled) return;

    setIsSaving(true);
    try {
      // Optimistic update
      const newAttendance: Record<string, AttendanceStatus> = {};
      students.forEach((s) => {
        newAttendance[s.id] = 'present';
      });
      setLocalAttendance(newAttendance);

      await markAllPresent(sessionId, students);
    } catch (error) {
      console.error('Failed to mark all present:', error);
      // Refresh to get actual state
      await fetchAttendanceForSession(sessionId);
    } finally {
      setIsSaving(false);
    }
  };

  const getStudentStatus = (studentId: string): AttendanceStatus | null => {
    return localAttendance[studentId] || null;
  };

  const getAttendanceSummary = () => {
    const summary = {
      present: 0,
      absent: 0,
      tardy: 0,
      excused: 0,
      unmarked: 0,
    };

    students.forEach((s) => {
      const status = getStudentStatus(s.id);
      if (status) {
        summary[status]++;
      } else {
        summary.unmarked++;
      }
    });

    return summary;
  };

  const summary = getAttendanceSummary();
  const allMarked = summary.unmarked === 0;

  if (isLoading && sessionAttendance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5" />
            Session Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5" />
            Session Attendance
          </CardTitle>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllPresent}
            disabled={disabled || isSaving}
            className="gap-1"
          >
            <Check className="w-4 h-4" />
            All Present
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Attendance summary */}
        {allMarked && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <Check className="w-4 h-4" />
              {summary.present} Present
            </span>
            {summary.absent > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <X className="w-4 h-4" />
                {summary.absent} Absent
              </span>
            )}
            {summary.tardy > 0 && (
              <span className="flex items-center gap-1 text-yellow-600">
                <Clock className="w-4 h-4" />
                {summary.tardy} Tardy
              </span>
            )}
            {summary.excused > 0 && (
              <span className="flex items-center gap-1 text-blue-600">
                <FileCheck className="w-4 h-4" />
                {summary.excused} Excused
              </span>
            )}
          </div>
        )}

        {/* Student list */}
        <div className="space-y-2">
          {students.map((student, index) => {
            const status = getStudentStatus(student.id);
            return (
              <div
                key={student.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-colors
                  ${status ? 'bg-gray-50' : 'bg-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      text-sm font-bold
                      ${STUDENT_COLORS[index % STUDENT_COLORS.length]}
                    `}
                  >
                    {getInitials(student.name)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    {status && (
                      <p className={`text-xs ${getAttendanceStatusColor(status)}`}>
                        {getAttendanceStatusIcon(status)} {getAttendanceStatusLabel(status)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {STATUS_BUTTONS.map((btn) => {
                    const isSelected = status === btn.status;
                    return (
                      <button
                        key={btn.status}
                        onClick={() => handleStatusChange(student.id, btn.status)}
                        disabled={disabled}
                        className={`
                          w-9 h-9 rounded-lg border-2 flex items-center justify-center
                          text-sm font-bold transition-all
                          ${isSelected ? btn.color : `bg-white text-gray-400 border-gray-200 ${btn.hoverColor}`}
                          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        title={getAttendanceStatusLabel(btn.status)}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Prompt to mark attendance */}
        {!allMarked && (
          <p className="text-sm text-amber-600 text-center">
            {summary.unmarked} student{summary.unmarked > 1 ? 's' : ''} not yet marked
          </p>
        )}
      </CardContent>
    </Card>
  );
}
