'use client';

import { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './sidebar';
import { useUIStore } from '@/stores/ui';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="min-h-screen bg-foundation">
      <Sidebar />

      {/* Mobile header with hamburger menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-text-muted/10 z-30 flex items-center px-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-text-muted hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="ml-3 font-bold text-lg text-text-primary">EMERGE</h1>
      </div>

      <main
        className={`
          min-h-screen transition-all duration-300
          pt-16 lg:pt-0
          lg:${sidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
