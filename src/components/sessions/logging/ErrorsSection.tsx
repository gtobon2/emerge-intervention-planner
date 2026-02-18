'use client';

import { useState } from 'react';
import { AlertTriangle, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Student, ObservedError } from '@/lib/supabase/types';

interface ErrorsSectionProps {
  errors: ObservedError[];
  onChange: (errors: ObservedError[]) => void;
  students: Student[];
  disabled?: boolean;
}

const ERROR_TYPES = [
  { value: 'phonological', label: 'Phonological' },
  { value: 'orthographic', label: 'Orthographic' },
  { value: 'morphological', label: 'Morphological' },
  { value: 'comprehension', label: 'Comprehension' },
  { value: 'fluency', label: 'Fluency' },
];

function createEmptyError(): ObservedError {
  return {
    error_pattern: '',
    correction_used: '',
    correction_worked: false,
    add_to_bank: false,
  };
}

/**
 * ErrorsSection - List of observed errors with type selector and description.
 * Supports add/remove rows. Each row has: error type, description, correction used.
 */
export function ErrorsSection({
  errors,
  onChange,
  students,
  disabled = false,
}: ErrorsSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const addError = () => {
    onChange([...errors, createEmptyError()]);
    setExpandedIndex(errors.length);
  };

  const removeError = (index: number) => {
    const updated = errors.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const updateError = (index: number, field: keyof ObservedError, value: string | boolean) => {
    const updated = errors.map((err, i) => {
      if (i !== index) return err;
      return { ...err, [field]: value };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">Observed Errors</span>
          {errors.length > 0 && (
            <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
              {errors.length}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addError}
          disabled={disabled}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Error
        </Button>
      </div>

      {errors.length === 0 && (
        <div className="text-center py-6 text-text-muted text-sm border border-dashed border-border rounded-xl">
          No errors recorded. Tap &quot;Add Error&quot; to log observed errors.
        </div>
      )}

      <div className="space-y-2">
        {errors.map((error, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <div
              key={index}
              className="border border-border rounded-xl overflow-hidden transition-all"
            >
              {/* Collapsed header */}
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full flex items-center justify-between p-3 min-h-[44px] text-left hover:bg-surface-elevated transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 whitespace-nowrap">
                    {error.error_pattern
                      ? ERROR_TYPES.find((t) => t.value === error.error_pattern)?.label || error.error_pattern
                      : 'Untyped'}
                  </span>
                  <span className="text-sm text-text-muted truncate">
                    {error.correction_used || 'No description'}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeError(index);
                    }}
                    disabled={disabled}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronDown
                    className={`w-4 h-4 text-text-muted transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border">
                  {/* Error type selector */}
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      Error Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ERROR_TYPES.map((type) => {
                        const isSelected = error.error_pattern === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => updateError(index, 'error_pattern', type.value)}
                            disabled={disabled}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px]
                              border transition-all
                              ${
                                isSelected
                                  ? 'border-movement bg-movement/10 text-movement'
                                  : 'border-border text-text-muted hover:border-border-hover'
                              }
                              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description / correction used */}
                  <Input
                    placeholder="Describe the error and correction used..."
                    value={error.correction_used}
                    onChange={(e) => updateError(index, 'correction_used', e.target.value)}
                    disabled={disabled}
                    className="min-h-[44px]"
                  />

                  {/* Correction worked toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateError(index, 'correction_worked', !error.correction_worked)
                      }
                      disabled={disabled}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px]
                        border transition-all
                        ${
                          error.correction_worked
                            ? 'border-green-500 bg-green-500/10 text-green-400'
                            : 'border-border text-text-muted hover:border-border-hover'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {error.correction_worked ? 'Correction Worked' : 'Correction Not Tested'}
                    </button>

                    <button
                      type="button"
                      onClick={() => updateError(index, 'add_to_bank', !error.add_to_bank)}
                      disabled={disabled}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px]
                        border transition-all
                        ${
                          error.add_to_bank
                            ? 'border-breakthrough bg-breakthrough/10 text-breakthrough'
                            : 'border-border text-text-muted hover:border-border-hover'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {error.add_to_bank ? 'Will Add to Bank' : 'Add to Error Bank'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
