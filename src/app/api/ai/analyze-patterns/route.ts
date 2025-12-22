import { NextRequest, NextResponse } from 'next/server';
import { getAICompletion, isAIConfigured } from '@/lib/ai/client';

interface PatternData {
  summary: {
    totalGroups: number;
    totalStudents: number;
    totalErrors: number;
    avgEffectiveness: number;
    analyzedSessions: number;
  };
  topErrorPatterns: Array<{
    errorPattern: string;
    curriculum: string;
    occurrenceCount: number;
    effectivenessRate: number;
    groupsAffected: number;
    studentsAffected: number;
    correctionProtocol: string;
    trend: 'improving' | 'declining' | 'stable';
  }>;
  crossGroupPatterns: Array<{
    pattern: string;
    groups: Array<{ groupName: string; occurrences: number }>;
    totalOccurrences: number;
    suggestedIntervention: string;
  }>;
  curriculumInsights: Array<{
    curriculum: string;
    totalErrors: number;
    avgEffectiveness: number;
    mostCommonError: string | null;
    leastEffectiveError: string | null;
  }>;
}

const PATTERN_ANALYSIS_PROMPT = `You are an expert reading and math intervention specialist analyzing cross-group error patterns for a school.

Analyze the provided data and generate actionable recommendations. Focus on:
1. Identifying the most critical patterns that need immediate attention
2. Suggesting specific, evidence-based interventions
3. Identifying professional development needs
4. Recommending school-wide vs. individual group interventions
5. Highlighting successful patterns to maintain

Be specific, practical, and prioritize your recommendations based on impact and urgency.
Format your response as a JSON object with this structure:
{
  "criticalFindings": ["finding1", "finding2", ...],
  "immediateActions": ["action1", "action2", ...],
  "schoolWideRecommendations": ["rec1", "rec2", ...],
  "professionalDevelopment": ["topic1", "topic2", ...],
  "positiveTrends": ["trend1", "trend2", ...]
}`;

export async function POST(request: NextRequest) {
  try {
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add your API key to .env' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { patternData } = body as { patternData: PatternData };

    if (!patternData) {
      return NextResponse.json(
        { error: 'Pattern data is required' },
        { status: 400 }
      );
    }

    // Build a detailed summary for the AI
    let dataPrompt = `Here is the cross-group pattern analysis data:

SUMMARY:
- Total Groups: ${patternData.summary.totalGroups}
- Total Students: ${patternData.summary.totalStudents}
- Total Errors Tracked: ${patternData.summary.totalErrors}
- Average Correction Effectiveness: ${patternData.summary.avgEffectiveness}%
- Sessions Analyzed: ${patternData.summary.analyzedSessions}

TOP ERROR PATTERNS:
`;

    for (const pattern of patternData.topErrorPatterns.slice(0, 10)) {
      dataPrompt += `
- "${pattern.errorPattern}" (${pattern.curriculum})
  * Occurrences: ${pattern.occurrenceCount}
  * Effectiveness Rate: ${pattern.effectivenessRate}%
  * Groups Affected: ${pattern.groupsAffected}
  * Students Affected: ${pattern.studentsAffected}
  * Trend: ${pattern.trend}
  * Current Protocol: ${pattern.correctionProtocol}`;
    }

    dataPrompt += `

CROSS-GROUP PATTERNS (appearing in multiple groups):
`;

    for (const pattern of patternData.crossGroupPatterns.slice(0, 5)) {
      dataPrompt += `
- "${pattern.pattern}"
  * Total Occurrences: ${pattern.totalOccurrences}
  * Groups: ${pattern.groups.map(g => `${g.groupName} (${g.occurrences})`).join(', ')}`;
    }

    dataPrompt += `

CURRICULUM INSIGHTS:
`;

    for (const insight of patternData.curriculumInsights) {
      dataPrompt += `
- ${insight.curriculum.replace('_', ' ')}:
  * Total Errors: ${insight.totalErrors}
  * Avg Effectiveness: ${insight.avgEffectiveness}%
  * Most Common Error: ${insight.mostCommonError || 'N/A'}
  * Least Effective Error: ${insight.leastEffectiveError || 'N/A'}`;
    }

    dataPrompt += `

Please analyze this data and provide your recommendations.`;

    const result = await getAICompletion({
      systemPrompt: PATTERN_ANALYSIS_PROMPT,
      userPrompt: dataPrompt,
      maxTokens: 2000,
    });

    // Try to parse the AI response as JSON
    let recommendations;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // If parsing fails, return the raw text as a single recommendation
      recommendations = {
        criticalFindings: [],
        immediateActions: [],
        schoolWideRecommendations: [result.text],
        professionalDevelopment: [],
        positiveTrends: [],
      };
    }

    return NextResponse.json({
      recommendations,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error('Pattern analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze patterns' },
      { status: 500 }
    );
  }
}
