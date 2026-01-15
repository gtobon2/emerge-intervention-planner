# Wilson Lesson Tracker

## Overview

The Wilson Lesson Tracker provides a **live lesson reference** during intervention sessions, allowing interventionists to track progress through each component of a Wilson Reading System lesson in real-time.

**Key Problem Solved:** Previously, Wilson lessons were saved but not accessible during sessions. Interventionists had no way to reference their lesson plan while teaching, and progress wasn't tracked between sessions.

## Features

### 1. Live Lesson Display

When a session has a Wilson lesson plan attached, the tracker displays:

- **10 lesson sections** organized by block:
  - **Block 1 (Blue): Word Study** - Sounds Quick Drill, Teach/Review Reading, Word Cards, Wordlist Reading, Sentence Reading
  - **Block 2 (Orange): Spelling** - Quick Drill Reverse, Teach/Review Spelling, Dictation
  - **Block 3 (Purple): Fluency/Comprehension** - Passage Reading, Listening Comprehension

- **Section details:**
  - Duration (minutes)
  - Elements (sounds, words, sentences, etc.)
  - Activities (AI-suggested or manually added)
  - Notes

### 2. Cross-Off Progress Tracking

**Elements:** Click any element (sound, word, sentence, story) to mark it as completed. Completed elements show with a strikethrough and green checkmark.

**Activities:** Click activities to check them off. A checkbox visual shows completion status.

**Entire Section:** Click the checkmark button on any section header to mark the entire section complete (automatically marks all elements and activities).

### 3. Progress Persistence

- Progress **auto-saves** to the database whenever you mark something complete
- **Pick up where you left off** - When you return to the session, all your previous progress is restored
- Great for lessons that span multiple days or interrupted sessions

### 4. Navigation

**Continue Button:** Jumps to the next incomplete section, expanding it and scrolling it into view. Perfect for quickly resuming after a break.

**Expand/Collapse:** Click any section header to expand or collapse its details.

### 5. Progress Indicators

**Overall Progress Bar:** Shows percentage of sections completed at the top of the tracker.

**Section Progress:** Each section shows:
- Item count (e.g., "3/5 items")
- Mini progress bar
- Green background when fully complete

### 6. Print Functionality

Click the **Print** button to:
- Expand all sections
- Generate a clean, printable view
- Print the full lesson plan for offline reference

## How to Use

### Creating a Lesson Plan

1. Go to a group page
2. Click **Wilson Planner** tab
3. Select a substep from the dropdown
4. Either:
   - **Auto-generate with AI:** Click "Generate with AI" to create a full lesson
   - **Manual build:** Drag elements from the Element Bank to each section
5. Click **Save** to save the lesson plan

### Attaching to a Session

When you save a Wilson lesson plan with a `sessionId`, it automatically attaches to that session.

### Using During Session

1. Go to the session page
2. Click **Start Session**
3. The Wilson Lesson Tracker appears (replaces the basic components checklist)
4. As you teach, click elements/activities to mark them done
5. Use **Continue** button to jump to next section
6. Progress saves automatically

### Resuming a Session

Simply return to the same session - all your progress is preserved. Click **Continue** to jump to where you left off.

## Technical Details

### Data Structure

```typescript
// Stored in session.wilson_lesson_progress
interface WilsonLessonProgress {
  [sectionComponent: string]: {
    completed: boolean;           // Is entire section done?
    elementsCompleted: string[];  // IDs of completed elements
    activitiesCompleted: number[]; // Indices of completed activities
  };
}
```

### Files

| File | Purpose |
|------|---------|
| `src/components/sessions/tracking/WilsonLessonTracker.tsx` | Main tracker component |
| `src/lib/supabase/types.ts` | `WilsonLessonProgress` type definition |
| `src/lib/local-db/index.ts` | `wilson_lesson_progress` field in LocalSession |
| `src/app/groups/[id]/session/[sessionId]/page.tsx` | Integration into session page |

### Database Fields

Added to `LocalSession` and `Session`:

```typescript
wilson_lesson_plan?: WilsonLessonPlan | null;     // The lesson plan
wilson_lesson_progress?: WilsonLessonProgress | null; // Progress tracking
```

## Color Coding

| Block | Color | Sections |
|-------|-------|----------|
| Word Study | Blue (`#1565c0`) | Parts 1-5 |
| Spelling | Orange (`#f57c00`) | Parts 6-8 |
| Fluency/Comprehension | Purple (`#7b1fa2`) | Parts 9-10 |

## Best Practices

1. **Create lesson plans ahead of time** - Build your Wilson lesson before the session starts
2. **Use Continue button** - Quickly resume after interruptions
3. **Mark sections complete** - Click the section checkmark when done with all items
4. **Print for offline** - Print a copy before sessions without reliable internet
5. **Check progress bar** - Quick visual of how much of the lesson is complete

## Troubleshooting

**Lesson not showing?**
- Ensure a Wilson lesson plan is attached to the session
- Check that the session has been saved after attaching the plan

**Progress not saving?**
- Check browser console for errors
- Ensure you have a stable connection (saves are immediate)

**Print not working?**
- Allow pop-ups for the site
- Try using browser's native print (Cmd/Ctrl + P)

## Changelog

### January 2026
- Initial release
- Cross-off functionality for elements and activities
- Progress persistence between sessions
- Print functionality
- Continue button for quick navigation
- Color-coded blocks (Word Study, Spelling, Fluency)
