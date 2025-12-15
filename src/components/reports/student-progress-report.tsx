'use client';

import { useState, useMemo, useEffect } from 'react';
import { Download, TrendingUp, User } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Select } from '@/components/ui';
import { Student, ProgressMonitoring, SessionWithGroup, ObservedError } from '@/lib/supabase/types';
import { convertToCSV, downloadCSV, generateTimestampedFilename, formatCSVDate, formatReportDate } from '@/lib/export-utils';

interface StudentProgressReportProps {
  students: Student[];
  progressData: ProgressMonitoring[];
  sessions: SessionWithGroup[];
}

export function StudentProgressReport({
  students,
  progressData,
  sessions,
}: StudentProgressReportProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Auto-select first student if available
  useEffect(() => {
    if (students.length > 0 && selectedStudentIds.length === 0) {
      setSelectedStudentIds([students[0].id]);
    }
  }, [students, selectedStudentIds.length]);

  // Filter data for selected students
  const filteredData = useMemo(() => {
    if (selectedStudentIds.length === 0) {
      return [];
    }

    return selectedStudentIds.map((studentId) => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return null;

      // Get progress monitoring data
      const studentProgress = progressData
        .filter((p) => p.student_id === studentId)
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate OTR participation (from sessions)
      const groupSessions = sessions.filter(
        (s) => s.group_id === student.group_id && s.status === 'completed'
      );
      const totalOTRs = groupSessions.reduce(
        (sum, s) => sum + (s.actual_otr_estimate || 0),
        0
      );
      const avgOTRsPerSession =
        groupSessions.length > 0
          ? Math.round(totalOTRs / groupSessions.length)
          : 0;

      // Get common errors from sessions
      const allErrors: ObservedError[] = [];
      groupSessions.forEach((session) => {
        if (session.errors_observed) {
          allErrors.push(...session.errors_observed);
        }
        if (session.unexpected_errors) {
          allErrors.push(...session.unexpected_errors);
        }
      });

      // Count error patterns
      const errorCounts = new Map<string, number>();
      allErrors.forEach((error) => {
        const count = errorCounts.get(error.error_pattern) || 0;
        errorCounts.set(error.error_pattern, count + 1);
      });

      // Get top 5 errors
      const commonErrors = Array.from(errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pattern, count]) => ({ pattern, count }));

      // Calculate progress stats
      const currentScore = studentProgress.length > 0
        ? studentProgress[studentProgress.length - 1].score
        : null;
      const firstScore = studentProgress.length > 0 ? studentProgress[0].score : null;
      const improvement =
        currentScore !== null && firstScore !== null
          ? currentScore - firstScore
          : null;

      return {
        student,
        progress: studentProgress,
        currentScore,
        firstScore,
        improvement,
        dataPointCount: studentProgress.length,
        avgOTRsPerSession,
        totalSessions: groupSessions.length,
        commonErrors,
      };
    }).filter(Boolean);
  }, [selectedStudentIds, students, progressData, sessions]);

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Export to CSV
  const handleExport = () => {
    setIsExporting(true);

    try {
      const exportData: any[] = [];

      filteredData.forEach((data) => {
        if (!data) return;

        // Add progress monitoring data points
        data.progress.forEach((pm) => {
          exportData.push({
            'Student Name': data.student.name,
            'Data Type': 'Progress Monitoring',
            Date: formatCSVDate(pm.date),
            'Measure Type': pm.measure_type,
            Score: pm.score,
            Benchmark: pm.benchmark || 'N/A',
            Goal: pm.goal || 'N/A',
            Notes: pm.notes || '',
          });
        });

        // Add summary row
        exportData.push({
          'Student Name': data.student.name,
          'Data Type': 'Summary',
          Date: 'Overall',
          'Measure Type': 'Total Data Points',
          Score: data.dataPointCount,
          Benchmark: 'Sessions Attended',
          Goal: data.totalSessions,
          Notes: `Improvement: ${data.improvement || 'N/A'}, Avg OTRs: ${data.avgOTRsPerSession}`,
        });

        // Add common errors
        data.commonErrors.forEach((error, idx) => {
          exportData.push({
            'Student Name': data.student.name,
            'Data Type': 'Common Error',
            Date: `Error ${idx + 1}`,
            'Measure Type': error.pattern,
            Score: error.count,
            Benchmark: 'Frequency',
            Goal: '',
            Notes: '',
          });
        });
      });

      const csv = convertToCSV(exportData);
      const filename = generateTimestampedFilename('student-progress-report');
      downloadCSV(csv, filename);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-movement" />
            Select Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.map((student) => (
              <label
                key={student.id}
                className="flex items-center gap-2 p-3 bg-surface/50 rounded-lg cursor-pointer hover:bg-surface border border-text-muted/10"
              >
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-text-primary">{student.name}</span>
              </label>
            ))}
          </div>
          {students.length === 0 && (
            <p className="text-center text-text-muted py-4">
              No students available. Please select a group first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Report Content */}
      {filteredData.length > 0 && (
        <>
          {/* Export Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              isLoading={isExporting}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Student Reports */}
          {filteredData.map((data) => {
            if (!data) return null;

            return (
              <Card key={data.student.id}>
                <CardHeader>
                  <CardTitle>{data.student.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-text-muted mb-1">Current Score</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {data.currentScore !== null ? data.currentScore : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted mb-1">Improvement</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {data.improvement !== null ? (
                            <span className={data.improvement >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {data.improvement >= 0 ? '+' : ''}
                              {data.improvement}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted mb-1">Sessions</p>
                        <p className="text-2xl font-bold text-text-primary">{data.totalSessions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted mb-1">Avg OTRs</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {data.avgOTRsPerSession}
                        </p>
                      </div>
                    </div>

                    {/* Progress Monitoring Scores */}
                    {data.progress.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-movement" />
                          Progress Monitoring Scores
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-text-muted/20">
                                <th className="text-left py-2 px-2 font-medium text-text-muted">Date</th>
                                <th className="text-left py-2 px-2 font-medium text-text-muted">Measure</th>
                                <th className="text-center py-2 px-2 font-medium text-text-muted">Score</th>
                                <th className="text-center py-2 px-2 font-medium text-text-muted">Goal</th>
                                <th className="text-left py-2 px-2 font-medium text-text-muted">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.progress.map((pm) => (
                                <tr key={pm.id} className="border-b border-text-muted/10">
                                  <td className="py-2 px-2 text-text-primary">
                                    {formatReportDate(pm.date)}
                                  </td>
                                  <td className="py-2 px-2 text-text-primary">{pm.measure_type}</td>
                                  <td className="py-2 px-2 text-center font-semibold text-text-primary">
                                    {pm.score}
                                  </td>
                                  <td className="py-2 px-2 text-center text-text-muted">
                                    {pm.goal || '-'}
                                  </td>
                                  <td className="py-2 px-2 text-text-muted text-xs">
                                    {pm.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Common Errors */}
                    {data.commonErrors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-3">
                          Most Common Errors
                        </h4>
                        <div className="space-y-2">
                          {data.commonErrors.map((error, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-surface/50 rounded-lg"
                            >
                              <span className="text-sm text-text-primary">{error.pattern}</span>
                              <span className="text-sm font-semibold text-text-muted">
                                {error.count}x
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.progress.length === 0 && data.commonErrors.length === 0 && (
                      <p className="text-center text-text-muted py-8">
                        No progress data available for this student yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}

      {filteredData.length === 0 && students.length > 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-text-muted">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Students Selected</p>
              <p className="text-sm">Select one or more students above to view their progress.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
