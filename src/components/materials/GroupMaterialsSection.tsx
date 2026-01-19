'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Layers,
  Puzzle,
  BookOpen,
  FileText,
  PenTool,
  Image,
  Monitor,
  ClipboardCheck,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { useGroupMaterials } from '@/hooks/use-group-materials';
import type { Curriculum, MaterialCategory, GroupMaterialWithCatalog } from '@/lib/supabase/types';
import { MATERIAL_CATEGORY_LABELS, getMaterialCategoryColor } from '@/lib/supabase/types';

interface GroupMaterialsSectionProps {
  groupId: string;
  curriculum: Curriculum;
  canEdit?: boolean;
}

// Category icon mapping
const CATEGORY_ICONS: Record<MaterialCategory, typeof Package> = {
  cards: Layers,
  manipulatives: Puzzle,
  texts: BookOpen,
  workbooks: FileText,
  teacher: PenTool,
  visuals: Image,
  technology: Monitor,
  assessment: ClipboardCheck,
  other: Package,
};

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

export function GroupMaterialsSection({ groupId, curriculum, canEdit = true }: GroupMaterialsSectionProps) {
  const {
    materials,
    materialsByCategory,
    summary,
    isLoading,
    error,
    initialize,
    toggleMaterial,
    addCustom,
    deleteMaterial,
    refresh,
  } = useGroupMaterials(groupId, curriculum);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToCategoryId, setAddToCategoryId] = useState<MaterialCategory>('other');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  // Auto-expand categories with uncollected items
  useEffect(() => {
    if (materials.length > 0) {
      const uncollectedCategories = new Set<string>();
      materials.forEach((m) => {
        if (!m.is_collected) {
          const category = m.is_custom ? m.custom_category || 'other' : m.material?.category || 'other';
          uncollectedCategories.add(category);
        }
      });
      setExpandedCategories(uncollectedCategories);
    }
  }, [materials]);

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      await initialize();
    } finally {
      setIsInitializing(false);
    }
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

  const handleAddCustomMaterial = async () => {
    if (!newItemName.trim()) return;
    await addCustom({
      name: newItemName.trim(),
      description: newItemDescription.trim() || undefined,
      category: addToCategoryId,
    });
    setNewItemName('');
    setNewItemDescription('');
    setShowAddModal(false);
  };

  const getCategoryProgress = (category: MaterialCategory) => {
    const items = materialsByCategory[category] || [];
    const total = items.length;
    const collected = items.filter((m) => m.is_collected).length;
    return { total, collected };
  };

  // Get material display info
  const getMaterialInfo = (m: GroupMaterialWithCatalog) => {
    if (m.is_custom) {
      return {
        name: m.custom_name || 'Custom Material',
        description: m.custom_description,
        category: m.custom_category || 'other',
      };
    }
    return {
      name: m.material?.name || 'Unknown Material',
      description: m.material?.description,
      category: m.material?.category || 'other',
    };
  };

  // Show initialize prompt if no materials
  if (!isLoading && materials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Package className="w-5 h-5 text-movement" />
            <span>Materials</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Package className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
            <p className="text-sm text-text-muted mb-4">
              No materials set up yet
            </p>
            {canEdit && (
              <Button
                onClick={handleInitialize}
                disabled={isInitializing}
                className="gap-2"
              >
                {isInitializing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Initialize Materials
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = summary?.percent || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-movement" />
              <span>Materials</span>
            </div>
            <Button variant="ghost" size="sm" onClick={refresh} className="min-h-[36px]">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-text-primary">
                {summary?.collected || 0} / {summary?.total || 0} collected
              </span>
              <span className={`text-sm font-bold ${
                progressPercent >= 100 ? 'text-green-600' :
                progressPercent >= 75 ? 'text-emerald-600' :
                progressPercent >= 50 ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent >= 100 ? 'bg-green-500' :
                  progressPercent >= 75 ? 'bg-emerald-500' :
                  progressPercent >= 50 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-foundation rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {CATEGORY_ORDER.filter((cat) => (materialsByCategory[cat]?.length || 0) > 0).map((category) => {
                const items = materialsByCategory[category] || [];
                const isExpanded = expandedCategories.has(category);
                const progress = getCategoryProgress(category);
                const IconComponent = CATEGORY_ICONS[category];
                const isComplete = progress.collected === progress.total && progress.total > 0;

                return (
                  <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-3 hover:bg-foundation/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-text-muted" />
                        <span className="text-sm font-medium text-text-primary">
                          {MATERIAL_CATEGORY_LABELS[category]}
                        </span>
                        <span className="text-xs text-text-muted">
                          ({progress.collected}/{progress.total})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isComplete && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-text-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-muted" />
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
                              className={`flex items-start gap-3 p-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                                item.is_collected ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                              }`}
                            >
                              {canEdit ? (
                                <button
                                  onClick={() => toggleMaterial(item.id, !item.is_collected)}
                                  className="mt-0.5 flex-shrink-0"
                                >
                                  {item.is_collected ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-text-muted hover:text-movement transition-colors" />
                                  )}
                                </button>
                              ) : (
                                <div className="mt-0.5 flex-shrink-0">
                                  {item.is_collected ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-text-muted" />
                                  )}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${
                                    item.is_collected ? 'text-text-muted line-through' : 'text-text-primary'
                                  }`}>
                                    {info.name}
                                  </span>
                                  {item.is_custom && (
                                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                {info.description && (
                                  <p className={`text-xs mt-0.5 ${
                                    item.is_collected ? 'text-text-muted/60' : 'text-text-muted'
                                  }`}>
                                    {info.description}
                                  </p>
                                )}
                                {item.location && (
                                  <p className="text-xs mt-1 text-movement">
                                    Location: {item.location}
                                  </p>
                                )}
                              </div>
                              {canEdit && item.is_custom && (
                                <button
                                  onClick={() => deleteMaterial(item.id)}
                                  className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Custom Material Button */}
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-text-muted/30 rounded-lg text-text-muted hover:text-text-primary hover:border-text-muted/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Custom Material
            </button>
          )}
        </CardContent>
      </Card>

      {/* Add Custom Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Add Custom Material</h2>
            <div className="space-y-4">
              <Input
                label="Material Name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Extra markers"
              />
              <Input
                label="Description (optional)"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="e.g., Keep backup set in drawer"
              />
              <Select
                label="Category"
                value={addToCategoryId}
                onChange={(e) => setAddToCategoryId(e.target.value as MaterialCategory)}
                options={CATEGORY_ORDER.map((cat) => ({
                  value: cat,
                  label: MATERIAL_CATEGORY_LABELS[cat],
                }))}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setNewItemName('');
                  setNewItemDescription('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomMaterial}
                disabled={!newItemName.trim()}
                className="flex-1"
              >
                Add Material
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
