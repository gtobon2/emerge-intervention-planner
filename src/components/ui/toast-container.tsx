'use client';

import { create } from 'zustand';
import { Toast } from './toast';

// --- Toast Types ---
export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// --- Toast Store ---
interface ToastState {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// --- Convenience helper ---
export function toast(
  type: ToastData['type'],
  title: string,
  message?: string,
  duration?: number
) {
  useToastStore.getState().addToast({ type, title, message, duration });
}

// --- Container Component ---
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast
            id={t.id}
            type={t.type}
            title={t.title}
            message={t.message}
            duration={t.duration}
            onDismiss={removeToast}
          />
        </div>
      ))}
    </div>
  );
}
