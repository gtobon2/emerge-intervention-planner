'use client';

import { Card } from '@/components/ui';
import type { DifficultyLevel } from '@/lib/worksheets';

interface SubstepOption {
  value: string;
  label: string;
}

interface SubstepGroup {
  label: string;
  options: SubstepOption[];
}

interface WorksheetConfigPanelProps {
  selectedSubstep: string;
  onSubstepChange: (substep: string) => void;
  difficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  wordCount: number;
  onWordCountChange: (count: number) => void;
  includeNonsense: boolean;
  onIncludeNonsenseChange: (include: boolean) => void;
  includeAnswerKey: boolean;
  onIncludeAnswerKeyChange: (include: boolean) => void;
  studentName: string;
  onStudentNameChange: (name: string) => void;
  substepOptions: SubstepGroup[];
}

export function WorksheetConfigPanel({
  selectedSubstep,
  onSubstepChange,
  difficulty,
  onDifficultyChange,
  wordCount,
  onWordCountChange,
  includeNonsense,
  onIncludeNonsenseChange,
  includeAnswerKey,
  onIncludeAnswerKeyChange,
  studentName,
  onStudentNameChange,
  substepOptions,
}: WorksheetConfigPanelProps) {
  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">
        2. Configure Worksheet
      </h2>

      {/* Substep Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Wilson Substep
        </label>
        <select
          value={selectedSubstep}
          onChange={(e) => onSubstepChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-text-muted/20 bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-wilson"
        >
          {substepOptions.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Difficulty
        </label>
        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => onDifficultyChange(level)}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize
                ${
                  difficulty === level
                    ? 'bg-wilson text-white'
                    : 'bg-text-muted/10 text-text-secondary hover:bg-text-muted/20'
                }
              `}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Word Count */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Number of Words: {wordCount}
        </label>
        <input
          type="range"
          min={6}
          max={20}
          value={wordCount}
          onChange={(e) => onWordCountChange(parseInt(e.target.value, 10))}
          className="w-full accent-wilson"
        />
        <div className="flex justify-between text-xs text-text-muted">
          <span>6</span>
          <span>20</span>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeNonsense}
            onChange={(e) => onIncludeNonsenseChange(e.target.checked)}
            className="w-4 h-4 rounded border-text-muted/30 text-wilson focus:ring-wilson"
          />
          <span className="text-sm text-text-secondary">Include nonsense words</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeAnswerKey}
            onChange={(e) => onIncludeAnswerKeyChange(e.target.checked)}
            className="w-4 h-4 rounded border-text-muted/30 text-wilson focus:ring-wilson"
          />
          <span className="text-sm text-text-secondary">Generate answer key</span>
        </label>
      </div>

      {/* Student Name (Optional) */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Student Name (Optional)
        </label>
        <input
          type="text"
          value={studentName}
          onChange={(e) => onStudentNameChange(e.target.value)}
          placeholder="Leave blank for fill-in field"
          className="w-full px-3 py-2 rounded-lg border border-text-muted/20 bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-wilson"
        />
      </div>
    </Card>
  );
}
