'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Student } from '@/lib/supabase/types';

/**
 * Get initials from student name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Rotating color palette for student circles
 */
const STUDENT_COLORS = [
  'bg-movement text-white',
  'bg-emerald-500 text-white',
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-amber-500 text-white',
];

interface StudentOTRPanelProps {
  /** List of students in the session */
  students: Student[];
  /** OTR counts per student (studentId -> count) */
  studentOTRs: Record<string, number>;
  /** Target OTR count for the session */
  targetOTR: number;
  /** Callback when a student OTR is incremented */
  onStudentOTR: (studentId: string) => void;
}

/**
 * StudentOTRPanel - Per-student OTR tracking with visual circles
 *
 * Displays student circles that can be tapped/clicked to increment
 * individual OTR counts. Shows total OTRs and progress toward target.
 */
export function StudentOTRPanel({
  students,
  studentOTRs,
  targetOTR,
  onStudentOTR,
}: StudentOTRPanelProps) {
  const totalOTRs = Object.values(studentOTRs).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-700">
          Students in Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 justify-center">
          {students.map((student, index) => (
            <button
              key={student.id}
              onClick={() => onStudentOTR(student.id)}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                hover:bg-gray-50 active:scale-95 min-w-[70px]
              `}
              title={`${student.name} - Click to add OTR`}
            >
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  text-lg font-bold shadow-md transition-transform
                  hover:scale-110 cursor-pointer
                  ${STUDENT_COLORS[index % STUDENT_COLORS.length]}
                `}
              >
                {getInitials(student.name)}
              </div>
              <span className="text-xs text-gray-600 font-medium truncate max-w-[70px]">
                {student.name.split(' ')[0]}
              </span>
              <span className="text-xs font-bold text-movement">
                {studentOTRs[student.id] || 0} OTRs
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-sm text-gray-500">Total OTRs</p>
          <p className="text-3xl font-bold text-movement">{totalOTRs}</p>
          <p className="text-xs text-gray-400">Target: {targetOTR}</p>
        </div>
      </CardContent>
    </Card>
  );
}
