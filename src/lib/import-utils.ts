/**
 * Import utilities for parsing CSV files and validating student data
 */

import type { StudentInsert } from '@/lib/supabase/types';

export interface CSVRow {
  [key: string]: string;
}

export interface ParsedCSVData {
  headers: string[];
  rows: CSVRow[];
  rawRows: string[][];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface StudentImportData {
  name?: string;
  grade?: string;
  notes?: string;
  group_name?: string;
}

export interface ValidatedStudent {
  data: StudentInsert;
  originalRow: number;
  groupName?: string;
}

export interface ValidationResult {
  valid: ValidatedStudent[];
  errors: ValidationError[];
}

/**
 * Parses a CSV string into structured data
 * Handles different delimiters and quoted values
 */
export function parseCSV(csvString: string): ParsedCSVData {
  const lines = csvString.trim().split(/\r?\n/);

  if (lines.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  // Detect delimiter (comma, semicolon, or tab)
  const delimiter = detectDelimiter(lines[0]);

  // Parse all rows
  const rawRows: string[][] = [];
  for (const line of lines) {
    if (line.trim()) {
      rawRows.push(parseCSVLine(line, delimiter));
    }
  }

  if (rawRows.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  // First row is headers
  const headers = rawRows[0].map(h => h.trim());

  // Convert remaining rows to objects
  const rows: CSVRow[] = [];
  for (let i = 1; i < rawRows.length; i++) {
    const row: CSVRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = rawRows[i][j] || '';
    }
    rows.push(row);
  }

  return { headers, rows, rawRows };
}

/**
 * Detects the delimiter used in a CSV line
 */
function detectDelimiter(line: string): string {
  const delimiters = [',', ';', '\t'];
  let maxCount = 0;
  let detectedDelimiter = ',';

  for (const delimiter of delimiters) {
    const count = line.split(delimiter).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }

  return detectedDelimiter;
}

/**
 * Parses a single CSV line, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of value
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last value
  values.push(current.trim());

  return values;
}

/**
 * Maps CSV column names to standard field names
 * Handles various common column naming conventions
 */
export function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  const nameVariants = ['name', 'student_name', 'student name', 'studentname', 'full name', 'fullname'];
  const gradeVariants = ['grade', 'grade_level', 'grade level', 'gradelevel'];
  const notesVariants = ['notes', 'note', 'comments', 'comment', 'description'];
  const groupVariants = ['group', 'group_name', 'group name', 'groupname'];

  for (const header of headers) {
    const lowerHeader = header.toLowerCase();

    if (nameVariants.includes(lowerHeader)) {
      mapping[header] = 'name';
    } else if (gradeVariants.includes(lowerHeader)) {
      mapping[header] = 'grade';
    } else if (notesVariants.includes(lowerHeader)) {
      mapping[header] = 'notes';
    } else if (groupVariants.includes(lowerHeader)) {
      mapping[header] = 'group_name';
    }
  }

  return mapping;
}

/**
 * Validates student data from CSV rows
 */
export function validateStudentData(
  rows: CSVRow[],
  columnMapping: Record<string, string>,
  defaultGroupId?: string
): ValidationResult {
  const valid: ValidatedStudent[] = [];
  const errors: ValidationError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 because row 1 is headers and we're 0-indexed

    // Extract mapped values
    const mappedData: StudentImportData = {};
    for (const [csvColumn, standardField] of Object.entries(columnMapping)) {
      const value = row[csvColumn]?.trim();
      if (value) {
        (mappedData as any)[standardField] = value;
      }
    }

    // Validate required fields
    if (!mappedData.name || mappedData.name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Student name is required',
      });
      continue;
    }

    // Validate name length
    if (mappedData.name.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Student name is too long (max 100 characters)',
      });
      continue;
    }

    // Validate grade if provided
    if (mappedData.grade) {
      const gradeNum = parseInt(mappedData.grade);
      if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 12) {
        errors.push({
          row: rowNumber,
          field: 'grade',
          message: 'Grade must be a number between 0 and 12',
        });
        continue;
      }
    }

    // Build student insert object
    const studentData: StudentInsert = {
      name: mappedData.name,
      notes: mappedData.notes || null,
      group_id: defaultGroupId || '', // Will be set during import
    };

    valid.push({
      data: studentData,
      originalRow: rowNumber,
      groupName: mappedData.group_name,
    });
  }

  return { valid, errors };
}

/**
 * Checks for duplicate student names
 */
export function findDuplicates(
  students: ValidatedStudent[],
  existingStudents: { name: string; group_id: string }[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const nameMap = new Map<string, number>();

  // Check for duplicates within the import
  for (const student of students) {
    const nameLower = student.data.name.toLowerCase();
    if (nameMap.has(nameLower)) {
      errors.push({
        row: student.originalRow,
        field: 'name',
        message: `Duplicate name in import: "${student.data.name}"`,
      });
    } else {
      nameMap.set(nameLower, student.originalRow);
    }
  }

  // Check for duplicates with existing students (same name and group)
  for (const student of students) {
    const nameLower = student.data.name.toLowerCase();
    const duplicate = existingStudents.find(
      (existing) =>
        existing.name.toLowerCase() === nameLower &&
        existing.group_id === student.data.group_id
    );

    if (duplicate) {
      errors.push({
        row: student.originalRow,
        field: 'name',
        message: `Student "${student.data.name}" already exists in this group`,
      });
    }
  }

  return errors;
}

/**
 * Generates a sample CSV template for download
 */
export function generateSampleCSV(): string {
  const headers = ['name', 'grade', 'notes', 'group_name'];
  const sampleRows = [
    ['John Smith', '3', 'Needs support with phonics', 'Morning Reading Group'],
    ['Maria Garcia', '3', 'Working on fluency', 'Morning Reading Group'],
    ['James Johnson', '4', 'Strong decoder, needs comprehension support', 'Afternoon Math Group'],
  ];

  const csvLines = [headers.join(',')];

  for (const row of sampleRows) {
    const escapedRow = row.map((value) => {
      // Escape values that contain commas or quotes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(escapedRow.join(','));
  }

  return csvLines.join('\n');
}

/**
 * Downloads the sample CSV template
 */
export function downloadSampleCSV(): void {
  const csvContent = generateSampleCSV();
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'student_import_template.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Reads a file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
