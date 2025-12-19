'use client';

import type { LearningComponent, LearningProgression } from '@/lib/learning-commons';
import { LearningComponentCard } from './learning-component-card';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface SkillProgressionProps {
  progression: LearningProgression;
  currentComponentId?: string;
  onComponentClick?: (component: LearningComponent) => void;
}

export function SkillProgression({
  progression,
  currentComponentId,
  onComponentClick,
}: SkillProgressionProps) {
  const [expanded, setExpanded] = useState(true);

  const currentIndex = progression.pathway.findIndex(
    (uuid) => uuid === currentComponentId
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div>
          <h3 className="font-semibold text-gray-900">{progression.name}</h3>
          <p className="text-sm text-gray-500">
            {progression.components.length} skills across grades{' '}
            {progression.gradeSpan.join(', ')}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="p-4">
          <div className="relative">
            {/* Progression line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {progression.components.map((component, index) => {
                const isCurrent = component.uuid === currentComponentId;
                const isPast = currentIndex >= 0 && index < currentIndex;
                const isFuture = currentIndex >= 0 && index > currentIndex;

                return (
                  <div key={component.uuid} className="relative pl-12">
                    {/* Node */}
                    <div
                      className={`absolute left-4 top-4 w-4 h-4 rounded-full border-2 ${
                        isCurrent
                          ? 'bg-movement border-movement'
                          : isPast
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-white border-gray-300'
                      }`}
                    />

                    <div
                      className={`${
                        isCurrent
                          ? 'ring-2 ring-movement ring-offset-2'
                          : isPast
                          ? 'opacity-75'
                          : ''
                      }`}
                    >
                      <LearningComponentCard
                        component={component}
                        onClick={() => onComponentClick?.(component)}
                      />
                    </div>

                    {index < progression.components.length - 1 && (
                      <div className="flex items-center justify-center py-2 pl-8 text-gray-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
