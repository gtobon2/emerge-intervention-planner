'use client';

import { useState, useMemo } from 'react';
import { Download, Calendar, FileText } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';
import { SessionWithGroup } from '@/lib/supabase/types';
import { formatCurriculumPosition } from '@/lib/supabase/types';
import { convertToCSV, downloadCSV, generateTimestampedFilename, formatCSVDate, formatReportDate } from '@/lib/export-utils';

interface SessionReportProps {
  sessions: SessionWithGroup[];
}

export function SessionReport({ sessions }: SessionReportProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Filter sessions by date range
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    if (startDate) {
      filtered = filtered.filter((s) => s.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((s) => s.date <= endDate);
    }

    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, startDate, endDate]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const completed = filteredSessions.filter((s) => s.status === 'completed');
    const totalSessions = completed.length;

    // Calculate average OTRs
    const sessionsWithOTR = completed.filter((s) => s.actual_otr_estimate);
    const avgOTRs = sessionsWithOTR.length > 0
      ? Math.round(
          sessionsWithOTR.reduce((sum, s) => sum + (s.actual_otr_estimate || 0), 0) /
            sessionsWithOTR.length
        )
      : 0;

    // Calculate total errors observed
    const totalErrors = completed.reduce((sum, s) => {
      const errorsObserved = s.errors_observed?.length || 0;
      const unexpectedErrors = s.unexpected_errors?.length || 0;
      return sum + errorsObserved + unexpectedErrors;
    }, 0);

    // Calculate average exit ticket score
    const sessionsWithExitTicket = completed.filter(
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
      totalSessions,
      avgOTRs,
      totalErrors,
      avgExitTicketScore,
    };
  }, [filteredSessions]);

  // Export to CSV
  const handleExport = () => {
    setIsExporting(true);

    try {
      const exportData = filteredSessions.map((session) => ({
        Date: formatCSVDate(session.date),
        Time: session.time || 'Not scheduled',
        Group: session.group.name,
        Curriculum: session.group.curriculum,
        Tier: session.group.tier,
        Position: formatCurriculumPosition(session.group.curriculum, session.curriculum_position),
        Status: session.status,
        'Planned OTRs': session.planned_otr_target || 'N/A',
        'Actual OTRs': session.actual_otr_estimate || 'N/A',
        Pacing: session.pacing || 'N/A',
        'Exit Ticket': session.exit_ticket_correct && session.exit_ticket_total
          ? `${session.exit_ticket_correct}/${session.exit_ticket_total}`
          : 'N/A',
        'Mastery Level': session.mastery_demonstrated || 'N/A',
        'Errors Observed': (session.errors_observed?.length || 0) + (session.unexpected_errors?.length || 0),
        'PM Score': session.pm_score || 'N/A',
        Notes: session.notes || '',
      }));

      const csv = convertToCSV(exportData);
      const filename = generateTimestampedFilename('session-summary-report');
      downloadCSV(csv, filename);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF (lazy-loads jsPDF on demand)
  const handleExportPDF = async () => {
    setIsExportingPDF(true);

    try {
      const { exportSessionReportToPDF } = await import('@/lib/export');
      // Map SessionWithGroup to Session format for PDF export
      const sessionsForPDF = filteredSessions.map(s => ({
        ...s,
        group_id: s.group.id,
      }));
      exportSessionReportToPDF(sessionsForPDF, {
        subtitle: startDate || endDate
          ? `${startDate || 'Start'} to ${endDate || 'End'}`
          : `${filteredSessions.length} sessions`,
        fileName: generateTimestampedFilename('session-summary-report'),
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-movement" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-text-primary">{stats.totalSessions}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">Avg OTRs/Session</p>
              <p className="text-3xl font-bold text-text-primary">{stats.avgOTRs}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">Total Errors</p>
              <p className="text-3xl font-bold text-text-primary">{stats.totalErrors}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">Avg Exit Ticket</p>
              <p className="text-3xl font-bold text-text-primary">{stats.avgExitTicketScore}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Session Details ({filteredSessions.length})</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleExportPDF}
                disabled={filteredSessions.length === 0 || isExportingPDF}
                isLoading={isExportingPDF}
                variant="secondary"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
              <Button
                onClick={handleExport}
                disabled={filteredSessions.length === 0 || isExporting}
                isLoading={isExporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <p>No sessions found for the selected date range.</p>
              <p className="text-sm mt-2">Adjust your filters to see results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-text-muted/20">
                    <th className="text-left py-3 px-2 font-medium text-text-muted">Date</th>
                    <th className="text-left py-3 px-2 font-medium text-text-muted">Group</th>
                    <th className="text-left py-3 px-2 font-medium text-text-muted">Position</th>
                    <th className="text-center py-3 px-2 font-medium text-text-muted">Status</th>
                    <th className="text-center py-3 px-2 font-medium text-text-muted">OTRs</th>
                    <th className="text-center py-3 px-2 font-medium text-text-muted">Errors</th>
                    <th className="text-center py-3 px-2 font-medium text-text-muted">Exit Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => {
                    const errorsCount =
                      (session.errors_observed?.length || 0) +
                      (session.unexpected_errors?.length || 0);
                    const exitTicketScore =
                      session.exit_ticket_correct && session.exit_ticket_total
                        ? `${session.exit_ticket_correct}/${session.exit_ticket_total}`
                        : '-';

                    return (
                      <tr key={session.id} className="border-b border-text-muted/10 hover:bg-surface/50">
                        <td className="py-3 px-2 text-text-primary">
                          {formatReportDate(session.date)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="text-text-primary font-medium">{session.group.name}</div>
                          <div className="text-xs text-text-muted capitalize">
                            {session.group.curriculum.replace('_', ' ')} • Tier {session.group.tier}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-text-primary">
                          {formatCurriculumPosition(
                            session.group.curriculum,
                            session.curriculum_position
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              session.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : session.status === 'planned'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-text-primary">
                          {session.actual_otr_estimate || '-'}
                        </td>
                        <td className="py-3 px-2 text-center text-text-primary">
                          {errorsCount > 0 ? errorsCount : '-'}
                        </td>
                        <td className="py-3 px-2 text-center text-text-primary">
                          {exitTicketScore}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
