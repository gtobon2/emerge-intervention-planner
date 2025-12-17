'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, X, Loader2, User, Bot, Info, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createMaskingContext,
  maskStudent,
  maskTextContent,
  unmaskTextContent,
  createMaskingLegend,
  type PIIMaskingContext,
} from '@/lib/ai/pii-mask';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StudentContext {
  id: string;
  name: string;
  groupName?: string;
  curriculum?: string;
  tier?: string;
  notes?: string | null;
}

interface GroupContext {
  name: string;
  curriculum: string;
  tier: string;
  grade: string;
}

interface SessionContext {
  date: string;
  studentNames?: string[];
  errorsLogged?: number;
  otrCount?: number;
  exitTicketScore?: number;
  notes?: string;
}

export interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional context for the conversation
  students?: StudentContext[];
  group?: GroupContext;
  recentSessions?: SessionContext[];
}

export function AIChat({
  isOpen,
  onClose,
  students = [],
  group,
  recentSessions = [],
}: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Create masking context - persists across the conversation
  const [maskingContext] = useState<PIIMaskingContext>(() => createMaskingContext());

  // Pre-mask all students when context changes
  useEffect(() => {
    students.forEach((student) => {
      maskStudent(maskingContext, student.id, student.name);
    });
  }, [students, maskingContext]);

  // Get the legend for display
  const legend = createMaskingLegend(maskingContext, students);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Mask the user's message before sending
    const maskedUserMessage = maskTextContent(
      maskingContext,
      userMessage,
      students
    );

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage, // Show original to user
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsLoading(true);

    try {
      // Build masked context for API
      const maskedStudents = students.map((student) => {
        const masked = maskStudent(maskingContext, student.id, student.name);
        return {
          maskedId: masked.maskedId,
          maskedName: masked.maskedName,
          groupName: student.groupName,
          curriculum: student.curriculum,
          tier: student.tier,
          progressNotes: student.notes
            ? maskTextContent(maskingContext, student.notes, students)
            : undefined,
        };
      });

      const maskedSessions = recentSessions.map((session) => ({
        ...session,
        maskedStudentNames: session.studentNames?.map((name) => {
          const student = students.find((s) => s.name === name);
          if (student) {
            return maskStudent(maskingContext, student.id, student.name).maskedName;
          }
          return name;
        }),
        notes: session.notes
          ? maskTextContent(maskingContext, session.notes, students)
          : undefined,
      }));

      // Build conversation history (masked)
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content:
          msg.role === 'user'
            ? maskTextContent(maskingContext, msg.content, students)
            : msg.content,
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: maskedUserMessage,
          context: {
            students: maskedStudents.length > 0 ? maskedStudents : undefined,
            group,
            recentSessions: maskedSessions.length > 0 ? maskedSessions : undefined,
          },
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get response');
      }

      const data = await response.json();

      // Unmask the AI's response to show real names to user
      const unmaskedResponse = unmaskTextContent(
        maskingContext,
        data.response,
        students
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: unmaskedResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, maskingContext, students, group, recentSessions, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg p-2">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI Assistant</h2>
              <p className="text-xs text-gray-500">
                Get help with interventions and student progress
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {students.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLegend(!showLegend)}
                className="text-gray-500 hover:text-gray-700"
                title="View student privacy legend"
              >
                <Shield className="w-4 h-4" />
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Privacy Legend */}
        {showLegend && legend.length > 0 && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Privacy Protection Active
                </p>
                <p className="text-xs text-amber-700 mb-2">
                  Student names are masked when sent to AI. Only you see real names.
                </p>
                <div className="flex flex-wrap gap-2">
                  {legend.map((item) => (
                    <span
                      key={item.maskedName}
                      className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-amber-200"
                    >
                      <span className="text-amber-600">{item.maskedName}</span>
                      <span className="text-gray-400">=</span>
                      <span className="text-gray-700">{item.originalName}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Context Info */}
        {(group || students.length > 0) && (
          <div className="px-4 py-2 bg-gray-50 border-b text-xs text-gray-600 flex items-center gap-4">
            <Info className="w-3 h-3" />
            {group && <span>Group: {group.name}</span>}
            {students.length > 0 && <span>{students.length} student(s) in context</span>}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-300" />
              <h3 className="font-medium text-gray-700 mb-2">
                How can I help you today?
              </h3>
              <p className="text-sm max-w-md mx-auto">
                Ask me about intervention strategies, student error patterns,
                progress monitoring, or differentiation techniques.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  'What interventions work for decoding errors?',
                  'How should I adjust for a struggling student?',
                  'Analyze recent error patterns',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-gray-50 rounded-b-xl">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about interventions, student progress, or strategies..."
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 self-end"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            <Shield className="w-3 h-3 inline mr-1" />
            Student names are automatically masked for privacy
          </p>
        </div>
      </div>
    </div>
  );
}
