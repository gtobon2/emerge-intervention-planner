'use client';

import { useState, useEffect } from 'react';
import type { StandardSkillAnalysis } from '@/lib/curriculum/delta-math';
import type { LearningComponent } from '@/lib/learning-commons';
import { LearningComponentCard } from './learning-component-card';
import { SkillProgression } from './skill-progression';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Target,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface SkillAnalysisPanelProps {
  standardCode: string;
  onClose?: () => void;
}

export function SkillAnalysisPanel({
  standardCode,
  onClose,
}: SkillAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<StandardSkillAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'components' | 'prerequisites' | 'next' | 'progression'
  >('components');

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/learning-commons/map-skill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ standardCode }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch skill analysis');
        }

        const data = await response.json();
        setAnalysis(data.analysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [standardCode]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Analyzing skill components...</span>
        </div>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-red-500">
          <AlertTriangle className="w-5 h-5" />
          <span>{error || 'Could not load skill analysis'}</span>
        </div>
      </Card>
    );
  }

  const tabs = [
    {
      id: 'components' as const,
      label: 'Learning Components',
      count: analysis.learningComponents.length,
      icon: Target,
    },
    {
      id: 'prerequisites' as const,
      label: 'Prerequisites',
      count: analysis.prerequisites.length,
      icon: ArrowLeft,
    },
    {
      id: 'next' as const,
      label: 'Next Skills',
      count: analysis.nextSkills.length,
      icon: ArrowRight,
    },
    {
      id: 'progression' as const,
      label: 'Progression',
      count: analysis.progression?.components.length || 0,
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <Badge className="mb-2 bg-movement text-white">
              {standardCode}
            </Badge>
            <h3 className="font-semibold text-lg text-gray-900">
              {analysis.standard.description}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Grade {analysis.standard.grade} • {analysis.standard.domainName}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        {/* Skills summary */}
        <div className="mt-4 flex flex-wrap gap-2">
          {analysis.standard.skills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-movement text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'components' && (
          <div className="space-y-3">
            {analysis.learningComponents.length > 0 ? (
              analysis.learningComponents.map((component) => (
                <LearningComponentCard
                  key={component.uuid}
                  component={component}
                  showPrerequisites
                />
              ))
            ) : (
              <Card className="p-4 text-center text-gray-500">
                No learning components found for this standard
              </Card>
            )}
          </div>
        )}

        {activeTab === 'prerequisites' && (
          <div className="space-y-3">
            {analysis.prerequisites.length > 0 ? (
              <>
                <p className="text-sm text-amber-600 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  Students should master these skills first
                </p>
                {analysis.prerequisites.map((component) => (
                  <LearningComponentCard
                    key={component.uuid}
                    component={component}
                    isPrerequisite
                  />
                ))}
              </>
            ) : (
              <Card className="p-4 text-center text-gray-500">
                No prerequisite skills identified
              </Card>
            )}
          </div>
        )}

        {activeTab === 'next' && (
          <div className="space-y-3">
            {analysis.nextSkills.length > 0 ? (
              <>
                <p className="text-sm text-emerald-600 flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4" />
                  Skills to develop after mastery
                </p>
                {analysis.nextSkills.map((component) => (
                  <LearningComponentCard
                    key={component.uuid}
                    component={component}
                    isNextSkill
                  />
                ))}
              </>
            ) : (
              <Card className="p-4 text-center text-gray-500">
                No next skills identified
              </Card>
            )}
          </div>
        )}

        {activeTab === 'progression' && (
          <div>
            {analysis.progression ? (
              <SkillProgression
                progression={analysis.progression}
                currentComponentId={analysis.learningComponents[0]?.uuid}
              />
            ) : (
              <Card className="p-4 text-center text-gray-500">
                No learning progression available
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
