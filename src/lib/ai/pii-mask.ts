/**
 * PII Masking Utility
 *
 * Replaces student names and other PII with anonymous identifiers
 * before sending data to AI services. This ensures student privacy
 * while still allowing AI to provide useful insights.
 */

export interface MaskedStudent {
  originalId: string;
  maskedId: string;
  maskedName: string;
}

export interface PIIMaskingContext {
  studentMap: Map<string, MaskedStudent>;
  reverseMap: Map<string, string>; // maskedId -> originalId
}

/**
 * Creates a new PII masking context
 * Use one context per AI conversation to maintain consistent mappings
 */
export function createMaskingContext(): PIIMaskingContext {
  return {
    studentMap: new Map(),
    reverseMap: new Map(),
  };
}

/**
 * Generates a unique masked name for a student
 * Uses a letter + number format: "Student A1", "Student B2", etc.
 */
function generateMaskedName(index: number): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O to avoid confusion
  const letterIndex = index % letters.length;
  const numberSuffix = Math.floor(index / letters.length) + 1;
  return `Student ${letters[letterIndex]}${numberSuffix}`;
}

/**
 * Masks a student's information
 * Returns a consistent masked ID for the same student within a context
 */
export function maskStudent(
  context: PIIMaskingContext,
  studentId: string,
  studentName: string
): MaskedStudent {
  // Return existing mapping if we've seen this student
  const existing = context.studentMap.get(studentId);
  if (existing) {
    return existing;
  }

  // Create new masked identity
  const index = context.studentMap.size;
  const maskedId = `student_${index + 1}`;
  const maskedName = generateMaskedName(index);

  const masked: MaskedStudent = {
    originalId: studentId,
    maskedId,
    maskedName,
  };

  context.studentMap.set(studentId, masked);
  context.reverseMap.set(maskedId, studentId);

  return masked;
}

/**
 * Gets the original student ID from a masked ID
 */
export function unmaskStudentId(
  context: PIIMaskingContext,
  maskedId: string
): string | null {
  return context.reverseMap.get(maskedId) || null;
}

/**
 * Masks all student names in a text string
 * Replaces occurrences of student names with their masked versions
 */
export function maskTextContent(
  context: PIIMaskingContext,
  text: string,
  students: Array<{ id: string; name: string }>
): string {
  let maskedText = text;

  for (const student of students) {
    const masked = maskStudent(context, student.id, student.name);
    // Replace all occurrences of the student name (case-insensitive)
    const nameRegex = new RegExp(escapeRegExp(student.name), 'gi');
    maskedText = maskedText.replace(nameRegex, masked.maskedName);
  }

  return maskedText;
}

/**
 * Unmasks text by replacing masked names with original names
 * Useful for displaying AI responses with real names
 */
export function unmaskTextContent(
  context: PIIMaskingContext,
  text: string,
  students: Array<{ id: string; name: string }>
): string {
  let unmaskedText = text;

  for (const student of students) {
    const masked = context.studentMap.get(student.id);
    if (masked) {
      const maskedRegex = new RegExp(escapeRegExp(masked.maskedName), 'gi');
      unmaskedText = unmaskedText.replace(maskedRegex, student.name);
    }
  }

  return unmaskedText;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Masks student data for AI context
 * Returns a sanitized version safe to send to AI
 */
export interface StudentDataForAI {
  id: string;
  name: string;
  notes?: string | null;
  groupName?: string;
  recentErrors?: string[];
  progressSummary?: string;
}

export interface MaskedStudentData {
  maskedId: string;
  maskedName: string;
  notes?: string | null;
  groupName?: string;
  recentErrors?: string[];
  progressSummary?: string;
}

export function maskStudentDataForAI(
  context: PIIMaskingContext,
  student: StudentDataForAI,
  allStudents: Array<{ id: string; name: string }>
): MaskedStudentData {
  const masked = maskStudent(context, student.id, student.name);

  return {
    maskedId: masked.maskedId,
    maskedName: masked.maskedName,
    notes: student.notes ? maskTextContent(context, student.notes, allStudents) : null,
    groupName: student.groupName,
    recentErrors: student.recentErrors?.map((e) => maskTextContent(context, e, allStudents)),
    progressSummary: student.progressSummary
      ? maskTextContent(context, student.progressSummary, allStudents)
      : undefined,
  };
}

/**
 * Creates a legend mapping masked names to original names
 * For displaying to the user (not sent to AI)
 */
export function createMaskingLegend(
  context: PIIMaskingContext,
  students: Array<{ id: string; name: string }>
): Array<{ maskedName: string; originalName: string }> {
  return students
    .map((student) => {
      const masked = context.studentMap.get(student.id);
      if (masked) {
        return {
          maskedName: masked.maskedName,
          originalName: student.name,
        };
      }
      return null;
    })
    .filter((item): item is { maskedName: string; originalName: string } => item !== null);
}

/**
 * Serializes a masking context for storage (e.g., in session state)
 */
export function serializeMaskingContext(context: PIIMaskingContext): string {
  const data = {
    studentMap: Array.from(context.studentMap.entries()),
    reverseMap: Array.from(context.reverseMap.entries()),
  };
  return JSON.stringify(data);
}

/**
 * Deserializes a masking context from storage
 */
export function deserializeMaskingContext(serialized: string): PIIMaskingContext {
  const data = JSON.parse(serialized);
  return {
    studentMap: new Map(data.studentMap),
    reverseMap: new Map(data.reverseMap),
  };
}
