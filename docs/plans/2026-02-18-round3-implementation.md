# Round 3: Implementation Plan

## 6 Parallel Streams with File Ownership

### Stream A: Session Logging Form
**NEW files only** (no conflicts):
- `src/components/sessions/logging/SessionLoggingForm.tsx` — Main form with 7 sections
- `src/components/sessions/logging/PacingSection.tsx` — Pacing radio (too_slow/just_right/too_fast)
- `src/components/sessions/logging/MasterySection.tsx` — Mastery level + exit ticket scores
- `src/components/sessions/logging/ErrorsSection.tsx` — Error observation with error bank integration
- `src/components/sessions/logging/PMSection.tsx` — PM score entry for Tier 3 sessions
- `src/components/sessions/logging/FidelitySection.tsx` — Fidelity checklist
- `src/components/sessions/logging/index.ts` — Barrel export

**Modifies** (exclusive ownership):
- `src/components/sessions/index.ts` — Add SessionLoggingForm export
- `src/components/sessions/tracking/index.ts` — Add WilsonLessonTracker + CaminoLessonTracker exports if missing

### Stream B: Print Session/Lesson
**NEW files only** (no conflicts):
- `src/components/sessions/print/PrintSessionLesson.tsx` — Main print layout
- `src/components/sessions/print/WilsonLessonPrint.tsx` — Wilson 10-part lesson print
- `src/components/sessions/print/CaminoLessonPrint.tsx` — Camino lesson print
- `src/components/sessions/print/GenericSessionPrint.tsx` — Delta Math/WordGen/Amira
- `src/components/sessions/print/print-styles.css` — Print-specific styles
- `src/components/sessions/print/index.ts` — Barrel export

### Stream C: Form Validation
**Modifies** (exclusive ownership):
- `src/lib/supabase/validation.ts` — Add validateGoalSetting, validatePMDataPoint
- `src/components/goals/GoalSettingModal.tsx` — Wire validateGoalSetting
- `src/components/progress/add-data-point-modal.tsx` — Wire validatePMDataPoint
- `src/components/sessions/edit-session-modal.tsx` — Wire validateSession
- `src/components/sessions/plan-session-modal.tsx` — Wire validateSession
- `src/components/errors/add-error-modal.tsx` — Wire validateErrorBankEntry

### Stream D: Mobile Responsiveness
**Modifies** (exclusive CSS/layout ownership):
- `src/app/calendar/page.tsx` — Responsive 7-col grid
- `src/components/schedule/ScheduleGrid.tsx` — Remove min-w, add mobile layout
- `src/components/goals/GoalSettingModal.tsx` — ONLY responsive table classes (no validation)
- `src/app/admin/page.tsx` — Responsive admin tables
- `src/app/admin/cycles/page.tsx` — Responsive cycle management

**CONFLICT NOTE**: GoalSettingModal.tsx shared with Stream C
- Stream C: validation logic only (adds error state, validation calls)
- Stream D: CSS responsive classes only (adds responsive table wrappers)
- Resolution: Stream D runs FIRST on GoalSettingModal, Stream C runs AFTER

### Stream E: Error UI & Loading States
**NEW files** (no conflicts):
- `src/app/error.tsx` — Root error boundary
- `src/app/not-found.tsx` — 404 page
- `src/components/ui/toast.tsx` — Toast notification component
- `src/components/ui/toast-container.tsx` — Toast container with auto-dismiss
- `src/app/groups/[id]/error.tsx` — Group error boundary
- `src/app/groups/[id]/session/[sessionId]/error.tsx` — Session error boundary

**Modifies** (exclusive ownership):
- `src/components/layout/app-layout.tsx` — Add ToastContainer to layout
- `src/stores/notifications.ts` — Add 'error' | 'success' | 'warning' notification types

### Stream F: PM Data Entry Enhancement
**NEW files** (no conflicts):
- `src/components/progress/IndividualPMEntry.tsx` — Single-student PM entry
- `src/components/progress/PMEntryFromSession.tsx` — Session-embedded PM for Tier 3

**Modifies** (exclusive ownership):
- `src/app/progress/page.tsx` — Add individual PM entry mode toggle

### Stream G: Integration (SEQUENTIAL — after A-F)
**Modifies** (after all streams complete):
- `src/app/groups/[id]/session/[sessionId]/page.tsx` — Wire SessionLoggingForm + Print button
- Run full build verification

## Conflict Resolution Matrix
| File | Stream D | Stream C | Resolution |
|------|----------|----------|------------|
| GoalSettingModal.tsx | CSS responsive | Validation logic | D first, C second |

All other files have single-stream ownership — no conflicts.

## Execution Order
1. Streams A, B, D, E, F — fully parallel (no shared files)
2. Stream C — after Stream D completes (GoalSettingModal dependency)
3. Stream G — after all streams complete (integration)
