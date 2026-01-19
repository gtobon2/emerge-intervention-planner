'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Calendar,
  CheckCheck,
  Clock,
  Users,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, CurriculumBadge } from '@/components/ui';
import { useWeeklyMaterials } from '@/hooks/use-group-materials';
import type { SessionMaterialWithCatalog } from '@/lib/supabase/types';
import { MATERIAL_CATEGORY_LABELS } from '@/lib/supabase/types';
import { formatCurriculumPosition } from '@/lib/supabase/types';

interface WeeklyMaterialsOverviewProps {
  showHeader?: boolean;
}

export function WeeklyMaterialsOverview({ showHeader = true }: WeeklyMaterialsOverviewProps) {
  const { materials, materialsByDate, summary, isLoading, error, toggleMaterial, refresh } =
    useWeeklyMaterials();

  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  // Get sorted dates
  const sortedDates = Object.keys(materialsByDate).sort();

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get session info from material
  const getSessionInfo = (m: SessionMaterialWithCatalog) => {
    const session = (m as any).session;
    if (!session) return null;
    return {
      groupName: session.group?.name || 'Unknown Group',
      curriculum: session.group?.curriculum || 'wilson',
      position: session.curriculum_position,
      time: session.time,
    };
  };

  // Group materials by session within a date
  const getMaterialsBySession = (dateMaterials: SessionMaterialWithCatalog[]) => {
    const bySession: Record<string, SessionMaterialWithCatalog[]> = {};
    dateMaterials.forEach((m) => {
      const sessionId = m.session_id;
      if (!bySession[sessionId]) {
        bySession[sessionId] = [];
      }
      bySession[sessionId].push(m);
    });
    return bySession;
  };

  if (!isLoading && materials.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Calendar className="w-5 h-5 text-movement" />
              <span>Weekly Materials</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
            <p className="text-sm text-text-muted mb-2">No materials to prepare this week</p>
            <p className="text-xs text-text-muted">
              Plan sessions to generate material checklists
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = summary.percent;

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-movement" />
              <span>Weekly Materials</span>
            </div>
            <Button variant="ghost" size="sm" onClick={refresh} className="min-h-[36px]">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-text-primary">
              {summary.prepared} / {summary.total} prepared
            </span>
            <span
              className={`text-sm font-bold ${
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
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-foundation rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDates.map((date) => {
              const dateMaterials = materialsByDate[date] || [];
              const isExpanded = expandedDates.has(date);
              const datePrepared = dateMaterials.filter((m) => m.is_prepared).length;
              const dateTotal = dateMaterials.length;
              const isDateComplete = datePrepared === dateTotal;
              const materialsBySession = getMaterialsBySession(dateMaterials);

              return (
                <div
                  key={date}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Date Header */}
                  <button
                    onClick={() => toggleDate(date)}
                    className="w-full flex items-center justify-between p-3 hover:bg-foundation/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-text-muted" />
                      <span className="font-medium text-text-primary">{formatDate(date)}</span>
                      <span className="text-xs text-text-muted">
                        ({datePrepared}/{dateTotal})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDateComplete && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      )}
                    </div>
                  </button>

                  {/* Sessions for this date */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {Object.entries(materialsBySession).map(([sessionId, sessionMaterials]) => {
                        const sessionInfo = getSessionInfo(sessionMaterials[0]);
                        const sessionPrepared = sessionMaterials.filter((m) => m.is_prepared).length;
                        const sessionTotal = sessionMaterials.length;

                        return (
                          <div key={sessionId} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                            {/* Session Header */}
                            <div className="flex items-center justify-between p-3 bg-foundation/30">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-movement" />
                                <span className="text-sm font-medium text-text-primary">
                                  {sessionInfo?.groupName}
                                </span>
                                {sessionInfo && (
                                  <CurriculumBadge curriculum={sessionInfo.curriculum} />
                                )}
                                {sessionInfo?.time && (
                                  <span className="flex items-center gap-1 text-xs text-text-muted">
                                    <Clock className="w-3 h-3" />
                                    {sessionInfo.time}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-text-muted">
                                {sessionPrepared}/{sessionTotal}
                              </span>
                            </div>

                            {/* Materials for this session */}
                            <div className="bg-white dark:bg-surface">
                              {sessionMaterials.map((item) => (
                                <div
                                  key={item.id}
                                  className={`flex items-start gap-3 p-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                                    item.is_prepared ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                                  }`}
                                >
                                  <button
                                    onClick={() =>
                                      toggleMaterial(sessionId, item.id, !item.is_prepared)
                                    }
                                    className="mt-0.5 flex-shrink-0"
                                  >
                                    {item.is_prepared ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-text-muted hover:text-movement transition-colors" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-sm font-medium ${
                                          item.is_prepared
                                            ? 'text-text-muted line-through'
                                            : 'text-text-primary'
                                        }`}
                                      >
                                        {item.specific_item || item.material?.name || 'Material'}
                                      </span>
                                      {item.quantity_needed && parseInt(item.quantity_needed) > 1 && (
                                        <span className="text-xs text-movement font-medium">
                                          x{item.quantity_needed}
                                        </span>
                                      )}
                                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-text-muted rounded">
                                        {MATERIAL_CATEGORY_LABELS[item.material?.category || 'other']}
                                      </span>
                                    </div>
                                    {item.material?.description && (
                                      <p
                                        className={`text-xs mt-0.5 ${
                                          item.is_prepared ? 'text-text-muted/60' : 'text-text-muted'
                                        }`}
                                      >
                                        {item.material.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
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
      </CardContent>
    </Card>
  );
}
