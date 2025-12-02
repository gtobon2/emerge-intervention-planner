export {
  getAnthropicClient,
  getOpenAIClient,
  getAIProvider,
  getDefaultModel,
  getAICompletion,
  isAIConfigured,
  DEFAULT_MODELS,
  SYSTEM_PROMPTS,
} from './client';

export type {
  AIProvider,
  AICompletionOptions,
  AICompletionResult,
} from './client';

export {
  generateErrorSuggestionPrompt,
  generateSessionSummaryPrompt,
  generateVoiceNotePrompt,
  generatePatternAnalysisPrompt,
} from './prompts';
