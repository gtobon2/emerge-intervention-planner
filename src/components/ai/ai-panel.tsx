'use client';

import { ReactNode } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

export interface AIPanelProps {
  children: ReactNode;
  className?: string;
}

export function AIPanel({ children, className = '' }: AIPanelProps) {
  return (
    <div
      className={`
        relative rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50
        ${className}
      `}
    >
      {/* AI Badge */}
      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        AI
      </div>
      {children}
    </div>
  );
}

export interface AILoadingProps {
  message?: string;
}

export function AILoading({ message = 'AI is thinking...' }: AILoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="relative">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <Sparkles className="w-4 h-4 text-blue-500 absolute top-0 right-0 animate-pulse" />
      </div>
      <p className="text-sm text-gray-600 font-medium">{message}</p>
    </div>
  );
}

export interface AIErrorProps {
  message: string;
  onRetry?: () => void;
}

export function AIError({ message, onRetry }: AIErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-3">
      <div className="bg-red-100 rounded-full p-3">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <p className="text-sm text-red-700 font-medium text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export interface AIBadgeProps {
  className?: string;
}

export function AIBadge({ className = '' }: AIBadgeProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-blue-500
        text-white px-2 py-1 rounded-full text-xs font-medium
        ${className}
      `}
    >
      <Sparkles className="w-3 h-3" />
      AI
    </div>
  );
}
