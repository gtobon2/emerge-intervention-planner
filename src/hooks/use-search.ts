import { useSearchStore } from '@/stores/search';

/**
 * Hook for accessing and managing global search functionality
 *
 * @returns Search state and actions
 */
export function useSearch() {
  const query = useSearchStore((state) => state.query);
  const results = useSearchStore((state) => state.results);
  const isSearching = useSearchStore((state) => state.isSearching);
  const recentSearches = useSearchStore((state) => state.recentSearches);
  const search = useSearchStore((state) => state.search);
  const clearSearch = useSearchStore((state) => state.clearSearch);
  const addToRecent = useSearchStore((state) => state.addToRecent);
  const clearRecentSearches = useSearchStore((state) => state.clearRecentSearches);

  // Calculate total results
  const totalResults =
    results.groups.length +
    results.students.length +
    results.sessions.length +
    results.errors.length;

  const hasResults = totalResults > 0;

  return {
    query,
    results,
    isSearching,
    recentSearches,
    totalResults,
    hasResults,
    search,
    clearSearch,
    addToRecent,
    clearRecentSearches,
  };
}
