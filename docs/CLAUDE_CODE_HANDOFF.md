# EMERGE Intervention Planner - Claude Code Handoff

## Quick Context
**What:** Web app for a single interventionist (Geraldo) managing 10 student groups across 5 different curricula
**Why:** Current pain points are tracking what was covered, planning next sessions based on data, and maintaining consistent session structure
**Philosophy:** Research-based intervention planning using NCII principles, explicit instruction, and data-based individualization

## The 10 Groups Being Managed
| Group | Curriculum | Tier | Grade |
|-------|------------|------|-------|
| Wilson Group A | Wilson Reading System | 3 | 3 |
| Wilson Group B | Wilson Reading System | 2 | 4 |
| Wilson Group C | Wilson Reading System | 2 | 5 |
| Wilson Group D | Wilson Reading System | 3 | 2 |
| Delta Math 5A | Delta Math | 2 | 5 |
| Delta Math 5B | Delta Math | 3 | 5 |
| Camino Group 1 | Camino a la Lectura | 2 | 2 |
| Camino Group 2 | Camino a la Lectura | 3 | 3 |
| Amira Readers | Amira Learning | 2 | 2 |
| WordGen Vocab | WordGen | 2 | 5 |

---

## Tech Stack
```
Frontend:        React 18+ with TypeScript
Styling:         Tailwind CSS
State:           Zustand
Database:        Supabase (PostgreSQL + Auth + Realtime)
AI:              Anthropic Claude API (via edge functions)
Calendar:        FullCalendar.js
Charts:          Recharts
Voice:           Web Speech API
Deploy:          Vercel
```

## Brand Colors (EMERGE)
```css
--foundation: #1A1A1D;    /* Rich Charcoal - backgrounds */
--movement: #FF006E;       /* Hot Magenta - primary actions */
--breakthrough: #E9FF7A;   /* Citrus Yellow - highlights/success */
--surface: #2D2D30;        /* Card backgrounds */
--text: #FFFFFF;
--text-muted: #A0A0A0;
--font-brand: 'Plus Jakarta Sans';
--font-student: 'Atkinson Hyperlegible';
```

---

## Database Schema

```sql
-- GROUPS
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  curriculum TEXT NOT NULL, -- 'wilson' | 'delta_math' | 'camino' | 'wordgen' | 'amira'
  tier INTEGER NOT NULL CHECK (tier IN (2, 3)),
  grade INTEGER NOT NULL,
  current_position JSONB NOT NULL,
  schedule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSIONS
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'planned', -- 'planned' | 'completed' | 'cancelled'
  curriculum_position JSONB NOT NULL,
  
  -- Planning (BEFORE session)
  planned_otr_target INTEGER,
  planned_response_formats TEXT[],
  planned_practice_items JSONB,
  cumulative_review_items JSONB,
  anticipated_errors JSONB,
  
  -- Logging (AFTER session)
  actual_otr_estimate INTEGER,
  pacing TEXT, -- 'too_slow' | 'just_right' | 'too_fast'
  components_completed TEXT[],
  exit_ticket_correct INTEGER,
  exit_ticket_total INTEGER,
  mastery_demonstrated TEXT,
  
  -- Errors
  errors_observed JSONB,
  unexpected_errors JSONB,
  
  -- Tier 3 specific
  pm_score NUMERIC,
  pm_trend TEXT,
  dbi_adaptation_notes TEXT,
  
  -- Notes
  notes TEXT,
  next_session_notes TEXT,
  fidelity_checklist JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROGRESS MONITORING
CREATE TABLE progress_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  measure_type TEXT NOT NULL,
  score NUMERIC NOT NULL,
  benchmark NUMERIC,
  goal NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ERROR BANK
CREATE TABLE error_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum TEXT NOT NULL,
  curriculum_position JSONB,
  error_pattern TEXT NOT NULL,
  underlying_gap TEXT,
  correction_protocol TEXT NOT NULL,
  correction_prompts TEXT[],
  visual_cues TEXT,
  kinesthetic_cues TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  effectiveness_count INTEGER DEFAULT 0,
  occurrence_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CURRICULUM SEQUENCES
CREATE TABLE curriculum_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum TEXT NOT NULL,
  position_key TEXT NOT NULL,
  position_label TEXT NOT NULL,
  description TEXT,
  skills TEXT[],
  sample_words JSONB,
  lesson_components JSONB,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## App Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── groups/
│   │   ├── page.tsx                # Groups list
│   │   └── [id]/page.tsx           # Group detail + sessions
│   ├── calendar/page.tsx           # Calendar view
│   ├── progress/page.tsx           # PM charts
│   └── api/ai/                     # AI endpoints
├── components/
│   ├── ui/                         # Button, Card, Modal, Select, etc.
│   ├── dashboard/                  # GroupCard, TodaySchedule, QuickStats
│   ├── sessions/                   # SessionPlanner, SessionLogger, ErrorTracker
│   ├── curriculum/                 # WilsonPicker, DeltaPicker, CaminoPicker
│   └── progress/                   # PMChart, DataEntryForm
├── lib/
│   ├── supabase/                   # Client, types
│   ├── curriculum/                 # Wilson, Delta, Camino data
│   ├── error-banks/                # Pre-loaded errors
│   └── ai/                         # Claude integration
├── hooks/                          # useGroups, useSessions, etc.
└── stores/                         # Zustand stores
```

---

## 10 Subagent Tasks

### Dependency Graph
```
[1] Infrastructure ──┬──→ [3] Dashboard
                     ├──→ [5] Error Bank ──→ [6] Sessions
[2] UI Components ───┼──→ [7] Progress
                     ├──→ [8] Calendar
[4] Curriculum Data ─┴──→ [9] AI Features
                          [10] Seeding (after 4, 5)
```

### Task Details

**SUBAGENT 1: Core Infrastructure** (Start immediately)
- Set up Supabase project and all tables
- Create TypeScript types from schema
- Set up Zustand stores
- Create base API routes

**SUBAGENT 2: UI Component Library** (Start immediately)
- Design tokens (colors, fonts, spacing per brand)
- Button (primary/secondary/ghost variants)
- Card, Modal, Select, Checkbox, Input, Textarea
- Badge (for tier, curriculum), Timer, VoiceInput

**SUBAGENT 3: Dashboard & Navigation** (After 1, 2)
- App layout with sidebar
- GroupCard component
- TodaySchedule component
- QuickStats, filter/search

**SUBAGENT 4: Curriculum Data** (Start immediately)
- Wilson sequence (Steps 1-6, all substeps) - SEE DATA BELOW
- Delta Math standards (grades 3-5) - SEE DATA BELOW
- Camino lessons (1-40) - SEE DATA BELOW
- Cascading position pickers per curriculum

**SUBAGENT 5: Error Bank System** (After 1)
- Seed pre-loaded errors - SEE DATA BELOW
- ErrorAnticipator component (planning view)
- ErrorTracker component (logging view)
- CRUD operations, effectiveness tracking

**SUBAGENT 6: Session Planning & Logging** (After 2, 4, 5)
- SessionPlanner (pre-session form)
- SessionLogger (post-session form)
- OTRCounter (tap counter)
- FidelityChecklist
- Auto-save, session history

**SUBAGENT 7: Progress Monitoring** (After 1, 2)
- PMChart with Recharts (line chart, goal line, trend line)
- DataEntryForm
- Decision rule alerts
- Phase change markers

**SUBAGENT 8: Calendar System** (After 1, 2)
- FullCalendar integration
- WeekView, MonthView
- Drag-to-reschedule
- Google Calendar sync (optional)

**SUBAGENT 9: AI Integration** (After 1)
- Claude API setup
- Voice-to-text transcription
- Error suggestion endpoint
- Session summary generator

**SUBAGENT 10: Data Seeding** (After 4, 5)
- Seed curriculum sequences
- Seed error banks
- Create 10 test groups matching user's actual groups
- Sample session and PM data

---

## Lesson Structure Templates

### Wilson (10 parts, adapted to 35-40 min)
1. Sound Cards (2 min) - Review letter-sounds
2. Teach/Review Concepts (5 min) - New skill, rules
3. Word Cards (2 min) - Decode real words
4. Word List Reading (5 min) - Real + nonsense words
5. Sentence Reading (3 min) - Apply in sentences
6. Passage Reading (8 min) - Controlled decodable
7. Quick Drill (2 min) - Rapid review
8. Dictation: Sounds (2 min)
9. Dictation: Words (3 min)
10. Dictation: Sentences (3 min)

### Delta Math (8-session cycle per standard)
| Session | Phase | Focus |
|---------|-------|-------|
| 1 | Concrete | Diagnostic + manipulatives |
| 2 | Concrete | Hands-on practice |
| 3 | Transition | Concrete → Representational |
| 4 | Representational | Visual models |
| 5 | Transition | Representational → Abstract |
| 6 | Abstract | Procedural fluency |
| 7 | Mixed | Word problems |
| 8 | Assessment | Post-assess |

### Camino a la Lectura (11 components, 45 min)
1. Warm-Up Review (5 min)
2. Phonemic Awareness (5 min)
3. New Phonics Concept (10 min) - I Do/We Do/You Do
4. Word Blending/Decoding (5-10 min)
5. Decodable Text Reading (10 min)
6. Comprehension & Discussion (5 min)
7. Vocabulary & Oral Language (5 min)
8. Writing/Spelling (5-10 min)
9. Grammar & Conventions (5 min, optional)
10. Review & Reinforcement (2-3 min)
11. Homework/Extension

### WordGen (5-day cycle per unit)
- Day 1: Introduce words + Text 1
- Day 2: Deep word work
- Day 3: Text 2 + Discussion
- Day 4: Writing
- Day 5: Assessment

### Amira (AI-driven, 20-30 min)
- Warm-Up (3-5 min)
- Oral Reading with AI interventions (15-20 min)
- Comprehension (5-8 min)
- Summary (2-3 min)

---

## Curriculum Sequence Data

### Wilson Steps Overview
```typescript
const WILSON_STEPS = [
  { step: 1, name: 'Closed Syllables & Foundational Skills', substeps: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6'] },
  { step: 2, name: 'VCe Syllables', substeps: ['2.1', '2.2', '2.3'] },
  { step: 3, name: 'Open Syllables & Multisyllabic', substeps: ['3.1', '3.2', '3.3', '3.4'] },
  { step: 4, name: 'R-Controlled Vowels', substeps: ['4.1', '4.2', '4.3'] },
  { step: 5, name: 'Vowel Teams', substeps: ['5.1', '5.2', '5.3', '5.4'] },
  { step: 6, name: 'Diphthongs & Advanced', substeps: ['6.1', '6.2', '6.3', '6.4'] }
];

// Substep details
const WILSON_SUBSTEPS = {
  '1.1': { name: 'Short Vowels (CVC)', words: ['sat', 'pet', 'hit', 'lot', 'cup'] },
  '1.2': { name: 'Consonant Blends', words: ['plant', 'blend', 'crisp', 'stomp'] },
  '1.3': { name: 'Digraphs (ch, sh, th, wh, ck)', words: ['chip', 'shop', 'thin', 'whip'] },
  '1.4': { name: 'Bonus Letters (ff, ll, ss, zz)', words: ['stuff', 'bell', 'miss', 'jazz'] },
  '1.5': { name: 'Glued Sounds (all, am, an, ang, ing)', words: ['ball', 'ham', 'man', 'bang', 'ring'] },
  '1.6': { name: 'Suffixes (-s, -es, -ed, -ing)', words: ['cats', 'dishes', 'jumped', 'running'] },
  '2.1': { name: 'VCe Long Vowels', words: ['make', 'time', 'hope', 'cube'] },
  // ... continue for all substeps
};
```

### Camino Lessons Overview
```typescript
const CAMINO_LESSONS = [
  // Phase 1: Vowels & First Consonants (Weeks 1-10)
  { lesson: 1, focus: 'Vowels a,e,i,o,u', syllables: ['a','e','i','o','u'] },
  { lesson: 2, focus: 'Letter M', syllables: ['ma','me','mi','mo','mu'] },
  { lesson: 3, focus: 'Letter P', syllables: ['pa','pe','pi','po','pu'] },
  { lesson: 4, focus: 'Letter L', syllables: ['la','le','li','lo','lu'] },
  { lesson: 5, focus: 'Review M,P,L', syllables: ['all m,p,l syllables'] },
  { lesson: 6, focus: 'Letter S', syllables: ['sa','se','si','so','su'] },
  { lesson: 7, focus: 'Letter T', syllables: ['ta','te','ti','to','tu'] },
  { lesson: 8, focus: 'Letter D', syllables: ['da','de','di','do','du'] },
  { lesson: 9, focus: 'Review S,T,D', syllables: ['all s,t,d syllables'] },
  { lesson: 10, focus: 'Unit 1 Assessment', syllables: ['all Phase 1'] },
  
  // Phase 2: Additional Consonants (Weeks 11-20)
  { lesson: 11, focus: 'Letter N', syllables: ['na','ne','ni','no','nu'] },
  { lesson: 12, focus: 'Letter R (tap)', syllables: ['ra','re','ri','ro','ru'] },
  { lesson: 13, focus: 'Hard C (ca,co,cu)', syllables: ['ca','co','cu'] },
  { lesson: 14, focus: 'Soft C (ce,ci)', syllables: ['ce','ci'] },
  { lesson: 15, focus: 'Review N,R,C', syllables: ['all n,r,c syllables'] },
  { lesson: 16, focus: 'Letter B', syllables: ['ba','be','bi','bo','bu'] },
  { lesson: 17, focus: 'Hard G (ga,go,gu)', syllables: ['ga','go','gu'] },
  { lesson: 18, focus: 'Letters F,V', syllables: ['fa','fe','fi','fo','fu','va','ve','vi','vo','vu'] },
  { lesson: 19, focus: 'Letters Z,J,Ñ', syllables: ['za','zo','zu','ja','je','ji','jo','ju','ña','ñe','ñi','ño','ñu'] },
  { lesson: 20, focus: 'Unit 2 Assessment', syllables: ['all Phase 2'] },
  
  // Phase 3: Digraphs (Weeks 21-28)
  { lesson: 21, focus: 'Digraph CH', syllables: ['cha','che','chi','cho','chu'] },
  { lesson: 22, focus: 'Digraph LL', syllables: ['lla','lle','lli','llo','llu'] },
  { lesson: 23, focus: 'Digraph RR', syllables: ['rra','rre','rri','rro','rru'] },
  { lesson: 24, focus: 'QU combination', syllables: ['que','qui'] },
  { lesson: 25, focus: 'Review digraphs', syllables: ['all digraphs'] },
  { lesson: 26, focus: 'Silent H', syllables: ['ha','he','hi','ho','hu'] },
  { lesson: 27, focus: 'Diphthongs', syllables: ['ai','ei','oi','au','eu'] },
  { lesson: 28, focus: 'Unit 3 Assessment', syllables: ['all Phase 3'] },
  
  // Phase 4: Blends (Weeks 29-36)
  { lesson: 29, focus: 'L-blends (bl,cl,fl,gl,pl)', words: ['blanco','clase','flor','globo','plato'] },
  { lesson: 30, focus: 'R-blends (br,cr,dr)', words: ['brazo','crema','drama'] },
  { lesson: 31, focus: 'R-blends (fr,gr,pr,tr)', words: ['fresa','grande','primo','tren'] },
  { lesson: 32, focus: 'Mixed blends', words: ['biblioteca','problema'] },
  { lesson: 33, focus: 'Syllable division', words: ['pa-lo-ma','ár-bol'] },
  { lesson: 34, focus: 'Accents', words: ['pá-ja-ro','ca-fé'] },
  { lesson: 35, focus: 'Complex words', words: ['mariposa','elefante'] },
  { lesson: 36, focus: 'Unit 4 Assessment', words: ['all Phase 4'] },
  
  // Phase 5: Advanced (Weeks 37-40)
  { lesson: 37, focus: 'Fluency' },
  { lesson: 38, focus: 'Comprehension strategies' },
  { lesson: 39, focus: 'Authentic texts' },
  { lesson: 40, focus: 'Final Assessment' }
];
```

### Delta Math Standards (Priority: Grade 5)
```typescript
const DELTA_STANDARDS = {
  '5.NF.1': { 
    desc: 'Add/subtract fractions with unlike denominators',
    prereqs: ['4.NF.1', '4.NF.3c'],
    errors: ['Adding without common denominator', 'Adding denominators'],
    tools: { concrete: ['Fraction bars'], visual: ['Number lines'], abstract: ['LCD procedure'] }
  },
  '5.NF.4': {
    desc: 'Multiply fractions and whole numbers',
    prereqs: ['4.NF.4', 'Fraction meaning'],
    errors: ['Expecting larger product', 'Multiplying incorrectly'],
    tools: { concrete: ['Fraction bars', 'Paper folding'], visual: ['Area models'] }
  },
  '5.NBT.3': {
    desc: 'Read, write, compare decimals to thousandths',
    prereqs: ['4th grade decimals'],
    errors: ['Longer decimal = larger', 'Treating as whole numbers'],
    tools: { concrete: ['Decimats', 'Money'], visual: ['Place value charts', 'Number lines'] }
  },
  '5.NBT.7': {
    desc: 'Operations with decimals to hundredths',
    prereqs: ['5.NBT.3', 'Whole number operations'],
    errors: ['Misaligning decimals', 'Ignoring decimal in multiplication'],
    tools: { concrete: ['Decimats'], visual: ['Area models'] }
  },
  // Grade 4 standards for intervention groups
  '4.NF.2': { desc: 'Compare fractions', errors: ['Larger denominator = larger fraction'] },
  '4.NF.3c': { desc: 'Add/subtract like denominators', errors: ['Adding denominators too'] },
  '4.NBT.6': { desc: 'Divide multi-digit by 1-digit', errors: ['Place value errors in quotient'] }
};
```

---

## Error Bank Seed Data (Key Examples)

### Wilson Errors
```typescript
const WILSON_ERRORS = [
  {
    position: '1.3', // Digraphs
    error: 'Reads digraph as two separate sounds',
    correction: 'These two letters are glued together. They make ONE sound. Tap once.',
    prompts: ['These letters work as a team.', 'One sound, not two.']
  },
  {
    position: '1.3',
    error: 'Adds schwa after digraph (chuh instead of /ch/)',
    correction: 'Clip it! Just the sound, no extra.',
    prompts: ['Make it short and crisp.', 'No "uh" at the end.']
  },
  {
    position: '1.6',
    error: 'Pronounces -ed as /ed/ in all words',
    correction: 'Three sounds: /id/ after t/d, /d/ after voiced, /t/ after unvoiced. Throat check.',
    prompts: ['What\'s the last sound of the base word?', 'Is it voiced or unvoiced?']
  },
  {
    position: '2.1',
    error: 'Uses short vowel in VCe words',
    correction: 'Magic e makes the vowel say its name. Draw rainbow arc.',
    prompts: ['Is there an e at the end?', 'The vowel says its name.']
  }
];
```

### Math Errors
```typescript
const MATH_ERRORS = [
  {
    standard: '4.NF.3c',
    error: 'Adds both numerators AND denominators',
    correction: 'Use fraction bars. Denominator is the SIZE of pieces - it doesn\'t change when we add.',
    prompts: ['Read as "two-fifths plus one-fifth." How many fifths?', 'The denominator is the name of the pieces.']
  },
  {
    standard: '4.NF.2',
    error: 'Larger denominator = larger fraction',
    correction: 'Use fraction tiles side by side. More pieces = smaller pieces.',
    prompts: ['Would you rather have 1/2 or 1/8 of a pizza?']
  },
  {
    standard: '5.NBT.3',
    error: 'Longer decimal = larger (0.36 > 0.5)',
    correction: 'Shade on decimats. Compare: 50 cents or 36 cents?',
    prompts: ['0.5 is the same as 0.50. Which is more?']
  }
];
```

### Spanish/Camino Errors
```typescript
const SPANISH_ERRORS = [
  {
    position: 'universal',
    error: 'Applies English vowel reduction (schwa)',
    correction: 'Every Spanish vowel is pronounced fully. Clap syllables with equal stress.',
    prompts: ['En español, cada vocal se pronuncia completamente.', 'Di cada sílaba con fuerza.']
  },
  {
    position: 'lesson_11',
    error: 'Confuses n and m in final position',
    correction: 'Lip closure: For /m/ lips together, for /n/ mouth open, tongue touches roof.',
    prompts: ['¿Tus labios se cierran o se quedan abiertos?']
  },
  {
    position: 'lesson_15+',
    error: 'Cannot produce Spanish tap r',
    correction: 'Say "butter" fast. That middle sound is like Spanish r.',
    prompts: ['Pon tu lengua donde dices "d" pero solo tócala una vez.']
  },
  {
    position: 'lesson_15+',
    error: 'Cannot produce Spanish trill rr',
    correction: 'Tongue must be RELAXED. Start with "drrr" like a motor.',
    prompts: ['Relaja tu lengua. Si está tensa, no puede vibrar.']
  }
];
```

---

## Key Features to Build

### 1. Session Planning Form (Pre-Session)
```
GROUP: [Dropdown]
POSITION: [Cascading picker based on curriculum]

PRACTICE PLAN:
- Response formats: ☐ Choral ☐ Written ☐ Partner ☐ Individual
- Target OTR: [___] per student
- Practice items: [auto-populated + editable]
- Cumulative review: [pulled from prior lessons]

ANTICIPATED ERRORS:
[Auto-suggested based on position from error bank]
☑ Error: _________ → Correction: _________
[+ Add Custom]

LESSON COMPONENTS:
[Curriculum-specific checklist with timers]
```

### 2. Session Logging Form (Post-Session)
```
PRACTICE DELIVERED:
- Actual OTR: [___]
- Cumulative review completed? ○ Yes ○ No
- Pacing: ○ Too slow ○ Just right ○ Too fast

COMPONENTS COMPLETED:
[Checkboxes for curriculum-specific components]

ERROR TRACKING:
Anticipated errors:
☑ Error #1: Occurred? ● Yes ○ No → Correction worked? ● Yes ○ No
Unexpected error: [___________] → Correction used: [___________]
☐ Add to error bank

MASTERY CHECK:
Exit ticket: [__]/[__] correct
Ready to advance? ○ Yes ○ No ○ Need more practice

NOTES: [Voice input available 🎤]
```

### 3. Dashboard
- Today's schedule with quick-start buttons
- Group cards showing: name, curriculum, tier, current position, next session
- Filter by curriculum
- Quick stats: sessions this week, PM due, groups needing attention

### 4. Progress Monitoring
- Line chart with data points
- Goal line and trend line
- Phase change markers
- Decision rule alerts (e.g., "4 consecutive points below aimline")

---

## AI Features (Priority Order)

1. **Voice-to-Text Notes** - Dictate session observations
2. **Error Suggestion** - Given position, suggest likely errors from bank
3. **Session Summary** - Generate IEP-ready paragraph from log data
4. **Cross-Group Patterns** - "3 Wilson groups showed wh/w confusion this week"

---

## Success Criteria

1. Session planning takes <5 minutes with pre-populated data
2. Voice notes reduce logging time by 50%
3. Error suggestions are relevant 80%+ of the time
4. Can see any group's PM trend in 2 clicks
5. Seamless switching between Wilson/Delta/Camino/WordGen/Amira

---

## Reference Files (For Complete Data)

If you need the full detailed data, these files are available:
- `SCOPE_AND_SEQUENCES.ts` - Complete curriculum progressions
- `error_banks_seed_data.ts` - All 50+ pre-loaded errors with corrections
- `INTERVENTION_PLANNING_TEMPLATES.md` - Detailed lesson component descriptions
- `EMERGE_Intervention_Planner_Dev_Plan.md` - Full technical specification

---

## Quick Start Order

1. **Supabase**: Create project, run schema SQL above
2. **Next.js**: Create app with TypeScript + Tailwind
3. **Seed Data**: Load curriculum sequences and error banks
4. **UI Components**: Build design system with brand colors
5. **Core Features**: Dashboard → Group detail → Session forms
6. **AI**: Add voice-to-text and error suggestions last

---

**END OF HANDOFF DOCUMENT**
