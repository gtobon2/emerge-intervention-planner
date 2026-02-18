# EMERGE Intervention Planner - Evaluation Rubric

## Scoring Scale
Each criterion is scored 1-5:
- **1 - Broken/Unusable**: Feature doesn't work, crashes, or is completely confusing
- **2 - Poor**: Works partially but has significant bugs or UX problems
- **3 - Acceptable**: Functional but rough edges, a teacher could use it with effort
- **4 - Good**: Works well, minor polish needed, teachers would adopt it
- **5 - Excellent**: Smooth, intuitive, delightful - teachers would recommend it

---

## Category 1: User Experience (UX) — Weight: 25%

### 1A. Task Completion Flow
- Can a user complete core tasks without getting lost? (plan a session, log data, check progress)
- Are workflows linear and logical, or do they require backtracking?
- Are there dead ends where the user doesn't know what to do next?

### 1B. Feedback & State Communication
- Does the app clearly show what's happening? (loading states, success/error messages)
- After an action, does the user know it worked?
- Are empty states helpful ("No sessions yet - click here to plan one")?

### 1C. Error Recovery
- What happens when something goes wrong? (network error, bad input, missing data)
- Can the user recover gracefully or do they hit a wall?
- Are form validations helpful and inline, or cryptic?

### 1D. Cognitive Load
- Is information presented in digestible chunks or overwhelming walls of data?
- Are there too many choices on one screen?
- Does the hierarchy guide the eye to what matters most?

---

## Category 2: Usability — Weight: 25%

### 2A. Navigation & Information Architecture
- Can a new user find what they need in <3 clicks?
- Is the sidebar/nav clear about what each section does?
- Does the app match mental models of how an interventionist thinks about their work?

### 2B. Consistency
- Do similar actions work the same way across the app? (modals, forms, buttons)
- Are patterns reused (e.g., if one page uses a dropdown, others do too)?
- Is terminology consistent? (e.g., "session" vs "lesson" vs "meeting")

### 2C. Speed & Responsiveness
- Do pages load quickly?
- Are interactions snappy (button clicks, form submissions, navigation)?
- Does the app feel sluggish at any point?

### 2D. Mobile/Responsive
- Does the app work on a tablet? (teachers often use iPads)
- Are touch targets large enough?
- Does the layout adapt or break on smaller screens?

---

## Category 3: Teacher Usefulness — Weight: 25%

### 3A. Daily Workflow Support
- Does the dashboard show what a teacher needs FIRST THING in the morning?
- Can they quickly see: what groups to see today, what to teach, who needs attention?
- Does the session planning actually save time vs. paper/spreadsheets?

### 3B. Data-Driven Decision Making
- Do progress monitoring charts tell a clear story?
- Can a teacher quickly identify which students are on track vs. struggling?
- Are decision rules and alerts actionable (not just "data is below goal")?

### 3C. Curriculum Alignment
- Does the Wilson wizard actually match how Wilson sessions are structured?
- Are curriculum positions/sequences accurate?
- Can the teacher trust the data and suggestions the app provides?

### 3D. Multi-Role Utility
- **Teacher/Interventionist**: Can they plan and log sessions efficiently?
- **Principal/Coach**: Can they get a quick overview of group progress?
- **Data Team**: Can they pull meaningful reports?

---

## Category 4: User Interface (UI) Design — Weight: 12.5%

### 4A. Visual Design
- Is the dark theme readable and pleasant, or harsh on the eyes?
- Are brand colors (Hot Magenta, Citrus Yellow) used effectively or overwhelming?
- Is whitespace used well to create breathing room?

### 4B. Typography & Readability
- Are fonts legible at all sizes?
- Is there clear hierarchy (headings, body, labels)?
- Are data-heavy screens (PM charts, session logs) scannable?

### 4C. Component Quality
- Do buttons, modals, cards, and forms look polished?
- Are interactive states clear (hover, active, disabled, focus)?
- Is the design system consistent across pages?

### 4D. Data Visualization
- Are charts readable and meaningful?
- Do colors in charts convey the right meaning?
- Are labels, axes, and legends clear?

---

## Category 5: User-Friendliness vs. Clunkiness — Weight: 12.5%

### 5A. First Impressions
- Could a teacher who has never seen the app figure out what to do?
- Is there any onboarding or helpful first-use experience?
- Does the app feel welcoming or intimidating?

### 5B. Friction Points
- Where does the app make the user do unnecessary work?
- Are there too many clicks to accomplish simple tasks?
- Are there confusing modals, unclear buttons, or hidden features?

### 5C. Delight & Polish
- Are there any "nice touches" that make the app pleasant to use?
- Do animations/transitions feel smooth or janky?
- Does the app feel like a finished product or a prototype?

### 5D. Accessibility
- Are contrast ratios sufficient for readability?
- Can the app be navigated with keyboard?
- Are interactive elements properly labeled?

---

## Evaluation Personas

### Persona 1: Geraldo (Interventionist)
- Uses the app daily to plan and log 5-6 sessions
- Needs speed and efficiency above all
- Switches between Wilson, Delta Math, and Camino groups
- Key tasks: plan session, log session, check PM data, generate letters

### Persona 2: Ms. Martinez (Principal)
- Checks in weekly to see group progress
- Needs high-level overview, not granular details
- Key tasks: view dashboard, check PM charts, see which groups need attention

### Persona 3: New Teacher (Unfamiliar)
- First time using the app, no training
- Can they figure out how to plan a Wilson session?
- Do they understand what the dashboard is telling them?

---

## Reporting Format

For each category, agents should report:
1. **Score** (1-5) with justification
2. **Specific issues found** (with file paths and line numbers when possible)
3. **Screenshots or descriptions** of problems
4. **Implementation plan** for each fix, including:
   - Files to modify
   - Description of the change
   - Estimated complexity (small/medium/large)
   - Dependencies on other fixes
   - Which files would conflict if worked on in parallel

## Overall Score Calculation
```
Overall = (UX * 0.25) + (Usability * 0.25) + (Teacher Usefulness * 0.25) + (UI * 0.125) + (Friendliness * 0.125)
```
