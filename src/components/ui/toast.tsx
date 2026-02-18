'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const borderColorMap = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

const iconColorMap = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const progressColorMap = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export function Toast({ id, type, title, message, duration = 5000, onDismiss }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 200);
  }, [id, onDismiss]);

  useEffect(() => {
    if (duration <= 0) return;

    const interval = 50;
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timer);
          handleDismiss();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, handleDismiss]);

  const Icon = iconMap[type];

  return (
    <div
      className={`
        w-80 bg-surface border border-text-muted/10 border-l-4 ${borderColorMap[type]}
        rounded-lg shadow-lg overflow-hidden
        transition-all duration-200 ease-out
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColorMap[type]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          {message && (
            <p className="text-sm text-text-muted mt-0.5">{message}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-foundation transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {duration > 0 && (
        <div className="h-0.5 w-full bg-text-muted/10">
          <div
            className={`h-full ${progressColorMap[type]} transition-none`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
