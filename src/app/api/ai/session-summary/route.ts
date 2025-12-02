import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, DEFAULT_MODEL, SYSTEM_PROMPTS } from '@/lib/ai';
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

    const client = getAnthropicClient();
    if (!client) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const prompt = generateSessionSummaryPrompt(session, groupName);

    const message = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPTS.sessionSummary,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    const text = content.type === 'text' ? content.text : '';

    return NextResponse.json({
      summary: text,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Error generating session summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate session summary' },
      { status: 500 }
    );
  }
}
