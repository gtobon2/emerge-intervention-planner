'use client';

import { Search, MapPin } from 'lucide-react';
import { Input, Select } from '@/components/ui';
import type { Curriculum } from '@/lib/supabase/types';

interface ErrorFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCurriculum: Curriculum | 'all';
  onCurriculumChange: (value: Curriculum | 'all') => void;
  sortBy: 'alphabetical' | 'most_used' | 'most_effective';
  onSortChange: (value: 'alphabetical' | 'most_used' | 'most_effective') => void;
  // Position filtering
  selectedPosition?: string;
  onPositionChange?: (value: string) => void;
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

// Position options by curriculum
const wilsonPositionOptions = [
  { value: '', label: 'All Steps' },
  { value: '1', label: 'Step 1' },
  { value: '2', label: 'Step 2' },
  { value: '3', label: 'Step 3' },
  { value: '4', label: 'Step 4' },
  { value: '5', label: 'Step 5' },
  { value: '6', label: 'Step 6' },
];

const caminoPositionOptions = [
  { value: '', label: 'All Lessons' },
  ...Array.from({ length: 40 }, (_, i) => ({ value: String(i + 1), label: `Lesson ${i + 1}` }))
];

const deltaMathPositionOptions = [
  { value: '', label: 'All Standards' },
  { value: '3.NBT', label: '3.NBT Standards' },
  { value: '4.NF', label: '4.NF Standards' },
  { value: '5.NBT', label: '5.NBT Standards' },
  { value: '5.NF', label: '5.NF Standards' },
];

function getPositionOptions(curriculum: Curriculum | 'all') {
  switch (curriculum) {
    case 'wilson':
      return wilsonPositionOptions;
    case 'camino':
    case 'despegando':
      return caminoPositionOptions;
    case 'delta_math':
      return deltaMathPositionOptions;
    default:
      return [];
  }
}

export function ErrorFilters({
  searchQuery,
  onSearchChange,
  selectedCurriculum,
  onCurriculumChange,
  sortBy,
  onSortChange,
  selectedPosition = '',
  onPositionChange,
}: ErrorFiltersProps) {
  const positionOptions = getPositionOptions(selectedCurriculum);
  const showPositionFilter = positionOptions.length > 0 && onPositionChange;

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

      {/* Position Filter - Only shows when a specific curriculum is selected */}
      {showPositionFilter && (
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none z-10" />
          <Select
            options={positionOptions}
            value={selectedPosition}
            onChange={(e) => onPositionChange(e.target.value)}
            className="w-40 pl-9"
          />
        </div>
      )}

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
