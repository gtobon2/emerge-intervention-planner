import { NextRequest, NextResponse } from 'next/server';
import { getAICompletion, isAIConfigured, SYSTEM_PROMPTS } from '@/lib/ai';
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

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    const prompt = generateErrorSuggestionPrompt(curriculum, position, previousErrors);

    const result = await getAICompletion({
      systemPrompt: SYSTEM_PROMPTS.errorSuggestion,
      userPrompt: prompt,
      maxTokens: 1024,
    });

    return NextResponse.json({
      suggestions: result.text,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Error suggesting errors:', error);
    return NextResponse.json(
      { error: 'Failed to generate error suggestions' },
      { status: 500 }
    );
  }
}
