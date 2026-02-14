'use client';

import { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Users,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth';
import { db } from '@/lib/local-db';

function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [
    headers.join(','),
    ...rows.map(r =>
      r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminExportPage() {
  const { isAdmin, userRole } = useAuthStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  if (!isAdmin()) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-text-primary mb-2">Access Denied</h2>
            <p className="text-text-muted">You must be an admin to access this page.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleExportStudentRoster = async () => {
    setLoading('students');
    try {
      const students = await db.students.toArray();
      const groups = await db.groups.toArray();

      const groupMap = new Map(groups.map(g => [g.id, g.name]));

      const rows = students.map(s => [
        s.name,
        String(s.group_id),
        groupMap.get(s.group_id as number) || 'Unassigned',
      ]);

      downloadCSV(
        ['Student Name', 'Grade', 'Group Name'],
        rows,
        `student-roster-${new Date().toISOString().split('T')[0]}.csv`
      );
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleExportSessionLog = async () => {
    setLoading('sessions');
    try {
      let sessions = await db.sessions.toArray();
      const groups = await db.groups.toArray();
      const groupMap = new Map(groups.map(g => [g.id, g]));

      if (startDate) {
        sessions = sessions.filter(s => s.date >= startDate);
      }
      if (endDate) {
        sessions = sessions.filter(s => s.date <= endDate);
      }

      const rows = sessions.map(s => {
        const group = groupMap.get(s.group_id);
        return [
          s.date,
          group?.name || 'Unknown',
          s.status,
          JSON.stringify(s.curriculum_position || ''),
          s.mastery_demonstrated || '',
        ];
      });

      downloadCSV(
        ['Date', 'Group Name', 'Status', 'Curriculum Position', 'Mastery'],
        rows,
        `session-log-${new Date().toISOString().split('T')[0]}.csv`
      );
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleExportPMData = async () => {
    setLoading('pm');
    try {
      let pmRecords = await db.progressMonitoring.toArray();
      const students = await db.students.toArray();
      const groups = await db.groups.toArray();

      const studentMap = new Map(students.map(s => [s.id, s]));
      const groupMap = new Map(groups.map(g => [g.id, g.name]));

      if (startDate) {
        pmRecords = pmRecords.filter(p => p.date >= startDate);
      }
      if (endDate) {
        pmRecords = pmRecords.filter(p => p.date <= endDate);
      }

      const rows = pmRecords.map(p => {
        const student = studentMap.get(p.student_id as number);
        const groupName = student ? (groupMap.get(student.group_id) || '') : '';
        return [
          student?.name || 'Unknown',
          groupName,
          p.date,
          String(p.score),
          String(p.goal ?? ''),
          String(p.benchmark ?? ''),
        ];
      });

      downloadCSV(
        ['Student Name', 'Group Name', 'Date', 'Score', 'Goal', 'Benchmark'],
        rows,
        `pm-data-${new Date().toISOString().split('T')[0]}.csv`
      );
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleExportAttendance = async () => {
    setLoading('attendance');
    try {
      let sessions = await db.sessions.toArray();
      const students = await db.students.toArray();
      const groups = await db.groups.toArray();

      const groupMap = new Map(groups.map(g => [g.id, g.name]));

      if (startDate) {
        sessions = sessions.filter(s => s.date >= startDate);
      }
      if (endDate) {
        sessions = sessions.filter(s => s.date <= endDate);
      }

      // Count sessions per group, then calculate per-student attendance
      const groupSessionCounts = new Map<number, number>();
      sessions
        .filter(s => s.status === 'completed')
        .forEach(s => {
          groupSessionCounts.set(s.group_id, (groupSessionCounts.get(s.group_id) || 0) + 1);
        });

      const rows = students.map(s => {
        const groupId = s.group_id as number;
        const totalSessions = groupSessionCounts.get(groupId) || 0;
        return [
          s.name,
          groupMap.get(groupId) || 'Unassigned',
          String(totalSessions),
        ];
      });

      downloadCSV(
        ['Student Name', 'Group Name', 'Completed Sessions'],
        rows,
        `attendance-summary-${new Date().toISOString().split('T')[0]}.csv`
      );
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(null);
    }
  };

  const exportCards = [
    {
      title: 'Student Roster',
      description: 'All students with name, grade, and group assignment.',
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
      onClick: handleExportStudentRoster,
      key: 'students',
    },
    {
      title: 'Session Log',
      description: 'All sessions with date, group, status, curriculum position, and mastery.',
      icon: Calendar,
      color: 'text-purple-600 bg-purple-100',
      onClick: handleExportSessionLog,
      key: 'sessions',
    },
    {
      title: 'Progress Monitoring Data',
      description: 'All PM records with student, group, date, score, goal, and benchmark.',
      icon: BarChart3,
      color: 'text-emerald-600 bg-emerald-100',
      onClick: handleExportPMData,
      key: 'pm',
    },
    {
      title: 'Attendance Summary',
      description: 'Per-student completed session counts by group.',
      icon: FileSpreadsheet,
      color: 'text-amber-600 bg-amber-100',
      onClick: handleExportAttendance,
      key: 'attendance',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Download className="w-7 h-7 text-movement" />
            Data Export
          </h1>
          <p className="text-text-muted mt-1">
            Export intervention data as CSV files for reporting and analysis.
          </p>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Date Range Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-muted mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary"
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="min-h-[42px]"
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-text-muted mt-2">
              Date filter applies to Session Log, PM Data, and Attendance exports.
            </p>
          </CardContent>
        </Card>

        {/* Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportCards.map(card => (
            <Card key={card.key} className="hover:shadow-md transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{card.title}</h3>
                    <p className="text-sm text-text-muted mt-1 mb-4">{card.description}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={card.onClick}
                      isLoading={loading === card.key}
                      disabled={loading !== null}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
