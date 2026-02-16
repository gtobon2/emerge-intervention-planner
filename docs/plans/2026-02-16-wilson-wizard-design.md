# Wilson Lesson Builder Wizard — Design Document

## Problem

The existing Wilson lesson builder uses a drag-and-drop interface that is clunky, confusing, and difficult to use on mobile. Interventionists find it takes too many steps to build a lesson, the layout is overwhelming, and the drag-and-drop mechanics are awkward.

## Solution

Replace the drag-and-drop builder with a **guided 5-step wizard** that walks through Wilson's natural 3-block structure with smart defaults. Elements are pre-populated from the substep data bank and users toggle items on/off rather than dragging them.

## Wizard Flow

### Step 1: Setup
- Substep picker (grouped by Step 1-6)
- Days toggle: 1 / 2 / 3
- Session type: Group or 1:1 (sets default durations)

### Step 2: Word Study (Block 1 — Parts 1-5)
Each section is a collapsible card pre-populated from the substep's element bank:
- Part 1: Sounds Quick Drill — sound cards with checkboxes
- Part 2: Teach & Review Reading — sample words + concepts
- Part 3: Word Cards — real words + HF words
- Part 4: Wordlist Reading — real + nonsense words
- Part 5: Sentence Reading — sentences

Each section has: day assignment toggle (1/2/3), duration slider, optional notes.

### Step 3: Spelling (Block 2 — Parts 6-8)
Same card pattern:
- Part 6: Quick Drill Reverse
- Part 7: Teach & Review Spelling
- Part 8: Written Work Dictation

### Step 4: Fluency (Block 3 — Parts 9-10)
- Part 9: Passage Reading — stories
- Part 10: Listening Comprehension — stories

### Step 5: Review & Save
- Tab per day showing assigned sections, element counts, total duration
- Warnings for days exceeding session time or having zero sections
- "Generate with AI" button for auto-filling empty sections
- Save button

## Component Architecture

### New Components
- `WilsonWizard` — main container: step state, progress bar, Next/Back
- `WizardSetup` — Step 1: substep picker, days, session type
- `WizardBlock` — Reusable for Steps 2-4: renders WizardSection cards for a block
- `WizardSection` — Single lesson component: element checklist, day toggle, duration, notes
- `WizardReview` — Step 5: plan summary by day, save

### Preserved (No Changes)
- All existing types: `WilsonLessonPlan`, `LessonPlanSection`, `LessonPlanElement`, etc.
- Element bank data in IndexedDB (`WilsonLessonElements`)
- Wilson data settings page (`/settings/wilson-data`)
- `WilsonLessonTracker` for live session tracking
- AI generation endpoint (`/api/ai/generate-wilson-lesson`)
- `WILSON_LESSON_SECTIONS` constant (section definitions)

### Replaced
- `WilsonLessonBuilder.tsx` → `WilsonWizard.tsx`
- `ElementBank.tsx` → elements inline in `WizardSection`
- `LessonSection.tsx` → `WizardSection.tsx`
- `DraggableElement.tsx` → removed (no drag-and-drop)

### Entry Points
- New route: `/wilson-builder` (standalone page with AppLayout)
- Session planning modal: "Build Wilson Lesson" button opens wizard in full-screen modal

## UX Details

### WizardSection Card
```
┌─────────────────────────────────────────────┐
│ ▼ Part 1: Sounds Quick Drill    Day [1][2][3]│
│   Duration: [3 min ──●────── 10 min]        │
│                                              │
│   ☑ f — "fish" (consonant)                  │
│   ☑ l — "lamp" (consonant)                  │
│   ☑ a — "apple" (vowel, NEW)               │
│   ☐ o — "octopus" (vowel)                  │
│                                              │
│   Notes: [optional text field]               │
└─────────────────────────────────────────────┘
```

- Sections expanded by default, collapsible
- "NEW" badge on elements introduced at this substep
- Day toggles only visible when numDays > 1
- Empty element bank shows link to Settings > Wilson Data
- Duration slider with min/max per component definition
- Mobile: cards stack vertically, day toggles become dropdown

### Review Step
- Tab per day (Day 1 / Day 2 / Day 3)
- Warning badges for overloaded or empty days
- Total duration per day displayed prominently

## Data Flow

1. User picks substep → load `WilsonLessonElements` from IndexedDB
2. Elements auto-populate into sections (all checked by default)
3. User unchecks items, assigns days, adjusts durations
4. On save → builds `WilsonLessonPlan` (existing type) → saves to session(s)
5. Multi-day plans split into separate sessions with `series_id`, `series_order`, `series_total`

## Out of Scope
- Wilson Steps 7-12 (R-controlled, Vowel Teams, Advanced)
- Migrating Wilson element data from IndexedDB to Supabase
- Changes to the Wilson Data settings page
