/**
 * EMERGE Intervention Planner - Data Validation Helpers
 *
 * Validation functions to ensure data integrity before saving to Supabase.
 * These functions check required fields and data formats.
 */

import type {
  GroupInsert,
  StudentInsert,
  SessionInsert,
  ProgressMonitoringInsert,
  ErrorBankInsert,
  Curriculum,
  CurriculumPosition,
} from './types';

// ===========================================
// VALIDATION RESULT TYPES
// ===========================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ===========================================
// GROUP VALIDATION
// ===========================================

export function validateGroup(group: Partial<GroupInsert>): ValidationResult {
  const errors: string[] = [];

  if (!group.name || group.name.trim() === '') {
    errors.push('Group name is required');
  }

  if (!group.curriculum) {
    errors.push('Curriculum is required');
  }

  if (!group.tier || (group.tier !== 2 && group.tier !== 3)) {
    errors.push('Tier must be 2 or 3');
  }

  if (group.grade === undefined || group.grade === null) {
    errors.push('Grade level is required');
  } else if (group.grade < 0 || group.grade > 12) {
    errors.push('Grade level must be between 0 and 12');
  }

  if (!group.current_position) {
    errors.push('Current curriculum position is required');
  } else {
    const positionValidation = validateCurriculumPosition(
      group.curriculum!,
      group.current_position
    );
    if (!positionValidation.isValid) {
      errors.push(...positionValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===========================================
// STUDENT VALIDATION
// ===========================================

export function validateStudent(student: Partial<StudentInsert>): ValidationResult {
  const errors: string[] = [];

  if (!student.name || student.name.trim() === '') {
    errors.push('Student name is required');
  }

  if (!student.group_id || student.group_id.trim() === '') {
    errors.push('Group ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===========================================
// SESSION VALIDATION
// ===========================================

export function validateSession(session: Partial<SessionInsert>): ValidationResult {
  const errors: string[] = [];

  if (!session.group_id || session.group_id.trim() === '') {
    errors.push('Group ID is required');
  }

  if (!session.date || session.date.trim() === '') {
    errors.push('Session date is required');
  } else {
    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(session.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }
  }

  if (!session.curriculum_position) {
    errors.push('Curriculum position is required');
  }

  // Validate OTR target if provided
  if (session.planned_otr_target !== undefined && session.planned_otr_target !== null) {
    if (session.planned_otr_target < 0) {
      errors.push('Planned OTR target must be a positive number');
    }
  }

  // Validate actual OTR if provided
  if (session.actual_otr_estimate !== undefined && session.actual_otr_estimate !== null) {
    if (session.actual_otr_estimate < 0) {
      errors.push('Actual OTR estimate must be a positive number');
    }
  }

  // Validate exit ticket data if provided
  if (session.exit_ticket_total !== undefined && session.exit_ticket_total !== null) {
    if (session.exit_ticket_total < 1) {
      errors.push('Exit ticket total must be at least 1');
    }

    if (session.exit_ticket_correct !== undefined && session.exit_ticket_correct !== null) {
      if (session.exit_ticket_correct > session.exit_ticket_total) {
        errors.push('Exit ticket correct cannot exceed total');
      }
      if (session.exit_ticket_correct < 0) {
        errors.push('Exit ticket correct must be a positive number');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===========================================
// PROGRESS MONITORING VALIDATION
// ===========================================

export function validateProgressMonitoring(
  data: Partial<ProgressMonitoringInsert>
): ValidationResult {
  const errors: string[] = [];

  if (!data.group_id || data.group_id.trim() === '') {
    errors.push('Group ID is required');
  }

  if (!data.date || data.date.trim() === '') {
    errors.push('Date is required');
  } else {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(data.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }
  }

  if (!data.measure_type || data.measure_type.trim() === '') {
    errors.push('Measure type is required');
  }

  if (data.score === undefined || data.score === null) {
    errors.push('Score is required');
  } else if (data.score < 0) {
    errors.push('Score must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===========================================
// ERROR BANK VALIDATION
// ===========================================

export function validateErrorBankEntry(
  error: Partial<ErrorBankInsert>
): ValidationResult {
  const errors: string[] = [];

  if (!error.curriculum) {
    errors.push('Curriculum is required');
  }

  if (!error.error_pattern || error.error_pattern.trim() === '') {
    errors.push('Error pattern is required');
  }

  if (!error.correction_protocol || error.correction_protocol.trim() === '') {
    errors.push('Correction protocol is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===========================================
// CURRICULUM POSITION VALIDATION
// ===========================================

export function validateCurriculumPosition(
  curriculum: Curriculum,
  position: CurriculumPosition
): ValidationResult {
  const errors: string[] = [];

  switch (curriculum) {
    case 'wilson': {
      const wilsonPos = position as { step?: number; substep?: string };
      if (!wilsonPos.step) {
        errors.push('Wilson position requires step number');
      } else if (wilsonPos.step < 1 || wilsonPos.step > 12) {
        errors.push('Wilson step must be between 1 and 12');
      }
      if (!wilsonPos.substep) {
        errors.push('Wilson position requires substep');
      }
      break;
    }

    case 'delta_math': {
      const deltaPos = position as { standard?: string };
      if (!deltaPos.standard || deltaPos.standard.trim() === '') {
        errors.push('Delta Math position requires standard (e.g., "3.OA.7")');
      }
      break;
    }

    case 'camino': {
      const caminoPos = position as { lesson?: number };
      if (!caminoPos.lesson) {
        errors.push('Camino position requires lesson number');
      } else if (caminoPos.lesson < 1) {
        errors.push('Camino lesson must be a positive number');
      }
      break;
    }

    case 'wordgen': {
      const wordgenPos = position as { unit?: number; day?: number };
      if (!wordgenPos.unit) {
        errors.push('WordGen position requires unit number');
      } else if (wordgenPos.unit < 1) {
        errors.push('WordGen unit must be a positive number');
      }
      if (!wordgenPos.day) {
        errors.push('WordGen position requires day number');
      } else if (wordgenPos.day < 1 || wordgenPos.day > 5) {
        errors.push('WordGen day must be between 1 and 5');
      }
      break;
    }

    case 'amira': {
      const amiraPos = position as { level?: string };
      const validLevels = ['Emergent', 'Beginning', 'Transitional', 'Fluent'];
      if (!amiraPos.level) {
        errors.push('Amira position requires level');
      } else if (!validLevels.includes(amiraPos.level)) {
        errors.push(
          `Amira level must be one of: ${validLevels.join(', ')}`
        );
      }
      break;
    }

    default:
      errors.push(`Unknown curriculum: ${curriculum}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===========================================
// GOAL SETTING VALIDATION
// ===========================================

export function validateGoalSetting(goal: {
  measure_type?: string;
  goal_score?: number;
  benchmark_score?: number;
  goal_target_date?: string;
  benchmark_date?: string;
}): ValidationResult {
  const errors: string[] = [];
  if (!goal.measure_type?.trim()) errors.push('Measure type is required');
  if (goal.goal_score !== undefined && goal.goal_score !== null) {
    if (goal.goal_score < 0) errors.push('Goal score must be positive');
    if (goal.goal_score > 9999) errors.push('Goal score seems too high');
  }
  if (goal.benchmark_score !== undefined && goal.goal_score !== undefined) {
    if (goal.benchmark_score >= goal.goal_score) {
      errors.push('Goal score should be higher than benchmark');
    }
  }
  // Date format checks
  if (goal.goal_target_date && !/^\d{4}-\d{2}-\d{2}$/.test(goal.goal_target_date)) {
    errors.push('Invalid goal target date format');
  }
  return { isValid: errors.length === 0, errors };
}

// ===========================================
// PM DATA POINT VALIDATION
// ===========================================

export function validatePMDataPoint(data: {
  score?: number;
  date?: string;
  measure_type?: string;
}): ValidationResult {
  const errors: string[] = [];
  if (!data.measure_type?.trim()) errors.push('Measure type is required');
  if (data.score === undefined || data.score === null) errors.push('Score is required');
  else if (data.score < 0) errors.push('Score must be positive');
  else if (data.score > 9999) errors.push('Score seems too high');
  if (!data.date) errors.push('Date is required');
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) errors.push('Invalid date format');
  return { isValid: errors.length === 0, errors };
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Format validation errors into a user-friendly message
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return 'Validation errors:\n' + errors.map((e) => `- ${e}`).join('\n');
}

/**
 * Throw validation error if data is invalid
 */
export function assertValid(validation: ValidationResult): void {
  if (!validation.isValid) {
    throw new Error(formatValidationErrors(validation.errors));
  }
}
