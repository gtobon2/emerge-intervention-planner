'use client';

import { Search } from 'lucide-react';
import { Input, Select } from '@/components/ui';
import type { Curriculum } from '@/lib/supabase/types';

interface ErrorFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCurriculum: Curriculum | 'all';
  onCurriculumChange: (value: Curriculum | 'all') => void;
  sortBy: 'alphabetical' | 'most_used' | 'most_effective';
  onSortChange: (value: 'alphabetical' | 'most_used' | 'most_effective') => void;
}

const curriculumOptions = [
  { value: 'all', label: 'All Curricula' },
  { value: 'wilson', label: 'Wilson Reading' },
  { value: 'delta_math', label: 'Delta Math' },
  { value: 'camino', label: 'Camino a la Lectura' },
  { value: 'wordgen', label: 'WordGen' },
  { value: 'amira', label: 'Amira Learning' },
];

const sortOptions = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'most_used', label: 'Most Used' },
  { value: 'most_effective', label: 'Most Effective' },
];

export function ErrorFilters({
  searchQuery,
  onSearchChange,
  selectedCurriculum,
  onCurriculumChange,
  sortBy,
  onSortChange,
}: ErrorFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-surface rounded-xl">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search error patterns..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Curriculum Filter */}
      <Select
        options={curriculumOptions}
        value={selectedCurriculum}
        onChange={(e) => onCurriculumChange(e.target.value as Curriculum | 'all')}
        className="w-52"
      />

      {/* Sort Options */}
      <Select
        options={sortOptions}
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as 'alphabetical' | 'most_used' | 'most_effective')}
        className="w-48"
      />
    </div>
  );
}
