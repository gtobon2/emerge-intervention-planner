import { NextRequest, NextResponse } from 'next/server';
import { mapSkillToComponents } from '@/lib/learning-commons';
import { analyzeStandardSkills } from '@/lib/curriculum/delta-math';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skill, gradeLevel, standardCode } = body as {
      skill?: string;
      gradeLevel?: string;
      standardCode?: string;
    };

    // If a standard code is provided, do a comprehensive analysis
    if (standardCode) {
      const analysis = analyzeStandardSkills(standardCode);

      if (!analysis) {
        return NextResponse.json(
          { error: 'Standard not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        analysis,
        source: 'standard',
      });
    }

    // Otherwise, map a free-form skill description
    if (!skill) {
      return NextResponse.json(
        { error: 'Missing required field: skill or standardCode' },
        { status: 400 }
      );
    }

    const mapping = mapSkillToComponents(skill, gradeLevel);

    return NextResponse.json({
      mapping,
      source: 'skill-search',
    });
  } catch (error) {
    console.error('Error mapping skill:', error);
    return NextResponse.json(
      { error: 'Failed to map skill to learning components' },
      { status: 500 }
    );
  }
}
