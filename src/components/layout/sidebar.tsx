'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  FileText,
  X
} from 'lucide-react';
import { useUIStore } from '@/stores/ui';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/students', label: 'Students', icon: UserCheck },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/error-bank', label: 'Error Bank', icon: BookOpen },
  { href: '/reports', label: 'Reports', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      toggleSidebar();
    }
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      if (sidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [sidebarOpen]);

  return (
    <>
      {/* Overlay backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen
          bg-surface border-r border-text-muted/10
          flex flex-col
          transition-all duration-300
          z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden absolute right-4 top-4 p-2 text-text-muted hover:text-text-primary"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="p-4 border-b border-text-muted/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-movement to-breakthrough flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-foundation" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-lg text-text-primary">EMERGE</h1>
                <p className="text-xs text-text-muted">Intervention Planner</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors min-h-[44px]
                  ${isActive
                    ? 'bg-movement/10 text-movement'
                    : 'text-text-muted hover:text-text-primary hover:bg-foundation'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="p-3 border-t border-text-muted/10">
          <Link
            href="/settings"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-colors min-h-[44px]
              ${pathname === '/settings'
                ? 'bg-movement/10 text-movement'
                : 'text-text-muted hover:text-text-primary hover:bg-foundation'
              }
            `}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Settings</span>}
          </Link>
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="
            hidden lg:flex
            absolute -right-3 top-1/2 -translate-y-1/2
            w-6 h-6 rounded-full
            bg-surface border border-text-muted/20
            items-center justify-center
            text-text-muted hover:text-text-primary
            transition-colors
          "
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>
    </>
  );
}
