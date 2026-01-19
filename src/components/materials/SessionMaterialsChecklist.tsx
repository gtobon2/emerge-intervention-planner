'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useSessionMaterials } from '@/hooks/use-group-materials';
import type { Curriculum, MaterialCategory, SessionMaterialWithCatalog } from '@/lib/supabase/types';
import { MATERIAL_CATEGORY_LABELS } from '@/lib/supabase/types';

interface SessionMaterialsChecklistProps {
  sessionId: string;
  curriculum: Curriculum;
  curriculumPosition: any;
  canEdit?: boolean;
  compact?: boolean;
}

// Category order for display
const CATEGORY_ORDER: MaterialCategory[] = [
  'cards',
  'manipulatives',
  'texts',
  'workbooks',
  'teacher',
  'visuals',
  'technology',
  'assessment',
  'other',
];

export function SessionMaterialsChecklist({
  sessionId,
  curriculum,
  curriculumPosition,
  canEdit = true,
  compact = false,
}: SessionMaterialsChecklistProps) {
  const {
    materials,
    summary,
    isLoading,
    error,
    toggleMaterial,
    bulkToggle,
    generate,
    refresh,
  } = useSessionMaterials(sessionId);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER));
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-expand all categories in compact mode
  useEffect(() => {
    if (compact && materials.length > 0) {
      const allCategories = new Set<string>();
      materials.forEach((m) => {
        const category = m.material?.category || 'other';
        allCategories.add(category);
      });
      setExpandedCategories(allCategories);
    }
  }, [compact, materials]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generate(curriculum, curriculumPosition);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAllPrepared = async () => {
    await bulkToggle(true);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Group materials by category
  const materialsByCategory = materials.reduce((acc, m) => {
    const category = m.material?.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(m);
    return acc;
  }, {} as Record<MaterialCategory, SessionMaterialWithCatalog[]>);

  // Get material display info
  const getMaterialInfo = (m: SessionMaterialWithCatalog) => {
    return {
      name: m.specific_item || m.material?.name || 'Unknown Material',
      description: m.material?.description,
      quantity: m.quantity_needed,
    };
  };

  // Show generate prompt if no materials
  if (!isLoading && materials.length === 0) {
    return (
      <Card className={compact ? 'border-0 shadow-none' : ''}>
        {!compact && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-movement" />
              <span>Session Materials</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="text-center py-4">
            <Package className="w-10 h-10 mx-auto mb-2 text-text-muted opacity-50" />
            <p className="text-sm text-text-muted mb-3">
              No materials generated for this session
            </p>
            {canEdit && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="sm"
                className="gap-2"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate Materials List
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = summary.percent;
  const isAllPrepared = summary.prepared === summary.total && summary.total > 0;

  return (
    <Card className={compact ? 'border-0 shadow-none' : ''}>
      {!compact && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-movement" />
              <span>Session Materials</span>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && !isAllPrepared && materials.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllPrepared}
                  className="gap-1 text-xs min-h-[32px]"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark All
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={refresh} className="min-h-[32px]">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? 'p-0' : 'space-y-3'}>
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-muted">
              {summary.prepared} / {summary.total} prepared
            </span>
            <span
              className={`text-xs font-bold ${
                progressPercent >= 100
                  ? 'text-green-600'
                  : progressPercent >= 75
                    ? 'text-emerald-600'
                    : progressPercent >= 50
                      ? 'text-amber-600'
                      : 'text-red-600'
              }`}
            >
              {progressPercent}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent >= 100
                  ? 'bg-green-500'
                  : progressPercent >= 75
                    ? 'bg-emerald-500'
                    : progressPercent >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-foundation rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {CATEGORY_ORDER.filter((cat) => (materialsByCategory[cat]?.length || 0) > 0).map(
              (category) => {
                const items = materialsByCategory[category] || [];
                const isExpanded = expandedCategories.has(category);
                const categoryPrepared = items.filter((m) => m.is_prepared).length;
                const categoryTotal = items.length;
                const isCategoryComplete = categoryPrepared === categoryTotal;

                return (
                  <div
                    key={category}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-2 hover:bg-foundation/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-text-primary">
                          {MATERIAL_CATEGORY_LABELS[category]}
                        </span>
                        <span className="text-xs text-text-muted">
                          ({categoryPrepared}/{categoryTotal})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isCategoryComplete && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-text-muted" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-text-muted" />
                        )}
                      </div>
                    </button>

                    {/* Category Items */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-foundation/30">
                        {items.map((item) => {
                          const info = getMaterialInfo(item);
                          return (
                            <div
                              key={item.id}
                              className={`flex items-start gap-2 p-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                                item.is_prepared ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                              }`}
                            >
                              {canEdit ? (
                                <button
                                  onClick={() => toggleMaterial(item.id, !item.is_prepared)}
                                  className="mt-0.5 flex-shrink-0"
                                >
                                  {item.is_prepared ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-text-muted hover:text-movement transition-colors" />
                                  )}
                                </button>
                              ) : (
                                <div className="mt-0.5 flex-shrink-0">
                                  {item.is_prepared ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-text-muted" />
                                  )}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`text-xs font-medium ${
                                      item.is_prepared
                                        ? 'text-text-muted line-through'
                                        : 'text-text-primary'
                                    }`}
                                  >
                                    {info.name}
                                  </span>
                                  {info.quantity && parseInt(info.quantity) > 1 && (
                                    <span className="text-xs text-movement font-medium">
                                      x{info.quantity}
                                    </span>
                                  )}
                                  {item.is_auto_generated && (
                                    <span title="Auto-generated">
                                      <Sparkles className="w-3 h-3 text-amber-500" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* Regenerate Button */}
        {canEdit && materials.length > 0 && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-1 p-2 text-xs text-text-muted hover:text-text-primary hover:bg-foundation transition-colors rounded"
          >
            {isGenerating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Regenerate for this position
          </button>
        )}
      </CardContent>
    </Card>
  );
}
