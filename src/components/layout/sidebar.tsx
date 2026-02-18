'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  CalendarClock,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  FileText,
  ClipboardList,
  Languages,
  Package,
  Shield,
  Download,
  X,
  LogOut,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { useAuth } from '@/hooks/use-auth';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'CORE',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/groups', label: 'Groups', icon: Users },
      { href: '/students', label: 'Students', icon: UserCheck },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/progress', label: 'Progress', icon: TrendingUp },
    ],
  },
  {
    label: 'SESSION TOOLS',
    items: [
      { href: '/schedule', label: 'Schedule', icon: CalendarClock },
      { href: '/error-bank', label: 'Error Bank', icon: BookOpen },
    ],
  },
  {
    label: 'RESOURCES',
    items: [
      { href: '/worksheets', label: 'Worksheets', icon: ClipboardList },
      { href: '/worksheets-spanish', label: 'Spanish Worksheets', icon: Languages },
      { href: '/materials', label: 'Materials', icon: Package },
      { href: '/letters', label: 'Family Letters', icon: FileText },
      { href: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { href: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
      { href: '/admin/export', label: 'Data Export', icon: Download, adminOnly: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore();
  const { isAdmin, signOut, currentDemoUser, userRole, isLoading } = useAuth();

  // Filter nav groups based on user role
  const filteredNavGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.adminOnly || isAdmin),
    }))
    .filter(group => group.items.length > 0);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
        <nav className="flex-1 p-3 overflow-y-auto">
          {filteredNavGroups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex > 0 ? 'mt-4' : ''}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold tracking-wider text-text-muted/60 uppercase">
                  {group.label}
                </p>
              )}
              {sidebarCollapsed && groupIndex > 0 && (
                <div className="mx-3 mb-2 border-t border-text-muted/10" />
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
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
              </div>
            </div>
          ))}
        </nav>

        {/* Settings & User */}
        <div className="p-3 border-t border-text-muted/10 space-y-1">
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

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-colors min-h-[44px]
              text-text-muted hover:text-red-500 hover:bg-red-500/10
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>

          {/* Current User Info (collapsed shows just badge, expanded shows name) */}
          {currentDemoUser && !sidebarCollapsed && (
            <div className="mt-3 px-3 py-2 bg-foundation/50 rounded-lg">
              <p className="text-xs text-text-muted">Signed in as</p>
              <p className="text-sm font-medium truncate">{currentDemoUser.name}</p>
              <p className="text-xs text-text-muted capitalize">{userRole}</p>
            </div>
          )}
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
