'use client';

import { WizardSection } from './WizardSection';
import { WILSON_LESSON_SECTIONS, type LessonBlock, type LessonComponentType } from '@/lib/curriculum/wilson-lesson-elements';

// Re-export ElementOption for use by parent
export interface ElementOption {
  id: string;
  type: 'sound' | 'word' | 'nonsense' | 'hf_word' | 'sentence' | 'story' | 'element';
  label: string;
  sublabel?: string;
  isNew?: boolean;
  checked: boolean;
}

interface SectionState {
  elements: ElementOption[];
  duration: number;
  notes: string;
  dayAssignment: number;
  activities: string[];
}

interface WizardBlockProps {
  block: LessonBlock;
  blockLabel: string;
  blockDescription: string;
  sections: Record<LessonComponentType, SectionState>;
  onToggleElement: (component: LessonComponentType, elementId: string) => void;
  onDurationChange: (component: LessonComponentType, duration: number) => void;
  onNotesChange: (component: LessonComponentType, notes: string) => void;
  onDayChange: (component: LessonComponentType, day: number) => void;
  onActivitiesChange: (component: LessonComponentType, activities: string[]) => void;
  numDays: number;
}

export function WizardBlock({
  block,
  blockLabel,
  blockDescription,
  sections,
  onToggleElement,
  onDurationChange,
  onNotesChange,
  onDayChange,
  onActivitiesChange,
  numDays,
}: WizardBlockProps) {
  const blockSections = WILSON_LESSON_SECTIONS.filter(s => s.block === block);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">{blockLabel}</h2>
        <p className="text-sm text-text-muted mt-1">{blockDescription}</p>
      </div>

      <div className="space-y-3 max-w-2xl mx-auto">
        {blockSections.map(sectionDef => {
          const state = sections[sectionDef.type];
          if (!state) return null;

          return (
            <WizardSection
              key={sectionDef.type}
              component={sectionDef.type}
              elements={state.elements}
              onToggleElement={(id) => onToggleElement(sectionDef.type, id)}
              duration={state.duration}
              onDurationChange={(d) => onDurationChange(sectionDef.type, d)}
              notes={state.notes}
              onNotesChange={(n) => onNotesChange(sectionDef.type, n)}
              dayAssignment={state.dayAssignment}
              onDayChange={(d) => onDayChange(sectionDef.type, d)}
              numDays={numDays}
              activities={state.activities}
              onActivitiesChange={(a) => onActivitiesChange(sectionDef.type, a)}
            />
          );
        })}
      </div>
    </div>
  );
}
