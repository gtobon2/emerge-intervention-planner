'use client';

import { useEffect } from 'react';
import { X, HelpCircle, Keyboard, BookOpen, Play, MessageCircle, RotateCcw } from 'lucide-react';
import { useHelpStore } from '@/stores/help';
import { Button } from '@/components/ui';
import Link from 'next/link';

export function HelpPanel() {
  const { showHelpPanel, setHelpPanel, startTour } = useHelpStore();

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showHelpPanel) {
        setHelpPanel(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showHelpPanel, setHelpPanel]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (showHelpPanel) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showHelpPanel]);

  if (!showHelpPanel) return null;

  const shortcuts = [
    { keys: ['Cmd', 'K'], description: 'Open search' },
    { keys: ['?'], description: 'Open help panel' },
    { keys: ['Esc'], description: 'Close modals/panels' },
  ];

  const quickTips = [
    {
      title: 'Track OTRs per student',
      description: 'Click on student circles during sessions to track individual engagement.',
    },
    {
      title: 'Save errors to bank',
      description: 'Save common errors during sessions to quickly access correction strategies.',
    },
    {
      title: 'Use voice notes',
      description: 'Click the microphone icon to dictate session notes hands-free.',
    },
    {
      title: 'Export reports',
      description: 'Download CSV reports for progress monitoring and session data.',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={() => setHelpPanel(false)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-text-muted/20">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-movement" />
            <h2 className="text-lg font-semibold text-text-primary">Help & Support</h2>
          </div>
          <button
            onClick={() => setHelpPanel(false)}
            className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-text-muted/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Tips */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
              <Play className="w-4 h-4 text-movement" />
              Quick Tips
            </h3>
            <div className="space-y-3">
              {quickTips.map((tip, index) => (
                <div
                  key={index}
                  className="p-3 bg-foundation rounded-lg border border-text-muted/10"
                >
                  <h4 className="font-medium text-text-primary text-sm">{tip.title}</h4>
                  <p className="text-sm text-text-secondary mt-1">{tip.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
              <Keyboard className="w-4 h-4 text-movement" />
              Keyboard Shortcuts
            </h3>
            <div className="bg-foundation rounded-lg border border-text-muted/10 divide-y divide-text-muted/10">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <span className="text-sm text-text-secondary">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex}>
                        <kbd className="px-2 py-1 bg-surface border border-text-muted/20 rounded text-xs font-mono text-text-primary">
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="mx-1 text-text-muted">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Resources */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
              <BookOpen className="w-4 h-4 text-movement" />
              Resources
            </h3>
            <div className="space-y-2">
              <Link
                href="/help"
                onClick={() => setHelpPanel(false)}
                className="flex items-center justify-between p-3 bg-foundation rounded-lg border border-text-muted/10 hover:border-movement/50 transition-colors group"
              >
                <span className="text-sm text-text-primary group-hover:text-movement">
                  Full Documentation
                </span>
                <BookOpen className="w-4 h-4 text-text-muted group-hover:text-movement" />
              </Link>
              <button
                onClick={() => {
                  setHelpPanel(false);
                  startTour();
                }}
                className="w-full flex items-center justify-between p-3 bg-foundation rounded-lg border border-text-muted/10 hover:border-movement/50 transition-colors group"
              >
                <span className="text-sm text-text-primary group-hover:text-movement">
                  Restart Tour
                </span>
                <RotateCcw className="w-4 h-4 text-text-muted group-hover:text-movement" />
              </button>
            </div>
          </section>

          {/* Contact Support */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
              <MessageCircle className="w-4 h-4 text-movement" />
              Need More Help?
            </h3>
            <p className="text-sm text-text-secondary mb-3">
              Contact support for assistance with technical issues or questions about using EMERGE.
            </p>
            <Button variant="secondary" size="sm" className="w-full">
              Contact Support
            </Button>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-text-muted/20 bg-foundation">
          <p className="text-xs text-text-muted text-center">
            EMERGE Intervention Planner v1.0
          </p>
        </div>
      </div>
    </>
  );
}
