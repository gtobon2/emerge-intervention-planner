'use client';

import { useState, useMemo, useEffect } from 'react';
import { Download, Users, TrendingUp } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Select } from '@/components/ui';
import { Group, Student, SessionWithGroup, ProgressMonitoring } from '@/lib/supabase/types';
import { formatCurriculumPosition } from '@/lib/supabase/types';
import { convertToCSV, downloadCSV, generateTimestampedFilename, formatCSVDate } from '@/lib/export-utils';

interface GroupReportProps {
  groups: Group[];
  students: Student[];
  sessions: SessionWithGroup[];
  progressData: ProgressMonitoring[];
}

export function GroupReport({
  groups,
  students,
  sessions,
  progressData,
}: GroupReportProps) {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Auto-select first group if available
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // Calculate group performance data
  const groupData = useMemo(() => {
    if (!selectedGroupId) return null;

    const group = groups.find((g) => g.id === selectedGroupId);
    if (!group) return null;

    // Get students in group
    const groupStudents = students.filter((s) => s.group_id === selectedGroupId);

    // Get sessions for group
    const groupSessions = sessions.filter((s) => s.group_id === selectedGroupId);
    const completedSessions = groupSessions.filter((s) => s.status === 'completed');

    // Calculate session count
    const sessionCount = completedSessions.length;

    // Calculate average attendance (assuming all students should attend)
    const totalPossibleAttendance = sessionCount * groupStudents.length;
    const avgAttendance = totalPossibleAttendance > 0 ? 100 : 0; // Simplified - would need actual attendance data

    // Calculate average OTRs
    const sessionsWithOTR = completedSessions.filter((s) => s.actual_otr_estimate);
    const avgOTRs = sessionsWithOTR.length > 0
      ? Math.round(
          sessionsWithOTR.reduce((sum, s) => sum + (s.actual_otr_estimate || 0), 0) /
            sessionsWithOTR.length
        )
      : 0;

    // Get progress data for group
    const groupProgress = progressData.filter((p) => p.group_id === selectedGroupId);

    // Calculate progress trend
    let progressTrend: 'improving' | 'declining' | 'flat' = 'flat';
    if (groupProgress.length >= 2) {
      const sortedProgress = [...groupProgress].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      const firstHalf = sortedProgress.slice(0, Math.floor(sortedProgress.length / 2));
      const secondHalf = sortedProgress.slice(Math.floor(sortedProgress.length / 2));

      const firstAvg =
        firstHalf.reduce((sum, p) => sum + p.score, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, p) => sum + p.score, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 2) {
        progressTrend = 'improving';
      } else if (secondAvg < firstAvg - 2) {
        progressTrend = 'declining';
      }
    }

    // Student breakdown with individual stats
    const studentBreakdown = groupStudents.map((student) => {
      const studentProgress = groupProgress.filter((p) => p.student_id === student.id);
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
        dataPoints: studentProgress.length,
        currentScore,
        improvement,
      };
    });

    // Average exit ticket score
    const sessionsWithExitTicket = completedSessions.filter(
      (s) => s.exit_ticket_correct !== null && s.exit_ticket_total !== null
    );
    const avgExitTicketScore = sessionsWithExitTicket.length > 0
      ? Math.round(
          (sessionsWithExitTicket.reduce(
            (sum, s) => sum + ((s.exit_ticket_correct || 0) / (s.exit_ticket_total || 1)),
            0
          ) /
            sessionsWithExitTicket.length) *
            100
        )
      : 0;

    return {
      group,
      sessionCount,
      avgAttendance,
      avgOTRs,
      avgExitTicketScore,
      progressTrend,
      studentBreakdown,
      totalStudents: groupStudents.length,
    };
  }, [selectedGroupId, groups, students, sessions, progressData]);

  // Export to CSV
  const handleExport = () => {
    if (!groupData) return;

    setIsExporting(true);

    try {
      // Group overview
      const overviewData = [
        {
          'Report Type': 'Group Overview',
          'Group Name': groupData.group.name,
          Curriculum: groupData.group.curriculum,
          Tier: groupData.group.tier,
          Grade: groupData.group.grade,
          'Current Position': formatCurriculumPosition(
            groupData.group.curriculum,
            groupData.group.current_position
          ),
          'Total Students': groupData.totalStudents,
          'Total Sessions': groupData.sessionCount,
          'Avg OTRs': groupData.avgOTRs,
          'Avg Exit Ticket': `${groupData.avgExitTicketScore}%`,
          'Progress Trend': groupData.progressTrend,
        },
      ];

      // Student breakdown
      const studentData = groupData.studentBreakdown.map((item) => ({
        'Report Type': 'Student Detail',
        'Student Name': item.student.name,
        'Data Points': item.dataPoints,
        'Current Score': item.currentScore !== null ? item.currentScore : 'N/A',
        Improvement: item.improvement !== null ? item.improvement : 'N/A',
        Notes: item.student.notes || '',
      }));

      const exportData = [...overviewData, ...studentData];
      const csv = convertToCSV(exportData);
      const filename = generateTimestampedFilename(
        `group-report-${groupData.group.name.replace(/\s+/g, '-').toLowerCase()}`
      );
      downloadCSV(csv, filename);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Group Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-movement" />
            Select Group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            options={[
              { value: '', label: 'Select a group' },
              ...groups.map((g) => ({
                value: g.id,
                label: `${g.name} - ${g.curriculum} (Tier ${g.tier})`,
              })),
            ]}
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {groupData && (
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

          {/* Group Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Group Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Group Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-text-muted mb-1">Curriculum</p>
                    <p className="text-base font-medium text-text-primary capitalize">
                      {groupData.group.curriculum.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted mb-1">Tier</p>
                    <p className="text-base font-medium text-text-primary">
                      Tier {groupData.group.tier}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted mb-1">Grade</p>
                    <p className="text-base font-medium text-text-primary">
                      Grade {groupData.group.grade}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted mb-1">Current Position</p>
                    <p className="text-base font-medium text-text-primary">
                      {formatCurriculumPosition(
                        groupData.group.curriculum,
                        groupData.group.current_position
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted mb-1">Students</p>
                    <p className="text-base font-medium text-text-primary">
                      {groupData.totalStudents}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted mb-1">Schedule</p>
                    <p className="text-base font-medium text-text-primary">
                      {groupData.group.schedule?.days?.join(', ') || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-text-muted mb-1">Sessions</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {groupData.sessionCount}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-text-muted mb-1">Avg OTRs</p>
                  <p className="text-3xl font-bold text-text-primary">{groupData.avgOTRs}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-text-muted mb-1">Exit Ticket</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {groupData.avgExitTicketScore}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-text-muted mb-1">Progress Trend</p>
                  <p className="text-2xl font-bold text-text-primary capitalize flex items-center justify-center gap-2">
                    {groupData.progressTrend === 'improving' && (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    )}
                    {groupData.progressTrend}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Student Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {groupData.studentBreakdown.length === 0 ? (
                <p className="text-center text-text-muted py-8">
                  No students in this group yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-text-muted/20">
                        <th className="text-left py-3 px-2 font-medium text-text-muted">
                          Student
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-text-muted">
                          Data Points
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-text-muted">
                          Current Score
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-text-muted">
                          Improvement
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-text-muted">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupData.studentBreakdown.map((item) => (
                        <tr
                          key={item.student.id}
                          className="border-b border-text-muted/10 hover:bg-surface/50"
                        >
                          <td className="py-3 px-2 text-text-primary font-medium">
                            {item.student.name}
                          </td>
                          <td className="py-3 px-2 text-center text-text-primary">
                            {item.dataPoints}
                          </td>
                          <td className="py-3 px-2 text-center text-text-primary font-semibold">
                            {item.currentScore !== null ? item.currentScore : '-'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.improvement !== null ? (
                              <span
                                className={`font-semibold ${
                                  item.improvement >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {item.improvement >= 0 ? '+' : ''}
                                {item.improvement}
                              </span>
                            ) : (
                              <span className="text-text-muted">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-text-muted text-xs">
                            {item.student.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!groupData && groups.length > 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-text-muted">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Group Selected</p>
              <p className="text-sm">Select a group above to view performance data.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {groups.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-text-muted">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Groups Available</p>
              <p className="text-sm">Create a group to start viewing reports.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
