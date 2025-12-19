import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to EMERGE',
    content: 'EMERGE is a research-based intervention planner for reading and math. Let\'s take a quick tour to help you get started!',
    position: 'bottom',
  },
  {
    id: 'groups',
    title: 'Your Groups',
    content: 'Create and manage intervention groups here. Each group can have multiple students and scheduled sessions.',
    target: '[data-tour="sidebar-groups"]',
    position: 'right',
  },
  {
    id: 'calendar',
    title: 'Calendar View',
    content: 'View and schedule all your intervention sessions in one place. Click on a session to start or edit it.',
    target: '[data-tour="sidebar-calendar"]',
    position: 'right',
  },
  {
    id: 'session',
    title: 'Running a Session',
    content: 'During sessions, track OTR (Opportunities to Respond), use the timer, and record student errors in real-time.',
    position: 'bottom',
  },
  {
    id: 'progress',
    title: 'Progress Monitoring',
    content: 'Track student progress over time with visual charts. Monitor mastery levels and adjust interventions as needed.',
    target: '[data-tour="sidebar-progress"]',
    position: 'right',
  },
  {
    id: 'error-bank',
    title: 'Error Bank',
    content: 'Save common errors and correction strategies. Quickly access them during sessions for consistent interventions.',
    target: '[data-tour="sidebar-errors"]',
    position: 'right',
  },
  {
    id: 'reports',
    title: 'Reports',
    content: 'Generate comprehensive reports on student progress, session data, and intervention effectiveness.',
    target: '[data-tour="sidebar-reports"]',
    position: 'right',
  },
];

interface HelpState {
  // Onboarding state
  hasSeenOnboarding: boolean;
  currentTourStep: number;
  isTourActive: boolean;

  // Help panel state
  showHelpPanel: boolean;

  // Actions
  completeOnboarding: () => void;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  toggleHelpPanel: () => void;
  setHelpPanel: (show: boolean) => void;
}

export const useHelpStore = create<HelpState>()(
  persist(
    (set, get) => ({
      // Initial state
      hasSeenOnboarding: false,
      currentTourStep: 0,
      isTourActive: false,
      showHelpPanel: false,

      // Actions
      completeOnboarding: () => {
        set({
          hasSeenOnboarding: true,
          isTourActive: false,
          currentTourStep: 0,
        });
      },

      startTour: () => {
        set({
          isTourActive: true,
          currentTourStep: 0,
          showHelpPanel: false,
        });
      },

      nextStep: () => {
        const { currentTourStep } = get();
        if (currentTourStep < tourSteps.length - 1) {
          set({ currentTourStep: currentTourStep + 1 });
        } else {
          get().completeOnboarding();
        }
      },

      prevStep: () => {
        const { currentTourStep } = get();
        if (currentTourStep > 0) {
          set({ currentTourStep: currentTourStep - 1 });
        }
      },

      endTour: () => {
        set({
          isTourActive: false,
          currentTourStep: 0,
        });
      },

      toggleHelpPanel: () => {
        set((state) => ({ showHelpPanel: !state.showHelpPanel }));
      },

      setHelpPanel: (show: boolean) => {
        set({ showHelpPanel: show });
      },
    }),
    {
      name: 'emerge-help-store',
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);
