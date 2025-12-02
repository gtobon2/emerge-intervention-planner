import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modals
  activeModal: string | null;
  modalData: Record<string, any>;

  // Session Planning
  otrCount: number;
  sessionTimer: {
    isRunning: boolean;
    startTime: number | null;
    elapsedTime: number;
    component: string | null;
  };

  // Voice input
  isRecording: boolean;
  transcription: string;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (modalId: string, data?: Record<string, any>) => void;
  closeModal: () => void;

  // OTR Counter
  incrementOTR: () => void;
  decrementOTR: () => void;
  resetOTR: () => void;

  // Session Timer
  startTimer: (component: string) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  updateElapsedTime: () => void;

  // Voice
  setRecording: (isRecording: boolean) => void;
  setTranscription: (text: string) => void;
  appendTranscription: (text: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: {},
      otrCount: 0,
      sessionTimer: {
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        component: null,
      },
      isRecording: false,
      transcription: '',

      // Sidebar actions
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      // Modal actions
      openModal: (modalId, data = {}) => {
        set({ activeModal: modalId, modalData: data });
      },

      closeModal: () => {
        set({ activeModal: null, modalData: {} });
      },

      // OTR Counter actions
      incrementOTR: () => {
        set((state) => ({ otrCount: state.otrCount + 1 }));
      },

      decrementOTR: () => {
        set((state) => ({ otrCount: Math.max(0, state.otrCount - 1) }));
      },

      resetOTR: () => {
        set({ otrCount: 0 });
      },

      // Timer actions
      startTimer: (component) => {
        set({
          sessionTimer: {
            isRunning: true,
            startTime: Date.now(),
            elapsedTime: 0,
            component,
          },
        });
      },

      stopTimer: () => {
        const { sessionTimer } = get();
        const elapsed = sessionTimer.startTime
          ? Date.now() - sessionTimer.startTime
          : 0;
        set({
          sessionTimer: {
            ...sessionTimer,
            isRunning: false,
            elapsedTime: elapsed,
          },
        });
      },

      resetTimer: () => {
        set({
          sessionTimer: {
            isRunning: false,
            startTime: null,
            elapsedTime: 0,
            component: null,
          },
        });
      },

      updateElapsedTime: () => {
        const { sessionTimer } = get();
        if (sessionTimer.isRunning && sessionTimer.startTime) {
          set({
            sessionTimer: {
              ...sessionTimer,
              elapsedTime: Date.now() - sessionTimer.startTime,
            },
          });
        }
      },

      // Voice actions
      setRecording: (isRecording) => {
        set({ isRecording });
      },

      setTranscription: (text) => {
        set({ transcription: text });
      },

      appendTranscription: (text) => {
        set((state) => ({
          transcription: state.transcription + ' ' + text,
        }));
      },
    }),
    {
      name: 'emerge-ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Format elapsed time as MM:SS
export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
