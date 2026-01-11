/**
 * Wilson Worksheet PDF Export
 *
 * Generates print-ready PDF worksheets using jsPDF.
 */

import jsPDF from 'jspdf';
import type { GeneratedWorksheet, WorksheetSection } from './types';

// Note: jsPDF is extended in src/lib/export/pdf-export.ts

// PDF styling constants
const STYLES = {
  page: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 20,
    marginBottom: 25,
  },
  title: {
    fontSize: 18,
    color: [59, 130, 246] as [number, number, number], // blue-500
  },
  subtitle: {
    fontSize: 12,
    color: [107, 114, 128] as [number, number, number], // gray-500
  },
  sectionTitle: {
    fontSize: 14,
    color: [31, 41, 55] as [number, number, number], // gray-800
  },
  body: {
    fontSize: 12,
    color: [55, 65, 81] as [number, number, number], // gray-700
  },
  soundBox: {
    width: 25,
    height: 20,
    spacing: 5,
  },
  lineHeight: 8,
};

/**
 * Export worksheet to PDF
 */
export function exportWorksheetToPDF(worksheet: GeneratedWorksheet): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = STYLES.page.marginTop;

  // Header
  yPos = addHeader(doc, worksheet, yPos);

  // Instructions
  yPos = addInstructions(doc, worksheet.instructions, yPos);

  // Content sections
  for (const section of worksheet.content.sections) {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = STYLES.page.marginTop;
    }

    yPos = addSection(doc, section, yPos);
  }

  // Footer
  addFooter(doc, worksheet);

  // Save
  const fileName = `Wilson_Worksheet_${worksheet.config.substep}_${worksheet.config.template}.pdf`;
  doc.save(fileName);
}

/**
 * Export answer key to PDF
 */
export function exportAnswerKeyToPDF(worksheet: GeneratedWorksheet): void {
  if (!worksheet.answerKey) {
    console.warn('No answer key available');
    return;
  }

  const doc = new jsPDF();
  let yPos = STYLES.page.marginTop;

  // Header
  doc.setFontSize(STYLES.title.fontSize);
  doc.setTextColor(...STYLES.title.color);
  doc.text('Answer Key', STYLES.page.marginLeft, yPos);
  yPos += 8;

  doc.setFontSize(STYLES.subtitle.fontSize);
  doc.setTextColor(...STYLES.subtitle.color);
  doc.text(worksheet.title, STYLES.page.marginLeft, yPos);
  yPos += 15;

  // Answer sections
  for (const section of worksheet.answerKey.sections) {
    if (yPos > 260) {
      doc.addPage();
      yPos = STYLES.page.marginTop;
    }

    doc.setFontSize(STYLES.sectionTitle.fontSize);
    doc.setTextColor(...STYLES.sectionTitle.color);
    doc.text(section.title, STYLES.page.marginLeft, yPos);
    yPos += 8;

    doc.setFontSize(STYLES.body.fontSize);
    doc.setTextColor(...STYLES.body.color);

    section.answers.forEach((answer, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = STYLES.page.marginTop;
      }
      doc.text(`${idx + 1}. ${answer}`, STYLES.page.marginLeft + 5, yPos);
      yPos += STYLES.lineHeight;
    });

    yPos += 8;
  }

  // Save
  const fileName = `Wilson_AnswerKey_${worksheet.config.substep}_${worksheet.config.template}.pdf`;
  doc.save(fileName);
}

/**
 * Add header to PDF
 */
function addHeader(doc: jsPDF, worksheet: GeneratedWorksheet, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = startY;

  // Title
  doc.setFontSize(STYLES.title.fontSize);
  doc.setTextColor(...STYLES.title.color);
  doc.text(worksheet.title, STYLES.page.marginLeft, yPos);

  // Student name field (right side)
  doc.setFontSize(10);
  doc.setTextColor(...STYLES.subtitle.color);
  doc.text('Name: _______________________', pageWidth - 80, yPos);
  yPos += 8;

  // Substep info
  doc.setFontSize(STYLES.subtitle.fontSize);
  doc.text(`Step ${worksheet.stepNumber}: ${worksheet.stepName}`, STYLES.page.marginLeft, yPos);

  // Date field (right side)
  doc.text('Date: _______________', pageWidth - 80, yPos);
  yPos += 5;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(STYLES.page.marginLeft, yPos, pageWidth - STYLES.page.marginRight, yPos);
  yPos += 10;

  return yPos;
}

/**
 * Add instructions
 */
function addInstructions(doc: jsPDF, instructions: string, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = startY;

  doc.setFontSize(10);
  doc.setTextColor(...STYLES.subtitle.color);
  doc.setFont('helvetica', 'italic');

  const lines = doc.splitTextToSize(instructions, pageWidth - STYLES.page.marginLeft - STYLES.page.marginRight);
  doc.text(lines, STYLES.page.marginLeft, yPos);

  doc.setFont('helvetica', 'normal');
  yPos += lines.length * 5 + 10;

  return yPos;
}

/**
 * Add a section to the PDF
 */
function addSection(doc: jsPDF, section: WorksheetSection, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = startY;

  // Section title
  doc.setFontSize(STYLES.sectionTitle.fontSize);
  doc.setTextColor(...STYLES.sectionTitle.color);
  doc.setFont('helvetica', 'bold');
  doc.text(section.title, STYLES.page.marginLeft, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 10;

  // Section content based on type
  switch (section.type) {
    case 'word_list':
      yPos = renderWordList(doc, section, yPos);
      break;
    case 'sound_boxes':
      yPos = renderSoundBoxes(doc, section, yPos);
      break;
    case 'sentences':
      yPos = renderSentences(doc, section, yPos);
      break;
    case 'syllable_split':
      yPos = renderSyllableSplit(doc, section, yPos);
      break;
    case 'fill_blank':
      yPos = renderFillBlank(doc, section, yPos);
      break;
    case 'matching':
      yPos = renderMatching(doc, section, yPos);
      break;
    case 'sentence_choice':
      yPos = renderSentenceChoice(doc, section, yPos);
      break;
    case 'draw_area':
      yPos = renderDrawArea(doc, section, yPos);
      break;
  }

  return yPos + 8;
}

/**
 * Render word list section
 */
function renderWordList(doc: jsPDF, section: WorksheetSection, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = startY;
  const itemsPerRow = 4;
  const colWidth = (pageWidth - STYLES.page.marginLeft - STYLES.page.marginRight) / itemsPerRow;

  doc.setFontSize(STYLES.body.fontSize);
  doc.setTextColor(...STYLES.body.color);

  section.items.forEach((item, idx) => {
    const col = idx % itemsPerRow;
    const row = Math.floor(idx / itemsPerRow);

    if (col === 0 && idx > 0) {
      yPos += STYLES.lineHeight;
    }

    const xPos = STYLES.page.marginLeft + col * colWidth;
    const displayY = startY + row * STYLES.lineHeight;

    doc.text(`${item.id}. ${item.prompt}`, xPos, displayY);
  });

  const totalRows = Math.ceil(section.items.length / itemsPerRow);
  return startY + totalRows * STYLES.lineHeight + 5;
}

/**
 * Render sound boxes section
 */
function renderSoundBoxes(doc: jsPDF, section: WorksheetSection, startY: number): number {
  let yPos = startY;
  const boxWidth = STYLES.soundBox.width;
  const boxHeight = STYLES.soundBox.height;
  const spacing = STYLES.soundBox.spacing;

  doc.setFontSize(STYLES.body.fontSize);

  for (const item of section.items) {
    if (yPos > 250) {
      doc.addPage();
      yPos = STYLES.page.marginTop;
    }

    // Word label
    doc.setTextColor(...STYLES.body.color);
    doc.text(`${item.id}. ${item.prompt}`, STYLES.page.marginLeft, yPos);
    yPos += 5;

    // Draw boxes
    const boxes = item.soundBoxes || [];
    boxes.forEach((_, idx) => {
      const xPos = STYLES.page.marginLeft + 20 + idx * (boxWidth + spacing);
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.rect(xPos, yPos, boxWidth, boxHeight);
    });

    yPos += boxHeight + 8;
  }

  return yPos;
}

/**
 * Render sentences section
 */
function renderSentences(doc: jsPDF, section: WorksheetSection, startY: number): number {
  let yPos = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const lineWidth = pageWidth - STYLES.page.marginLeft - STYLES.page.marginRight;

  doc.setFontSize(STYLES.body.fontSize);
  doc.setTextColor(...STYLES.body.color);

  for (const item of section.items) {
    if (yPos > 250) {
      doc.addPage();
      yPos = STYLES.page.marginTop;
    }

    doc.text(`${item.id}.`, STYLES.page.marginLeft, yPos);

    // Draw line for writing
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(STYLES.page.marginLeft + 10, yPos + 2, STYLES.page.marginLeft + lineWidth - 10, yPos + 2);

    yPos += 12;

    // Add extra line for longer sentences
    doc.line(STYLES.page.marginLeft + 10, yPos + 2, STYLES.page.marginLeft + lineWidth - 10, yPos + 2);
    yPos += 12;
  }

  return yPos;
}

/**
 * Render syllable split section
 */
function renderSyllableSplit(doc: jsPDF, section: WorksheetSection, startY: number): number {
  let yPos = startY;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(STYLES.body.fontSize);
  doc.setTextColor(...STYLES.body.color);

  for (const item of section.items) {
    if (yPos > 260) {
      doc.addPage();
      yPos = STYLES.page.marginTop;
    }

    // Word on left
    doc.text(`${item.id}. ${item.prompt}`, STYLES.page.marginLeft, yPos);

    // Arrow
    doc.text('→', STYLES.page.marginLeft + 60, yPos);

    // Blank for division
    doc.text('_____ / _____', STYLES.page.marginLeft + 75, yPos);

    yPos += STYLES.lineHeight + 2;
  }

  return yPos;
}

/**
 * Render fill in the blank section
 */
function renderFillBlank(doc: jsPDF, section: WorksheetSection, startY: number): number {
  let yPos = startY;

  doc.setFontSize(STYLES.body.fontSize);
  doc.setTextColor(...STYLES.body.color);

  for (const item of section.items) {
    if (yPos > 270) {
      doc.addPage();
      yPos = STYLES.page.marginTop;
    }

    doc.text(`${item.id}. ${item.prompt}`, STYLES.page.marginLeft, yPos);
    yPos += STYLES.lineHeight + 2;
  }

  return yPos;
}

/**
 * Render matching section
 */
function renderMatching(doc: jsPDF, section: WorksheetSection, startY: number): number {
  let yPos = startY;

  doc.setFontSize(STYLES.body.fontSize);
  doc.setTextColor(...STYLES.body.color);

  // Options box
  const options = section.items[0]?.options || [];
  doc.setFontSize(10);
  doc.text(`Options: ${options.join('  |  ')}`, STYLES.page.marginLeft, yPos);
  yPos += 10;

  doc.setFontSize(STYLES.body.fontSize);

  for (const item of section.items) {
    if (yPos > 270) {
      doc.addPage();
      yPos = STYLES.page.marginTop;
    }

    doc.text(`${item.id}. ${item.prompt}: ________________`, STYLES.page.marginLeft, yPos);
    yPos += STYLES.lineHeight + 2;
  }

  return yPos;
}

/**
 * Render sentence choice section (finish the sentence)
 */
function renderSentenceChoice(doc: jsPDF, section: WorksheetSection, startY: number): number {
  let yPos = startY;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(STYLES.body.fontSize);
  doc.setTextColor(...STYLES.body.color);

  for (const item of section.items) {
    if (yPos > 240) {
      doc.addPage();
      yPos = STYLES.page.marginTop;
    }

    // Sentence prompt
    doc.text(`${item.id}. ${item.prompt}`, STYLES.page.marginLeft, yPos);
    yPos += 10;

    // Options (with circles)
    const options = item.options || [];
    let xPos = STYLES.page.marginLeft + 10;

    for (const option of options) {
      // Draw circle
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.circle(xPos + 3, yPos - 2, 3);

      // Option text
      doc.text(option, xPos + 10, yPos);
      xPos += 60; // Space between options
    }

    yPos += 12;
  }

  return yPos;
}

/**
 * Render draw area section
 */
function renderDrawArea(doc: jsPDF, section: WorksheetSection, startY: number): number {
  let yPos = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = pageWidth - STYLES.page.marginLeft - STYLES.page.marginRight;

  doc.setFontSize(STYLES.body.fontSize);
  doc.setTextColor(...STYLES.body.color);

  for (const item of section.items) {
    if (yPos > 180) {
      doc.addPage();
      yPos = STYLES.page.marginTop;
    }

    // Sentence prompt
    doc.text(`${item.id}. Read: "${item.prompt}"`, STYLES.page.marginLeft, yPos);
    yPos += 8;

    // Draw box for drawing
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(STYLES.page.marginLeft, yPos, boxWidth, 50);
    doc.setLineDashPattern([], 0); // Reset dash pattern

    // "Draw here" text in center
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text('Draw your picture here', STYLES.page.marginLeft + boxWidth / 2 - 25, yPos + 27);
    doc.setFontSize(STYLES.body.fontSize);
    doc.setTextColor(...STYLES.body.color);

    yPos += 55;

    // Line for writing sentence
    doc.setFontSize(9);
    doc.text('Write the sentence:', STYLES.page.marginLeft, yPos);
    yPos += 5;

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(STYLES.page.marginLeft, yPos + 2, STYLES.page.marginLeft + boxWidth, yPos + 2);

    yPos += 15;
  }

  return yPos;
}

/**
 * Add footer to all pages
 */
function addFooter(doc: jsPDF, worksheet: GeneratedWorksheet): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('EMERGE Intervention Planner - Wilson Worksheet', STYLES.page.marginLeft, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - STYLES.page.marginRight - 20, pageHeight - 10);
  }
}

/**
 * Generate a batch of worksheets as a single PDF
 */
export function exportWorksheetBatchToPDF(worksheets: GeneratedWorksheet[]): void {
  if (worksheets.length === 0) return;

  const doc = new jsPDF();
  let isFirstPage = true;

  for (const worksheet of worksheets) {
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    let yPos = STYLES.page.marginTop;

    // Add worksheet content
    yPos = addHeader(doc, worksheet, yPos);
    yPos = addInstructions(doc, worksheet.instructions, yPos);

    for (const section of worksheet.content.sections) {
      if (yPos > 250) {
        doc.addPage();
        yPos = STYLES.page.marginTop;
      }
      yPos = addSection(doc, section, yPos);
    }
  }

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('EMERGE Intervention Planner - Wilson Worksheet Batch', 20, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 40, pageHeight - 10);
  }

  doc.save(`Wilson_Worksheet_Batch_${new Date().toISOString().split('T')[0]}.pdf`);
}
