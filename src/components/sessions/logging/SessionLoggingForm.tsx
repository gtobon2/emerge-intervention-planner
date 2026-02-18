'use client';

import { useState, useCallback } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  Circle,
  Save,
  X,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { PacingSection } from './PacingSection';
import { MasterySection } from './MasterySection';
import { ErrorsSection } from './ErrorsSection';
import { PMSection } from './PMSection';
import { FidelitySection, getFidelityDefaults } from './FidelitySection';
import type {
  Session,
  Student,
  Pacing,
  MasteryLevel,
  ObservedError,
  FidelityItem,
  PMTrend,
} from '@/lib/supabase/types';

// ============================================
// TYPES
// ============================================

export interface SessionLoggingData {
  pacing: Pacing | null;
  mastery_demonstrated: MasteryLevel | null;
  exit_ticket_correct: number | null;
  exit_ticket_total: number | null;
  errors_observed: ObservedError[];
  pm_score: number | null;
  fidelity_items: FidelityItem[];
  notes: string;
}

export interface SessionLoggingFormProps {
  session: Session;
  students: Student[];
  onSave: (data: SessionLoggingData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  /** Whether the group is Tier 3 (shows PM section) */
  isTier3?: boolean;
  /** Curriculum name for fidelity checklist customization */
  curriculum?: string;
  /** Previous PM scores for trend display */
  previousPMScores?: number[];
  /** Current PM trend */
  pmTrend?: PMTrend | null;
}

// ============================================
// COLLAPSIBLE SECTION
// ============================================

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  isFilled: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  isFilled,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 min-h-[52px] hover:bg-surface-elevated transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {isFilled ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          ) : (
            <Circle className="w-5 h-5 text-text-muted/40 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold text-text-primary">{title}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN FORM COMPONENT
// ============================================

/**
 * SessionLoggingForm - Main form for logging session data after completion.
 *
 * Wraps all logging sections (pacing, mastery, errors, PM, fidelity, notes)
 * in collapsible cards. Shows green checkmarks for filled sections.
 */
export function SessionLoggingForm({
  session,
  students,
  onSave,
  onCancel,
  isLoading = false,
  isTier3 = false,
  curriculum = 'wilson',
  previousPMScores = [],
  pmTrend = null,
}: SessionLoggingFormProps) {
  // Initialize form state from existing session data
  const [pacing, setPacing] = useState<Pacing | null>(session.pacing ?? null);
  const [mastery, setMastery] = useState<MasteryLevel | null>(
    session.mastery_demonstrated ?? null
  );
  const [exitTicketCorrect, setExitTicketCorrect] = useState<number | null>(
    session.exit_ticket_correct ?? null
  );
  const [exitTicketTotal, setExitTicketTotal] = useState<number | null>(
    session.exit_ticket_total ?? null
  );
  const [errors, setErrors] = useState<ObservedError[]>(
    session.errors_observed ?? []
  );
  const [pmScore, setPmScore] = useState<number | null>(session.pm_score ?? null);
  const [fidelityItems, setFidelityItems] = useState<FidelityItem[]>(
    session.fidelity_checklist && session.fidelity_checklist.length > 0
      ? session.fidelity_checklist
      : getFidelityDefaults(curriculum as Parameters<typeof getFidelityDefaults>[0])
  );
  const [notes, setNotes] = useState<string>(session.notes ?? '');

  // Track which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pacing: true,
    mastery: true,
    errors: false,
    pm: false,
    fidelity: false,
    notes: false,
  });

  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Determine which sections are filled
  const sectionsFilled = {
    pacing: pacing !== null,
    mastery: mastery !== null || (exitTicketCorrect !== null && exitTicketTotal !== null),
    errors: errors.length > 0,
    pm: pmScore !== null,
    fidelity: fidelityItems.some((item) => item.completed),
    notes: notes.trim().length > 0,
  };

  const filledCount = Object.values(sectionsFilled).filter(Boolean).length;
  const totalSections = isTier3 ? 6 : 5; // PM only for Tier 3

  const handleSave = async () => {
    const data: SessionLoggingData = {
      pacing,
      mastery_demonstrated: mastery,
      exit_ticket_correct: exitTicketCorrect,
      exit_ticket_total: exitTicketTotal,
      errors_observed: errors,
      pm_score: pmScore,
      fidelity_items: fidelityItems,
      notes,
    };
    await onSave(data);
  };

  const handleExitTicketChange = (correct: number | null, total: number | null) => {
    setExitTicketCorrect(correct);
    setExitTicketTotal(total);
  };

  return (
    <Card className="overflow-visible">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Session Log</h2>
              <p className="text-sm text-text-muted mt-0.5">
                Record observations and outcomes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">
                {filledCount}/{totalSections} sections
              </span>
              <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{
                    width: `${totalSections > 0 ? (filledCount / totalSections) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="px-5 pb-2 space-y-2">
          {/* Pacing */}
          <CollapsibleSection
            title="Pacing"
            isOpen={openSections.pacing}
            onToggle={() => toggleSection('pacing')}
            isFilled={sectionsFilled.pacing}
          >
            <PacingSection
              value={pacing}
              onChange={setPacing}
              disabled={isLoading}
            />
          </CollapsibleSection>

          {/* Mastery & Exit Ticket */}
          <CollapsibleSection
            title="Mastery & Exit Ticket"
            isOpen={openSections.mastery}
            onToggle={() => toggleSection('mastery')}
            isFilled={sectionsFilled.mastery}
          >
            <MasterySection
              mastery={mastery}
              onMasteryChange={setMastery}
              exitTicketCorrect={exitTicketCorrect}
              exitTicketTotal={exitTicketTotal}
              onExitTicketChange={handleExitTicketChange}
              disabled={isLoading}
            />
          </CollapsibleSection>

          {/* Errors */}
          <CollapsibleSection
            title="Observed Errors"
            isOpen={openSections.errors}
            onToggle={() => toggleSection('errors')}
            isFilled={sectionsFilled.errors}
          >
            <ErrorsSection
              errors={errors}
              onChange={setErrors}
              students={students}
              disabled={isLoading}
            />
          </CollapsibleSection>

          {/* PM Score (Tier 3 only) */}
          {isTier3 && (
            <CollapsibleSection
              title="Progress Monitoring"
              isOpen={openSections.pm}
              onToggle={() => toggleSection('pm')}
              isFilled={sectionsFilled.pm}
            >
              <PMSection
                score={pmScore}
                onChange={setPmScore}
                previousScores={previousPMScores}
                trend={pmTrend}
                disabled={isLoading}
              />
            </CollapsibleSection>
          )}

          {/* Fidelity Checklist */}
          <CollapsibleSection
            title="Fidelity Checklist"
            isOpen={openSections.fidelity}
            onToggle={() => toggleSection('fidelity')}
            isFilled={sectionsFilled.fidelity}
          >
            <FidelitySection
              items={fidelityItems}
              onChange={setFidelityItems}
              curriculum={curriculum as Parameters<typeof getFidelityDefaults>[0]}
              disabled={isLoading}
            />
          </CollapsibleSection>

          {/* Notes */}
          <CollapsibleSection
            title="Session Notes"
            isOpen={openSections.notes}
            onToggle={() => toggleSection('notes')}
            isFilled={sectionsFilled.notes}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Additional Notes</span>
              </div>
              <Textarea
                placeholder="General observations, next steps, parent communication notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
                className="min-h-[100px]"
              />
            </div>
          </CollapsibleSection>
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter align="between" className="px-5">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onCancel}
          disabled={isLoading}
          leftIcon={<X className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleSave}
          isLoading={isLoading}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Log
        </Button>
      </CardFooter>
    </Card>
  );
}
