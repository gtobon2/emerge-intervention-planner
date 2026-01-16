'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Edit2, Check, MapPin } from 'lucide-react';
import { Card, CardContent, Button, Badge, CurriculumBadge } from '@/components/ui';
import type { ErrorBankSeedEntry } from '@/lib/error-banks';
import type { Curriculum, CurriculumPosition } from '@/lib/supabase/types';

interface ErrorCardProps {
  error: ErrorBankSeedEntry;
  isCustom?: boolean;
  onEdit?: () => void;
}

/**
 * Format position for display based on curriculum type
 */
function formatPosition(curriculum: Curriculum, position: CurriculumPosition | null): string | null {
  if (!position) return null;

  switch (curriculum) {
    case 'wilson': {
      const pos = position as { step?: number; substep?: string; stepRange?: [number, number] };
      if (pos.stepRange) {
        return `Steps ${pos.stepRange[0]}-${pos.stepRange[1]}`;
      }
      if (pos.step !== undefined && pos.substep !== undefined) {
        return `Step ${pos.substep}`;
      }
      if (pos.step !== undefined) {
        return `Step ${pos.step}`;
      }
      return null;
    }
    case 'camino':
    case 'despegando': {
      const pos = position as { lesson?: number; unit?: number; lessonRange?: [number, number] };
      if (pos.lessonRange) {
        return `Lessons ${pos.lessonRange[0]}-${pos.lessonRange[1]}`;
      }
      if (pos.unit !== undefined && pos.lesson !== undefined) {
        return `Unit ${pos.unit}, Lesson ${pos.lesson}`;
      }
      if (pos.lesson !== undefined) {
        return `Lesson ${pos.lesson}`;
      }
      return null;
    }
    case 'delta_math': {
      const pos = position as { standard?: string; module?: number };
      if (pos.standard) {
        return pos.standard;
      }
      if (pos.module !== undefined) {
        return `Module ${pos.module}`;
      }
      return null;
    }
    case 'wordgen': {
      const pos = position as { unit?: number; day?: number };
      if (pos.unit !== undefined && pos.day !== undefined) {
        return `Unit ${pos.unit}, Day ${pos.day}`;
      }
      return null;
    }
    case 'amira': {
      const pos = position as { level?: string };
      if (pos.level) {
        return pos.level;
      }
      return null;
    }
    default:
      return null;
  }
}

export function ErrorCard({ error, isCustom = false, onEdit }: ErrorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(error.correction_protocol);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const positionLabel = formatPosition(error.curriculum, error.position);

  return (
    <Card className="hover:border-movement/20 transition-all">
      <CardContent>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <CurriculumBadge curriculum={error.curriculum} />
                {positionLabel && (
                  <Badge className="bg-surface border-text-muted/20 text-text-primary flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {positionLabel}
                  </Badge>
                )}
                {!positionLabel && (
                  <Badge className="bg-gray-100 border-gray-200 text-gray-500">
                    Universal
                  </Badge>
                )}
                {isCustom && (
                  <Badge className="bg-breakthrough/20 text-breakthrough border-breakthrough/30">
                    Custom
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-semibold text-text-primary leading-tight">
                {error.error_pattern}
              </h3>
            </div>
            {isCustom && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="flex-shrink-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Underlying Gap */}
          {error.underlying_gap && (
            <div className="text-sm">
              <span className="text-text-muted">Gap: </span>
              <span className="text-text-primary">{error.underlying_gap}</span>
            </div>
          )}

          {/* Correction Protocol */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-muted">Correction Protocol</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-text-primary bg-foundation rounded-lg p-3">
              {error.correction_protocol}
            </p>
          </div>

          {/* Expandable Section */}
          {(error.correction_prompts?.length || error.visual_cues || error.kinesthetic_cues) && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-medium text-movement hover:text-movement/80 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show More Details
                  </>
                )}
              </button>

              {isExpanded && (
                <div className="space-y-3 pt-2 border-t border-text-muted/10">
                  {/* Correction Prompts */}
                  {error.correction_prompts && error.correction_prompts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-text-muted mb-2">
                        Correction Prompts
                      </h4>
                      <ul className="space-y-1">
                        {error.correction_prompts.map((prompt, idx) => (
                          <li key={idx} className="text-sm text-text-primary pl-4 relative">
                            <span className="absolute left-0 text-movement">•</span>
                            {prompt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Visual Cues */}
                  {error.visual_cues && (
                    <div>
                      <h4 className="text-sm font-medium text-text-muted mb-1">
                        Visual Cues
                      </h4>
                      <p className="text-sm text-text-primary">{error.visual_cues}</p>
                    </div>
                  )}

                  {/* Kinesthetic Cues */}
                  {error.kinesthetic_cues && (
                    <div>
                      <h4 className="text-sm font-medium text-text-muted mb-1">
                        Kinesthetic Cues
                      </h4>
                      <p className="text-sm text-text-primary">{error.kinesthetic_cues}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
