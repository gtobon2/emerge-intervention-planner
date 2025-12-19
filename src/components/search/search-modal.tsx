'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Users,
  User,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useSearch } from '@/hooks/use-search';
import type { SearchResult } from '@/stores/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const {
    query,
    results,
    isSearching,
    recentSearches,
    hasResults,
    search,
    clearSearch,
    addToRecent,
  } = useSearch();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    clearSearch();
    setSelectedIndex(-1);
    onClose();
  };

  const handleInputChange = (value: string) => {
    search(value);
  };

  // Get all results in a flat array for keyboard navigation
  const allResults: SearchResult[] = [
    ...results.groups,
    ...results.students,
    ...results.sessions,
    ...results.errors,
  ];

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (allResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          handleResultClick(allResults[selectedIndex]);
        }
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    if (query) {
      addToRecent(query);
    }

    // Navigate based on result type
    switch (result.type) {
      case 'group':
        router.push(`/groups/${result.id}`);
        break;
      case 'student':
        // Navigate to the group page with student highlighted (if supported)
        const student = result.data as any;
        if (student.group_id) {
          router.push(`/groups/${student.group_id}`);
        }
        break;
      case 'session':
        // Navigate to calendar or session detail
        router.push(`/calendar?session=${result.id}`);
        break;
      case 'error':
        router.push(`/error-bank?error=${result.id}`);
        break;
    }

    handleClose();
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    search(searchQuery);
    if (inputRef.current) {
      inputRef.current.value = searchQuery;
    }
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'group':
        return <Users className="w-4 h-4" />;
      case 'student':
        return <User className="w-4 h-4" />;
      case 'session':
        return <Calendar className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getCurriculumBadgeColor = (curriculum?: string) => {
    switch (curriculum) {
      case 'wilson':
        return 'bg-movement/10 text-movement';
      case 'delta_math':
        return 'bg-breakthrough/10 text-breakthrough';
      case 'camino':
        return 'bg-purple-500/10 text-purple-600';
      case 'wordgen':
        return 'bg-blue-500/10 text-blue-600';
      case 'amira':
        return 'bg-green-500/10 text-green-600';
      default:
        return 'bg-text-muted/10 text-text-muted';
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-600';
      case 'planned':
        return 'bg-blue-500/10 text-blue-600';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-text-muted/10 text-text-muted';
    }
  };

  const renderResultSection = (
    title: string,
    icon: React.ReactNode,
    results: SearchResult[],
    startIndex: number
  ) => {
    if (results.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-muted">
          {icon}
          <span>{title}</span>
          <span className="text-xs">({results.length})</span>
        </div>
        <div className="space-y-1">
          {results.map((result, index) => {
            const globalIndex = startIndex + index;
            const isSelected = selectedIndex === globalIndex;

            return (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className={`
                  w-full px-4 py-3 text-left transition-colors
                  hover:bg-foundation
                  ${isSelected ? 'bg-foundation' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-text-muted">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-text-primary truncate">
                        {result.title}
                      </p>
                      {result.badge && (
                        <span
                          className={`
                            px-2 py-0.5 text-xs font-medium rounded-full
                            ${
                              result.type === 'session'
                                ? getStatusBadgeColor(result.badge)
                                : getCurriculumBadgeColor(result.badge)
                            }
                          `}
                        >
                          {result.badge}
                        </span>
                      )}
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-text-muted truncate">
                        {result.subtitle}
                      </p>
                    )}
                    {result.metadata && (
                      <p className="text-xs text-text-muted mt-1">
                        {result.metadata}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-movement flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50"
      onClick={handleClose}
    >
      <div
        className="
          w-full max-w-2xl mt-20
          bg-surface rounded-lg shadow-2xl
          max-h-[calc(100vh-120px)] flex flex-col
          animate-in fade-in zoom-in-95 duration-200
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-text-muted/10">
          <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search groups, students, sessions, errors..."
            className="
              flex-1 bg-transparent text-text-primary placeholder:text-text-muted
              outline-none text-lg
            "
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {isSearching && (
            <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
          )}
          <button
            onClick={handleClose}
            className="p-1 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {/* Loading state */}
          {isSearching && query && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-movement animate-spin" />
            </div>
          )}

          {/* No query state - show recent searches */}
          {!query && !isSearching && (
            <div className="py-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-muted">
                    <Clock className="w-4 h-4" />
                    <span>Recent Searches</span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((recent, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(recent.query)}
                        className="
                          w-full px-4 py-3 text-left transition-colors
                          hover:bg-foundation
                        "
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-text-muted" />
                          <span className="text-text-primary">{recent.query}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {recentSearches.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-text-muted/50 mx-auto mb-3" />
                  <p className="text-text-muted">
                    Start typing to search across your intervention data
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Results state */}
          {query && !isSearching && hasResults && (
            <div className="py-4">
              {renderResultSection(
                'Groups',
                <Users className="w-4 h-4" />,
                results.groups,
                0
              )}
              {renderResultSection(
                'Students',
                <User className="w-4 h-4" />,
                results.students,
                results.groups.length
              )}
              {renderResultSection(
                'Sessions',
                <Calendar className="w-4 h-4" />,
                results.sessions,
                results.groups.length + results.students.length
              )}
              {renderResultSection(
                'Error Patterns',
                <AlertCircle className="w-4 h-4" />,
                results.errors,
                results.groups.length +
                  results.students.length +
                  results.sessions.length
              )}
            </div>
          )}

          {/* No results state */}
          {query && !isSearching && !hasResults && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-text-muted/50 mx-auto mb-3" />
              <p className="text-text-primary font-medium mb-1">
                No results found
              </p>
              <p className="text-text-muted text-sm">
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts */}
        <div className="
          flex items-center justify-between gap-4 px-4 py-3
          border-t border-text-muted/10 text-xs text-text-muted
        ">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-foundation rounded border border-text-muted/20">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-foundation rounded border border-text-muted/20">
                ↵
              </kbd>
              <span>Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-foundation rounded border border-text-muted/20">
              Esc
            </kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
