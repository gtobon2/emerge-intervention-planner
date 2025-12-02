import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// AI Provider type
export type AIProvider = 'openai' | 'anthropic';

// Get the configured AI provider
export function getAIProvider(): AIProvider {
  const configuredProvider = process.env.AI_PROVIDER as AIProvider;

  if (configuredProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return 'anthropic';
  }

  if (configuredProvider === 'openai' && process.env.OPENAI_API_KEY) {
    return 'openai';
  }

  // Default: prefer OpenAI if available, then Anthropic
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';

  return 'openai'; // Default fallback
}

// Initialize OpenAI client
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OpenAI API key not configured');
    return null;
  }

  return new OpenAI({
    apiKey,
  });
}

// Initialize Anthropic client
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

// Default models for each provider
export const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
};

// Get the default model for the current provider
export function getDefaultModel(): string {
  const provider = getAIProvider();
  return DEFAULT_MODELS[provider];
}

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

// Unified interface for AI completion
export interface AICompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export interface AICompletionResult {
  text: string;
  provider: AIProvider;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// Unified completion function that works with either provider
export async function getAICompletion(options: AICompletionOptions): Promise<AICompletionResult> {
  const { systemPrompt, userPrompt, maxTokens = 1024 } = options;
  const provider = getAIProvider();

  if (provider === 'openai') {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI client not configured');
    }

    const response = await client.chat.completions.create({
      model: DEFAULT_MODELS.openai,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const text = response.choices[0]?.message?.content || '';

    return {
      text,
      provider: 'openai',
      model: DEFAULT_MODELS.openai,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  } else {
    const client = getAnthropicClient();
    if (!client) {
      throw new Error('Anthropic client not configured');
    }

    const response = await client.messages.create({
      model: DEFAULT_MODELS.anthropic,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return {
      text,
      provider: 'anthropic',
      model: DEFAULT_MODELS.anthropic,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}

// Check if AI is configured
export function isAIConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}
