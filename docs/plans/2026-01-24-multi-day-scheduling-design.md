# Multi-Day Scheduling & Lesson Planning Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable drag-and-drop scheduling of groups across multiple days based on dosage, and enforce that lesson sessions can only be scheduled during the group's configured day/time slots.

**Architecture:** Extend the existing GroupSchedule system to support dosage-based scheduling. Modify the Schedule Builder sidebar to display one draggable card per scheduled day (based on group.schedule.days). Enforce time slot validation when creating sessions.

**Tech Stack:** React, TypeScript, Zustand stores, Supabase, existing drag-and-drop infrastructure

---

## Feature 1: Multi-Day Drag-and-Drop Scheduling

### Problem
Currently, each unscheduled group shows as ONE draggable card in the sidebar. When dropped, it creates a single session. However, groups have a dosage (e.g., 3x/week) and users need to schedule each day individually.

### Solution
Instead of showing one card per group, show one card **per scheduled day** based on the group's `schedule.days` array.

**Example:**
- Group "Alpha" has `schedule.days: ['monday', 'wednesday', 'friday']`
- Display 3 draggable cards: "Alpha (Mon)", "Alpha (Wed)", "Alpha (Fri)"
- User drags "Alpha (Mon)" to the Monday 9:00 slot
- That card disappears, "Alpha (Wed)" and "Alpha (Fri)" remain

### Data Model Changes
The existing `GroupSchedule` type already supports this:
```typescript
interface GroupSchedule {
  days?: string[]; // e.g., ['monday', 'wednesday', 'friday']
  time?: string;   // e.g., '09:00'
  duration?: number; // minutes
}
```

We'll also leverage `EnhancedGroupSchedule.day_times` for per-day time overrides.

### UI Changes

**Unscheduled Groups Sidebar:**
1. For each group without sessions, expand to show one card per day in `schedule.days`
2. Each card displays: Group name + (Day abbreviation)
3. Cards are individually draggable
4. When dropped, create session for that specific day
5. Card disappears after drop, others remain

**Card Visual:**
```
┌────────────────────────┐
│ ⋮ Alpha (Mon)         │
│   Grade 2 | Wilson    │
│   9:00 AM - 9:30 AM   │  ← Optional: show configured time
└────────────────────────┘
```

**Drag-Drop Behavior:**
- Card includes day info in drag data
- On drop, validate that the drop day matches the card's day
- If user drops "Alpha (Mon)" on Tuesday → show error/reject
- Create session with correct date for that weekday

### Implementation

**page.tsx changes:**
1. Modify `unscheduledGroups` to track per-day status
2. Create new `unscheduledDaySlots` derived state:
   ```typescript
   interface UnscheduledDaySlot {
     group: Group;
     day: WeekDay;
     time: string | null; // from schedule
   }
   ```
3. Update drag data to include `day` and `time`

**ScheduleGrid.tsx changes:**
1. Validate drop target day matches dragged day
2. Show feedback when dragging (highlight only valid day column)

---

## Feature 2: Lesson Planning Tied to Group Schedule

### Problem
When planning lessons for a group, the session should only be schedulable during the group's configured day/time slots.

### Solution
Enforce schedule validation when creating sessions:
1. Session's day-of-week must match one of `schedule.days`
2. Session's time must match `schedule.time` (or the per-day time from `day_times`)

### Validation Rules
```typescript
function validateSessionAgainstGroupSchedule(
  session: { date: string; time: string },
  group: Group
): { valid: boolean; error?: string } {
  const schedule = group.schedule;
  if (!schedule?.days?.length) {
    return { valid: true }; // No schedule configured
  }

  const dayOfWeek = getWeekDayFromDate(session.date);

  // Check day is in schedule
  if (!schedule.days.includes(dayOfWeek)) {
    return {
      valid: false,
      error: `${group.name} is not scheduled for ${dayOfWeek}s`
    };
  }

  // Check time matches (with tolerance for different session durations)
  if (schedule.time && session.time !== schedule.time) {
    return {
      valid: false,
      error: `${group.name} is scheduled for ${schedule.time}, not ${session.time}`
    };
  }

  return { valid: true };
}
```

### Where Validation Applies

1. **Schedule Builder drop handler** - Validate day matches
2. **Session creation in store** - Enforce schedule compliance
3. **Session edit modal** - Only allow valid day/time combinations

### UI Feedback

**Schedule Grid:**
- When dragging a day-specific card, highlight ONLY that day's column
- Dim/disable other columns to prevent accidental drops

**Error Messages:**
- Toast notification if trying to drop on wrong day
- Inline error in session form if date/time doesn't match schedule

---

## Implementation Plan Summary

### Task 1: Create UnscheduledDaySlot type and compute from groups
- Add type definitions
- Create selector to expand groups into day slots
- Track which slots have been scheduled

### Task 2: Update Unscheduled Groups sidebar UI
- Render one card per day slot (not per group)
- Include day badge on each card
- Update drag data format

### Task 3: Update drag-drop handlers
- Include day validation in drop handler
- Add visual feedback for valid drop targets
- Create sessions with correct date/time

### Task 4: Add schedule validation to session creation
- Create validation utility function
- Integrate into sessions store
- Add error feedback in UI

### Task 5: Update ScheduleGrid visual feedback
- Highlight only valid day columns during drag
- Dim invalid columns

---

## Files to Modify

1. `src/app/schedule/page.tsx` - Sidebar, drag handlers, day slot computation
2. `src/components/schedule/ScheduleGrid.tsx` - Drop validation, visual feedback
3. `src/lib/supabase/types.ts` - Add UnscheduledDaySlot type (if needed)
4. `src/stores/sessions.ts` - Add schedule validation
5. `src/lib/scheduling/schedule-validation.ts` - New file for validation utilities

---

## Out of Scope

- Batch scheduling wizard (schedule all days at once)
- Recurring session templates
- Drag-and-drop between days (move existing session)
- Per-student time overrides
