# EMERGE Intervention Planner

A research-based intervention planning and session logging tool for interventionists managing multiple student groups across different curricula.

## Purpose

Built for interventionists who manage multiple groups (e.g., 10 groups across Wilson Reading, Delta Math, Camino a la Lectura, WordGen, and Amira) and need to:

- **Plan sessions** with anticipated errors and OTR targets
- **Log sessions** quickly with voice-to-text
- **Track progress** with PM charts and trend analysis
- **Get AI suggestions** for likely errors based on curriculum position
- **Chat with AI** for intervention strategies with built-in student privacy protection

## Tech Stack

- **Frontend:** Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **State:** Zustand (with local-first IndexedDB via Dexie)
- **Database:** Supabase (PostgreSQL) + Dexie (IndexedDB for offline)
- **AI:** OpenAI GPT-4o-mini or Anthropic Claude (configurable)
- **Calendar:** FullCalendar.js
- **Charts:** Recharts

## Design System (2025 Modern UI)

The app uses CSS variables for consistent theming with light/dark mode support:

```css
/* Light Mode */
--foundation: #F8FAFC;
--surface: #FFFFFF;
--movement: #FF006E;      /* Hot Magenta - primary actions */
--breakthrough: #84CC16;  /* Lime - success states */

/* Dark Mode */
--foundation: #0F0F12;
--surface: #18181B;
```

Features include:
- Glassmorphism effects
- Micro-interactions and animations
- Skeleton loading states
- Sparklines for data visualization

## Project Structure

```
emerge-intervention-planner/
├── docs/
│   ├── CLAUDE_CODE_HANDOFF.md    # Main spec for Claude Code
│   ├── SCOPE_AND_SEQUENCES.ts    # Curriculum data
│   └── ERROR_BANKS.ts            # Pre-loaded error patterns
├── src/
│   ├── app/                      # Next.js App Router
│   │   └── api/ai/               # AI API routes
│   ├── components/
│   │   ├── ai/                   # AI components (chat, suggestions)
│   │   ├── ui/                   # Reusable UI components
│   │   └── layout/               # App layout components
│   ├── lib/
│   │   ├── ai/                   # AI client, PII masking
│   │   ├── local-db/             # Dexie IndexedDB
│   │   └── supabase/             # Supabase client & types
│   ├── hooks/                    # Custom React hooks
│   └── stores/                   # Zustand stores
├── .env.example                  # Environment variables template
└── tailwind.config.js            # Tailwind + design tokens
```

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/emerge-intervention-planner.git
cd emerge-intervention-planner
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

### 4. Run locally
```bash
npm run dev
```

## Features

### Core Features
- [x] Dashboard with group cards and today's schedule
- [x] Session planning with anticipated errors
- [x] Session logging with OTR tracking
- [x] Progress monitoring charts
- [x] Calendar integration
- [x] All Students view
- [x] Error Bank

### AI Features
- [x] Error suggestions based on curriculum position
- [x] Session summary generation
- [x] **AI Chat Assistant** with student context
- [x] **PII Masking** - Student names automatically anonymized when sent to AI
- [ ] Voice-to-text session notes
- [ ] Cross-group pattern detection

### Privacy Features
- Student names are automatically masked before sending to AI (e.g., "Maria" → "Student A1")
- Users see real names; AI only sees anonymized identifiers
- Privacy legend shows the mapping for reference

### Curricula Supported
- Wilson Reading System (Steps 1-6)
- Delta Math (Grades 3-5 standards)
- Camino a la Lectura (Lessons 1-40)
- WordGen (5-day vocabulary cycles)
- Amira Learning (AI reading tutor)

## UI Components

### Cards
```tsx
<Card variant="default" hover>...</Card>
<Card variant="glass">...</Card>
<Card variant="interactive">...</Card>
<StatCard label="Sessions" value={42} sparkline={[10,20,15,30,25]} />
```

### Buttons
```tsx
<Button variant="primary">Save</Button>
<Button variant="secondary" leftIcon={<Plus />}>Add</Button>
<Button variant="outline">Cancel</Button>
<IconButton icon={<Settings />} aria-label="Settings" />
```

### Inputs
```tsx
<Input label="Name" leftIcon={<User />} />
<SearchInput value={query} onClear={() => setQuery('')} />
<Textarea label="Notes" />
```

## For Claude Code

The main specification is in `docs/CLAUDE_CODE_HANDOFF.md`. This contains:
- Complete database schema
- App architecture
- Feature specifications
- Curriculum sequence data
- Error bank seed data

## License

Private - All rights reserved.
