# Feature Batch Design: Goals, Notifications, Dashboard, Letters & Exports

**Date:** 2026-02-14
**Status:** Draft

---

## 1. Goal System

### Problem
Goals currently exist only at the PM data point level (`ProgressMonitoring.goal`). There is no UI to set goals at the student/group level, making PM reminders and decision rule alerts less useful.

### Approach: Goals per Student per Group
- Add a `StudentGoal` record: `{ student_id, group_id, goal_score, benchmark_score, measure_type, set_date }`
- Store in IndexedDB (`studentGoals` table) + Supabase
- Goal-setting UI on the group detail page: a "Set Goals" button that opens a modal showing all students in the group, with goal + benchmark inputs
- When entering PM data, auto-populate the goal/benchmark fields from the student's group goal
- Decision rule alerts use the student-level goal for aimline calculations

### UI
- **Group page** > "Goals" tab or button > modal with table of students, each with goal + benchmark number inputs
- Bulk set: "Apply same goal to all" option for convenience
- Goal history: track when goals change (optional v2)

---

## 2. Notifications Enhancement

### Current State
- Client-side Zustand store with `session_reminder`, `pm_due`, `session_completed`, `info` types
- `generateReminders()` creates reminders on-demand for upcoming sessions and PM-due students
- NotificationBell dropdown + `/notifications` page

### Approach: Enhance Client-Side System
Keep the local-first architecture. Add new notification types and auto-generate on page load.

### New Notification Types
| Type | Trigger | Message |
|------|---------|---------|
| `pm_reminder` | PM data due based on tier schedule | "PM data due for [Student] in [Group]" |
| `decision_rule_alert` | 4 consecutive points above/below aimline | "[Student] has 4 points below aimline - consider intensifying" |
| `attendance_flag` | Student missed 2+ consecutive sessions | "[Student] absent 2 sessions in a row" |
| `session_reminder` | Session starting within configured window | Already exists |
| `goal_not_set` | Student in group with no goal assigned | "No goal set for [Student] in [Group]" |

### Auto-Generation
- Run notification generation on dashboard load and every 15 minutes while app is open
- Deduplicate by checking existing unread notifications with same title/message
- Add `generateDecisionAlerts()` and `generateAttendanceFlags()` to the store

### Settings
- Notification preferences in `/settings`: toggle each type on/off
- Reminder timing selector (already exists: 15min/30min/1hour)

---

## 3. Dashboard Landing Page Enhancement

### Current State
The dashboard (`/`) shows QuickStats, TodaySchedule, GroupCards, cycle info, and upcoming non-student days.

### Approach: Add Action-Oriented Widgets
Keep existing layout. Add new sections for actionable items.

### New Sections
1. **Action Items Panel** (replaces or supplements QuickStats)
   - "X students need PM data" (clickable, links to progress page)
   - "X students have decision rule alerts" (links to progress)
   - "X sessions this week not yet completed" (links to schedule)
   - "X students absent 2+ sessions" (links to attendance)

2. **Weekly Progress Snapshot**
   - Mini bar chart: sessions completed vs planned this week
   - PM data collected this week vs due

3. **Recent Activity Feed**
   - Last 5 actions: sessions completed, PM data entered, groups modified
   - Timestamp + description + link

---

## 4. Print-Friendly Session Plans

### Approach: CSS Print Styles + PDF Download

### CSS Print
- Add `@media print` styles to the session detail page (`/groups/[id]/session/[sessionId]`)
- Hide navigation, sidebar, action buttons
- Show session plan content in clean layout: group name, date, students, curriculum position, planned activities, materials checklist

### PDF Download
- Add "Download PDF" button to session detail page
- Use existing `jsPDF` + `autoTable` pattern from `pdf-export.ts`
- Content: header with group/date/curriculum, student list, session plan details, materials checklist
- One page per session

---

## 5. Data Export for Admin

### Approach: Admin Export Page

### Location
New page at `/admin/export` (admin-only access)

### Export Options
| Export | Format | Content |
|--------|--------|---------|
| Student Roster | CSV | All students with group assignments, grade, tier |
| Session Log | CSV | All sessions with dates, status, attendance, mastery |
| PM Data | CSV | All PM records with student, group, score, goal, date |
| Attendance Report | CSV | Attendance by student across sessions |
| Group Summary | PDF | Group details with student counts, session counts, avg PM scores |

### UI
- Date range filter
- Group/curriculum filter
- Export format selector (CSV or PDF)
- "Export All" button for bulk download (ZIP of all CSVs)

---

## 6. Family Letters (4 Types, Bilingual)

### Approach: Template-Based with Auto-Population

All letters are bilingual (English on top, Spanish translation below) and auto-populate from student/group/PM data.

### Letter Types

#### 6a. Notice of Assignment
**When:** Student is first assigned to an intervention group
**Content:**
- Student name, grade, school
- Intervention program name (curriculum)
- Tier level and what it means
- Session schedule (days/times)
- Interventionist name and contact
- Parent rights and questions contact

#### 6b. Notice of Intervention Exit
**When:** Student exits intervention (mastery achieved)
**Content:**
- Student name, grade
- Intervention program they were in
- Duration of intervention
- Summary of progress (starting score, ending score, growth)
- What happens next (return to general instruction, continued monitoring)

#### 6c. Notice of Intervention Intensification
**When:** Decision rule triggers intensification (move from Tier 2 to Tier 3)
**Content:**
- Student name, grade
- Current intervention and performance summary
- Why intensification is recommended (4 consecutive points below aimline)
- New intervention plan (more frequent sessions, smaller group, etc.)
- Parent input requested

#### 6d. Family Progress Report
**When:** Generated on-demand or at cycle end
**Content:**
- Student name, grade, group
- Intervention program and tier
- Number of sessions attended / total
- Attendance percentage
- PM scores with simple trend description (improving/stable/declining)
- Goal and current performance relative to goal
- Interventionist comments (optional text field)

### Implementation
- New page at `/letters` accessible from student or group context
- Letter type selector
- Preview pane with bilingual layout
- "Download PDF" button
- Auto-populated from:
  - Student record (name, grade)
  - Group record (curriculum, tier, schedule)
  - Session records (attendance, dates)
  - PM records (scores, trends, goals)
  - Interventionist profile (name, contact)

### PDF Layout
- School letterhead area (configurable in settings: school name, address, logo URL)
- Date
- Parent/Guardian salutation
- English content
- Horizontal divider
- Spanish content (same structure)
- Signature line for interventionist

---

## Build Sequence

1. **Goal System** - Foundation for notifications and letters
2. **Notifications Enhancement** - Builds on goals
3. **Dashboard Enhancement** - Uses notification data
4. **Print-Friendly Session Plans** - Independent
5. **Data Export for Admin** - Independent
6. **Family Letters** - Uses goals, PM data, attendance data

---

## Data Dependencies

```
Goals → Notifications (decision alerts need goals)
Goals → Family Letters (progress reports reference goals)
Attendance → Notifications (attendance flags)
Attendance → Family Letters (attendance percentage)
PM Data → Notifications (PM reminders, decision alerts)
PM Data → Family Letters (progress reports)
```
