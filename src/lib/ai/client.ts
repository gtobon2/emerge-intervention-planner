import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
// Note: In production, this should only be used in server-side code
export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('Anthropic API key not configured');
    return null;
  }

  return new Anthropic({
    apiKey,
  });
}

// Default model for all AI features
export const DEFAULT_MODEL = 'claude-3-haiku-20240307';

// System prompts for different features
export const SYSTEM_PROMPTS = {
  errorSuggestion: `You are an expert intervention specialist helping teachers anticipate and address student learning errors.
Based on the curriculum position and common error patterns, suggest likely errors students might make and evidence-based correction strategies.
Be specific and practical. Include correction prompts the teacher can use verbatim.`,

  sessionSummary: `You are helping a special education teacher create professional documentation.
Generate a concise, IEP-ready summary of the session based on the logged data.
Use professional language appropriate for educational records.
Include: skills addressed, student response to instruction, error patterns observed, and recommendations.`,

  voiceTranscription: `You are helping process voice notes from a teacher during an intervention session.
Clean up the transcription for clarity while preserving the teacher's observations.
Organize information into clear categories: observations, errors noted, student responses, and next steps.`,

  patternAnalysis: `You are analyzing error patterns across multiple intervention sessions.
Identify trends, common difficulties, and suggest instructional adjustments.
Be specific about which students or groups show particular patterns.`,
};
