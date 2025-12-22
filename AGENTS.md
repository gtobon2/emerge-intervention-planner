# EMERGE Intervention Planner - Agent Context

> **Purpose**: This file provides context for Claude Code / Claude CI to understand the project and continue development effectively.

---

## Quick Start for Agents

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add OPENAI_API_KEY=sk-... to .env

# Run development server
npm run dev
```

---

## Project Overview

**EMERGE** is a web application for special education interventionists managing student intervention groups across 5 curricula:
- Wilson Reading System (Steps 1-6)
- Delta Math (Grades 3-5)
- Camino a la Lectura (Lessons 1-40)
- WordGen (5-day cycles)
- Amira Learning

### Core Functionality
1. **Group Management** - Create/manage intervention groups with students
2. **Session Planning** - Plan sessions with anticipated errors, OTR targets
3. **Session Logging** - Run sessions with timer, OTR counter, error tracking
4. **Progress Monitoring** - Track PM data with charts, trendlines, decision rules
5. **Error Bank** - 27+ pre-seeded error patterns with correction protocols
6. **AI Assistant** - Chat for intervention help with PII masking for privacy
7. **Calendar** - FullCalendar view of all sessions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| State | Zustand |
| Local DB | Dexie (IndexedDB) |
| Remote DB | Supabase (PostgreSQL) |
| AI | OpenAI GPT-4o-mini / Anthropic Claude |
| Charts | Recharts |
| Calendar | FullCalendar.js |

---

## Key Files to Read First

| File | Purpose |
|------|---------|
| `docs/CLAUDE_CODE_HANDOFF.md` | **Main spec** - database schema, architecture, features |
| `README.md` | Overview, getting started, component examples |
| `DEVELOPMENT_LOG.md` | Session-by-session development history |
| `src/lib/supabase/types.ts` | TypeScript types for all entities |
| `src/components/ai/README.md` | AI components & PII masking documentation |

---

## Architecture

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/ai/            # AI API routes (chat, suggest-errors, summary)
│   ├── groups/[id]/       # Group detail, students, sessions
│   ├── calendar/          # FullCalendar page
│   ├── progress/          # PM charts page
│   ├── error-bank/        # Error patterns page
│   └── students/          # All students page
├── components/
│   ├── ui/                # Reusable UI (Card, Button, Input, etc.)
│   ├── ai/                # AI components (AIChat, AIErrorSuggestions)
│   ├── layout/            # AppLayout, Sidebar
│   └── [feature]/         # Feature-specific components
├── lib/
│   ├── ai/                # AI client, PII masking, prompts
│   ├── local-db/          # Dexie IndexedDB setup
│   ├── supabase/          # Supabase client, types, queries
│   └── curriculum/        # Curriculum data (wilson, delta-math, etc.)
├── stores/                # Zustand stores
└── hooks/                 # Custom React hooks
```

### Data Flow
1. **Local-first**: Data stored in IndexedDB via Dexie
2. **Sync**: Background sync to Supabase when online
3. **AI**: Requests go through `/api/ai/*` routes with PII masking

---

## Current State (as of 2025-12-21)

### Completed Features ✅
- [x] Dashboard with group cards
- [x] Group CRUD with student management
- [x] Session planning and running (timer, OTR, errors)
- [x] Error Bank (27+ patterns, search, filter)
- [x] Progress monitoring (charts, trendlines, decision rules)
- [x] Calendar view (FullCalendar)
- [x] AI error suggestions
- [x] AI session summaries
- [x] **AI Chat Assistant** with conversation history
- [x] **PII Masking** - student names anonymized for AI
- [x] **2025 UI Design System** - glassmorphism, animations, dark mode
- [x] Mobile responsive design
- [x] Voice input for notes (Web Speech API)

### In Progress / Backlog
- [x] Wire AI chat to page-specific context (group/student detail pages) ✅
- [x] Cross-group pattern detection ✅
- [x] Export reports to PDF ✅
- [ ] Offline sync improvements
- [ ] Multi-tenancy support

---

## Important Patterns

### PII Masking (Privacy)
Student names are NEVER sent to AI. Use the masking utilities:

```tsx
import { createMaskingContext, maskStudent, maskTextContent } from '@/lib/ai/pii-mask';

const context = createMaskingContext();
const masked = maskStudent(context, studentId, 'Maria');
// Returns: { maskedName: 'Student A1', maskedId: 'student_1' }

const maskedText = maskTextContent(context, 'Maria did well', students);
// Returns: 'Student A1 did well'
```

### UI Components
Use the design system components:

```tsx
// Cards
<Card variant="default" hover>...</Card>
<Card variant="glass">...</Card>
<StatCard label="Sessions" value={42} sparkline={[10,20,15,30]} />

// Buttons
<Button variant="primary" leftIcon={<Plus />}>Add</Button>
<Button variant="outline">Cancel</Button>
<IconButton icon={<Settings />} aria-label="Settings" />

// Inputs
<Input label="Name" leftIcon={<User />} />
<SearchInput value={query} onClear={() => setQuery('')} />
```

### CSS Utilities
```css
.glass          /* Glassmorphism effect */
.shimmer        /* Loading shimmer */
.skeleton       /* Skeleton loading */
.hover-lift     /* Lift on hover */
.stagger-item   /* Staggered list animation */
```

### Zustand Stores
```tsx
import { useGroupsStore } from '@/stores/groups';
import { useSessionsStore } from '@/stores/sessions';
import { useStudentsStore } from '@/stores/students';
import { useErrorsStore } from '@/stores/errors';
import { useProgressStore } from '@/stores/progress';
```

---

## Environment Variables

```bash
# Required for AI
AI_PROVIDER=openai              # or 'anthropic'
OPENAI_API_KEY=sk-...           # if using OpenAI
ANTHROPIC_API_KEY=sk-ant-...    # if using Anthropic

# Optional (for Supabase sync)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Common Tasks

### Add a New Page
1. Create file in `src/app/[route]/page.tsx`
2. Add to sidebar in `src/components/layout/sidebar.tsx`
3. Use `AppLayout` wrapper for consistent layout

### Add a New UI Component
1. Create in `src/components/ui/[name].tsx`
2. Export from `src/components/ui/index.ts`
3. Follow existing patterns (forwardRef, variants, className merge)

### Add a New AI Feature
1. Create API route in `src/app/api/ai/[feature]/route.ts`
2. Use `getAICompletion()` from `@/lib/ai/client`
3. Apply PII masking if student data involved
4. Create component in `src/components/ai/`

### Add a New Store
1. Create in `src/stores/[name].ts`
2. Export from `src/stores/index.ts`
3. Create hook in `src/hooks/use-[name].ts`

---

## Testing

```bash
npm run build    # Check for build errors
npm run lint     # Run ESLint
npm run dev      # Manual testing at localhost:3000
```

---

## Recent Commits (Reference)

| Commit | Description |
|--------|-------------|
| `289a24f` | Add AGENTS.md for Claude CI context |
| `1a0c670` | Update documentation for new features |
| `1b40f26` | Modernize UI with 2025 design system |
| `4136d2a` | Fix AI chat input text color for dark mode |
| `7bc1a26` | Add AI Chat Assistant with PII masking |
| `6b9be2d` | Add Students to sidebar navigation |

---

## Contact / Resources

- **Main Spec**: `docs/CLAUDE_CODE_HANDOFF.md`
- **Dev Log**: `DEVELOPMENT_LOG.md`
- **AI Docs**: `src/components/ai/README.md`
