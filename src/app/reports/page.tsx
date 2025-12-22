'use client';

import { useState, useEffect } from 'react';
import { FileText, BarChart, Users, Calendar, Layers } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { SessionReport } from '@/components/reports/session-report';
import { StudentProgressReport } from '@/components/reports/student-progress-report';
import { GroupReport } from '@/components/reports/group-report';
import { CrossGroupInsights } from '@/components/reports/cross-group-insights';
import { useSessionsStore } from '@/stores/sessions';
import { useStudentsStore } from '@/stores/students';
import { useGroupsStore } from '@/stores/groups';
import { useProgressStore } from '@/stores/progress';
import { useAIContextStore } from '@/stores/ai-context';
import { analyzePatterns, type PatternAnalysisResult } from '@/lib/analytics/pattern-detection';

type ReportType = 'session' | 'student' | 'group' | 'crossgroup' | null;

const reportCards = [
  {
    id: 'crossgroup' as ReportType,
    title: 'Cross-Group Pattern Analysis',
    description: 'Identify error patterns across all groups, find common issues, and get AI-powered recommendations',
    icon: Layers,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    badge: 'NEW',
  },
  {
    id: 'session' as ReportType,
    title: 'Session Summary Report',
    description: 'View session history, OTR counts, and error tracking across date ranges',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'student' as ReportType,
    title: 'Student Progress Report',
    description: 'Track individual student progress, PM scores, and common error patterns',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'group' as ReportType,
    title: 'Group Performance Report',
    description: 'Analyze group-level metrics, attendance, and overall progress trends',
    icon: BarChart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysisResult | null>(null);

  // Stores
  const { allSessions, fetchAllSessions } = useSessionsStore();
  const { students, fetchStudentsForGroup } = useStudentsStore();
  const { groups, fetchGroups } = useGroupsStore();
  const { data: progressData, fetchProgressForGroup } = useProgressStore();
  const { setContext, clearContext } = useAIContextStore();

  // Fetch all data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchAllSessions(),
          fetchGroups(),
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchAllSessions, fetchGroups]);

  // Fetch students and progress when a group-based report is selected
  useEffect(() => {
    if (selectedReport === 'student' || selectedReport === 'group') {
      // Fetch students for all groups
      groups.forEach((group) => {
        fetchStudentsForGroup(group.id);
        fetchProgressForGroup(group.id);
      });
    }
  }, [selectedReport, groups, fetchStudentsForGroup, fetchProgressForGroup]);

  // Load pattern analysis and set AI context when cross-group report is selected
  useEffect(() => {
    if (selectedReport === 'crossgroup') {
      analyzePatterns().then((analysis) => {
        setPatternAnalysis(analysis);

        // Build AI context with pattern analysis data
        const patternSummary = `
Cross-Group Pattern Analysis Summary:
- Total Groups: ${analysis.summary.totalGroups}
- Total Students: ${analysis.summary.totalStudents}
- Total Errors Tracked: ${analysis.summary.totalErrors}
- Average Correction Effectiveness: ${analysis.summary.avgEffectiveness}%
- Sessions Analyzed: ${analysis.summary.analyzedSessions}

Top Error Patterns:
${analysis.topErrorPatterns.slice(0, 5).map((p, i) =>
  `${i + 1}. "${p.errorPattern}" (${p.curriculum}) - ${p.occurrenceCount} occurrences, ${p.effectivenessRate}% effectiveness, trend: ${p.trend}`
).join('\n')}

Cross-Group Patterns (appearing in multiple groups):
${analysis.crossGroupPatterns.slice(0, 3).map((p, i) =>
  `${i + 1}. "${p.pattern}" - affects ${p.groups.length} groups, ${p.totalOccurrences} total occurrences`
).join('\n')}

Current Recommendations:
${analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`.trim();

        setContext({
          currentPage: 'reports',
          students: students,
          additionalContext: patternSummary,
        });
      });
    } else if (selectedReport === 'session') {
      const sessionSummary = `
Session Report Summary:
- Total Sessions: ${allSessions.length}
- Completed Sessions: ${allSessions.filter(s => s.status === 'completed').length}
- Planned Sessions: ${allSessions.filter(s => s.status === 'planned').length}
`.trim();
      // Map sessions to SessionContext format
      const mappedSessions = allSessions.slice(0, 20).map(s => ({
        date: s.date,
        errorsLogged: (s.errors_observed?.length || 0) + (s.unexpected_errors?.length || 0),
        otrCount: s.actual_otr_estimate || undefined,
        exitTicketScore: s.exit_ticket_correct && s.exit_ticket_total
          ? Math.round((s.exit_ticket_correct / s.exit_ticket_total) * 100)
          : undefined,
        notes: s.notes || undefined,
      }));
      setContext({
        currentPage: 'reports',
        recentSessions: mappedSessions,
        additionalContext: sessionSummary,
      });
    } else {
      setContext({
        currentPage: 'reports',
        students: students,
      });
    }

    return () => clearContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport, allSessions, students]); // setContext and clearContext are stable Zustand actions

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
            <p className="text-text-muted">
              Generate useful reports for tracking intervention effectiveness
            </p>
          </div>
          {selectedReport && (
            <button
              onClick={() => setSelectedReport(null)}
              className="text-sm text-movement hover:underline"
            >
              Back to Reports
            </button>
          )}
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-text-muted">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-movement mb-4"></div>
                <p>Loading report data...</p>
              </div>
            </CardContent>
          </Card>
        ) : selectedReport === null ? (
          /* Report Selection Dashboard */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reportCards.map((report) => (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedReport(report.id)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-lg ${report.bgColor} flex items-center justify-center`}>
                        <report.icon className={`w-6 h-6 ${report.color}`} />
                      </div>
                      {'badge' in report && report.badge && (
                        <span className="px-2 py-1 text-xs font-medium bg-pink-500 text-white rounded-full">
                          {report.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        {report.title}
                      </h3>
                      <p className="text-sm text-text-muted">
                        {report.description}
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="text-sm text-movement font-medium hover:underline">
                        Generate Report →
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Selected Report Content */
          <div>
            {selectedReport === 'crossgroup' && (
              <div className="space-y-4">
                <Card variant="highlighted">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-pink-600" />
                      Cross-Group Pattern Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-muted">
                      Analyze error patterns across all intervention groups to identify common issues,
                      track correction effectiveness, and receive data-driven recommendations for
                      school-wide interventions.
                    </p>
                  </CardContent>
                </Card>
                <CrossGroupInsights />
              </div>
            )}

            {selectedReport === 'session' && (
              <div className="space-y-4">
                <Card variant="highlighted">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-movement" />
                      Session Summary Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-muted">
                      Analyze session history with key metrics including OTR counts, error
                      tracking, and exit ticket performance. Filter by date range and export
                      to CSV for further analysis.
                    </p>
                  </CardContent>
                </Card>
                <SessionReport sessions={allSessions} />
              </div>
            )}

            {selectedReport === 'student' && (
              <div className="space-y-4">
                <Card variant="highlighted">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-movement" />
                      Student Progress Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-muted">
                      Track individual student progress over time including PM scores, OTR
                      participation rates, and common error patterns. Select one or more
                      students to compare their progress.
                    </p>
                  </CardContent>
                </Card>
                <StudentProgressReport
                  students={students}
                  progressData={progressData}
                  sessions={allSessions}
                />
              </div>
            )}

            {selectedReport === 'group' && (
              <div className="space-y-4">
                <Card variant="highlighted">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="w-5 h-5 text-movement" />
                      Group Performance Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-muted">
                      Analyze group-level performance including session counts, average OTRs,
                      progress trends, and individual student breakdowns. Export comprehensive
                      group data for reporting.
                    </p>
                  </CardContent>
                </Card>
                <GroupReport
                  groups={groups}
                  students={students}
                  sessions={allSessions}
                  progressData={progressData}
                />
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        {!isLoading && selectedReport === null && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-movement" />
                About Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-text-muted">
                <p>
                  Reports help you analyze intervention effectiveness and make data-driven
                  decisions about student support. Each report type provides different insights:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong className="text-text-primary">Cross-Group Patterns:</strong> Identify
                    error patterns across all groups for school-wide intervention planning
                  </li>
                  <li>
                    <strong className="text-text-primary">Session Summary:</strong> Track your
                    teaching practice across multiple sessions
                  </li>
                  <li>
                    <strong className="text-text-primary">Student Progress:</strong> Monitor
                    individual student growth and identify areas needing support
                  </li>
                  <li>
                    <strong className="text-text-primary">Group Performance:</strong> Evaluate
                    group effectiveness and make grouping decisions
                  </li>
                </ul>
                <p className="pt-2">
                  All reports can be exported to CSV format for sharing with administrators or
                  importing into other data systems.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
