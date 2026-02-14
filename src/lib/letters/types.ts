export type LetterType = 'assignment' | 'exit' | 'intensification' | 'progress_report';

export interface LetterData {
  type: LetterType;
  studentName: string;
  studentGrade: number;
  schoolName: string;
  curriculum: string;
  curriculumLabel: string;
  tier: number;
  interventionistName: string;
  interventionistContact: string;
  date: string;
  // Assignment-specific
  schedule?: string;
  // Exit-specific
  startScore?: number;
  endScore?: number;
  growth?: number;
  interventionDuration?: string;
  // Progress report
  sessionsAttended?: number;
  totalSessions?: number;
  attendancePercentage?: number;
  pmScores?: Array<{ date: string; score: number }>;
  trend?: 'improving' | 'stable' | 'declining';
  goal?: number;
  currentScore?: number;
  comments?: string;
}
