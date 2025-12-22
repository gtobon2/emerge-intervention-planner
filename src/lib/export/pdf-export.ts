/**
 * PDF Export Utility
 *
 * Generates PDF reports for sessions, students, groups, and cross-group analysis.
 * Uses jsPDF with autoTable plugin for professional-looking tables.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Session, Student, Group, ProgressMonitoring } from '@/lib/supabase/types';
import type { PatternAnalysisResult } from '@/lib/analytics';
import { getCurriculumLabel, getTierLabel } from '@/lib/supabase/types';

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
