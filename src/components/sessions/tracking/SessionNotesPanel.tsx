'use client';

import { MessageSquare, Mic } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SessionNotesPanelProps {
  /** Current notes content */
  notes: string;
  /** Callback when notes change */
  onNotesChange: (notes: string) => void;
  /** Whether voice input is currently listening */
  isListening?: boolean;
  /** Whether voice input is supported in this browser */
  isVoiceSupported?: boolean;
  /** Voice input error message */
  voiceError?: string | null;
  /** Callback to toggle voice input */
  onToggleVoice?: () => void;
}

/**
 * SessionNotesPanel - Notes input with optional voice recording support
 *
 * Provides a textarea for session notes with an optional voice input button
 * when speech recognition is supported by the browser.
 */
export function SessionNotesPanel({
  notes,
  onNotesChange,
  isListening = false,
  isVoiceSupported = false,
  voiceError = null,
  onToggleVoice,
}: SessionNotesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Session Notes
          </CardTitle>
          {isVoiceSupported && onToggleVoice && (
            <button
              type="button"
              onClick={onToggleVoice}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg'
                    : 'bg-foundation text-text-secondary hover:bg-border'
                }
              `}
              title={isListening ? 'Stop voice input' : 'Click to start voice input'}
            >
              <Mic className="w-4 h-4" />
              {isListening && (
                <>
                  <span className="w-2 h-2 bg-white rounded-full" />
                  <span className="text-sm font-medium">Recording</span>
                </>
              )}
              {!isListening && <span className="text-sm">Voice Input</span>}
            </button>
          )}
        </div>
        {isListening && (
          <p className="text-sm text-movement mt-2 animate-pulse">
            Listening... speak now
          </p>
        )}
        {voiceError && (
          <p className="text-sm text-red-500 mt-2">{voiceError}</p>
        )}
        {!isVoiceSupported && (
          <p className="text-xs text-text-muted mt-2">
            Voice input not supported in this browser. Use Chrome, Edge, or Safari for voice features.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full h-32 p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-movement focus:border-movement bg-surface text-text-primary"
          placeholder="Add observations, student responses, or notes for next session..."
        />
      </CardContent>
    </Card>
  );
}
