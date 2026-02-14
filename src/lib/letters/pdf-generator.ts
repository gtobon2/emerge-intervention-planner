import jsPDF from 'jspdf';
import type { LetterData } from './types';
import { getLetterContent } from './templates';

const PAGE_MARGIN = 20;
const PAGE_WIDTH = 215.9; // Letter size in mm
const PAGE_HEIGHT = 279.4; // Letter size in mm
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const FOOTER_ZONE = PAGE_HEIGHT - 30;

const COLORS = {
  primary: [236, 72, 153] as [number, number, number], // pink-500
  text: [31, 41, 55] as [number, number, number], // gray-800
  muted: [107, 114, 128] as [number, number, number], // gray-500
};

function checkPageBreak(doc: jsPDF, yPos: number, neededSpace: number): number {
  if (yPos + neededSpace > FOOTER_ZONE) {
    doc.addPage();
    return PAGE_MARGIN + 10;
  }
  return yPos;
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  yPos: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines: string[] = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    yPos = checkPageBreak(doc, yPos, lineHeight);
    doc.text(line, x, yPos);
    yPos += lineHeight;
  }
  return yPos;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text('EMERGE Intervention Planner', PAGE_MARGIN, PAGE_HEIGHT - 10);
    doc.text(
      `Page ${i} of ${pageCount}`,
      PAGE_WIDTH - PAGE_MARGIN,
      PAGE_HEIGHT - 10,
      { align: 'right' }
    );
  }
}

export function generateLetterPDF(data: LetterData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const content = getLetterContent(data);
  let yPos = PAGE_MARGIN;

  // --- School letterhead ---
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolName, PAGE_WIDTH / 2, yPos, { align: 'center' });
  yPos += 8;

  // Date right-aligned
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.text(data.date, PAGE_WIDTH - PAGE_MARGIN, yPos, { align: 'right' });
  yPos += 10;

  // --- English section ---
  // Title
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(content.titleEn, PAGE_MARGIN, yPos);
  yPos += 8;

  // Body paragraphs
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  for (const paragraph of content.paragraphsEn) {
    yPos = checkPageBreak(doc, yPos, 6);
    yPos = addWrappedText(doc, paragraph, PAGE_MARGIN, yPos, CONTENT_WIDTH, 5.5);
    yPos += 4; // paragraph spacing
  }

  yPos += 6;

  // --- Divider ---
  yPos = checkPageBreak(doc, yPos, 20);
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, yPos, PAGE_WIDTH - PAGE_MARGIN, yPos);
  yPos += 8;

  // --- Spanish header ---
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('--- Traduccion al Espanol ---', PAGE_WIDTH / 2, yPos, { align: 'center' });
  yPos += 10;

  // Spanish title
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(content.titleEs, PAGE_MARGIN, yPos);
  yPos += 8;

  // Spanish body paragraphs
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  for (const paragraph of content.paragraphsEs) {
    yPos = checkPageBreak(doc, yPos, 6);
    yPos = addWrappedText(doc, paragraph, PAGE_MARGIN, yPos, CONTENT_WIDTH, 5.5);
    yPos += 4;
  }

  // --- Signature line ---
  yPos += 12;
  yPos = checkPageBreak(doc, yPos, 20);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text('Sincerely / Atentamente,', PAGE_MARGIN, yPos);
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.text(data.interventionistName, PAGE_MARGIN, yPos);

  // Footer
  addFooter(doc);

  // Save
  const safeName = data.studentName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const safeDate = data.date.replace(/\//g, '-');
  doc.save(`letter-${data.type}-${safeName}-${safeDate}.pdf`);
}
