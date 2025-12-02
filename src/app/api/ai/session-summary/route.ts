import { NextRequest, NextResponse } from 'next/server';
import { getAICompletion, isAIConfigured, SYSTEM_PROMPTS } from '@/lib/ai';
import { generateSessionSummaryPrompt } from '@/lib/ai/prompts';
import type { Session } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session, groupName } = body as {
      session: Session;
      groupName: string;
    };

    if (!session || !groupName) {
      return NextResponse.json(
        { error: 'Missing required fields: session, groupName' },
        { status: 400 }
      );
    }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    const prompt = generateSessionSummaryPrompt(session, groupName);

    const result = await getAICompletion({
      systemPrompt: SYSTEM_PROMPTS.sessionSummary,
      userPrompt: prompt,
      maxTokens: 1024,
    });

    return NextResponse.json({
      summary: result.text,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Error generating session summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate session summary' },
      { status: 500 }
    );
  }
}
