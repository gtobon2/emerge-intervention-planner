/**
 * Cross-Group Pattern Detection
 *
 * Analyzes error patterns across all intervention groups to identify:
 * - Common errors that persist across groups
 * - Most effective correction protocols
 * - Students who struggle with similar patterns
 * - Errors correlating with low progress
 */

import { db } from '@/lib/local-db';
import type { Curriculum } from '@/lib/supabase/types';

// Pattern detection result types
export interface ErrorPatternInsight {
  errorPattern: string;
  curriculum: Curriculum;
  occurrenceCount: number;
  effectivenessCount: number;
  effectivenessRate: number; // 0-100
  groupsAffected: number;
  studentsAffected: number;
  correctionProtocol: string;
  trend: 'improving' | 'declining' | 'stable';
}

export interface CurriculumInsight {
  curriculum: Curriculum;
  totalErrors: number;
  uniquePatterns: number;
  avgEffectiveness: number;
  mostCommonError: string | null;
  leastEffectiveError: string | null;
}

export interface StudentErrorProfile {
  studentId: number;
  studentName: string;
  groupId: number;
  groupName: string;
  errorPatterns: string[];
  totalErrors: number;
  correctionSuccessRate: number;
}

export interface CrossGroupPattern {
  pattern: string;
  groups: Array<{
    groupId: number;
    groupName: string;
    occurrences: number;
  }>;
  totalOccurrences: number;
  suggestedIntervention: string;
}

export interface PatternAnalysisResult {
  summary: {
    totalGroups: number;
    totalStudents: number;
    totalErrors: number;
    avgEffectiveness: number;
    analyzedSessions: number;
  };
  topErrorPatterns: ErrorPatternInsight[];
  curriculumInsights: CurriculumInsight[];
  crossGroupPatterns: CrossGroupPattern[];
  studentProfiles: StudentErrorProfile[];
  recommendations: string[];
}

/**
 * Analyze error patterns across all groups
 */
export async function analyzePatterns(): Promise<PatternAnalysisResult> {
  // Fetch all data needed for analysis
  const [groups, sessions, errorBank, studentTracking, students] = await Promise.all([
    db.groups.toArray(),
    db.sessions.where('status').equals('completed').toArray(),
    db.errorBank.toArray(),
    db.studentSessionTracking.toArray(),
    db.students.toArray(),
  ]);

  // Calculate summary stats
  const summary = {
    totalGroups: groups.length,
    totalStudents: students.length,
    totalErrors: errorBank.reduce((sum, e) => sum + e.occurrence_count, 0),
    avgEffectiveness: calculateAvgEffectiveness(errorBank),
    analyzedSessions: sessions.length,
  };

  // Get top error patterns
  const topErrorPatterns = await getTopErrorPatterns(errorBank, sessions, groups);

  // Get curriculum insights
  const curriculumInsights = getCurriculumInsights(errorBank, groups);

  // Find cross-group patterns
  const crossGroupPatterns = await findCrossGroupPatterns(sessions, groups, errorBank);

  // Build student error profiles
  const studentProfiles = buildStudentProfiles(studentTracking, students, groups);

  // Generate recommendations
  const recommendations = generateRecommendations(
    topErrorPatterns,
    crossGroupPatterns,
    curriculumInsights,
    summary
  );

  return {
    summary,
    topErrorPatterns,
    curriculumInsights,
    crossGroupPatterns,
    studentProfiles,
    recommendations,
  };
}

function calculateAvgEffectiveness(errorBank: any[]): number {
  const totalOccurrences = errorBank.reduce((sum, e) => sum + e.occurrence_count, 0);
  const totalEffective = errorBank.reduce((sum, e) => sum + e.effectiveness_count, 0);

  if (totalOccurrences === 0) return 0;
  return Math.round((totalEffective / totalOccurrences) * 100);
}

async function getTopErrorPatterns(
  errorBank: any[],
  sessions: any[],
  groups: any[]
): Promise<ErrorPatternInsight[]> {
  // Group sessions by group_id for counting
  const groupSessionMap = new Map<number, any[]>();
  sessions.forEach(session => {
    const existing = groupSessionMap.get(session.group_id) || [];
    existing.push(session);
    groupSessionMap.set(session.group_id, existing);
  });

  // Count groups and students affected by each error
  const errorGroupCounts = new Map<string, Set<number>>();
  const errorStudentCounts = new Map<string, Set<number>>();

  // Get student tracking for student counts
  const studentTracking = await db.studentSessionTracking.toArray();

  studentTracking.forEach(tracking => {
    (tracking.errors_exhibited || []).forEach((pattern: string) => {
      if (!errorStudentCounts.has(pattern)) {
        errorStudentCounts.set(pattern, new Set());
      }
      errorStudentCounts.get(pattern)!.add(tracking.student_id);
    });
  });

  sessions.forEach(session => {
    const allErrors = [
      ...(session.errors_observed || []),
      ...(session.unexpected_errors || []),
    ];

    allErrors.forEach((error: any) => {
      const pattern = error.error_pattern;
      if (!errorGroupCounts.has(pattern)) {
        errorGroupCounts.set(pattern, new Set());
      }
      errorGroupCounts.get(pattern)!.add(session.group_id);
    });
  });

  // Sort errors by occurrence count and take top 10
  const sortedErrors = errorBank
    .filter(e => e.occurrence_count > 0)
    .sort((a, b) => b.occurrence_count - a.occurrence_count)
    .slice(0, 10);

  return sortedErrors.map(error => {
    const effectivenessRate = error.occurrence_count > 0
      ? Math.round((error.effectiveness_count / error.occurrence_count) * 100)
      : 0;

    // Determine trend based on recent sessions
    const trend = determineTrend(error.error_pattern, sessions);

    return {
      errorPattern: error.error_pattern,
      curriculum: error.curriculum,
      occurrenceCount: error.occurrence_count,
      effectivenessCount: error.effectiveness_count,
      effectivenessRate,
      groupsAffected: errorGroupCounts.get(error.error_pattern)?.size || 0,
      studentsAffected: errorStudentCounts.get(error.error_pattern)?.size || 0,
      correctionProtocol: error.correction_protocol,
      trend,
    };
  });
}

function determineTrend(
  pattern: string,
  sessions: any[]
): 'improving' | 'declining' | 'stable' {
  // Sort sessions by date
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedSessions.length < 4) return 'stable';

  // Split into first half and second half
  const midpoint = Math.floor(sortedSessions.length / 2);
  const firstHalf = sortedSessions.slice(0, midpoint);
  const secondHalf = sortedSessions.slice(midpoint);

  // Count occurrences in each half
  const countInHalf = (half: any[]) => {
    return half.reduce((count, session) => {
      const allErrors = [
        ...(session.errors_observed || []),
        ...(session.unexpected_errors || []),
      ];
      const found = allErrors.some((e: any) => e.error_pattern === pattern);
      return count + (found ? 1 : 0);
    }, 0);
  };

  const firstCount = countInHalf(firstHalf);
  const secondCount = countInHalf(secondHalf);

  // Normalize by number of sessions in each half
  const firstRate = firstCount / firstHalf.length;
  const secondRate = secondCount / secondHalf.length;

  const diff = secondRate - firstRate;
  if (diff < -0.1) return 'improving'; // Fewer errors in second half
  if (diff > 0.1) return 'declining'; // More errors in second half
  return 'stable';
}

function getCurriculumInsights(errorBank: any[], groups: any[]): CurriculumInsight[] {
  const curricula: Curriculum[] = ['wilson', 'delta_math', 'camino', 'wordgen', 'amira'];

  return curricula.map(curriculum => {
    const currErrors = errorBank.filter(e => e.curriculum === curriculum);

    if (currErrors.length === 0) {
      return {
        curriculum,
        totalErrors: 0,
        uniquePatterns: 0,
        avgEffectiveness: 0,
        mostCommonError: null,
        leastEffectiveError: null,
      };
    }

    const totalOccurrences = currErrors.reduce((sum, e) => sum + e.occurrence_count, 0);
    const totalEffective = currErrors.reduce((sum, e) => sum + e.effectiveness_count, 0);

    // Find most common error (by occurrences)
    const sortedByOccurrence = [...currErrors].sort(
      (a, b) => b.occurrence_count - a.occurrence_count
    );

    // Find least effective error (with minimum occurrences threshold)
    const withOccurrences = currErrors.filter(e => e.occurrence_count >= 3);
    const sortedByEffectiveness = [...withOccurrences].sort((a, b) => {
      const rateA = a.occurrence_count > 0 ? a.effectiveness_count / a.occurrence_count : 0;
      const rateB = b.occurrence_count > 0 ? b.effectiveness_count / b.occurrence_count : 0;
      return rateA - rateB;
    });

    return {
      curriculum,
      totalErrors: totalOccurrences,
      uniquePatterns: currErrors.length,
      avgEffectiveness: totalOccurrences > 0
        ? Math.round((totalEffective / totalOccurrences) * 100)
        : 0,
      mostCommonError: sortedByOccurrence[0]?.error_pattern || null,
      leastEffectiveError: sortedByEffectiveness[0]?.error_pattern || null,
    };
  }).filter(insight => insight.totalErrors > 0 || insight.uniquePatterns > 0);
}

async function findCrossGroupPatterns(
  sessions: any[],
  groups: any[],
  errorBank: any[]
): Promise<CrossGroupPattern[]> {
  // Map group IDs to names
  const groupMap = new Map(groups.map(g => [g.id, g.name]));

  // Track error patterns across groups
  const patternGroups = new Map<string, Map<number, number>>();

  sessions.forEach(session => {
    const allErrors = [
      ...(session.errors_observed || []),
      ...(session.unexpected_errors || []),
    ];

    allErrors.forEach((error: any) => {
      const pattern = error.error_pattern;
      if (!patternGroups.has(pattern)) {
        patternGroups.set(pattern, new Map());
      }

      const groupCounts = patternGroups.get(pattern)!;
      const current = groupCounts.get(session.group_id) || 0;
      groupCounts.set(session.group_id, current + 1);
    });
  });

  // Find patterns that appear in 2+ groups
  const crossPatterns: CrossGroupPattern[] = [];

  patternGroups.forEach((groupCounts, pattern) => {
    if (groupCounts.size >= 2) {
      const groupsData = Array.from(groupCounts.entries())
        .map(([groupId, count]) => ({
          groupId,
          groupName: groupMap.get(groupId) || `Group ${groupId}`,
          occurrences: count,
        }))
        .sort((a, b) => b.occurrences - a.occurrences);

      const totalOccurrences = groupsData.reduce((sum, g) => sum + g.occurrences, 0);

      // Find the correction protocol from error bank
      const bankEntry = errorBank.find(e => e.error_pattern === pattern);
      const suggestedIntervention = bankEntry?.correction_protocol ||
        'Review error pattern and develop targeted intervention strategy';

      crossPatterns.push({
        pattern,
        groups: groupsData,
        totalOccurrences,
        suggestedIntervention,
      });
    }
  });

  // Sort by total occurrences
  return crossPatterns.sort((a, b) => b.totalOccurrences - a.totalOccurrences).slice(0, 10);
}

function buildStudentProfiles(
  studentTracking: any[],
  students: any[],
  groups: any[]
): StudentErrorProfile[] {
  const studentMap = new Map(students.map(s => [s.id, s]));
  const groupMap = new Map(groups.map(g => [g.id, g]));

  // Aggregate tracking by student
  const profileMap = new Map<number, {
    errorPatterns: Set<string>;
    totalErrors: number;
    successCount: number;
    totalCorrections: number;
  }>();

  studentTracking.forEach(tracking => {
    if (!profileMap.has(tracking.student_id)) {
      profileMap.set(tracking.student_id, {
        errorPatterns: new Set(),
        totalErrors: 0,
        successCount: 0,
        totalCorrections: 0,
      });
    }

    const profile = profileMap.get(tracking.student_id)!;

    (tracking.errors_exhibited || []).forEach((pattern: string) => {
      profile.errorPatterns.add(pattern);
      profile.totalErrors++;
    });

    // Count correction effectiveness
    const effectiveness = tracking.correction_effectiveness || {};
    Object.values(effectiveness).forEach((worked: any) => {
      profile.totalCorrections++;
      if (worked) profile.successCount++;
    });
  });

  // Build profiles
  const profiles: StudentErrorProfile[] = [];

  profileMap.forEach((data, studentId) => {
    const student = studentMap.get(studentId);
    if (!student) return;

    const group = groupMap.get(student.group_id);

    profiles.push({
      studentId,
      studentName: student.name,
      groupId: student.group_id,
      groupName: group?.name || `Group ${student.group_id}`,
      errorPatterns: Array.from(data.errorPatterns),
      totalErrors: data.totalErrors,
      correctionSuccessRate: data.totalCorrections > 0
        ? Math.round((data.successCount / data.totalCorrections) * 100)
        : 0,
    });
  });

  // Sort by total errors (students with most errors first)
  return profiles.sort((a, b) => b.totalErrors - a.totalErrors).slice(0, 20);
}

function generateRecommendations(
  topPatterns: ErrorPatternInsight[],
  crossPatterns: CrossGroupPattern[],
  curriculumInsights: CurriculumInsight[],
  summary: PatternAnalysisResult['summary']
): string[] {
  const recommendations: string[] = [];

  // Check for low overall effectiveness
  if (summary.avgEffectiveness < 50) {
    recommendations.push(
      `Overall correction effectiveness is ${summary.avgEffectiveness}%. Consider reviewing correction protocols and providing additional teacher training.`
    );
  }

  // Check for patterns with very low effectiveness
  const lowEffectiveness = topPatterns.filter(p => p.effectivenessRate < 40 && p.occurrenceCount >= 5);
  if (lowEffectiveness.length > 0) {
    recommendations.push(
      `${lowEffectiveness.length} error pattern(s) have correction effectiveness below 40%. Review: ${lowEffectiveness.map(p => `"${p.errorPattern}"`).slice(0, 3).join(', ')}`
    );
  }

  // Check for cross-group patterns
  if (crossPatterns.length > 0) {
    const topCross = crossPatterns[0];
    recommendations.push(
      `"${topCross.pattern}" appears across ${topCross.groups.length} groups (${topCross.totalOccurrences} occurrences). Consider school-wide intervention or professional development on this topic.`
    );
  }

  // Check for declining trends
  const declining = topPatterns.filter(p => p.trend === 'declining');
  if (declining.length > 0) {
    recommendations.push(
      `${declining.length} error pattern(s) are increasing in frequency. Prioritize intervention for: ${declining.map(p => `"${p.errorPattern}"`).slice(0, 2).join(', ')}`
    );
  }

  // Check for curriculum-specific issues
  const lowCurriculumEffectiveness = curriculumInsights.filter(c => c.avgEffectiveness < 50 && c.totalErrors >= 10);
  if (lowCurriculumEffectiveness.length > 0) {
    lowCurriculumEffectiveness.forEach(c => {
      recommendations.push(
        `${c.curriculum.replace('_', ' ')} curriculum has ${c.avgEffectiveness}% correction effectiveness. Consider curriculum-specific training.`
      );
    });
  }

  // Positive recommendations
  const improving = topPatterns.filter(p => p.trend === 'improving');
  if (improving.length > 0) {
    recommendations.push(
      `Great progress! ${improving.length} error pattern(s) are decreasing in frequency, indicating effective interventions.`
    );
  }

  // If no specific issues, add general guidance
  if (recommendations.length === 0) {
    recommendations.push(
      'Error patterns and correction effectiveness look healthy. Continue monitoring for emerging patterns.'
    );
  }

  return recommendations;
}

/**
 * Get quick summary stats for dashboard
 */
export async function getPatternSummary(): Promise<{
  topPatterns: Array<{ pattern: string; count: number; effectiveness: number }>;
  crossGroupCount: number;
  avgEffectiveness: number;
}> {
  const [errorBank, sessions, groups] = await Promise.all([
    db.errorBank.toArray(),
    db.sessions.where('status').equals('completed').toArray(),
    db.groups.toArray(),
  ]);

  // Top 5 patterns
  const topPatterns = errorBank
    .filter(e => e.occurrence_count > 0)
    .sort((a, b) => b.occurrence_count - a.occurrence_count)
    .slice(0, 5)
    .map(e => ({
      pattern: e.error_pattern,
      count: e.occurrence_count,
      effectiveness: e.occurrence_count > 0
        ? Math.round((e.effectiveness_count / e.occurrence_count) * 100)
        : 0,
    }));

  // Count cross-group patterns
  const patternGroups = new Map<string, Set<number>>();
  sessions.forEach(session => {
    const allErrors = [
      ...(session.errors_observed || []),
      ...(session.unexpected_errors || []),
    ];
    allErrors.forEach((error: any) => {
      if (!patternGroups.has(error.error_pattern)) {
        patternGroups.set(error.error_pattern, new Set());
      }
      patternGroups.get(error.error_pattern)!.add(session.group_id);
    });
  });

  let crossGroupCount = 0;
  patternGroups.forEach((groups) => {
    if (groups.size >= 2) crossGroupCount++;
  });

  // Average effectiveness
  const totalOccurrences = errorBank.reduce((sum, e) => sum + e.occurrence_count, 0);
  const totalEffective = errorBank.reduce((sum, e) => sum + e.effectiveness_count, 0);
  const avgEffectiveness = totalOccurrences > 0
    ? Math.round((totalEffective / totalOccurrences) * 100)
    : 0;

  return {
    topPatterns,
    crossGroupCount,
    avgEffectiveness,
  };
}
