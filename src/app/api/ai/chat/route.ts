import { NextRequest, NextResponse } from 'next/server';
import { getAICompletion, isAIConfigured, SYSTEM_PROMPTS } from '@/lib/ai/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  // Masked student data (no real names)
  students?: Array<{
    maskedId: string;
    maskedName: string;
    groupName?: string;
    curriculum?: string;
    tier?: string;
    recentErrors?: string[];
    progressNotes?: string;
  }>;
  // Group data
  group?: {
    name: string;
    curriculum: string;
    tier: string;
    grade: string;
    studentCount: number;
  };
  // Recent session data (masked)
  recentSessions?: Array<{
    date: string;
    maskedStudentNames?: string[];
    errorsLogged?: number;
    otrCount?: number;
    exitTicketScore?: number;
    notes?: string;
  }>;
  // Additional context (e.g., report data, pattern analysis)
  additionalContext?: string;
}

const AI_ASSISTANT_PROMPT = `You are an expert intervention specialist assistant helping teachers with reading and math interventions for students with learning difficulties.

Your role is to:
1. Analyze student data and error patterns to suggest targeted interventions
2. Recommend specific teaching strategies based on curriculum and student needs
3. Help interpret progress monitoring data
4. Suggest ways to differentiate instruction for individual students
5. Provide evidence-based correction protocols for common errors

Important guidelines:
- Students are identified by anonymous IDs (e.g., "Student A1", "Student B2") to protect privacy
- Be specific and practical in your recommendations
- Reference the curriculum when relevant (Wilson Reading, Camino del Éxito, DeltaMath, etc.)
- Consider the intervention tier when making suggestions
- Keep responses concise but actionable
- If you don't have enough information, ask clarifying questions

You have access to:
- Student error patterns and progress data
- Group curriculum and tier information
- Recent session notes and outcomes`;

export async function POST(request: NextRequest) {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add your API key to .env' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message, context, conversationHistory = [] } = body as {
      message: string;
      context?: ChatContext;
      conversationHistory?: ChatMessage[];
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build context string from provided data
    let contextString = '';

    if (context?.group) {
      contextString += `\n\nCurrent Group Context:
- Group: ${context.group.name}
- Curriculum: ${context.group.curriculum}
- Tier: ${context.group.tier}
- Grade: ${context.group.grade}
- Students: ${context.group.studentCount}`;
    }

    if (context?.students && context.students.length > 0) {
      contextString += '\n\nStudent Data:';
      for (const student of context.students) {
        contextString += `\n\n${student.maskedName}:`;
        if (student.groupName) contextString += `\n- Group: ${student.groupName}`;
        if (student.curriculum) contextString += `\n- Curriculum: ${student.curriculum}`;
        if (student.tier) contextString += `\n- Tier: ${student.tier}`;
        if (student.recentErrors && student.recentErrors.length > 0) {
          contextString += `\n- Recent Errors: ${student.recentErrors.join('; ')}`;
        }
        if (student.progressNotes) {
          contextString += `\n- Progress Notes: ${student.progressNotes}`;
        }
      }
    }

    if (context?.recentSessions && context.recentSessions.length > 0) {
      contextString += '\n\nRecent Sessions:';
      for (const session of context.recentSessions.slice(0, 5)) {
        contextString += `\n- ${session.date}:`;
        if (session.otrCount) contextString += ` OTR: ${session.otrCount}`;
        if (session.errorsLogged) contextString += `, Errors: ${session.errorsLogged}`;
        if (session.exitTicketScore !== undefined) {
          contextString += `, Exit Ticket: ${session.exitTicketScore}%`;
        }
        if (session.notes) contextString += `\n  Notes: ${session.notes}`;
      }
    }

    // Include additional context (e.g., report analysis, pattern data)
    if (context?.additionalContext) {
      contextString += '\n\n--- Additional Data Context ---\n' + context.additionalContext;
    }

    // Build conversation for context
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = '\n\nPrevious conversation:\n';
      for (const msg of conversationHistory.slice(-6)) { // Last 6 messages for context
        conversationContext += `${msg.role === 'user' ? 'Teacher' : 'Assistant'}: ${msg.content}\n`;
      }
    }

    // Combine system prompt with context
    const fullSystemPrompt = AI_ASSISTANT_PROMPT + contextString;

    // Build user prompt with conversation history
    const userPrompt = conversationContext
      ? `${conversationContext}\nTeacher: ${message}`
      : message;

    const result = await getAICompletion({
      systemPrompt: fullSystemPrompt,
      userPrompt,
      maxTokens: 1500,
    });

    return NextResponse.json({
      response: result.text,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
