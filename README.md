# EMERGE Intervention Planner

A research-based intervention planning and session logging tool for interventionists managing multiple student groups across different curricula.

## 🎯 Purpose

Built for interventionists who manage multiple groups (e.g., 10 groups across Wilson Reading, Delta Math, Camino a la Lectura, WordGen, and Amira) and need to:

- **Plan sessions** with anticipated errors and OTR targets
- **Log sessions** quickly with voice-to-text
- **Track progress** with PM charts and trend analysis
- **Get AI suggestions** for likely errors based on curriculum position

## 🛠 Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **State:** Zustand
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude API
- **Calendar:** FullCalendar.js
- **Charts:** Recharts

## 🎨 Brand (EMERGE)

```css
--foundation: #1A1A1D;    /* Rich Charcoal */
--movement: #FF006E;       /* Hot Magenta */
--breakthrough: #E9FF7A;   /* Citrus Yellow */
```

## 📁 Project Structure

```
emerge-intervention-planner/
├── docs/
│   ├── CLAUDE_CODE_HANDOFF.md    # Main spec for Claude Code
│   ├── SCOPE_AND_SEQUENCES.ts    # Curriculum data
│   └── ERROR_BANKS.ts            # Pre-loaded error patterns
├── src/
│   ├── app/                      # Next.js App Router
│   ├── components/               # React components
│   ├── lib/                      # Utilities, Supabase, AI
│   ├── hooks/                    # Custom hooks
│   └── stores/                   # Zustand stores
├── supabase/
│   └── schema.sql                # Database schema
└── .env.example                  # Environment variables template
```

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/emerge-intervention-planner.git
cd emerge-intervention-planner
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema from `supabase/schema.sql`
3. Copy your credentials to `.env.local`

### 4. Run locally
```bash
npm run dev
```

## 📋 Features

### Core Features
- [ ] Dashboard with group cards and today's schedule
- [ ] Session planning with anticipated errors
- [ ] Session logging with voice-to-text
- [ ] Progress monitoring charts
- [ ] Calendar integration

### AI Features
- [ ] Error suggestions based on curriculum position
- [ ] Voice-to-text session notes
- [ ] Session summary generation
- [ ] Cross-group pattern detection

### Curricula Supported
- Wilson Reading System (Steps 1-6)
- Delta Math (Grades 3-5 standards)
- Camino a la Lectura (Lessons 1-40)
- WordGen (5-day vocabulary cycles)
- Amira Learning (AI reading tutor)

## 🔧 For Claude Code

The main specification is in `docs/CLAUDE_CODE_HANDOFF.md`. This contains:
- Complete database schema
- App architecture
- 10 parallelizable subagent tasks
- Lesson structure templates
- Curriculum sequence data
- Error bank seed data
- Feature specifications

## 📄 License

Private - All rights reserved.
