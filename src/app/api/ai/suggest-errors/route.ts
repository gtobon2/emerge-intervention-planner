import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, DEFAULT_MODEL, SYSTEM_PROMPTS } from '@/lib/ai';
import { generateErrorSuggestionPrompt } from '@/lib/ai/prompts';
import type { Curriculum, CurriculumPosition } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { curriculum, position, previousErrors } = body as {
      curriculum: Curriculum;
      position: CurriculumPosition;
      previousErrors?: string[];
    };

    if (!curriculum || !position) {
      return NextResponse.json(
        { error: 'Missing required fields: curriculum, position' },
        { status: 400 }
      );
    }

    const client = getAnthropicClient();
    if (!client) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const prompt = generateErrorSuggestionPrompt(curriculum, position, previousErrors);

    const message = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPTS.errorSuggestion,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    const text = content.type === 'text' ? content.text : '';

    return NextResponse.json({
      suggestions: text,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Error suggesting errors:', error);
    return NextResponse.json(
      { error: 'Failed to generate error suggestions' },
      { status: 500 }
    );
  }
}
