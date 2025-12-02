'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useUIStore } from '@/stores/ui';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen
        bg-surface border-r border-text-muted/10
        flex flex-col
        transition-all duration-300
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        z-30
      `}
    >
      {/* Logo */}
      <div className="p-4 border-b border-text-muted/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-movement to-breakthrough flex items-center justify-center">
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
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-colors
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
            text-text-muted hover:text-text-primary hover:bg-foundation
            transition-colors
          `}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="font-medium">Settings</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="
          absolute -right-3 top-1/2 -translate-y-1/2
          w-6 h-6 rounded-full
          bg-surface border border-text-muted/20
          flex items-center justify-center
          text-text-muted hover:text-text-primary
          transition-colors
        "
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
