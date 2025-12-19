'use client';

import { CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Lesson component definition with name and typical duration
 */
export interface LessonComponent {
  name: string;
  duration: number; // in minutes
}

/**
 * Default Wilson Reading lesson components
 */
export const WILSON_LESSON_COMPONENTS: LessonComponent[] = [
  { name: 'Quickdrill', duration: 5 },
  { name: 'Sound Cards', duration: 3 },
  { name: 'Word Cards', duration: 5 },
  { name: 'Word List', duration: 5 },
  { name: 'Sentence Reading', duration: 5 },
  { name: 'Dictation', duration: 10 },
  { name: 'Passage Reading', duration: 10 },
];

interface LessonComponentsPanelProps {
  /** List of lesson components to display */
  components?: LessonComponent[];
  /** Names of completed components */
  completedComponents: string[];
  /** Callback when a component is toggled */
  onToggle: (componentName: string) => void;
}

/**
 * LessonComponentsPanel - Checklist for tracking completed lesson components
 *
 * Displays a grid of lesson component buttons that can be toggled to track
 * which parts of the lesson have been completed. Shows duration estimates.
 */
export function LessonComponentsPanel({
  components = WILSON_LESSON_COMPONENTS,
  completedComponents,
  onToggle,
}: LessonComponentsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          Lesson Components
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {components.map((component) => {
            const isCompleted = completedComponents.includes(component.name);
            return (
              <button
                key={component.name}
                onClick={() => onToggle(component.name)}
                className={`p-3 md:p-4 rounded-lg border text-left transition-all min-h-[60px] ${
                  isCompleted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-gray-200 hover:border-gray-300 active:scale-98'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className="font-medium text-sm md:text-base">
                    {component.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500 ml-7">
                  {component.duration} min
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
