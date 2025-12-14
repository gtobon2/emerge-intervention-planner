'use client';

import { useState } from 'react';
import type { ContentEvaluation } from '@/lib/learning-commons';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Brain,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface ContentEvaluatorProps {
  initialText?: string;
  targetGradeLevel?: string;
  onEvaluationComplete?: (evaluation: ContentEvaluation) => void;
}

export function ContentEvaluator({
  initialText = '',
  targetGradeLevel,
  onEvaluationComplete,
}: ContentEvaluatorProps) {
  const [text, setText] = useState(initialText);
  const [evaluation, setEvaluation] = useState<ContentEvaluation | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function evaluateContent() {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/learning-commons/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetGradeLevel,
          evaluationType: 'full',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate content');
      }

      const data = await response.json();
      setEvaluation(data.evaluation);
      setSuggestions(data.suggestions || []);
      onEvaluationComplete?.(data.evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const complexityColors = {
    exceedinglyComplex: 'bg-purple-100 text-purple-800',
    veryComplex: 'bg-blue-100 text-blue-800',
    moderatelyComplex: 'bg-green-100 text-green-800',
    slightlyComplex: 'bg-yellow-100 text-yellow-800',
    accessible: 'bg-gray-100 text-gray-800',
  };

  const formatScore = (score: number) => `${Math.round(score * 100)}%`;

  return (
    <div className="space-y-4">
      {/* Input */}
      <Card className="p-4">
        <label className="block mb-2">
          <span className="text-sm font-medium text-gray-700">
            Content to Evaluate
          </span>
          {targetGradeLevel && (
            <Badge variant="default" className="ml-2">
              Target: Grade {targetGradeLevel}
            </Badge>
          )}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-movement focus:border-movement resize-none"
          placeholder="Paste AI-generated content here to evaluate..."
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={evaluateContent} disabled={loading || !text.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Evaluate Content
              </>
            )}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {evaluation && (
        <>
          {/* Literacy Evaluation */}
          {evaluation.literacy && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Literacy Evaluation
                </h3>
              </div>

              {/* Text Complexity */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Complexity</span>
                  <Badge
                    className={
                      complexityColors[evaluation.literacy.textComplexity.overallLevel]
                    }
                  >
                    {evaluation.literacy.textComplexity.overallLevel.replace(
                      /([A-Z])/g,
                      ' $1'
                    )}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  Grade Level: {evaluation.literacy.textComplexity.gradeLevel}
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.entries(evaluation.literacy.textComplexity.dimensions).map(
                  ([dimension, level]) => (
                    <div
                      key={dimension}
                      className="p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <span className="text-gray-600 capitalize">
                        {dimension.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <Badge
                        className={`ml-2 text-xs ${complexityColors[level]}`}
                      >
                        {level.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    </div>
                  )
                )}
              </div>

              {/* Vocabulary */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Vocabulary Analysis
                </h4>
                <div className="flex gap-4 text-sm">
                  <span>
                    Tier 1:{' '}
                    <strong>
                      {evaluation.literacy.vocabularyLevel.tier1Words}
                    </strong>
                  </span>
                  <span>
                    Tier 2:{' '}
                    <strong>
                      {evaluation.literacy.vocabularyLevel.tier2Words}
                    </strong>
                  </span>
                  <span>
                    Tier 3:{' '}
                    <strong>
                      {evaluation.literacy.vocabularyLevel.tier3Words}
                    </strong>
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Appropriateness:{' '}
                  {formatScore(
                    evaluation.literacy.vocabularyLevel.appropriatenessScore
                  )}
                </div>
              </div>

              {/* Sentence Complexity */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Sentence Analysis
                </h4>
                <div className="flex gap-4 text-sm">
                  <span>
                    Avg Length:{' '}
                    <strong>
                      {evaluation.literacy.sentenceComplexity.averageLength.toFixed(
                        1
                      )}
                    </strong>{' '}
                    words
                  </span>
                  <span>
                    Complexity:{' '}
                    <strong>
                      {formatScore(
                        evaluation.literacy.sentenceComplexity.complexityScore
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Motivation Evaluation */}
          {evaluation.motivation && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">
                  Motivation Support
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  {
                    label: 'Growth Mindset',
                    value: evaluation.motivation.growthMindsetSupport,
                  },
                  {
                    label: 'Autonomy Support',
                    value: evaluation.motivation.autonomySupport,
                  },
                  {
                    label: 'Relevance Clarity',
                    value: evaluation.motivation.relevanceClarity,
                  },
                  {
                    label: 'Achievability',
                    value: evaluation.motivation.achievabilityCues,
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="p-2 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{label}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            value >= 0.7
                              ? 'bg-emerald-500'
                              : value >= 0.4
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {formatScore(value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm">
                <span className="text-gray-600">Overall Score: </span>
                <span
                  className={`font-semibold ${
                    evaluation.motivation.overallScore >= 0.7
                      ? 'text-emerald-600'
                      : evaluation.motivation.overallScore >= 0.4
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatScore(evaluation.motivation.overallScore)}
                </span>
              </div>
            </Card>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">
                  Improvement Suggestions
                </h3>
              </div>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="text-gray-400">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
