'use client';

import React from 'react';
import type { Session, Group, Curriculum } from '@/lib/supabase/types';
import { getCurriculumLabel, formatCurriculumPosition } from '@/lib/supabase/types';

// ============================================
// Types
// ============================================

interface GenericSessionPrintProps {
  session: Session;
  group: Group;
}

// ============================================
// Helpers
// ============================================

function getCurriculumDescription(curriculum: Curriculum): string {
  switch (curriculum) {
    case 'delta_math':
      return 'Standards-based math intervention using the Concrete-Representational-Abstract (CRA) approach.';
    case 'wordgen':
      return 'Academic vocabulary and comprehension program for middle school students.';
    case 'amira':
      return 'AI-powered reading tutor providing personalized instruction and fluency practice.';
    case 'despegando':
      return 'Spanish literacy intervention program for emerging readers.';
    default:
      return '';
  }
}

// ============================================
// Main Component
// ============================================

export function GenericSessionPrint({ session, group }: GenericSessionPrintProps) {
  const positionLabel = formatCurriculumPosition(group.curriculum, session.curriculum_position);
  const curriculumName = getCurriculumLabel(group.curriculum);
  const description = getCurriculumDescription(group.curriculum);

  const hasNotes = session.notes && session.notes.trim().length > 0;
  const hasNextSessionNotes = session.next_session_notes && session.next_session_notes.trim().length > 0;
  const hasPracticeItems = session.planned_practice_items && session.planned_practice_items.length > 0;
  const hasCumulativeReview = session.cumulative_review_items && session.cumulative_review_items.length > 0;
  const hasAnticipatedErrors = session.anticipated_errors && session.anticipated_errors.length > 0;
  const hasResponseFormats = session.planned_response_formats && session.planned_response_formats.length > 0;
  const hasFidelityChecklist = session.fidelity_checklist && session.fidelity_checklist.length > 0;

  return (
    <div className="generic-session-print">
      {/* Curriculum Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            {curriculumName} &mdash; Session Plan
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Current Position: {positionLabel}
          </p>
          {description && (
            <p className="text-xs text-gray-400 mt-0.5 italic">{description}</p>
          )}
        </div>
        {session.planned_otr_target && (
          <div className="text-right">
            <span className="text-xs font-medium text-gray-500">
              OTR Target: {session.planned_otr_target}
            </span>
          </div>
        )}
      </div>

      {/* Response Formats */}
      {hasResponseFormats && (
        <div className="mb-3 print-break-avoid">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
            Response Formats
          </h4>
          <div className="flex flex-wrap gap-1">
            {session.planned_response_formats!.map((format, i) => (
              <span
                key={i}
                className="print-element-tag inline-block border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-700 bg-gray-50"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Practice Items */}
      {hasPracticeItems && (
        <div className="mb-3 print-break-avoid">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
            Practice Items
          </h4>
          <table className="w-full text-xs border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-2 py-1 border-b border-gray-200 font-semibold text-gray-600 w-20">Type</th>
                <th className="text-left px-2 py-1 border-b border-gray-200 font-semibold text-gray-600">Item</th>
              </tr>
            </thead>
            <tbody>
              {session.planned_practice_items!.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-1 border-b border-gray-100 capitalize text-gray-500">
                    {item.type}
                  </td>
                  <td className="px-2 py-1 border-b border-gray-100 text-gray-800">
                    {item.item}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cumulative Review */}
      {hasCumulativeReview && (
        <div className="mb-3 print-break-avoid">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
            Cumulative Review Items
          </h4>
          <div className="flex flex-wrap gap-1">
            {session.cumulative_review_items!.map((item, i) => (
              <span
                key={i}
                className="print-element-tag inline-block border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-700 bg-white"
              >
                {item.item}
                <span className="text-gray-400 ml-1">({item.type})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Anticipated Errors */}
      {hasAnticipatedErrors && (
        <div className="mb-3 print-break-avoid">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
            Anticipated Errors & Corrections
          </h4>
          <table className="w-full text-xs border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-2 py-1 border-b border-gray-200 font-semibold text-gray-600">Error Pattern</th>
                <th className="text-left px-2 py-1 border-b border-gray-200 font-semibold text-gray-600">Correction Protocol</th>
              </tr>
            </thead>
            <tbody>
              {session.anticipated_errors!.map((error, i) => (
                <tr key={error.id || i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-1 border-b border-gray-100 text-gray-800">
                    {error.error_pattern}
                  </td>
                  <td className="px-2 py-1 border-b border-gray-100 text-gray-700">
                    {error.correction_protocol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Fidelity Checklist */}
      {hasFidelityChecklist && (
        <div className="mb-3 print-break-avoid">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
            Lesson Components Checklist
          </h4>
          <div className="space-y-1">
            {session.fidelity_checklist!.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                <span className="w-4 h-4 border border-gray-400 rounded-sm flex-shrink-0 inline-flex items-center justify-center">
                  {/* Empty checkbox for print */}
                </span>
                <span className="flex-1">{item.component}</span>
                {item.duration_minutes && (
                  <span className="text-gray-400">{item.duration_minutes} min</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Notes */}
      {hasNotes && (
        <div className="mb-3 print-break-avoid">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
            Session Notes
          </h4>
          <div className="print-section-notes border-l-2 border-gray-300 pl-2 text-xs text-gray-700">
            {session.notes}
          </div>
        </div>
      )}

      {/* Next Session Notes */}
      {hasNextSessionNotes && (
        <div className="mb-3 print-break-avoid">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
            Notes for Next Session
          </h4>
          <div className="print-section-notes border-l-2 border-amber-300 pl-2 text-xs text-gray-700 bg-amber-50 py-1">
            {session.next_session_notes}
          </div>
        </div>
      )}

      {/* Blank Notes Area for writing during the session */}
      <div className="mt-4 print-break-avoid">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Session Notes (during session)
        </h4>
        <div className="space-y-2">
          <div className="print-notes-line border-b border-gray-300 h-5" />
          <div className="print-notes-line border-b border-gray-300 h-5" />
          <div className="print-notes-line border-b border-gray-300 h-5" />
          <div className="print-notes-line border-b border-gray-300 h-5" />
          <div className="print-notes-line border-b border-gray-300 h-5" />
        </div>
      </div>
    </div>
  );
}

export default GenericSessionPrint;
