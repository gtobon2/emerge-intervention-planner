'use client';

import type { LearningComponent } from '@/lib/learning-commons';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BookOpen, GitBranch, Target } from 'lucide-react';

interface LearningComponentCardProps {
  component: LearningComponent;
  showPrerequisites?: boolean;
  isPrerequisite?: boolean;
  isNextSkill?: boolean;
  onClick?: () => void;
}

export function LearningComponentCard({
  component,
  showPrerequisites = false,
  isPrerequisite = false,
  isNextSkill = false,
  onClick,
}: LearningComponentCardProps) {
  const skillTypeColors = {
    Conceptual: 'bg-purple-100 text-purple-800',
    Procedural: 'bg-blue-100 text-blue-800',
    Application: 'bg-green-100 text-green-800',
  };

  return (
    <Card
      className={`p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${
        isPrerequisite ? 'border-l-4 border-l-amber-500' : ''
      } ${isNextSkill ? 'border-l-4 border-l-emerald-500' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-500" />
          <span className="font-mono text-xs text-gray-500">
            {component.identifier}
          </span>
        </div>
        <div className="flex gap-1">
          {component.gradeLevel?.map((grade) => (
            <Badge key={grade} variant="secondary" className="text-xs">
              Grade {grade}
            </Badge>
          ))}
          {component.skillType && (
            <Badge
              className={`text-xs ${skillTypeColors[component.skillType] || ''}`}
            >
              {component.skillType}
            </Badge>
          )}
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 mb-1">{component.label}</h4>

      <p className="text-sm text-gray-600 mb-2">{component.description}</p>

      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {component.domain && (
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {component.domain}
          </span>
        )}
        {component.cluster && (
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {component.cluster}
          </span>
        )}
      </div>

      {showPrerequisites && component.prerequisites && component.prerequisites.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-amber-600 font-medium">
            {component.prerequisites.length} prerequisite skill(s)
          </span>
        </div>
      )}
    </Card>
  );
}
