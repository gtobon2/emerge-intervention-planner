import { NextRequest, NextResponse } from 'next/server';
import {
  searchComponents,
  getComponentsByGrade,
  getComponentsByDomain,
  getComponentsByCluster,
  getAllLearningComponents,
} from '@/lib/learning-commons';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const grade = searchParams.get('grade');
    const domain = searchParams.get('domain');
    const cluster = searchParams.get('cluster');

    let components;

    if (query) {
      // Search by keyword
      components = searchComponents(query);
    } else if (grade) {
      // Filter by grade level
      components = getComponentsByGrade(grade);
    } else if (domain) {
      // Filter by domain
      components = getComponentsByDomain(domain);
    } else if (cluster) {
      // Filter by cluster
      components = getComponentsByCluster(cluster);
    } else {
      // Return all components (with limit)
      components = getAllLearningComponents().slice(0, 50);
    }

    return NextResponse.json({
      components,
      count: components.length,
    });
  } catch (error) {
    console.error('Error searching learning components:', error);
    return NextResponse.json(
      { error: 'Failed to search learning components' },
      { status: 500 }
    );
  }
}
