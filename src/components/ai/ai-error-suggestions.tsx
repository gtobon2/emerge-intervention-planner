'use client';

import { useState } from 'react';
import { Sparkles, Plus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AIPanel, AILoading, AIError, AIBadge } from './ai-panel';
import type { Curriculum, CurriculumPosition, AnticipatedError } from '@/lib/supabase/types';

export interface ErrorSuggestion {
  error: string;
  gap: string;
  correction: string;
  prompts: string[];
}

export interface AIErrorSuggestionsProps {
  curriculum: Curriculum;
  position: CurriculumPosition;
  previousErrors?: string[];
  onAddError: (error: AnticipatedError) => void;
  onAddAllErrors: (errors: AnticipatedError[]) => void;
}

export function AIErrorSuggestions({
  curriculum,
  position,
  previousErrors = [],
  onAddError,
  onAddAllErrors,
}: AIErrorSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ErrorSuggestion[]>([]);
  const [addedErrors, setAddedErrors] = useState<Set<number>>(new Set());

  const handleGenerateSuggestions = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setAddedErrors(new Set());

    try {
      const response = await fetch('/api/ai/suggest-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculum,
          position,
          previousErrors,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate suggestions');
      }

      const data = await response.json();

      // Parse the AI response into structured suggestions
      const parsedSuggestions = parseAISuggestions(data.suggestions);
      setSuggestions(parsedSuggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const parseAISuggestions = (text: string): ErrorSuggestion[] => {
    const suggestions: ErrorSuggestion[] = [];
    const blocks = text.split(/ERROR:/i).filter(Boolean);

    blocks.forEach((block) => {
      const errorMatch = block.match(/^([\s\S]*?)(?=GAP:|CORRECTION:|$)/);
      const gapMatch = block.match(/GAP:\s*([\s\S]*?)(?=CORRECTION:|PROMPTS:|$)/);
      const correctionMatch = block.match(/CORRECTION:\s*([\s\S]*?)(?=PROMPTS:|$)/);
      const promptsMatch = block.match(/PROMPTS:\s*([\s\S]*?)(?=ERROR:|$)/);

      if (errorMatch && correctionMatch) {
        const prompts = promptsMatch
          ? promptsMatch[1]
              .split(/[-•]\s*/)
              .map((p) => p.trim())
              .filter(Boolean)
          : [];

        suggestions.push({
          error: errorMatch[1].trim(),
          gap: gapMatch ? gapMatch[1].trim() : '',
          correction: correctionMatch[1].trim(),
          prompts,
        });
      }
    });

    return suggestions;
  };

  const handleAddSuggestion = (index: number) => {
    const suggestion = suggestions[index];
    const newError: AnticipatedError = {
      id: `ai-${Date.now()}-${index}`,
      error_pattern: suggestion.error,
      correction_protocol: suggestion.correction,
    };

    onAddError(newError);
    setAddedErrors((prev) => new Set([...Array.from(prev), index]));
  };

  const handleAddAll = () => {
    const newErrors: AnticipatedError[] = suggestions.map((suggestion, index) => ({
      id: `ai-${Date.now()}-${index}`,
      error_pattern: suggestion.error,
      correction_protocol: suggestion.correction,
    }));

    onAddAllErrors(newErrors);
    const allIndices = suggestions.map((_, i) => i);
    setAddedErrors(new Set(allIndices));
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleGenerateSuggestions}
        className="border-purple-200 hover:border-purple-300 hover:bg-purple-50"
      >
        <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
        Suggest Errors with AI
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="AI Error Suggestions"
        size="xl"
      >
        <AIPanel className="p-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 rounded-lg p-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">
                AI-Generated Error Suggestions
              </h3>
              <p className="text-sm text-gray-600">
                Based on {curriculum} curriculum at this position, here are likely student
                errors to anticipate.
              </p>
            </div>
          </div>
        </AIPanel>

        {isLoading && <AILoading message="Analyzing curriculum and generating suggestions..." />}

        {error && <AIError message={error} onRetry={handleGenerateSuggestions} />}

        {!isLoading && !error && suggestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} found
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddAll}
                disabled={addedErrors.size === suggestions.length}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add All
              </Button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${
                      addedErrors.has(index)
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-white border-gray-200 hover:border-purple-200'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {suggestion.error}
                      </h4>
                      {suggestion.gap && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong className="text-amber-700">Underlying Gap:</strong>{' '}
                          {suggestion.gap}
                        </p>
                      )}
                      <p className="text-sm text-gray-700">
                        <strong className="text-blue-700">Correction Protocol:</strong>{' '}
                        {suggestion.correction}
                      </p>
                    </div>
                    {addedErrors.has(index) ? (
                      <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Added
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddSuggestion(index)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>

                  {suggestion.prompts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Correction Prompts:
                      </p>
                      <ul className="space-y-1">
                        {suggestion.prompts.map((prompt, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span>
                            <span>{prompt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && suggestions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Click the button above to generate AI suggestions</p>
          </div>
        )}
      </Modal>
    </>
  );
}
