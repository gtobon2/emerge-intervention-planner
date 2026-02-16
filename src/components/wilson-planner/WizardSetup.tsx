'use client';

import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { WILSON_STEPS } from '@/lib/curriculum/wilson';

interface WizardSetupProps {
  selectedSubstep: string;
  onSubstepChange: (substep: string) => void;
  numDays: number;
  onNumDaysChange: (days: number) => void;
  isGroup: boolean;
  onIsGroupChange: (isGroup: boolean) => void;
}

export function WizardSetup({
  selectedSubstep,
  onSubstepChange,
  numDays,
  onNumDaysChange,
  isGroup,
  onIsGroupChange,
}: WizardSetupProps) {
  // Build grouped substep options
  const substepOptions = useMemo(() => {
    return WILSON_STEPS.map(step => ({
      step: step.step,
      name: step.name,
      substeps: step.substeps.map(ss => ({
        value: ss.substep,
        label: `${ss.substep}: ${ss.name}`,
      })),
    }));
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center">
        <BookOpen className="w-10 h-10 mx-auto mb-3 text-movement" />
        <h2 className="text-xl font-bold text-text-primary">Lesson Setup</h2>
        <p className="text-sm text-text-muted mt-1">
          Choose the substep and planning options
        </p>
      </div>

      {/* Substep Picker */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Wilson Substep
        </label>
        <select
          value={selectedSubstep}
          onChange={(e) => onSubstepChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {substepOptions.map(step => (
            <optgroup key={step.step} label={`Step ${step.step}: ${step.name}`}>
              {step.substeps.map(ss => (
                <option key={ss.value} value={ss.value}>
                  {ss.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Number of Days */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Number of Days
        </label>
        <div className="flex gap-3">
          {[1, 2, 3].map(d => (
            <button
              key={d}
              onClick={() => onNumDaysChange(d)}
              className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                numDays === d
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-text-muted hover:border-primary/50'
              }`}
            >
              {d} Day{d > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Session Type */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Session Type
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => onIsGroupChange(true)}
            className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              isGroup
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-text-muted hover:border-primary/50'
            }`}
          >
            Group
          </button>
          <button
            onClick={() => onIsGroupChange(false)}
            className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              !isGroup
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-text-muted hover:border-primary/50'
            }`}
          >
            1-on-1
          </button>
        </div>
      </div>
    </div>
  );
}
