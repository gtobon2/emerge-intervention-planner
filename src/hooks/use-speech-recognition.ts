'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  reset: () => void;
}

export function useSpeechRecognition({
  continuous = true,
  interimResults = true,
  lang = 'en-US',
  onTranscript,
  onError,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  // Initialize Speech Recognition
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    // Handle recognition results
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcriptPiece;
        } else {
          interim += transcriptPiece;
        }
      }

      if (final) {
        finalTranscriptRef.current += final + ' ';
        setTranscript(finalTranscriptRef.current.trim());
        if (onTranscript) {
          onTranscript(final, true);
        }
      }

      setInterimTranscript(interim);

      if (interim && onTranscript) {
        onTranscript(interim, false);
      }
    };

    // Handle errors
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      let errorMessage = 'An error occurred during speech recognition';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found or microphone access denied.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please enable microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);

      if (onError) {
        onError(errorMessage);
      }
    };

    // Handle recognition end
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    // Handle recognition start
    recognition.onstart = () => {
      setError(null);
    };

    recognitionRef.current = recognition;

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [continuous, interimResults, lang, onTranscript, onError]);

  // Start recognition
  const start = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      return;
    }

    try {
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e: any) {
      // Handle case where recognition is already started
      if (e.message?.includes('already started')) {
        setIsListening(true);
      } else {
        setError('Failed to start speech recognition');
        console.error('Start error:', e);
      }
    }
  }, [isSupported]);

  // Stop recognition
  const stop = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    } catch (e) {
      console.error('Stop error:', e);
    }
  }, []);

  // Toggle recognition
  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // Reset transcript
  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    finalTranscriptRef.current = '';
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    toggle,
    reset,
  };
}
