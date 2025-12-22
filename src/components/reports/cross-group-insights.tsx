'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Users,
  Layers,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FileText,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  analyzePatterns,
  type PatternAnalysisResult,
  type ErrorPatternInsight,
  type CrossGroupPattern,
} from '@/lib/analytics';
import { getCurriculumLabel } from '@/lib/supabase/types';
import { exportPatternAnalysisToPDF } from '@/lib/export';

interface AIRecommendations {
  criticalFindings: string[];
  immediateActions: string[];
  schoolWideRecommendations: string[];
  professionalDevelopment: string[];
  positiveTrends: string[];
}

export function CrossGroupInsights() {
  const [analysis, setAnalysis] = useState<PatternAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    patterns: true,
    crossGroup: true,
    recommendations: true,
    aiRecommendations: true,
  });
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendations | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzePatterns();
      setAnalysis(result);
    } catch (err) {
      console.error('Error analyzing patterns:', err);
      setError('Failed to analyze patterns. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleExportPDF = () => {
    if (!analysis) return;
    setIsExportingPDF(true);
    try {
      exportPatternAnalysisToPDF(analysis, {
        fileName: `cross-group-analysis-${new Date().toISOString().split('T')[0]}`,
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const fetchAIRecommendations = async () => {
    if (!analysis) return;
    setIsLoadingAI(true);
    setAIError(null);

    try {
      const response = await fetch('/api/ai/analyze-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternData: analysis }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get AI recommendations');
      }

      const data = await response.json();
      setAIRecommendations(data.recommendations);
    } catch (err) {
      setAIError(err instanceof Error ? err.message : 'Failed to get AI recommendations');
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-movement border-t-transparent rounded-full animate-spin" />
            <p className="text-text-muted">Analyzing error patterns across groups...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <p className="text-red-600">{error}</p>
            <Button onClick={loadAnalysis} variant="secondary">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleExportPDF}
          disabled={isExportingPDF}
          isLoading={isExportingPDF}
          variant="secondary"
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-movement/10 rounded-lg">
              <Layers className="w-5 h-5 text-movement" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{analysis.summary.totalGroups}</p>
              <p className="text-sm text-text-muted">Groups</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{analysis.summary.totalStudents}</p>
              <p className="text-sm text-text-muted">Students</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{analysis.summary.totalErrors}</p>
              <p className="text-sm text-text-muted">Total Errors</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              analysis.summary.avgEffectiveness >= 70 ? 'bg-emerald-500/10' :
              analysis.summary.avgEffectiveness >= 50 ? 'bg-amber-500/10' :
              'bg-red-500/10'
            }`}>
              <Target className={`w-5 h-5 ${
                analysis.summary.avgEffectiveness >= 70 ? 'text-emerald-500' :
                analysis.summary.avgEffectiveness >= 50 ? 'text-amber-500' :
                'text-red-500'
              }`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{analysis.summary.avgEffectiveness}%</p>
              <p className="text-sm text-text-muted">Avg Effectiveness</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI-Powered Recommendations */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <button
            onClick={() => toggleSection('aiRecommendations')}
            className="w-full flex items-center justify-between"
          >
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI-Powered Recommendations
              <Badge variant="default" className="ml-2 bg-purple-100 text-purple-700">
                AI
              </Badge>
            </CardTitle>
            {expandedSections.aiRecommendations ? (
              <ChevronUp className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            )}
          </button>
        </CardHeader>
        {expandedSections.aiRecommendations && (
          <CardContent>
            {!aiRecommendations && !isLoadingAI && !aiError && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto text-purple-300 mb-4" />
                <p className="text-text-muted mb-4">
                  Get AI-powered analysis and recommendations based on your error patterns.
                </p>
                <Button
                  onClick={fetchAIRecommendations}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate AI Recommendations
                </Button>
              </div>
            )}

            {isLoadingAI && (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-text-muted">Analyzing patterns with AI...</p>
              </div>
            )}

            {aiError && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-4" />
                <p className="text-red-600 mb-4">{aiError}</p>
                <Button onClick={fetchAIRecommendations} variant="secondary" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              </div>
            )}

            {aiRecommendations && (
              <div className="space-y-6">
                {/* Refresh button */}
                <div className="flex justify-end">
                  <Button
                    onClick={fetchAIRecommendations}
                    variant="ghost"
                    size="sm"
                    disabled={isLoadingAI}
                    className="gap-2 text-purple-600"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {/* Critical Findings */}
                {aiRecommendations.criticalFindings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Critical Findings
                    </h4>
                    <ul className="space-y-2">
                      {aiRecommendations.criticalFindings.map((finding, i) => (
                        <li key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Immediate Actions */}
                {aiRecommendations.immediateActions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-amber-700 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Immediate Actions
                    </h4>
                    <ul className="space-y-2">
                      {aiRecommendations.immediateActions.map((action, i) => (
                        <li key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* School-Wide Recommendations */}
                {aiRecommendations.schoolWideRecommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      School-Wide Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {aiRecommendations.schoolWideRecommendations.map((rec, i) => (
                        <li key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Professional Development */}
                {aiRecommendations.professionalDevelopment.length > 0 && (
                  <div>
                    <h4 className="font-medium text-purple-700 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Professional Development
                    </h4>
                    <ul className="space-y-2">
                      {aiRecommendations.professionalDevelopment.map((topic, i) => (
                        <li key={i} className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Positive Trends */}
                {aiRecommendations.positiveTrends.length > 0 && (
                  <div>
                    <h4 className="font-medium text-emerald-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Positive Trends
                    </h4>
                    <ul className="space-y-2">
                      {aiRecommendations.positiveTrends.map((trend, i) => (
                        <li key={i} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                          {trend}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Basic Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('recommendations')}
              className="w-full flex items-center justify-between"
            >
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Quick Summary
                <span className="text-xs font-normal text-text-muted">(Rule-based)</span>
              </CardTitle>
              {expandedSections.recommendations ? (
                <ChevronUp className="w-5 h-5 text-text-muted" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-muted" />
              )}
            </button>
          </CardHeader>
          {expandedSections.recommendations && (
            <CardContent>
              <ul className="space-y-3">
                {analysis.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className={`p-3 rounded-lg flex items-start gap-3 ${
                      rec.includes('Great progress') || rec.includes('look healthy')
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    {rec.includes('Great progress') || rec.includes('look healthy') ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${
                      rec.includes('Great progress') || rec.includes('look healthy')
                        ? 'text-emerald-800'
                        : 'text-amber-800'
                    }`}>
                      {rec}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      {/* Top Error Patterns */}
      <Card>
        <CardHeader>
          <button
            onClick={() => toggleSection('patterns')}
            className="w-full flex items-center justify-between"
          >
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-movement" />
              Top Error Patterns
            </CardTitle>
            {expandedSections.patterns ? (
              <ChevronUp className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            )}
          </button>
        </CardHeader>
        {expandedSections.patterns && (
          <CardContent>
            {analysis.topErrorPatterns.length === 0 ? (
              <p className="text-center text-text-muted py-8">
                No error patterns recorded yet. Complete some sessions to see patterns.
              </p>
            ) : (
              <div className="space-y-3">
                {analysis.topErrorPatterns.map((pattern, i) => (
                  <ErrorPatternCard key={i} pattern={pattern} rank={i + 1} />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Cross-Group Patterns */}
      <Card>
        <CardHeader>
          <button
            onClick={() => toggleSection('crossGroup')}
            className="w-full flex items-center justify-between"
          >
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              Cross-Group Patterns
              {analysis.crossGroupPatterns.length > 0 && (
                <Badge variant="default" className="ml-2">
                  {analysis.crossGroupPatterns.length} found
                </Badge>
              )}
            </CardTitle>
            {expandedSections.crossGroup ? (
              <ChevronUp className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            )}
          </button>
        </CardHeader>
        {expandedSections.crossGroup && (
          <CardContent>
            {analysis.crossGroupPatterns.length === 0 ? (
              <p className="text-center text-text-muted py-8">
                No patterns found across multiple groups yet.
              </p>
            ) : (
              <div className="space-y-4">
                {analysis.crossGroupPatterns.map((pattern, i) => (
                  <CrossGroupPatternCard key={i} pattern={pattern} />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Curriculum Insights */}
      {analysis.curriculumInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Curriculum Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.curriculumInsights.map((insight, i) => (
                <div
                  key={i}
                  className="p-4 bg-foundation rounded-lg border border-text-muted/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="curriculum" curriculum={insight.curriculum}>
                      {getCurriculumLabel(insight.curriculum)}
                    </Badge>
                    <span className={`text-sm font-medium ${
                      insight.avgEffectiveness >= 70 ? 'text-emerald-600' :
                      insight.avgEffectiveness >= 50 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {insight.avgEffectiveness}% effective
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Total Errors:</span>
                      <span className="font-medium">{insight.totalErrors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Unique Patterns:</span>
                      <span className="font-medium">{insight.uniquePatterns}</span>
                    </div>
                    {insight.mostCommonError && (
                      <div className="pt-2 border-t border-text-muted/10">
                        <p className="text-text-muted text-xs mb-1">Most common:</p>
                        <p className="text-text-primary truncate" title={insight.mostCommonError}>
                          {insight.mostCommonError}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ErrorPatternCard({ pattern, rank }: { pattern: ErrorPatternInsight; rank: number }) {
  const TrendIcon = pattern.trend === 'improving' ? TrendingDown :
    pattern.trend === 'declining' ? TrendingUp : Minus;

  const trendColor = pattern.trend === 'improving' ? 'text-emerald-500' :
    pattern.trend === 'declining' ? 'text-red-500' : 'text-gray-400';

  const trendBg = pattern.trend === 'improving' ? 'bg-emerald-50' :
    pattern.trend === 'declining' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="p-4 bg-foundation rounded-lg border border-text-muted/10 hover:border-movement/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-movement/10 flex items-center justify-center text-movement font-bold">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-medium text-text-primary">{pattern.errorPattern}</p>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${trendBg}`}>
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {pattern.trend === 'improving' ? 'Decreasing' :
                  pattern.trend === 'declining' ? 'Increasing' : 'Stable'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted mb-2">
            <Badge variant="curriculum" curriculum={pattern.curriculum}>
              {getCurriculumLabel(pattern.curriculum)}
            </Badge>
            <span>{pattern.occurrenceCount} occurrences</span>
            <span>{pattern.groupsAffected} groups</span>
            <span>{pattern.studentsAffected} students</span>
          </div>

          {/* Effectiveness bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pattern.effectivenessRate >= 70 ? 'bg-emerald-500' :
                  pattern.effectivenessRate >= 50 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${pattern.effectivenessRate}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${
              pattern.effectivenessRate >= 70 ? 'text-emerald-600' :
              pattern.effectivenessRate >= 50 ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {pattern.effectivenessRate}%
            </span>
          </div>

          {pattern.correctionProtocol && (
            <p className="text-xs text-text-muted mt-2 line-clamp-2">
              <span className="font-medium">Correction:</span> {pattern.correctionProtocol}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CrossGroupPatternCard({ pattern }: { pattern: CrossGroupPattern }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-purple-900 mb-2">{pattern.pattern}</p>
          <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
            <span className="font-medium">{pattern.totalOccurrences}</span> total occurrences across
            <span className="font-medium">{pattern.groups.length}</span> groups
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {pattern.groups.slice(0, expanded ? undefined : 3).map((group, i) => (
              <Badge key={i} variant="default" className="bg-purple-100 text-purple-700">
                {group.groupName} ({group.occurrences})
              </Badge>
            ))}
            {!expanded && pattern.groups.length > 3 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs text-purple-600 hover:underline"
              >
                +{pattern.groups.length - 3} more
              </button>
            )}
          </div>

          <div className="p-2 bg-white rounded border border-purple-100">
            <p className="text-xs text-purple-800">
              <span className="font-medium">Suggested intervention:</span> {pattern.suggestedIntervention}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
