'use client';

import { useState } from 'react';
import { ClipboardCheck, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { FidelityItem, Curriculum } from '@/lib/supabase/types';

interface FidelitySectionProps {
  items: FidelityItem[];
  onChange: (items: FidelityItem[]) => void;
  curriculum: Curriculum;
  disabled?: boolean;
}

/**
 * Wilson fidelity checklist - one item per lesson component.
 */
const WILSON_FIDELITY_ITEMS: string[] = [
  'Sound Cards / Letter-Keyword-Sound reviewed',
  'Teach / review new concept with manipulatives',
  'Quickdrill completed with accuracy',
  'Word Cards reviewed with automaticity',
  'Word List reading completed',
  'Sentence reading with prosody practice',
  'Dictation of sounds, words, and sentences',
  'Passage reading / fluency practice',
  'Listening comprehension addressed',
  'Student engagement and active responding maintained',
];

/**
 * Generic fidelity checklist for non-Wilson curricula.
 */
const DEFAULT_FIDELITY_ITEMS: string[] = [
  'Followed lesson plan sequence',
  'Used prescribed materials correctly',
  'Maintained appropriate pacing',
  'Provided corrective feedback',
  'Ensured active student engagement',
  'Completed formative assessment / exit ticket',
];

function getDefaultItems(curriculum: Curriculum): FidelityItem[] {
  const templates = curriculum === 'wilson' ? WILSON_FIDELITY_ITEMS : DEFAULT_FIDELITY_ITEMS;
  return templates.map((component) => ({
    component,
    completed: false,
    notes: '',
  }));
}

/**
 * FidelitySection - Checklist of fidelity items based on curriculum.
 * Wilson shows 10 items (one per lesson component).
 * Others show generic fidelity checklist items.
 */
export function FidelitySection({
  items,
  onChange,
  curriculum,
  disabled = false,
}: FidelitySectionProps) {
  const [expandedNotes, setExpandedNotes] = useState<number | null>(null);

  // Ensure items are initialized
  const effectiveItems = items.length > 0 ? items : getDefaultItems(curriculum);

  const completedCount = effectiveItems.filter((item) => item.completed).length;
  const totalCount = effectiveItems.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleItem = (index: number) => {
    const updated = effectiveItems.map((item, i) => {
      if (i !== index) return item;
      return { ...item, completed: !item.completed };
    });
    onChange(updated);
  };

  const updateNotes = (index: number, notes: string) => {
    const updated = effectiveItems.map((item, i) => {
      if (i !== index) return item;
      return { ...item, notes };
    });
    onChange(updated);
  };

  const markAll = (completed: boolean) => {
    onChange(effectiveItems.map((item) => ({ ...item, completed })));
  };

  const getCompletionColor = () => {
    if (completionPercent === 100) return 'text-green-400';
    if (completionPercent >= 70) return 'text-amber-400';
    return 'text-text-muted';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">Fidelity Checklist</span>
          <span className={`text-xs font-semibold ${getCompletionColor()}`}>
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markAll(true)}
            disabled={disabled}
            className="text-xs text-text-muted hover:text-green-400 transition-colors min-h-[44px] px-2"
          >
            Check All
          </button>
          <button
            type="button"
            onClick={() => markAll(false)}
            disabled={disabled}
            className="text-xs text-text-muted hover:text-red-400 transition-colors min-h-[44px] px-2"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Completion progress bar */}
      <div
        className="w-full h-1.5 rounded-full bg-border overflow-hidden"
        role="progressbar"
        aria-valuenow={completionPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Fidelity completion"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            completionPercent === 100 ? 'bg-green-500' : 'bg-movement'
          }`}
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1">
        {effectiveItems.map((item, index) => (
          <div
            key={index}
            className={`
              rounded-lg border transition-all
              ${item.completed ? 'border-green-500/20 bg-green-500/5' : 'border-border'}
            `}
          >
            <div className="flex items-center gap-3 p-2.5 min-h-[44px]">
              <Checkbox
                checked={item.completed}
                onChange={() => toggleItem(index)}
                disabled={disabled}
              />
              <span
                className={`text-sm flex-1 ${
                  item.completed ? 'text-text-muted line-through' : 'text-text-primary'
                }`}
              >
                {item.component}
              </span>
              <button
                type="button"
                onClick={() => setExpandedNotes(expandedNotes === index ? null : index)}
                aria-expanded={expandedNotes === index}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
                title="Add notes"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    expandedNotes === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Notes field */}
            {expandedNotes === index && (
              <div className="px-2.5 pb-2.5 pl-10">
                <Input
                  placeholder="Notes for this item..."
                  value={item.notes || ''}
                  onChange={(e) => updateNotes(index, e.target.value)}
                  disabled={disabled}
                  className="text-xs min-h-[36px]"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Export the default items generator for use in the main form
export { getDefaultItems as getFidelityDefaults };
