'use client';

import { useState } from 'react';
import { Sparkles, Copy, Edit2, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AIPanel, AILoading, AIError } from './ai-panel';
import type { Session } from '@/lib/supabase/types';

export interface AISessionSummaryProps {
  session: Session;
  groupName: string;
  onSaveToNotes: (summary: string) => void;
}

export function AISessionSummary({
  session,
  groupName,
  onSaveToNotes,
}: AISessionSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerateSummary = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setSummary('');
    setIsEditing(false);
    setCopied(false);
    setSaved(false);

    try {
      const response = await fetch('/api/ai/session-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          groupName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      setEditedSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = isEditing ? editedSummary : summary;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = () => {
    const textToSave = isEditing ? editedSummary : summary;
    onSaveToNotes(textToSave);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsOpen(false);
    }, 1500);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Save edits
      setSummary(editedSummary);
    }
    setIsEditing(!isEditing);
  };

  const canGenerate = session.status === 'completed' || session.components_completed?.length;

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleGenerateSummary}
        disabled={!canGenerate}
        className="border-purple-200 hover:border-purple-300 hover:bg-purple-50"
        title={
          !canGenerate
            ? 'Complete the session first to generate a summary'
            : 'Generate AI summary'
        }
      >
        <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
        Generate Summary
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="AI Session Summary"
        size="xl"
      >
        <AIPanel className="p-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 rounded-lg p-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">
                IEP-Ready Session Summary
              </h3>
              <p className="text-sm text-gray-600">
                AI-generated professional summary suitable for documentation and IEP
                reporting.
              </p>
            </div>
          </div>
        </AIPanel>

        {isLoading && (
          <AILoading message="Generating professional summary from session data..." />
        )}

        {error && <AIError message={error} onRetry={handleGenerateSummary} />}

        {!isLoading && !error && summary && (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className={copied ? 'text-emerald-600' : ''}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleEdit}
                className={isEditing ? 'text-blue-600' : ''}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                {isEditing ? 'Done Editing' : 'Edit'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saved}
                className={saved ? 'bg-emerald-600' : ''}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save to Notes
                  </>
                )}
              </Button>
            </div>

            {/* Summary content */}
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edit Summary
                </label>
                <textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="w-full h-64 p-4 border-2 border-purple-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-sans text-sm"
                  placeholder="Edit your summary..."
                />
              </div>
            ) : (
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="prose prose-sm max-w-none">
                  {summary.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700 mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Session metadata */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                Session Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Group:</span>{' '}
                  <span className="font-medium">{groupName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>{' '}
                  <span className="font-medium">{session.date}</span>
                </div>
                <div>
                  <span className="text-gray-500">OTR:</span>{' '}
                  <span className="font-medium">
                    {session.actual_otr_estimate || 'Not recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Exit Ticket:</span>{' '}
                  <span className="font-medium">
                    {session.exit_ticket_correct ?? '?'}/{session.exit_ticket_total ?? '?'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && !summary && (
          <div className="text-center py-8 text-gray-500">
            <p>No summary generated yet</p>
          </div>
        )}
      </Modal>
    </>
  );
}
