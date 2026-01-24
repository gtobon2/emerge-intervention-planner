# Multi-Day Scheduling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable drag-and-drop scheduling of intervention groups based on their dosage (days per week), with one draggable card per scheduled day.

**Architecture:** Extend the Schedule Builder sidebar to display one draggable card per group×day combination. Track which day-slots have sessions. Validate that drops occur on matching days. Create sessions with the correct date and configured time.

**Tech Stack:** React 18, TypeScript, Zustand, Next.js 14 App Router, Tailwind CSS

---

### Task 1: Add UnscheduledDaySlot Type and Helper Functions

**Files:**
- Create: `src/lib/scheduling/day-slots.ts`

**Step 1: Create the day slots utility file**

Create a new file with types and helper functions:

```typescript
// src/lib/scheduling/day-slots.ts
import { getWeekDayFromDate } from './time-utils';
import type { Group, Session, WeekDay, GroupSchedule, EnhancedGroupSchedule, isEnhancedSchedule, getTimeForDay } from '@/lib/supabase/types';

/**
 * Represents a single schedulable day slot for a group
 */
export interface UnscheduledDaySlot {
  group: Group;
  day: WeekDay;
  time: string | null; // Configured time for this day
  duration: number;    // Session duration in minutes
}

/**
 * Get the configured time for a specific day from a group's schedule
 */
export function getScheduledTimeForDay(schedule: GroupSchedule | EnhancedGroupSchedule | null, day: WeekDay): string | null {
  if (!schedule) return null;

  // Check if enhanced schedule with per-day times
  if ('day_times' in schedule) {
    const slot = schedule.day_times.find(dt => dt.day === day && dt.enabled);
    return slot?.time || null;
  }

  // Basic schedule - same time for all days
  if (schedule.days?.includes(day)) {
    return schedule.time || null;
  }

  return null;
}

/**
 * Get duration from schedule, defaulting to 30 minutes
 */
export function getScheduleDuration(schedule: GroupSchedule | EnhancedGroupSchedule | null): number {
  if (!schedule) return 30;
  return schedule.duration || 30;
}

/**
 * Get all scheduled days for a group
 */
export function getScheduledDays(schedule: GroupSchedule | EnhancedGroupSchedule | null): WeekDay[] {
  if (!schedule) return [];

  if ('day_times' in schedule) {
    return schedule.day_times.filter(dt => dt.enabled).map(dt => dt.day);
  }

  return (schedule.days || []) as WeekDay[];
}

/**
 * Expand groups into individual day slots based on their schedules
 */
export function expandGroupsToDaySlots(groups: Group[]): UnscheduledDaySlot[] {
  const slots: UnscheduledDaySlot[] = [];

  for (const group of groups) {
    const days = getScheduledDays(group.schedule);
    const duration = getScheduleDuration(group.schedule);

    if (days.length === 0) {
      // No schedule configured - show as single slot without day
      // This allows dragging to any day
      continue; // Skip groups without schedules for now
    }

    for (const day of days) {
      slots.push({
        group,
        day,
        time: getScheduledTimeForDay(group.schedule, day),
        duration,
      });
    }
  }

  return slots;
}

/**
 * Check if a day slot has been scheduled (has a planned session this week)
 */
export function isDaySlotScheduled(
  slot: UnscheduledDaySlot,
  sessions: Session[],
  weekDates: Map<WeekDay, string>
): boolean {
  const dateForDay = weekDates.get(slot.day);
  if (!dateForDay) return false;

  return sessions.some(s =>
    s.group_id === slot.group.id &&
    s.date === dateForDay &&
    s.status !== 'cancelled'
  );
}

/**
 * Filter to only unscheduled day slots
 */
export function getUnscheduledDaySlots(
  groups: Group[],
  sessions: Session[],
  weekDates: Map<WeekDay, string>
): UnscheduledDaySlot[] {
  const allSlots = expandGroupsToDaySlots(groups);
  return allSlots.filter(slot => !isDaySlotScheduled(slot, sessions, weekDates));
}
```

**Step 2: Verify file compiles**

Run: `cd /Users/drtobon/Documents/emerge-intervention-planner/emerge-intervention-planner && npx tsc --noEmit src/lib/scheduling/day-slots.ts 2>&1 | head -20`

Expected: No errors or type checking passes

**Step 3: Commit**

```bash
cd /Users/drtobon/Documents/emerge-intervention-planner/emerge-intervention-planner
git add src/lib/scheduling/day-slots.ts
git commit -m "feat(schedule): add day slot types and helpers for multi-day scheduling"
```

---

### Task 2: Update Schedule Page to Use Day Slots

**Files:**
- Modify: `src/app/schedule/page.tsx`

**Step 1: Import the new day slots module**

Add import at top of file (around line 16):

```typescript
import {
  UnscheduledDaySlot,
  getUnscheduledDaySlots,
  getScheduledDays,
} from '@/lib/scheduling/day-slots';
```

**Step 2: Add helper to get current week dates**

Add this helper function inside the component (around line 50, before the useEffect):

```typescript
  // Get dates for current week (Monday-Friday) - matching ScheduleGrid
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + daysFromMonday);

    const dates = new Map<WeekDay, string>();
    WEEKDAYS.forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayNum = String(date.getDate()).padStart(2, '0');
      dates.set(day, `${year}-${month}-${dayNum}`);
    });

    return dates;
  }, []);
```

**Step 3: Replace unscheduledGroups with unscheduledDaySlots**

Replace the existing `unscheduledGroups` useMemo (around line 52-59) with:

```typescript
  // Get unscheduled day slots (one per group per scheduled day)
  const unscheduledDaySlots = useMemo(() => {
    return getUnscheduledDaySlots(groups, allSessions, weekDates);
  }, [groups, allSessions, weekDates]);

  // Also keep track of groups without any schedule configured
  const groupsWithoutSchedule = useMemo(() => {
    return groups.filter(g => {
      const days = getScheduledDays(g.schedule);
      return days.length === 0;
    });
  }, [groups]);
```

**Step 4: Update draggingGroup state to use day slot**

Change the state (around line 40):

```typescript
  // Drag and drop state - now tracks day slot instead of just group
  const [draggingSlot, setDraggingSlot] = useState<UnscheduledDaySlot | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: WeekDay; timeStr: string } | null>(null);
```

**Step 5: Update drag handlers**

Replace the drag handlers (around line 82-133):

```typescript
  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, slot: UnscheduledDaySlot) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      groupId: slot.group.id,
      day: slot.day,
      time: slot.time,
    }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingSlot(slot);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingSlot(null);
    setDragOverSlot(null);
  }, []);

  const handleDrop = useCallback(async (day: WeekDay, timeStr: string, dateStr: string) => {
    if (!draggingSlot) return;

    // Validate day matches (must drop on the correct day column)
    if (draggingSlot.day !== day) {
      console.warn(`Cannot drop ${draggingSlot.group.name} (${draggingSlot.day}) on ${day}`);
      setDraggingSlot(null);
      setDragOverSlot(null);
      return;
    }

    // Use configured time if available, otherwise use drop target time
    const sessionTime = draggingSlot.time || timeStr;

    try {
      await createSession({
        group_id: draggingSlot.group.id,
        date: dateStr,
        time: sessionTime,
        status: 'planned',
        curriculum_position: draggingSlot.group.current_position,
        advance_after: false,
        // Required nullable fields
        notes: null,
        planned_otr_target: null,
        planned_response_formats: null,
        planned_practice_items: null,
        cumulative_review_items: null,
        anticipated_errors: null,
        actual_otr_estimate: null,
        pacing: null,
        components_completed: null,
        exit_ticket_correct: null,
        exit_ticket_total: null,
        mastery_demonstrated: null,
        errors_observed: null,
        unexpected_errors: null,
        pm_score: null,
        pm_trend: null,
        dbi_adaptation_notes: null,
        next_session_notes: null,
        fidelity_checklist: null,
      });
      // Refresh sessions
      fetchAllSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }

    setDraggingSlot(null);
    setDragOverSlot(null);
  }, [draggingSlot, createSession, fetchAllSessions]);
```

**Step 6: Update ScheduleGrid props**

Update the ScheduleGrid component props (around line 187-195):

```typescript
              <ScheduleGrid
                interventionist={selectedInterventionist}
                groups={groups}
                constraints={constraints}
                onDrop={handleDrop}
                isDragging={!!draggingSlot}
                dragOverSlot={dragOverSlot}
                onDragOver={setDragOverSlot}
                draggingDay={draggingSlot?.day || null}
              />
```

**Step 7: Update the sidebar to show day slots**

Replace the Unscheduled Groups card content (around line 211-249):

```typescript
            {/* Unscheduled Day Slots - Draggable */}
            <Card className="p-4">
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Unscheduled Sessions
                {draggingSlot && (
                  <span className="text-xs bg-movement/20 text-movement px-2 py-0.5 rounded">
                    Drop on {getDayDisplayName(draggingSlot.day)}
                  </span>
                )}
              </h3>
              {groups.length === 0 ? (
                <p className="text-sm text-text-muted">No groups created yet</p>
              ) : unscheduledDaySlots.length === 0 && groupsWithoutSchedule.length === 0 ? (
                <p className="text-sm text-green-600">All sessions scheduled for this week!</p>
              ) : (
                <div className="space-y-2">
                  {unscheduledDaySlots.length > 0 && (
                    <>
                      <p className="text-xs text-text-muted mb-2">
                        Drag to matching day column to schedule
                      </p>
                      {unscheduledDaySlots.slice(0, 15).map(slot => (
                        <div
                          key={`${slot.group.id}-${slot.day}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, slot)}
                          onDragEnd={handleDragEnd}
                          className={`
                            p-2 bg-background rounded-lg text-sm cursor-grab
                            hover:bg-surface-hover transition-colors
                            flex items-center gap-2
                            ${draggingSlot?.group.id === slot.group.id && draggingSlot?.day === slot.day
                              ? 'opacity-50 ring-2 ring-movement' : ''}
                          `}
                        >
                          <GripVertical className="w-4 h-4 text-text-muted flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{slot.group.name}</span>
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                {getDayDisplayName(slot.day).slice(0, 3)}
                              </span>
                            </div>
                            <div className="text-text-muted text-xs">
                              Grade {slot.group.grade} | {slot.group.curriculum}
                              {slot.time && ` | ${formatTimeDisplay(slot.time)}`}
                            </div>
                          </div>
                        </div>
                      ))}
                      {unscheduledDaySlots.length > 15 && (
                        <p className="text-xs text-text-muted text-center">
                          +{unscheduledDaySlots.length - 15} more sessions
                        </p>
                      )}
                    </>
                  )}

                  {/* Groups without schedule configured */}
                  {groupsWithoutSchedule.length > 0 && (
                    <>
                      <div className="border-t border-border my-3 pt-3">
                        <p className="text-xs text-text-muted mb-2">
                          Groups needing schedule setup:
                        </p>
                        {groupsWithoutSchedule.slice(0, 5).map(group => (
                          <Link
                            key={group.id}
                            href={`/groups/${group.id}`}
                            className="block p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                          >
                            <div className="font-medium">{group.name}</div>
                            <div className="text-text-muted text-xs">
                              Click to configure schedule
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
```

**Step 8: Add Link import if not present**

Ensure Link is imported at top of file:

```typescript
import Link from 'next/link';
```

**Step 9: Verify the page compiles**

Run: `cd /Users/drtobon/Documents/emerge-intervention-planner/emerge-intervention-planner && npm run build 2>&1 | tail -30`

Expected: Build succeeds or shows only warnings

**Step 10: Commit**

```bash
cd /Users/drtobon/Documents/emerge-intervention-planner/emerge-intervention-planner
git add src/app/schedule/page.tsx
git commit -m "feat(schedule): update sidebar to show day-specific draggable slots"
```

---

### Task 3: Update ScheduleGrid to Validate Drop Day

**Files:**
- Modify: `src/components/schedule/ScheduleGrid.tsx`

**Step 1: Add draggingDay prop**

Update the interface (around line 17-26):

```typescript
interface ScheduleGridProps {
  interventionist: LocalInterventionist | null;
  groups: Group[];
  constraints: ScheduleConstraint[];
  // Drag and drop props
  onDrop?: (day: WeekDay, timeStr: string, dateStr: string) => void;
  isDragging?: boolean;
  dragOverSlot?: { day: WeekDay; timeStr: string } | null;
  onDragOver?: (slot: { day: WeekDay; timeStr: string } | null) => void;
  draggingDay?: WeekDay | null; // The specific day being dragged
}
```

**Step 2: Destructure the new prop**

Update the function signature (around line 75-83):

```typescript
export function ScheduleGrid({
  interventionist,
  groups,
  constraints,
  onDrop,
  isDragging = false,
  dragOverSlot,
  onDragOver,
  draggingDay = null,
}: ScheduleGridProps) {
```

**Step 3: Update canDrop logic to validate day**

Find the canDrop calculation inside the day columns map (around line 310) and update:

```typescript
                // Only allow drop if day matches the dragging day
                const dayMatches = !draggingDay || draggingDay === day;
                const canDrop = isDragging && dayMatches && !blocked && sessions.length === 0 && (available || !interventionist);
```

**Step 4: Add visual feedback for invalid days**

Update the cell className (around line 333-350) to dim invalid days:

```typescript
                    className={`
                      min-h-[32px] rounded border transition-colors relative
                      ${isHourStart(timeStr) ? 'rounded-t-lg' : 'rounded-t-none border-t-0'}
                      ${timeStr.endsWith(':30') ? 'rounded-b-lg' : 'rounded-b-none'}
                      ${isDragOver && canDrop
                        ? 'bg-movement/20 border-movement border-2 scale-[1.02]'
                        : sessions.length > 0
                          ? 'bg-white border-gray-300 dark:bg-gray-900 dark:border-gray-600'
                          : blocked
                            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                            : isDragging && draggingDay && draggingDay !== day
                              ? 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600 opacity-40'
                              : available
                                ? `bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800
                                   ${isDragging && canDrop ? 'hover:bg-green-100 hover:border-green-300' : 'hover:bg-green-100'}
                                   dark:hover:bg-green-900/30 cursor-pointer`
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                      }
                      ${isDragging && canDrop ? 'ring-1 ring-movement/30' : ''}
                    `}
```

**Step 5: Update the day header to highlight matching day**

Find the day header div (around line 275-286) and update:

```typescript
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className={`
                text-center p-2 rounded-lg transition-colors
                ${isDragging && draggingDay === day
                  ? 'bg-movement/20 ring-2 ring-movement'
                  : 'bg-surface'}
              `}
            >
              <div className={`font-semibold text-sm ${isDragging && draggingDay === day ? 'text-movement' : 'text-text-primary'}`}>
                {getDayShortName(day)}
              </div>
              <div className="text-xs text-text-muted">
                {formatDateShort(weekDates.get(day)!)}
              </div>
            </div>
          ))}
```

**Step 6: Verify the component compiles**

Run: `cd /Users/drtobon/Documents/emerge-intervention-planner/emerge-intervention-planner && npm run build 2>&1 | tail -30`

Expected: Build succeeds

**Step 7: Commit**

```bash
cd /Users/drtobon/Documents/emerge-intervention-planner/emerge-intervention-planner
git add src/components/schedule/ScheduleGrid.tsx
git commit -m "feat(schedule): add day validation and visual feedback for drag-drop"
```

---

### Task 4: Test the Multi-Day Scheduling Flow

**Step 1: Start the development server**

Run: `cd /Users/drtobon/Documents/emerge-intervention-planner/emerge-intervention-planner && npm run dev &`

**Step 2: Manual Testing Checklist**

Test these scenarios in browser at http://localhost:3000/schedule:

1. **Group with schedule shows multiple cards:**
   - Create/edit a group with schedule days: Mon, Wed, Fri
   - Verify 3 separate cards appear in sidebar with day badges

2. **Day validation works:**
   - Drag a "Mon" card
   - Verify only Monday column is highlighted
   - Verify other days are dimmed
   - Drop on Monday → session created
   - Verify card disappears but Wed/Fri cards remain

3. **Time auto-fill works:**
   - Configure group with specific time (e.g., 9:00)
   - Drag and drop on correct day
   - Verify session uses configured time, not drop target time

4. **Groups without schedule:**
   - Create group without schedule configured
   - Verify it appears in "Groups needing schedule setup" section
   - Verify link goes to group detail page

**Step 3: Commit final state**

```bash
cd /Users/drtobon/Documents/emerge-intervention-planner/emerge-intervention-planner
git add -A
git commit -m "feat(schedule): complete multi-day drag-drop scheduling

- Add day slot types and helpers
- Update sidebar to show one card per scheduled day
- Validate drops land on correct day column
- Visual feedback highlights valid drop target day
- Groups without schedule shown separately"
```

---

### Task 5: Deploy to NAS

**Step 1: Build the production bundle**

Run: `cd /Users/drtobon/Documents/emerge-intervention-planner/emerge-intervention-planner && npm run build`

Expected: Build succeeds with no errors

**Step 2: Deploy to NAS**

Run: `scp -r /Users/drtobon/Documents/emerge-intervention-planner/emerge-intervention-planner/.next Dr.Tobon@192.168.86.45:/volume1/docker/emerge-intervention-planner/`

**Step 3: Restart the application**

Run: `ssh Dr.Tobon@192.168.86.45 "cd /volume1/docker/emerge-intervention-planner && pm2 restart emerge-planner"`

**Step 4: Verify deployment**

Test at: https://emerge.tbnlab.xyz/schedule

---

## Summary

This plan implements multi-day scheduling with these key behaviors:

1. **One card per day** - Groups with 3x/week dosage show 3 cards (Mon, Wed, Fri)
2. **Day-locked drops** - Can only drop Monday card on Monday column
3. **Visual feedback** - Target day column highlighted, others dimmed
4. **Time inheritance** - Uses configured time from group schedule
5. **Progress tracking** - Cards disappear as sessions are scheduled
