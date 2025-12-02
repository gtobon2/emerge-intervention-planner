import type { Curriculum, CurriculumPosition, Session } from '@/lib/supabase/types';
import { getPositionLabel } from '@/lib/curriculum';

// Generate prompt for error suggestion
export function generateErrorSuggestionPrompt(
  curriculum: Curriculum,
  position: CurriculumPosition,
  previousErrors?: string[]
): string {
  const positionLabel = getPositionLabel(curriculum, position);

  let prompt = `Curriculum: ${curriculum}
Current Position: ${positionLabel}

Please suggest 3-5 likely student errors for this instructional position. For each error:
1. Describe the error pattern clearly
2. Explain the underlying skill gap
3. Provide a correction protocol with specific teacher language
4. Include 2-3 correction prompts the teacher can use

Format each error as:
ERROR: [description]
GAP: [underlying issue]
CORRECTION: [protocol]
PROMPTS:
- [prompt 1]
- [prompt 2]
`;

  if (previousErrors && previousErrors.length > 0) {
    prompt += `\nPreviously observed errors in this group:\n${previousErrors.join('\n')}`;
  }

  return prompt;
}

// Generate prompt for session summary
export function generateSessionSummaryPrompt(session: Session, groupName: string): string {
  const components = session.components_completed?.join(', ') || 'Not recorded';
  const errors = session.errors_observed
    ? session.errors_observed.map((e: any) => e.error_pattern).join(', ')
    : 'None recorded';

  return `Please generate an IEP-ready session summary for the following intervention session:

Group: ${groupName}
Date: ${session.date}
Status: ${session.status}

INSTRUCTIONAL COMPONENTS COMPLETED:
${components}

PRACTICE DATA:
- Planned OTR target: ${session.planned_otr_target || 'Not set'}
- Actual OTR estimate: ${session.actual_otr_estimate || 'Not recorded'}
- Pacing: ${session.pacing || 'Not recorded'}
- Response formats used: ${session.planned_response_formats?.join(', ') || 'Not recorded'}

MASTERY CHECK:
- Exit ticket: ${session.exit_ticket_correct || '?'}/${session.exit_ticket_total || '?'} correct
- Mastery demonstrated: ${session.mastery_demonstrated || 'Not assessed'}

ERRORS OBSERVED:
${errors}

NOTES:
${session.notes || 'None'}

Please write a 2-3 paragraph professional summary suitable for IEP documentation.
Include: skills addressed, student response to instruction, error patterns, and recommendations.`;
}

// Generate prompt for voice note processing
export function generateVoiceNotePrompt(transcription: string): string {
  return `Please process this voice note transcription from a teacher during an intervention session.
Clean up any transcription errors and organize the information into clear categories.

TRANSCRIPTION:
${transcription}

Please organize into:
1. OBSERVATIONS: What the teacher noticed about student learning
2. ERRORS NOTED: Any specific errors or difficulties mentioned
3. STUDENT RESPONSES: How students responded to instruction
4. NEXT STEPS: Any mentioned plans or adjustments

Keep the teacher's voice and meaning while improving clarity.`;
}

// Generate prompt for cross-group pattern analysis
export function generatePatternAnalysisPrompt(
  groupSummaries: Array<{ groupName: string; curriculum: string; recentErrors: string[] }>
): string {
  const summaryText = groupSummaries
    .map(
      (g) => `${g.groupName} (${g.curriculum}):
  Errors: ${g.recentErrors.join(', ') || 'None recorded'}`
    )
    .join('\n\n');

  return `Please analyze these error patterns across multiple intervention groups and identify:
1. Common patterns appearing in multiple groups
2. Curriculum-specific trends
3. Suggested instructional adjustments

GROUP DATA:
${summaryText}

Provide actionable insights the teacher can use to adjust instruction.`;
}
