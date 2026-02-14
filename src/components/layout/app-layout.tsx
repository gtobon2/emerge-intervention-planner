'use client';

import { ReactNode, useState, useEffect, memo } from 'react';
import { Menu, User, LogOut, ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { GlobalSearch } from '@/components/search';
import { AIChat } from '@/components/ai';
import { useUIStore } from '@/stores/ui';
import { useAIContextStore } from '@/stores/ai-context';
import { useAuth } from '@/hooks/use-auth';
import { useNotificationGenerator } from '@/hooks/use-notifications';
import { OnboardingTour, HelpPanel } from '@/components/help';
import { useHelpStore } from '@/stores/help';

// Isolated component so notification store subscriptions don't re-render AppLayout's children
const NotificationGeneratorProvider = memo(function NotificationGeneratorProvider() {
  useNotificationGenerator();
  return null;
});

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Use individual selectors to avoid re-rendering on unrelated store changes
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed);
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const aiStudents = useAIContextStore(s => s.students);
  const aiGroup = useAIContextStore(s => s.group);
  const aiRecentSessions = useAIContextStore(s => s.recentSessions);
  const aiAdditionalContext = useAIContextStore(s => s.additionalContext);
  const { user, signOut } = useAuth();
  const toggleHelpPanel = useHelpStore(s => s.toggleHelpPanel);
  const hasSeenOnboarding = useHelpStore(s => s.hasSeenOnboarding);
  const startTour = useHelpStore(s => s.startTour);
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  // Start tour for first-time users
  useEffect(() => {
    if (!hasSeenOnboarding) {
      // Small delay to let the page render first
      const timer = setTimeout(() => startTour(), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding, startTour]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-foundation">
      {/* Isolated so its store subscriptions don't cascade to children */}
      <NotificationGeneratorProvider />
      <Sidebar />

      {/* Mobile header with hamburger menu and user menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-text-muted/10 z-30 flex items-center justify-between px-4">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-text-muted hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="ml-3 font-bold text-lg text-text-primary">EMERGE</h1>
        </div>

        {/* Mobile Search, Help, Notification Bell and User Menu */}
        <div className="flex items-center gap-2">
          <GlobalSearch />
          <button
            onClick={toggleHelpPanel}
            className="p-2 text-text-muted hover:text-movement transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <NotificationBell />
          <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-foundation transition-colors min-h-[44px] min-w-[44px]"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-movement flex items-center justify-center text-white text-sm font-medium">
              {getUserInitials()}
            </div>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-12 w-64 bg-surface border border-text-muted/10 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-text-muted/10">
                  <p className="font-medium text-text-primary">{getUserDisplayName()}</p>
                  <p className="text-sm text-text-muted">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text-primary hover:bg-foundation transition-colors min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Desktop header - only shown when sidebar is visible */}
      <div
        className={`
          hidden lg:block fixed top-0 right-0 h-16 bg-surface border-b border-text-muted/10 z-20
          transition-all duration-300
          ${sidebarCollapsed ? 'left-16' : 'left-64'}
        `}
      >
        <div className="h-full px-6 flex items-center justify-between gap-4">
          {/* Desktop Search */}
          <GlobalSearch />

          <div className="flex items-center gap-4">
            {/* Desktop Help Button */}
            <button
              onClick={toggleHelpPanel}
              className="p-2 text-text-muted hover:text-movement transition-colors rounded-lg hover:bg-foundation"
              aria-label="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Desktop Notification Bell */}
            <NotificationBell />

            {/* Desktop User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-foundation transition-colors min-h-[44px]"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-movement flex items-center justify-center text-white text-sm font-medium">
                {getUserInitials()}
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-sm font-medium text-text-primary">{getUserDisplayName()}</p>
                <p className="text-xs text-text-muted">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-14 w-64 bg-surface border border-text-muted/10 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-text-muted/10">
                    <p className="font-medium text-text-primary">{getUserDisplayName()}</p>
                    <p className="text-sm text-text-muted">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text-primary hover:bg-foundation transition-colors min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      </div>

      <main
        className={`
          min-h-screen transition-all duration-300
          pt-16 lg:pt-16
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Help System */}
      <HelpPanel />
      <OnboardingTour />

      {/* Floating AI Assistant Button */}
      <button
        onClick={() => setShowAIChat(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* AI Chat Modal - receives context from useAIContextStore */}
      <AIChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        students={aiStudents}
        group={aiGroup ?? undefined}
        recentSessions={aiRecentSessions}
        additionalContext={aiAdditionalContext}
      />
    </div>
  );
}
