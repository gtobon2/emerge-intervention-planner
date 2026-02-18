import { NextRequest, NextResponse } from 'next/server';
import {
  buildLearningProgression,
  getLearningComponent,
  getPrerequisites,
  getDependents,
} from '@/lib/learning-commons';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const componentId = searchParams.get('componentId');
    const depth = parseInt(searchParams.get('depth') || '5', 10);
    const clampedDepth = Math.max(1, Math.min(depth, 10));

    if (!componentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: componentId' },
        { status: 400 }
      );
    }

    const component = getLearningComponent(componentId);
    if (!component) {
      return NextResponse.json(
        { error: 'Learning component not found' },
        { status: 404 }
      );
    }

    const progression = buildLearningProgression(componentId, clampedDepth);
    const prerequisites = getPrerequisites(componentId);
    const dependents = getDependents(componentId);

    return NextResponse.json({
      component,
      progression,
      prerequisites,
      dependents,
    });
  } catch (error) {
    console.error('Error building learning progression:', error);
    return NextResponse.json(
      { error: 'Failed to build learning progression' },
      { status: 500 }
    );
  }
}
