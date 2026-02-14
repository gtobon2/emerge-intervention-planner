# Feature Batch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add goal system, enhanced notifications, dashboard improvements, print-friendly session plans, admin data export, and 4 bilingual family letter types.

**Architecture:** Local-first approach using Dexie IndexedDB for new data (studentGoals table), Zustand stores for state management, jsPDF for PDF generation. All new features follow existing patterns: components in `src/components/`, stores in `src/stores/`, pages in `src/app/`.

**Tech Stack:** Next.js 14, React 18, TypeScript, Zustand, Dexie.js, jsPDF + autoTable, Tailwind CSS, Lucide icons.

**Verification:** No test framework is set up. Use `npx tsc --noEmit` after each task to verify type safety. Manual browser testing for UI.

---

## Task 1: Add studentGoals table to IndexedDB

**Files:**
- Modify: `src/lib/local-db/index.ts`

**Step 1: Add the LocalStudentGoal interface**

After the `LocalStudentConstraint` interface (~line 212), add:

```typescript
export interface LocalStudentGoal {
  id?: number;
  student_id: number;
  group_id: number;
  goal_score: number;
  benchmark_score: number | null;
  measure_type: string;
  set_date: string;
  created_at: string;
  updated_at: string;
}
```

**Step 2: Add the table declaration to EmergeDatabase class**

After `studentConstraints` table declaration (~line 233), add:

```typescript
studentGoals!: Table<LocalStudentGoal, number>;
```

**Step 3: Add version 7 schema**

After the version 6 block (~line 316), add version 7 that includes `studentGoals`:

```typescript
// Version 7: Add student goals table
this.version(7).stores({
  groups: '++id, name, curriculum, tier, grade, interventionist_id, created_at, updated_at',
  students: '++id, name, group_id, created_at',
  sessions: '++id, group_id, date, status, series_id, created_at, updated_at',
  progressMonitoring: '++id, student_id, group_id, date, created_at',
  errorBank: '++id, curriculum, error_pattern, created_at',
  studentSessionTracking: '++id, session_id, student_id, created_at',
  wilsonLessonElements: '++id, substep, stepNumber, createdAt, updatedAt',
  wilsonLessonPlans: '++id, sessionId, substep, createdAt, updatedAt',
  caminoLessonElements: '++id, unit, lesson, lessonCode, createdAt, updatedAt',
  caminoLessonPlans: '++id, sessionId, unit, lesson, lessonCode, createdAt, updatedAt',
  interventionists: '++id, name, email, created_at, updated_at',
  gradeLevelConstraints: '++id, grade, type, created_at',
  studentConstraints: '++id, student_id, type, created_at',
  studentGoals: '++id, student_id, group_id, measure_type, created_at, updated_at',
});
```

**Step 4: Add insert/update types**

After `LocalStudentConstraintInsert` (~line 339), add:

```typescript
export type LocalStudentGoalInsert = Omit<LocalStudentGoal, 'id' | 'created_at' | 'updated_at'>;
export type LocalStudentGoalUpdate = Partial<LocalStudentGoalInsert>;
```

**Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

**Step 6: Commit**

```bash
git add src/lib/local-db/index.ts
git commit -m "feat: add studentGoals table to IndexedDB (v7)"
```

---

## Task 2: Create Goals Store

**Files:**
- Create: `src/stores/goals.ts`

**Step 1: Create the store**

```typescript
import { create } from 'zustand';
import { db, type LocalStudentGoal, type LocalStudentGoalInsert } from '@/lib/local-db';

interface GoalsState {
  goals: LocalStudentGoal[];
  isLoading: boolean;

  fetchGoalsForGroup: (groupId: number) => Promise<void>;
  fetchGoalForStudent: (studentId: number, groupId: number) => Promise<LocalStudentGoal | undefined>;
  setGoal: (goal: LocalStudentGoalInsert) => Promise<void>;
  setBulkGoals: (goals: LocalStudentGoalInsert[]) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  isLoading: false,

  fetchGoalsForGroup: async (groupId: number) => {
    set({ isLoading: true });
    try {
      const goals = await db.studentGoals.where('group_id').equals(groupId).toArray();
      set({ goals, isLoading: false });
    } catch {
      set({ goals: [], isLoading: false });
    }
  },

  fetchGoalForStudent: async (studentId: number, groupId: number) => {
    return db.studentGoals
      .where('[student_id+group_id]')
      .equals([studentId, groupId])
      .first()
      .catch(() => undefined);
  },

  setGoal: async (goal: LocalStudentGoalInsert) => {
    const now = new Date().toISOString();
    // Check if goal already exists for this student+group
    const existing = await db.studentGoals
      .where('student_id').equals(goal.student_id)
      .and(g => g.group_id === goal.group_id)
      .first();

    if (existing) {
      await db.studentGoals.update(existing.id!, {
        ...goal,
        updated_at: now,
      });
    } else {
      await db.studentGoals.add({
        ...goal,
        created_at: now,
        updated_at: now,
      } as LocalStudentGoal);
    }
    // Refresh
    await get().fetchGoalsForGroup(goal.group_id);
  },

  setBulkGoals: async (goals: LocalStudentGoalInsert[]) => {
    const now = new Date().toISOString();
    for (const goal of goals) {
      const existing = await db.studentGoals
        .where('student_id').equals(goal.student_id)
        .and(g => g.group_id === goal.group_id)
        .first();

      if (existing) {
        await db.studentGoals.update(existing.id!, { ...goal, updated_at: now });
      } else {
        await db.studentGoals.add({ ...goal, created_at: now, updated_at: now } as LocalStudentGoal);
      }
    }
    if (goals.length > 0) {
      await get().fetchGoalsForGroup(goals[0].group_id);
    }
  },

  deleteGoal: async (id: number) => {
    await db.studentGoals.delete(id);
    set((state) => ({ goals: state.goals.filter(g => g.id !== id) }));
  },
}));
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

**Step 3: Commit**

```bash
git add src/stores/goals.ts
git commit -m "feat: add goals store for student goal management"
```

---

## Task 3: Create Goal Setting Modal Component

**Files:**
- Create: `src/components/goals/GoalSettingModal.tsx`

**Step 1: Create the component**

A modal that shows a table of students in a group with goal + benchmark inputs. Includes "Apply same goal to all" convenience option.

Props:
- `isOpen: boolean`
- `onClose: () => void`
- `groupId: number`
- `students: Array<{ id: number; name: string }>`
- `curriculum: string`

The modal should:
- Fetch existing goals for the group on mount
- Show each student with number inputs for goal and benchmark
- Have "Apply to all" row at top
- Save button calls `setBulkGoals`
- Use existing UI components (Card, Button, Input patterns from the codebase)

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/goals/GoalSettingModal.tsx
git commit -m "feat: add goal setting modal for student goals"
```

---

## Task 4: Wire Goal Modal into Group Detail Page

**Files:**
- Modify: `src/app/groups/[id]/page.tsx`

**Step 1: Add "Set Goals" button and modal**

- Import `GoalSettingModal` and `useGoalsStore`
- Add state: `const [showGoalModal, setShowGoalModal] = useState(false)`
- Add a "Set Goals" button (Target icon from lucide-react) in the group header/actions area
- Render `<GoalSettingModal>` conditionally

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/app/groups/[id]/page.tsx
git commit -m "feat: wire goal setting modal into group detail page"
```

---

## Task 5: Enhance Notification Store with New Types

**Files:**
- Modify: `src/stores/notifications.ts`

**Step 1: Add new notification types**

Update the `NotificationType` union:

```typescript
export type NotificationType =
  | 'session_reminder'
  | 'pm_due'
  | 'pm_reminder'
  | 'session_completed'
  | 'decision_rule_alert'
  | 'attendance_flag'
  | 'goal_not_set'
  | 'info';
```

**Step 2: Add `generateDecisionAlerts` method**

New method that:
- Takes groups, students, PM data, and goals
- For each student with a goal, checks last 4 PM points using `checkDecisionRules()`
- Creates `decision_rule_alert` notification if triggered

**Step 3: Add `generateAttendanceFlags` method**

New method that:
- Takes sessions and attendance records
- Identifies students absent 2+ consecutive sessions
- Creates `attendance_flag` notification

**Step 4: Add `generateGoalAlerts` method**

New method that:
- Takes groups and goals
- For each student without a goal, creates `goal_not_set` notification

**Step 5: Verify**

Run: `npx tsc --noEmit`

**Step 6: Commit**

```bash
git add src/stores/notifications.ts
git commit -m "feat: add decision rule, attendance, and goal notification types"
```

---

## Task 6: Add Notification Preferences to Settings

**Files:**
- Modify: `src/stores/settings.ts`

**Step 1: Extend NotificationPreferences interface**

Add toggles for new notification types:

```typescript
export interface NotificationPreferences {
  emailNotifications: boolean;
  sessionReminders: boolean;
  pmDataDueReminders: boolean;
  decisionRuleAlerts: boolean;
  attendanceFlags: boolean;
  goalNotSetAlerts: boolean;
  reminderTiming: ReminderTiming;
}
```

**Step 2: Update defaultSettings**

Add default values for new preferences (all `true`).

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/stores/settings.ts
git commit -m "feat: add notification preference toggles for new alert types"
```

---

## Task 7: Auto-Generate Notifications on Dashboard Load

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Import and call notification generators**

- Import `useNotificationsStore`
- Import `useGoalsStore`
- Add `useEffect` that runs on mount + every 15 minutes:
  - Calls `generateReminders()` with today's sessions
  - Calls `generateDecisionAlerts()` with PM data and goals
  - Calls `generateAttendanceFlags()` with attendance data
  - Calls `generateGoalAlerts()` with group/student/goal data
- Respect notification preferences from settings store

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: auto-generate notifications on dashboard load"
```

---

## Task 8: Add Action Items Panel to Dashboard

**Files:**
- Create: `src/components/dashboard/ActionItems.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create ActionItems component**

A card showing actionable counts with clickable links:
- "X students need PM data" → `/progress`
- "X decision rule alerts" → `/notifications?type=decision_rule_alert`
- "X sessions this week incomplete" → `/schedule`
- "X students absent 2+ sessions" → `/notifications?type=attendance_flag`

Each item: icon + count + label, clickable, colored badge for urgency.

**Step 2: Add to dashboard page**

Place between QuickStats and the main content grid.

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/components/dashboard/ActionItems.tsx src/app/page.tsx
git commit -m "feat: add action items panel to dashboard"
```

---

## Task 9: Add Weekly Progress Snapshot to Dashboard

**Files:**
- Create: `src/components/dashboard/WeeklySnapshot.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create WeeklySnapshot component**

A compact card showing:
- Sessions: completed / planned this week (with progress bar)
- PM Data: collected / due this week (with progress bar)
- Simple visual bars using Tailwind (no chart library needed)

**Step 2: Add to dashboard**

Place in the sidebar column (alongside TodaySchedule).

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/components/dashboard/WeeklySnapshot.tsx src/app/page.tsx
git commit -m "feat: add weekly progress snapshot to dashboard"
```

---

## Task 10: Add Recent Activity Feed to Dashboard

**Files:**
- Create: `src/components/dashboard/RecentActivity.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create RecentActivity component**

Shows last 5 actions across the app:
- Query recent sessions (completed), recent PM entries, recent group changes from IndexedDB
- Sort by date descending
- Display: icon + description + time ago
- Each item links to relevant page

**Step 2: Add to dashboard**

Place below the groups grid.

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/components/dashboard/RecentActivity.tsx src/app/page.tsx
git commit -m "feat: add recent activity feed to dashboard"
```

---

## Task 11: Print-Friendly Session Plans (CSS)

**Files:**
- Modify: `src/app/groups/[id]/session/[sessionId]/page.tsx`
- Create: `src/app/groups/[id]/session/[sessionId]/print.css` (or add to global styles)

**Step 1: Add print styles**

Add `@media print` CSS to the session detail page:
- Hide sidebar, navigation, action buttons
- Show session content in clean single-column layout
- Include: group name, date, students, curriculum position, planned activities, materials

**Step 2: Add "Print" button**

Add a `Printer` icon button in the session page header that calls `window.print()`.

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/app/groups/[id]/session/[sessionId]/page.tsx
git commit -m "feat: add print-friendly styles for session plans"
```

---

## Task 12: Session Plan PDF Export

**Files:**
- Modify: `src/lib/export/pdf-export.ts`
- Modify: `src/lib/export/index.ts`

**Step 1: Add `exportSessionPlanToPDF` function**

Following existing pattern in `pdf-export.ts`:
- Uses `addHeader()` and `addFooter()` helpers
- Content: group name, date, curriculum, tier, grade
- Student list table
- Session plan details (activities, OTR targets, materials)
- One page per session

**Step 2: Export from index.ts**

Add `exportSessionPlanToPDF` to the barrel export.

**Step 3: Add PDF download button to session page**

Add `FileText` icon button next to the Print button.

**Step 4: Verify**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/lib/export/pdf-export.ts src/lib/export/index.ts src/app/groups/[id]/session/[sessionId]/page.tsx
git commit -m "feat: add PDF export for session plans"
```

---

## Task 13: Admin Data Export Page

**Files:**
- Create: `src/app/admin/export/page.tsx`

**Step 1: Create the export page**

Admin-only page with:
- Date range filter (start/end date inputs)
- Group/curriculum multiselect filter
- Export buttons for each type:
  - Student Roster (CSV)
  - Session Log (CSV)
  - PM Data (CSV)
  - Attendance Report (CSV)
  - Group Summary (PDF)
- Each button queries IndexedDB/Supabase and generates the export

Use existing CSV export pattern from `exportScheduleToCSV`:
- Build header row + data rows
- Create Blob, trigger download

**Step 2: Add navigation link**

Add "Data Export" to the admin section in the sidebar (check `src/components/layout/Sidebar.tsx`).

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/app/admin/export/page.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: add admin data export page with CSV/PDF exports"
```

---

## Task 14: Family Letter Infrastructure

**Files:**
- Create: `src/lib/letters/types.ts`
- Create: `src/lib/letters/templates.ts`

**Step 1: Create letter types**

```typescript
export type LetterType = 'assignment' | 'exit' | 'intensification' | 'progress_report';

export interface LetterData {
  type: LetterType;
  studentName: string;
  studentGrade: number;
  schoolName: string;
  curriculum: string;
  tier: number;
  interventionistName: string;
  interventionistContact: string;
  date: string;
  // Type-specific fields
  schedule?: string;
  startScore?: number;
  endScore?: number;
  growth?: number;
  interventionDuration?: string;
  sessionsAttended?: number;
  totalSessions?: number;
  attendancePercentage?: number;
  pmScores?: Array<{ date: string; score: number }>;
  trend?: 'improving' | 'stable' | 'declining';
  goal?: number;
  currentScore?: number;
  comments?: string;
}

export interface LetterTemplate {
  type: LetterType;
  titleEn: string;
  titleEs: string;
  generateEnglish: (data: LetterData) => string[];
  generateSpanish: (data: LetterData) => string[];
}
```

**Step 2: Create templates**

Write bilingual template functions for each of the 4 letter types. Each returns an array of paragraphs.

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/lib/letters/types.ts src/lib/letters/templates.ts
git commit -m "feat: add family letter types and bilingual templates"
```

---

## Task 15: Family Letter PDF Generator

**Files:**
- Create: `src/lib/letters/pdf-generator.ts`
- Create: `src/lib/letters/index.ts`

**Step 1: Create PDF generator**

Using jsPDF:
- School letterhead area (school name from settings, date)
- "Dear Parent/Guardian of [Student Name]," / "Estimado Padre/Tutor de [Student Name],"
- English content paragraphs
- Horizontal divider
- Spanish content paragraphs
- Signature line

**Step 2: Create barrel export**

```typescript
export { generateLetterPDF } from './pdf-generator';
export type { LetterType, LetterData } from './types';
```

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/lib/letters/pdf-generator.ts src/lib/letters/index.ts
git commit -m "feat: add bilingual family letter PDF generator"
```

---

## Task 16: Family Letters Page

**Files:**
- Create: `src/app/letters/page.tsx`

**Step 1: Create the letters page**

Page with:
- Student selector (dropdown of all students)
- Auto-detect group from student
- Letter type selector (4 options)
- Auto-populate LetterData from student/group/PM/attendance records
- Preview pane showing letter content (bilingual)
- Optional comments text area (for progress report)
- "Download PDF" button
- "Download All Letters for Group" option (generates all letters for students in a group)

**Step 2: Add to sidebar navigation**

Add "Family Letters" link with `FileText` icon.

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/app/letters/page.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: add family letters page with bilingual PDF generation"
```

---

## Task 17: School Settings for Letterhead

**Files:**
- Modify: `src/stores/settings.ts`
- Modify: `src/app/settings/page.tsx`

**Step 1: Add school settings to settings store**

```typescript
export interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolLogoUrl: string;
}
```

Add to `SettingsState` and defaults.

**Step 2: Add school settings section to settings page**

Add form fields for school name, address, phone.

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/stores/settings.ts src/app/settings/page.tsx
git commit -m "feat: add school settings for family letter letterhead"
```

---

## Task 18: Final Integration & Cleanup

**Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

**Step 2: Build check**

Run: `npm run build`
Expected: Successful build

**Step 3: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: final integration cleanup"
```

**Step 4: Push to remote**

```bash
git push origin main
```

---

## Summary

| Task | Feature | Files |
|------|---------|-------|
| 1 | Goal System - DB schema | `local-db/index.ts` |
| 2 | Goal System - Store | `stores/goals.ts` |
| 3 | Goal System - Modal UI | `components/goals/GoalSettingModal.tsx` |
| 4 | Goal System - Wire to group page | `app/groups/[id]/page.tsx` |
| 5 | Notifications - New types | `stores/notifications.ts` |
| 6 | Notifications - Settings | `stores/settings.ts` |
| 7 | Notifications - Auto-generate | `app/page.tsx` |
| 8 | Dashboard - Action items | `components/dashboard/ActionItems.tsx` |
| 9 | Dashboard - Weekly snapshot | `components/dashboard/WeeklySnapshot.tsx` |
| 10 | Dashboard - Recent activity | `components/dashboard/RecentActivity.tsx` |
| 11 | Session Plans - Print CSS | Session page + styles |
| 12 | Session Plans - PDF export | `lib/export/pdf-export.ts` |
| 13 | Admin Export - Page | `app/admin/export/page.tsx` |
| 14 | Letters - Types & templates | `lib/letters/` |
| 15 | Letters - PDF generator | `lib/letters/pdf-generator.ts` |
| 16 | Letters - Page | `app/letters/page.tsx` |
| 17 | Letters - School settings | `stores/settings.ts` |
| 18 | Final integration | All |
