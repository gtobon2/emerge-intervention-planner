import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicClient, DEFAULT_MODEL, SYSTEM_PROMPTS } from '@/lib/ai';
import { generateVoiceNotePrompt } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcription } = body as { transcription: string };

    if (!transcription) {
      return NextResponse.json(
        { error: 'Missing required field: transcription' },
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

    const prompt = generateVoiceNotePrompt(transcription);

    const message = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPTS.voiceTranscription,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    const text = content.type === 'text' ? content.text : '';

    return NextResponse.json({
      processedNotes: text,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Error processing voice notes:', error);
    return NextResponse.json(
      { error: 'Failed to process voice notes' },
      { status: 500 }
    );
  }
}
