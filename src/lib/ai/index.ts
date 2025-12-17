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

export {
  createMaskingContext,
  maskStudent,
  maskTextContent,
  unmaskTextContent,
  maskStudentDataForAI,
  createMaskingLegend,
  serializeMaskingContext,
  deserializeMaskingContext,
  unmaskStudentId,
} from './pii-mask';

export type {
  MaskedStudent,
  PIIMaskingContext,
  StudentDataForAI,
  MaskedStudentData,
} from './pii-mask';
