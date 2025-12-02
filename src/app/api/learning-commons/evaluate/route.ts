import { NextRequest, NextResponse } from 'next/server';
import {
  evaluateContent,
  evaluateTextComplexity,
  evaluateLiteracy,
  evaluateMotivation,
  generateImprovementSuggestions,
} from '@/lib/learning-commons';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      text,
      targetGradeLevel,
      evaluationType,
    } = body as {
      text: string;
      targetGradeLevel?: string;
      evaluationType?: 'full' | 'literacy' | 'motivation' | 'complexity';
    };

    if (!text) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      );
    }

    let result;

    switch (evaluationType) {
      case 'complexity':
        result = {
          type: 'complexity',
          evaluation: evaluateTextComplexity(text),
        };
        break;

      case 'literacy':
        result = {
          type: 'literacy',
          evaluation: evaluateLiteracy(text, targetGradeLevel),
        };
        break;

      case 'motivation':
        result = {
          type: 'motivation',
          evaluation: evaluateMotivation(text),
        };
        break;

      case 'full':
      default:
        const fullEvaluation = evaluateContent(text, {
          targetGradeLevel,
          checkLiteracy: true,
          checkMotivation: true,
          checkStandards: false,
        });

        result = {
          type: 'full',
          evaluation: fullEvaluation,
          suggestions: generateImprovementSuggestions(fullEvaluation),
        };
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error evaluating content:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate content' },
      { status: 500 }
    );
  }
}
