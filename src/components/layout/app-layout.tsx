'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { useUIStore } from '@/stores/ui';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-foundation">
      <Sidebar />
      <main
        className={`
          min-h-screen transition-all duration-300
          ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
        `}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
