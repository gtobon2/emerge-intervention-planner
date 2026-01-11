'use client';

import { useState, useMemo } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { ErrorFilters, ErrorCard, AddErrorModal } from '@/components/error-bank';
import { ALL_ERRORS, type ErrorBankSeedEntry } from '@/lib/error-banks';
import type { Curriculum } from '@/lib/supabase/types';
import type { NewErrorData } from '@/components/error-bank';

export default function ErrorBankPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | 'all'>('all');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'most_used' | 'most_effective'>('alphabetical');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customErrors, setCustomErrors] = useState<ErrorBankSeedEntry[]>([]);

  // Combine seed errors with custom errors
  const allErrors = useMemo(() => {
    return [...ALL_ERRORS, ...customErrors];
  }, [customErrors]);

  // Filter and sort errors
  const filteredErrors = useMemo(() => {
    let filtered = allErrors;

    // Filter by curriculum
    if (selectedCurriculum !== 'all') {
      filtered = filtered.filter(error => error.curriculum === selectedCurriculum);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(error =>
        error.error_pattern.toLowerCase().includes(query) ||
        error.underlying_gap.toLowerCase().includes(query) ||
        error.correction_protocol.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.error_pattern.localeCompare(b.error_pattern));
        break;
      case 'most_used':
        // For now, just alphabetical (would need occurrence_count from database)
        filtered.sort((a, b) => a.error_pattern.localeCompare(b.error_pattern));
        break;
      case 'most_effective':
        // For now, just alphabetical (would need effectiveness_count from database)
        filtered.sort((a, b) => a.error_pattern.localeCompare(b.error_pattern));
        break;
    }

    return filtered;
  }, [allErrors, selectedCurriculum, searchQuery, sortBy]);

  const handleAddError = (errorData: NewErrorData) => {
    const newError: ErrorBankSeedEntry = {
      curriculum: errorData.curriculum,
      position: null,
      error_pattern: errorData.error_pattern,
      underlying_gap: errorData.underlying_gap,
      correction_protocol: errorData.correction_protocol,
      correction_prompts: errorData.correction_prompts,
      visual_cues: errorData.visual_cues || null,
      kinesthetic_cues: errorData.kinesthetic_cues || null,
    };

    setCustomErrors([...customErrors, newError]);
    setIsAddModalOpen(false);
  };

  const getCurriculumStats = () => {
    const stats = {
      wilson: 0,
      delta_math: 0,
      camino: 0,
      wordgen: 0,
      amira: 0,
      despegando: 0,
      total: allErrors.length,
      custom: customErrors.length,
    };

    allErrors.forEach(error => {
      if (error.curriculum && error.curriculum in stats) {
        (stats as Record<string, number>)[error.curriculum]++;
      }
    });

    return stats;
  };

  const stats = getCurriculumStats();

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Error Bank</h1>
            <p className="text-sm md:text-base text-text-muted mt-1">
              Evidence-based error patterns and correction protocols
            </p>
          </div>
          <Button className="gap-2 w-full sm:w-auto min-h-[44px]" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Custom Error</span>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
          <div className="bg-surface rounded-lg p-4 border border-text-muted/10">
            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            <div className="text-xs text-text-muted">Total Errors</div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-wilson/30">
            <div className="text-2xl font-bold text-wilson">{stats.wilson}</div>
            <div className="text-xs text-text-muted">Wilson</div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-delta/30">
            <div className="text-2xl font-bold text-delta">{stats.delta_math}</div>
            <div className="text-xs text-text-muted">Delta Math</div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-camino/30">
            <div className="text-2xl font-bold text-camino">{stats.camino}</div>
            <div className="text-xs text-text-muted">Camino</div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-wordgen/30">
            <div className="text-2xl font-bold text-wordgen">{stats.wordgen}</div>
            <div className="text-xs text-text-muted">WordGen</div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-amira/30">
            <div className="text-2xl font-bold text-amira">{stats.amira}</div>
            <div className="text-xs text-text-muted">Amira</div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-breakthrough/30">
            <div className="text-2xl font-bold text-breakthrough">{stats.custom}</div>
            <div className="text-xs text-text-muted">Custom</div>
          </div>
        </div>

        {/* Filters */}
        <ErrorFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCurriculum={selectedCurriculum}
          onCurriculumChange={setSelectedCurriculum}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Error Cards Grid */}
        {filteredErrors.length === 0 ? (
          <div className="text-center py-12 md:py-16 bg-surface rounded-xl border border-text-muted/10 px-4">
            <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2">
              No errors found
            </h3>
            <p className="text-sm md:text-base text-text-muted mb-4">
              {searchQuery || selectedCurriculum !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Start by adding your first custom error pattern'}
            </p>
            {!searchQuery && selectedCurriculum === 'all' && (
              <Button onClick={() => setIsAddModalOpen(true)} className="min-h-[44px]">
                Add Custom Error
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-xs md:text-sm text-text-muted">
                Showing {filteredErrors.length} error pattern{filteredErrors.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredErrors.map((error, idx) => (
                <ErrorCard
                  key={idx}
                  error={error}
                  isCustom={customErrors.includes(error)}
                />
              ))}
            </div>
          </>
        )}

        {/* Add Error Modal */}
        <AddErrorModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddError}
        />
      </div>
    </AppLayout>
  );
}
