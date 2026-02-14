/**
 * PDF Export Utility
 *
 * Generates PDF reports for sessions, students, groups, and cross-group analysis.
 * Uses jsPDF with autoTable plugin for professional-looking tables.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Session, SessionWithGroup, Student, Group, ProgressMonitoring } from '@/lib/supabase/types';
import type { PatternAnalysisResult } from '@/lib/analytics';
import { getCurriculumLabel, getTierLabel } from '@/lib/supabase/types';

const WEEKDAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const WEEKDAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday',
};

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: { finalY: number };
  }
}

// PDF theme colors
const COLORS = {
  primary: [236, 72, 153] as [number, number, number], // pink-500
  secondary: [59, 130, 246] as [number, number, number], // blue-500
  success: [16, 185, 129] as [number, number, number], // emerald-500
  warning: [245, 158, 11] as [number, number, number], // amber-500
  danger: [239, 68, 68] as [number, number, number], // red-500
  text: [31, 41, 55] as [number, number, number], // gray-800
  muted: [107, 114, 128] as [number, number, number], // gray-500
  light: [249, 250, 251] as [number, number, number], // gray-50
};

interface ExportOptions {
  title: string;
  subtitle?: string;
  date?: string;
  fileName: string;
}

/**
 * Add header to PDF
 */
function addHeader(doc: jsPDF, options: ExportOptions) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.primary);
  doc.text(options.title, 14, 20);

  // Subtitle
  if (options.subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.muted);
    doc.text(options.subtitle, 14, 28);
  }

  // Date
  const dateStr = options.date || new Date().toLocaleDateString();
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Generated: ${dateStr}`, pageWidth - 14, 20, { align: 'right' });

  // Horizontal line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, 32, pageWidth - 14, 32);

  return 40; // Return Y position after header
}

/**
 * Add footer with page numbers
 */
function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`EMERGE Intervention Planner`, 14, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }
}

/**
 * Export Session Summary Report to PDF
 */
export function exportSessionReportToPDF(
  sessions: Session[],
  options: Partial<ExportOptions> = {}
) {
  const doc = new jsPDF();
  const exportOptions: ExportOptions = {
    title: 'Session Summary Report',
    subtitle: `${sessions.length} sessions`,
    fileName: 'session-report',
    ...options,
  };

  let yPos = addHeader(doc, exportOptions);

  // Summary stats
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalOTRs = completedSessions.reduce((sum, s) => sum + (s.actual_otr_estimate || 0), 0);
  const avgOTRs = completedSessions.length > 0 ? Math.round(totalOTRs / completedSessions.length) : 0;

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  doc.text('Summary', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Total Sessions: ${sessions.length}`, 14, yPos);
  doc.text(`Completed: ${completedSessions.length}`, 80, yPos);
  doc.text(`Average OTRs: ${avgOTRs}`, 140, yPos);
  yPos += 12;

  // Sessions table
  const tableData = sessions.map(session => [
    session.date,
    session.status,
    session.actual_otr_estimate?.toString() || '-',
    session.errors_observed?.length?.toString() || '0',
    session.exit_ticket_correct && session.exit_ticket_total
      ? `${session.exit_ticket_correct}/${session.exit_ticket_total}`
      : '-',
    session.pacing?.replace('_', ' ') || '-',
    session.mastery_demonstrated || '-',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Status', 'OTRs', 'Errors', 'Exit Ticket', 'Pacing', 'Mastery']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLORS.light,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  addFooter(doc);
  doc.save(`${exportOptions.fileName}.pdf`);
}

/**
 * Export Student Progress Report to PDF
 */
export function exportStudentReportToPDF(
  students: Student[],
  progressData: ProgressMonitoring[],
  sessions: Session[],
  options: Partial<ExportOptions> = {}
) {
  const doc = new jsPDF();
  const exportOptions: ExportOptions = {
    title: 'Student Progress Report',
    subtitle: `${students.length} students`,
    fileName: 'student-progress-report',
    ...options,
  };

  let yPos = addHeader(doc, exportOptions);

  // Students table with progress info
  const tableData = students.map(student => {
    const studentProgress = progressData.filter(p => p.student_id === student.id);
    const latestScore = studentProgress.length > 0
      ? studentProgress[studentProgress.length - 1].score
      : null;
    const goal = studentProgress.length > 0 ? studentProgress[0].goal : null;

    // Calculate trend
    let trend = '-';
    if (studentProgress.length >= 2) {
      const firstHalf = studentProgress.slice(0, Math.floor(studentProgress.length / 2));
      const secondHalf = studentProgress.slice(Math.floor(studentProgress.length / 2));
      const firstAvg = firstHalf.reduce((sum, p) => sum + p.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, p) => sum + p.score, 0) / secondHalf.length;
      if (secondAvg > firstAvg + 2) trend = 'Improving';
      else if (secondAvg < firstAvg - 2) trend = 'Declining';
      else trend = 'Stable';
    }

    return [
      student.name,
      studentProgress.length.toString(),
      latestScore?.toString() || '-',
      goal?.toString() || '-',
      trend,
      student.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Student', 'Data Points', 'Latest Score', 'Goal', 'Trend', 'Notes']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.secondary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLORS.light,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      5: { cellWidth: 50 },
    },
  });

  addFooter(doc);
  doc.save(`${exportOptions.fileName}.pdf`);
}

/**
 * Export Group Performance Report to PDF
 */
export function exportGroupReportToPDF(
  groups: Group[],
  students: Student[],
  sessions: Session[],
  progressData: ProgressMonitoring[],
  options: Partial<ExportOptions> = {}
) {
  const doc = new jsPDF();
  const exportOptions: ExportOptions = {
    title: 'Group Performance Report',
    subtitle: `${groups.length} groups`,
    fileName: 'group-performance-report',
    ...options,
  };

  let yPos = addHeader(doc, exportOptions);

  groups.forEach((group, index) => {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    const groupSessions = sessions.filter(s => s.group_id === group.id && s.status === 'completed');
    const groupStudents = students.filter(s => s.group_id === group.id);
    const totalOTRs = groupSessions.reduce((sum, s) => sum + (s.actual_otr_estimate || 0), 0);
    const avgOTRs = groupSessions.length > 0 ? Math.round(totalOTRs / groupSessions.length) : 0;

    // Group header
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.text(group.name, 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `${getCurriculumLabel(group.curriculum)} | ${getTierLabel(group.tier)} | Grade ${group.grade}`,
      14,
      yPos
    );
    yPos += 8;

    // Group stats
    const statsData = [
      ['Students', groupStudents.length.toString()],
      ['Sessions', groupSessions.length.toString()],
      ['Avg OTRs', avgOTRs.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      body: statsData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 },
      },
    });

    yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 30;

    // Students in group
    if (groupStudents.length > 0) {
      const studentTableData = groupStudents.map(student => [
        student.name,
        student.notes || '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Student Name', 'Notes']],
        body: studentTableData,
        theme: 'striped',
        headStyles: {
          fillColor: COLORS.secondary,
          textColor: [255, 255, 255],
          fontSize: 9,
        },
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
      });

      yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 30;
    }
  });

  addFooter(doc);
  doc.save(`${exportOptions.fileName}.pdf`);
}

/**
 * Export Cross-Group Pattern Analysis to PDF
 */
export function exportPatternAnalysisToPDF(
  analysis: PatternAnalysisResult,
  options: Partial<ExportOptions> = {}
) {
  const doc = new jsPDF();
  const exportOptions: ExportOptions = {
    title: 'Cross-Group Pattern Analysis',
    subtitle: 'Error patterns and intervention recommendations',
    fileName: 'pattern-analysis-report',
    ...options,
  };

  let yPos = addHeader(doc, exportOptions);

  // Summary stats
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  doc.text('Summary', 14, yPos);
  yPos += 8;

  const summaryData = [
    ['Total Groups', analysis.summary.totalGroups.toString()],
    ['Total Students', analysis.summary.totalStudents.toString()],
    ['Total Errors', analysis.summary.totalErrors.toString()],
    ['Avg Effectiveness', `${analysis.summary.avgEffectiveness}%`],
    ['Sessions Analyzed', analysis.summary.analyzedSessions.toString()],
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
    },
  });

  yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 40;

  // Recommendations
  if (analysis.recommendations.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.text('Recommendations', 14, yPos);
    yPos += 8;

    analysis.recommendations.forEach((rec, i) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.text);
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, 180);
      doc.text(lines, 14, yPos);
      yPos += lines.length * 5 + 3;
    });

    yPos += 10;
  }

  // Top error patterns
  if (analysis.topErrorPatterns.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.text('Top Error Patterns', 14, yPos);
    yPos += 8;

    const patternData = analysis.topErrorPatterns.map(p => [
      p.errorPattern.substring(0, 40) + (p.errorPattern.length > 40 ? '...' : ''),
      getCurriculumLabel(p.curriculum),
      p.occurrenceCount.toString(),
      `${p.effectivenessRate}%`,
      p.trend,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Error Pattern', 'Curriculum', 'Occurrences', 'Effectiveness', 'Trend']],
      body: patternData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.warning,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
    });

    yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 50;
  }

  // Cross-group patterns
  if (analysis.crossGroupPatterns.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.text('Cross-Group Patterns', 14, yPos);
    yPos += 8;

    const crossData = analysis.crossGroupPatterns.map(p => [
      p.pattern.substring(0, 35) + (p.pattern.length > 35 ? '...' : ''),
      p.groups.length.toString(),
      p.totalOccurrences.toString(),
      p.suggestedIntervention.substring(0, 50) + (p.suggestedIntervention.length > 50 ? '...' : ''),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Pattern', 'Groups', 'Total', 'Suggested Intervention']],
      body: crossData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.danger,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
    });
  }

  addFooter(doc);
  doc.save(`${exportOptions.fileName}.pdf`);
}

/**
 * Export weekly schedule to PDF
 */
export function exportScheduleToPDF(
  sessions: SessionWithGroup[],
  weekLabel: string,
  options: Partial<ExportOptions> = {}
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const exportOptions: ExportOptions = {
    title: 'Weekly Schedule',
    subtitle: weekLabel,
    fileName: `schedule-${weekLabel.replace(/\s+/g, '-').toLowerCase()}`,
    ...options,
  };

  let yPos = addHeader(doc, exportOptions);

  // Group sessions by day of week
  const sessionsByDay = new Map<string, SessionWithGroup[]>();
  WEEKDAY_ORDER.forEach(day => sessionsByDay.set(day, []));

  sessions.forEach(session => {
    const sessionDate = new Date(session.date + 'T00:00:00');
    const dayIndex = sessionDate.getDay(); // 0=Sun, 1=Mon...
    const dayName = WEEKDAY_ORDER[dayIndex - 1];
    if (dayName) {
      sessionsByDay.get(dayName)!.push(session);
    }
  });

  // Sort each day's sessions by time
  sessionsByDay.forEach(daySessions => {
    daySessions.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  });

  // Collect all unique times
  const allTimes = new Set<string>();
  sessions.forEach(s => { if (s.time) allTimes.add(s.time); });
  const sortedTimes = Array.from(allTimes).sort();

  // Build grid: rows = time slots, columns = days
  const tableBody: string[][] = [];
  sortedTimes.forEach(time => {
    const row = [formatTime12(time)];
    WEEKDAY_ORDER.forEach(day => {
      const daySessions = sessionsByDay.get(day) || [];
      const atTime = daySessions.filter(s => s.time === time);
      row.push(atTime.map(s => {
        const status = s.status === 'cancelled' ? ' [X]' : '';
        return `${s.group.name}${status}`;
      }).join('\n') || '');
    });
    tableBody.push(row);
  });

  if (tableBody.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.muted);
    doc.text('No sessions scheduled for this week.', 14, yPos);
  } else {
    autoTable(doc, {
      startY: yPos,
      head: [['Time', ...WEEKDAY_ORDER.map(d => WEEKDAY_LABELS[d])]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'top',
      },
      columnStyles: {
        0: { cellWidth: 22, fontStyle: 'bold' },
      },
    });
  }

  addFooter(doc);
  doc.save(`${exportOptions.fileName}.pdf`);
}

/**
 * Export schedule to CSV
 */
export function exportScheduleToCSV(
  sessions: SessionWithGroup[],
  weekLabel: string
) {
  const headers = ['Date', 'Day', 'Time', 'Group', 'Curriculum', 'Grade', 'Tier', 'Status'];

  const sorted = [...sessions].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.time || '').localeCompare(b.time || '');
  });

  const rows = sorted.map(s => {
    const sessionDate = new Date(s.date + 'T00:00:00');
    const dayName = WEEKDAY_ORDER[sessionDate.getDay() - 1] || '';
    return [
      s.date,
      WEEKDAY_LABELS[dayName] || '',
      s.time ? formatTime12(s.time) : '',
      s.group.name,
      getCurriculumLabel(s.group.curriculum),
      s.group.grade.toString(),
      getTierLabel(s.group.tier),
      s.status,
    ];
  });

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `schedule-${weekLabel.replace(/\s+/g, '-').toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export Session Plan to PDF
 */
export function exportSessionPlanToPDF(
  session: {
    date: string;
    time: string | null;
    status: string;
    curriculum_position: any;
    planned_otr_target: number | null;
    planned_response_formats: string[] | null;
    planned_practice_items: any[] | null;
    anticipated_errors: any[] | null;
    notes: string | null;
    mastery_demonstrated: string | null;
  },
  group: {
    name: string;
    curriculum: string;
    tier: number;
    grade: number;
  },
  students: Array<{ name: string }>
) {
  const doc = new jsPDF();
  const sessionDate = new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let yPos = addHeader(doc, {
    title: group.name,
    subtitle: `Session Plan - ${sessionDate}`,
    fileName: `session-plan-${group.name.replace(/\s+/g, '-').toLowerCase()}-${session.date}`,
  });

  // Group info table
  autoTable(doc, {
    startY: yPos,
    head: [['Curriculum', 'Tier', 'Grade', 'Status']],
    body: [[
      getCurriculumLabel(group.curriculum as any),
      getTierLabel(group.tier as any),
      `Grade ${group.grade}`,
      session.status,
    ]],
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 30;

  // Students list
  if (students.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.text('Students', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Student Name']],
      body: students.map((s, i) => [(i + 1).toString(), s.name]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 30;
  }

  // Session plan section
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  doc.text('Session Plan', 14, yPos);
  yPos += 6;

  const planRows: string[][] = [];
  planRows.push(['OTR Target', (session.planned_otr_target || 40).toString()]);

  if (session.planned_response_formats && session.planned_response_formats.length > 0) {
    planRows.push(['Response Formats', session.planned_response_formats.join(', ')]);
  }

  if (session.time) {
    planRows.push(['Time', session.time]);
  }

  autoTable(doc, {
    startY: yPos,
    body: planRows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
  });

  yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 30;

  // Practice items
  if (session.planned_practice_items && session.planned_practice_items.length > 0) {
    if (yPos > 240) { doc.addPage(); yPos = 20; }

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.text('Practice Items', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['Type', 'Item']],
      body: session.planned_practice_items.map((item: any) => [
        item.type || '-',
        item.item || '-',
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.success,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 30;
  }

  // Anticipated errors
  if (session.anticipated_errors && session.anticipated_errors.length > 0) {
    if (yPos > 240) { doc.addPage(); yPos = 20; }

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.text('Anticipated Errors', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['Error Pattern', 'Correction Protocol']],
      body: session.anticipated_errors.map((e: any) => [
        e.error_pattern || '-',
        e.correction_protocol || '-',
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.warning,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 30;
  }

  // Notes
  if (session.notes) {
    if (yPos > 260) { doc.addPage(); yPos = 20; }

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.text('Notes', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.muted);
    const noteLines = doc.splitTextToSize(session.notes, 180);
    doc.text(noteLines, 14, yPos);
  }

  addFooter(doc);
  doc.save(`session-plan-${group.name.replace(/\s+/g, '-').toLowerCase()}-${session.date}.pdf`);
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}
