'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { Button } from './button';

export interface VoiceInputProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function VoiceInput({ onTranscript, placeholder = 'Click to start recording...', className = '' }: VoiceInputProps) {
  const { isRecording, setRecording, transcription, setTranscription } = useUIStore();
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript);
        setTranscription(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setRecording(false);
    };

    recognition.onend = () => {
      if (isRecording) {
        // Restart if still supposed to be recording
        try {
          recognition.start();
        } catch (e) {
          setRecording(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [isRecording, onTranscript, setRecording, setTranscription]);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      setError(null);
      setTranscription('');
      try {
        recognitionRef.current.start();
        setRecording(true);
      } catch (e) {
        setError('Could not start recording');
      }
    }
  }, [isRecording, setRecording, setTranscription]);

  if (!isSupported) {
    return (
      <div className={`text-text-muted text-sm ${className}`}>
        Voice input not supported in this browser.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-3">
        <Button
          variant={isRecording ? 'danger' : 'secondary'}
          onClick={toggleRecording}
          className="gap-2"
        >
          {isRecording ? (
            <>
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Start Recording
            </>
          )}
        </Button>

        {isRecording && (
          <span className="text-sm text-movement animate-pulse">
            Listening...
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {transcription && (
        <div className="p-3 bg-foundation rounded-lg text-text-primary text-sm">
          {transcription}
        </div>
      )}

      {!isRecording && !transcription && (
        <p className="text-sm text-text-muted">{placeholder}</p>
      )}
    </div>
  );
}

// Compact voice button for inline use
export function VoiceButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { isRecording, setRecording } = useUIStore();
  const recognitionRef = useRef<any>(null);

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  return (
    <button
      type="button"
      onClick={toggleRecording}
      className={`
        p-2 rounded-lg transition-colors
        ${isRecording
          ? 'bg-movement text-white animate-pulse'
          : 'bg-surface text-text-muted hover:text-text-primary'
        }
      `}
      title={isRecording ? 'Stop recording' : 'Start voice input'}
    >
      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
