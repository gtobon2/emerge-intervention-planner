import { NextRequest, NextResponse } from 'next/server';
import { getAICompletion, isAIConfigured, SYSTEM_PROMPTS } from '@/lib/ai';
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

    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    const prompt = generateVoiceNotePrompt(transcription);

    const result = await getAICompletion({
      systemPrompt: SYSTEM_PROMPTS.voiceTranscription,
      userPrompt: prompt,
      maxTokens: 1024,
    });

    return NextResponse.json({
      processedNotes: result.text,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Error processing voice notes:', error);
    return NextResponse.json(
      { error: 'Failed to process voice notes' },
      { status: 500 }
    );
  }
}
