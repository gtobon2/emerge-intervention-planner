'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { SearchModal } from './search-modal';

export function GlobalSearch() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Detect Mac vs Windows/Linux for keyboard shortcut display
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Handle Cmd/Ctrl + K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="
          flex items-center gap-3 px-3 py-2 rounded-lg
          bg-foundation hover:bg-text-muted/10
          border border-text-muted/20
          text-text-muted hover:text-text-primary
          transition-colors min-h-[44px]
        "
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline text-sm">Search...</span>
        <kbd className="
          hidden md:flex items-center gap-1
          px-2 py-1 text-xs
          bg-surface rounded border border-text-muted/20
        ">
          <span>{isMac ? '⌘' : 'Ctrl'}</span>
          <span>K</span>
        </kbd>
      </button>

      <SearchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
