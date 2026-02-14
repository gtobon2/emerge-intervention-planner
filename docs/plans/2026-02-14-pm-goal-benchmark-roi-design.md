# PM Goal, Benchmark & ROI Redesign

## Problem

Goals and benchmarks are currently entered on every PM data point, but in practice they are set once per student per intervention cycle. The chart has no goal line, no benchmark marker, no aimline, and no ROI calculation.

## Design Decisions

- **Per-student SMART goals** with written text, numeric target, and target date
- **Benchmark entered once** with the actual assessment date (not auto-derived)
- **ROI displayed as** numeric stat card + dashed aimline on chart
- **Setup lives on the Progress Monitoring page** via a dedicated modal

## Data Model

### LocalStudentGoal (IndexedDB, expanded)

| Field | Type | Description |
|-------|------|-------------|
| id | number (auto) | Primary key |
| student_id | number | FK to student |
| group_id | number | FK to group |
| goal_score | number | Numeric target score |
| smart_goal_text | string | Written SMART goal |
| goal_target_date | string | Target date for achieving the goal |
| benchmark_score | number \| null | Starting assessment score |
| benchmark_date | string \| null | Date benchmark was administered |
| measure_type | string | CBM-R, Maze, etc. |
| set_date | string | When goal was set |
| created_at | string | Record created |
| updated_at | string | Record updated |

Requires a new DB version (v8) to add the new fields.

### ProgressMonitoring (unchanged)

The `benchmark` and `goal` fields remain in the schema for backward compatibility but are no longer populated from the batch entry modal. Weekly entries contain only: group_id, student_id, date, measure_type, score, notes.

## Workflow

### 1. Set Goal & Benchmark (once per student)

Button: "Set Goals & Benchmarks" on PM page (visible when a group is selected).

Modal shows a table of students with columns:
- Student name
- SMART goal text (textarea)
- Goal score (number)
- Target date (date picker)
- Benchmark score (number)
- Benchmark date (date picker)

Pre-populates from existing `LocalStudentGoal` records if they exist.

### 2. Enter PM Data (weekly)

Existing batch entry modal, simplified:
- Shared: date, measure type
- Per student: score only (no goal/benchmark columns)
- Counter: "X of Y scores entered"

### 3. Chart Enhancements

The progress chart adds per-student:

- **Benchmark point**: distinct diamond/square marker at (benchmark_date, benchmark_score)
- **Goal line**: horizontal dashed line at goal_score, spanning from benchmark_date to goal_target_date
- **Aimline**: dashed line from (benchmark_date, benchmark_score) to (goal_target_date, goal_score)
- **ROI stat card**: (current_score - benchmark_score) / weeks_elapsed, displayed per student

### 4. ROI Calculation

```
ROI = (most_recent_score - benchmark_score) / weeks_between(benchmark_date, most_recent_date)
```

The aimline represents the expected ROI needed to reach the goal:
```
Expected ROI = (goal_score - benchmark_score) / weeks_between(benchmark_date, goal_target_date)
```

Both values shown in a stat card so the interventionist can compare actual vs. expected ROI.

## Files Affected

- `src/lib/local-db/index.ts` — v8 schema, expanded LocalStudentGoal
- `src/stores/goals.ts` — update store for new fields
- `src/components/goals/GoalSettingModal.tsx` — rewrite with SMART goal, benchmark fields
- `src/components/progress/add-data-point-modal.tsx` — remove goal/benchmark columns
- `src/components/progress/progress-chart.tsx` — add benchmark point, goal line, aimline
- `src/app/progress/page.tsx` — add "Set Goals & Benchmarks" button, ROI stat card, wire goal data to chart
- `src/hooks/use-progress.ts` — may need ROI calculation helper
