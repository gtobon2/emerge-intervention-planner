'use client';

import React, { useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Session, Group, Student } from '@/lib/supabase/types';
import {
  getCurriculumLabel,
  getTierLabel,
  formatCurriculumPosition,
} from '@/lib/supabase/types';
import type { WilsonLessonPlan, LessonBlock } from '@/lib/curriculum/wilson-lesson-elements';
import { WILSON_LESSON_SECTIONS } from '@/lib/curriculum/wilson-lesson-elements';
import type { CaminoLessonPlan, CaminoLessonBlock } from '@/lib/curriculum/camino/camino-lesson-elements';
import { CAMINO_LESSON_SECTIONS } from '@/lib/curriculum/camino/camino-lesson-elements';
import { WilsonLessonPrint } from './WilsonLessonPrint';
import { CaminoLessonPrint } from './CaminoLessonPrint';
import { GenericSessionPrint } from './GenericSessionPrint';
import './print-styles.css';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: { finalY: number };
  }
}

// ============================================
// Types
// ============================================

export interface PrintSessionLessonProps {
  session: Session;
  group: Group;
  students: Student[];
}

// ============================================
// PDF Colors (matching existing pdf-export patterns)
// ============================================

const PDF_COLORS = {
  primary: [236, 72, 153] as [number, number, number],
  secondary: [59, 130, 246] as [number, number, number],
  text: [31, 41, 55] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  light: [249, 250, 251] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  wilson: {
    wordStudy: [37, 99, 235] as [number, number, number],
    spelling: [124, 58, 237] as [number, number, number],
    fluency: [22, 163, 106] as [number, number, number],
  },
  camino: {
    warmup: [217, 119, 6] as [number, number, number],
    phonics: [124, 58, 237] as [number, number, number],
    reading: [37, 99, 235] as [number, number, number],
    writing: [22, 163, 106] as [number, number, number],
  },
};

// ============================================
// PDF Generation Helpers
// ============================================

function formatSessionDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

function addPDFHeader(
  doc: jsPDF,
  group: Group,
  session: Session
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const sessionDate = formatSessionDate(session.date);

  // Group name
  doc.setFontSize(18);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(group.name, 14, 20);

  // Session date
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(`Session Plan - ${sessionDate}`, 14, 28);

  // Time (if set)
  if (session.time) {
    doc.text(`Time: ${formatTime12(session.time)}`, 14, 34);
  }

  // Curriculum / Tier / Grade on right
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.muted);
  const metaLines = [
    getCurriculumLabel(group.curriculum),
    `${getTierLabel(group.tier)} | Grade ${group.grade}`,
    formatCurriculumPosition(group.curriculum, session.curriculum_position),
  ];
  metaLines.forEach((line, i) => {
    doc.text(line, pageWidth - 14, 20 + i * 5, { align: 'right' });
  });

  // Line separator
  const lineY = session.time ? 38 : 33;
  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, lineY, pageWidth - 14, lineY);

  return lineY + 8;
}

function addPDFFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text('EMERGE Intervention Planner - Session Lesson Plan', 14, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

function addStudentRoster(doc: jsPDF, students: Student[], yPos: number): number {
  if (students.length === 0) return yPos;

  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text('Student Roster', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Student Name', 'Grade', 'Notes']],
    body: students.map((s, i) => [
      (i + 1).toString(),
      s.name,
      s.grade_level || '-',
      s.notes || '',
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: PDF_COLORS.secondary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.light,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 60 },
    },
  });

  return (doc as any).lastAutoTable?.finalY + 10 || yPos + 30;
}

function getWilsonBlockColor(block: LessonBlock): [number, number, number] {
  switch (block) {
    case 'word-study': return PDF_COLORS.wilson.wordStudy;
    case 'spelling': return PDF_COLORS.wilson.spelling;
    case 'fluency-comprehension': return PDF_COLORS.wilson.fluency;
    default: return PDF_COLORS.muted;
  }
}

function getWilsonBlockLabel(block: LessonBlock): string {
  switch (block) {
    case 'word-study': return 'Block 1: Word Study';
    case 'spelling': return 'Block 2: Spelling';
    case 'fluency-comprehension': return 'Block 3: Fluency & Comprehension';
    default: return block;
  }
}

function addWilsonLessonPDF(doc: jsPDF, plan: WilsonLessonPlan, yPos: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Lesson info
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text('Wilson Reading System Lesson Plan', 14, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(`Substep ${plan.substep} - ${plan.substepName}   |   Total: ${plan.totalDuration} min`, 14, yPos);
  yPos += 8;

  // Group sections by block
  const blockOrder: LessonBlock[] = ['word-study', 'spelling', 'fluency-comprehension'];
  for (const block of blockOrder) {
    const blockSections = plan.sections.filter(s => {
      const def = WILSON_LESSON_SECTIONS.find(d => d.type === s.component);
      return def?.block === block;
    });

    if (blockSections.length === 0) continue;

    // Check for page break
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // Block header
    const blockColor = getWilsonBlockColor(block);
    const blockDuration = blockSections.reduce((sum, s) => sum + s.duration, 0);

    doc.setFillColor(...blockColor);
    doc.rect(14, yPos - 4, pageWidth - 28, 7, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(getWilsonBlockLabel(block), 16, yPos);
    doc.text(`${blockDuration} min`, pageWidth - 16, yPos, { align: 'right' });
    yPos += 6;

    // Section rows
    for (const section of blockSections) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const def = WILSON_LESSON_SECTIONS.find(d => d.type === section.component);
      const part = def?.part || 0;

      // Section name and duration
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.text);
      doc.text(`Part ${part}: ${section.componentName}`, 18, yPos);
      doc.setTextColor(...PDF_COLORS.muted);
      doc.text(`${section.duration} min`, pageWidth - 16, yPos, { align: 'right' });
      yPos += 4;

      // Elements
      if (section.elements.length > 0) {
        const elemText = section.elements.map(e => e.value).join(', ');
        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.muted);
        const lines = doc.splitTextToSize(`Items: ${elemText}`, pageWidth - 36);
        doc.text(lines, 22, yPos);
        yPos += lines.length * 3.5 + 1;
      }

      // Activities
      if (section.activities.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.muted);
        for (const activity of section.activities) {
          if (yPos > 275) {
            doc.addPage();
            yPos = 20;
          }
          const lines = doc.splitTextToSize(`- ${activity}`, pageWidth - 40);
          doc.text(lines, 24, yPos);
          yPos += lines.length * 3.5 + 0.5;
        }
      }

      // Notes
      if (section.notes && section.notes.trim()) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        const noteLines = doc.splitTextToSize(`Note: ${section.notes}`, pageWidth - 40);
        doc.text(noteLines, 22, yPos);
        yPos += noteLines.length * 3.5 + 1;
      }

      yPos += 2;
    }

    yPos += 3;
  }

  return yPos;
}

function getCaminoBlockColor(block: CaminoLessonBlock): [number, number, number] {
  switch (block) {
    case 'warmup': return PDF_COLORS.camino.warmup;
    case 'phonics': return PDF_COLORS.camino.phonics;
    case 'reading': return PDF_COLORS.camino.reading;
    case 'writing': return PDF_COLORS.camino.writing;
    default: return PDF_COLORS.muted;
  }
}

function getCaminoBlockLabel(block: CaminoLessonBlock): string {
  switch (block) {
    case 'warmup': return 'Calentamiento (Warm-up)';
    case 'phonics': return 'Fonemas y Sonidos (Phonics)';
    case 'reading': return 'Lectura y Palabras (Reading)';
    case 'writing': return 'Escritura y Dictado (Writing)';
    default: return block;
  }
}

function addCaminoLessonPDF(doc: jsPDF, plan: CaminoLessonPlan, yPos: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Lesson info
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text('Plan de Leccion - Camino a la Lectura', 14, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(
    `Unidad ${plan.unit}, Leccion ${plan.lesson} - ${plan.lessonName}   |   Total: ${plan.totalDuration} min`,
    14,
    yPos
  );
  yPos += 8;

  // Group sections by block
  const blockOrder: CaminoLessonBlock[] = ['warmup', 'phonics', 'reading', 'writing'];
  for (const block of blockOrder) {
    const blockSections = plan.sections.filter(s => {
      const def = CAMINO_LESSON_SECTIONS.find(d => d.type === s.component);
      return def?.block === block;
    });

    if (blockSections.length === 0) continue;

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // Block header
    const blockColor = getCaminoBlockColor(block);
    const blockDuration = blockSections.reduce((sum, s) => sum + s.duration, 0);

    doc.setFillColor(...blockColor);
    doc.rect(14, yPos - 4, pageWidth - 28, 7, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(getCaminoBlockLabel(block), 16, yPos);
    doc.text(`${blockDuration} min`, pageWidth - 16, yPos, { align: 'right' });
    yPos += 6;

    // Section rows
    for (const section of blockSections) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const def = CAMINO_LESSON_SECTIONS.find(d => d.type === section.component);
      const part = def?.part || 0;

      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.text);
      doc.text(`Parte ${part}: ${section.componentName}`, 18, yPos);
      doc.setTextColor(...PDF_COLORS.muted);
      doc.text(`${section.duration} min`, pageWidth - 16, yPos, { align: 'right' });
      yPos += 4;

      // Elements
      if (section.elements.length > 0) {
        const elemText = section.elements.map(e => e.value).join(', ');
        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.muted);
        const lines = doc.splitTextToSize(`Elementos: ${elemText}`, pageWidth - 36);
        doc.text(lines, 22, yPos);
        yPos += lines.length * 3.5 + 1;
      }

      // Activities
      if (section.activities.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(...PDF_COLORS.muted);
        for (const activity of section.activities) {
          if (yPos > 275) {
            doc.addPage();
            yPos = 20;
          }
          const lines = doc.splitTextToSize(`- ${activity}`, pageWidth - 40);
          doc.text(lines, 24, yPos);
          yPos += lines.length * 3.5 + 0.5;
        }
      }

      // Notes
      if (section.notes && section.notes.trim()) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        const noteLines = doc.splitTextToSize(`Nota: ${section.notes}`, pageWidth - 40);
        doc.text(noteLines, 22, yPos);
        yPos += noteLines.length * 3.5 + 1;
      }

      yPos += 2;
    }

    yPos += 3;
  }

  return yPos;
}

function addGenericSessionPDF(doc: jsPDF, session: Session, group: Group, yPos: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Curriculum header
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(`${getCurriculumLabel(group.curriculum)} - Session Plan`, 14, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(`Position: ${formatCurriculumPosition(group.curriculum, session.curriculum_position)}`, 14, yPos);
  yPos += 8;

  // OTR Target
  if (session.planned_otr_target) {
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text(`OTR Target: ${session.planned_otr_target}`, 14, yPos);
    yPos += 6;
  }

  // Response Formats
  if (session.planned_response_formats && session.planned_response_formats.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text('Response Formats:', 14, yPos);
    yPos += 4;
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(session.planned_response_formats.join(', '), 18, yPos);
    yPos += 6;
  }

  // Practice Items
  if (session.planned_practice_items && session.planned_practice_items.length > 0) {
    if (yPos > 240) { doc.addPage(); yPos = 20; }

    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text('Practice Items', 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [['Type', 'Item']],
      body: session.planned_practice_items.map(item => [item.type, item.item]),
      theme: 'striped',
      headStyles: {
        fillColor: PDF_COLORS.success,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 25 } },
    });

    yPos = (doc as any).lastAutoTable?.finalY + 8 || yPos + 30;
  }

  // Anticipated Errors
  if (session.anticipated_errors && session.anticipated_errors.length > 0) {
    if (yPos > 240) { doc.addPage(); yPos = 20; }

    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text('Anticipated Errors', 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [['Error Pattern', 'Correction']],
      body: session.anticipated_errors.map(e => [e.error_pattern, e.correction_protocol]),
      theme: 'striped',
      headStyles: {
        fillColor: PDF_COLORS.warning,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    yPos = (doc as any).lastAutoTable?.finalY + 8 || yPos + 30;
  }

  // Session Notes
  if (session.notes && session.notes.trim()) {
    if (yPos > 260) { doc.addPage(); yPos = 20; }

    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text('Session Notes', 14, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.muted);
    const noteLines = doc.splitTextToSize(session.notes, pageWidth - 28);
    doc.text(noteLines, 14, yPos);
    yPos += noteLines.length * 4 + 4;
  }

  // Blank notes area
  if (yPos > 250) { doc.addPage(); yPos = 20; }

  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text('Session Notes (during session)', 14, yPos);
  yPos += 6;

  for (let i = 0; i < 6; i++) {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 8;
  }

  return yPos;
}

// ============================================
// Main Component
// ============================================

export function PrintSessionLesson({ session, group, students }: PrintSessionLessonProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const sessionDate = formatSessionDate(session.date);
  const curriculumLabel = getCurriculumLabel(group.curriculum);
  const positionLabel = formatCurriculumPosition(group.curriculum, session.curriculum_position);
  const isWilson = group.curriculum === 'wilson' && session.wilson_lesson_plan;
  const isCamino = group.curriculum === 'camino' && session.camino_lesson_plan;

  // ---- Print Handler ----
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ---- PDF Download Handler ----
  const handleDownloadPDF = useCallback(() => {
    const doc = new jsPDF();

    // Header
    let yPos = addPDFHeader(doc, group, session);

    // Student roster
    if (students.length > 0) {
      yPos = addStudentRoster(doc, students, yPos);
    }

    // Curriculum-specific content
    if (isWilson) {
      yPos = addWilsonLessonPDF(doc, session.wilson_lesson_plan!, yPos);
    } else if (isCamino) {
      yPos = addCaminoLessonPDF(doc, session.camino_lesson_plan!, yPos);
    } else {
      yPos = addGenericSessionPDF(doc, session, group, yPos);
    }

    // Footer
    addPDFFooter(doc);

    // Save
    const fileName = `lesson-plan-${group.name.replace(/\s+/g, '-').toLowerCase()}-${session.date}.pdf`;
    doc.save(fileName);
  }, [session, group, students, isWilson, isCamino]);

  return (
    <div className="print-session-lesson">
      {/* Action buttons - hidden during print */}
      <div className="no-print flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-movement text-white rounded-lg font-medium text-sm hover:bg-pink-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>

        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium text-sm hover:bg-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Print-optimized content */}
      <div
        ref={printRef}
        className="print-container print-preview-screen"
      >
        {/* ---- Header ---- */}
        <div className="print-header border-b-2 border-gray-800 pb-2 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="print-header-title text-xl font-bold text-gray-900">
                {group.name}
              </h1>
              <p className="print-header-subtitle text-sm text-gray-600 mt-0.5">
                {sessionDate}
                {session.time && (
                  <span className="ml-2">&middot; {formatTime12(session.time)}</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="print-header-meta text-xs text-gray-500">
                {curriculumLabel}
              </p>
              <p className="print-header-meta text-xs text-gray-500">
                {getTierLabel(group.tier)} &middot; Grade {group.grade}
              </p>
              <p className="print-header-meta text-xs text-gray-500">
                {positionLabel}
              </p>
            </div>
          </div>
        </div>

        {/* ---- Student Roster ---- */}
        {students.length > 0 && (
          <div className="print-roster mb-4 print-break-avoid">
            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              Students ({students.length})
            </h2>
            <div className="border border-gray-200 rounded overflow-hidden">
              <div className="grid grid-cols-2 gap-0">
                {students.map((student, i) => (
                  <div
                    key={student.id}
                    className={`print-roster-item flex items-center gap-2 px-2 py-1 text-xs ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } ${i < students.length - (students.length % 2 === 0 ? 2 : 1) ? 'border-b border-gray-100' : ''}`}
                  >
                    <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-[10px] flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-800 font-medium">{student.name}</span>
                    {student.grade_level && (
                      <span className="text-gray-400 text-[10px] ml-auto">Gr {student.grade_level}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- Section Divider ---- */}
        <div className="section-divider" />

        {/* ---- Curriculum-Specific Lesson Content ---- */}
        {isWilson && (
          <WilsonLessonPrint lessonPlan={session.wilson_lesson_plan!} />
        )}

        {isCamino && (
          <CaminoLessonPrint lessonPlan={session.camino_lesson_plan!} />
        )}

        {!isWilson && !isCamino && (
          <GenericSessionPrint session={session} group={group} />
        )}

        {/* ---- Footer ---- */}
        <div className="print-footer border-t border-gray-300 pt-2 mt-6 flex items-center justify-between">
          <span className="text-[9px] text-gray-400">
            EMERGE Intervention Planner
          </span>
          <span className="text-[9px] text-gray-400">
            Printed {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PrintSessionLesson;
