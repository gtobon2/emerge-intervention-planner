# EMERGE Scheduler Constraints - Design & Implementation Plan

**Date:** 2026-01-24
**Status:** Approved
**Author:** Claude + Dr. Tobon

## Problem Statement

Scheduler constraints in the EMERGE app have persistence and scoping issues:
1. Constraints stored in IndexedDB (browser-local) - disappear across devices/users
2. Single-grade model doesn't support multi-grade constraints
3. No user/role scoping - can't distinguish admin (schoolwide) vs personal constraints
4. Constraints not filtering correctly by grade on schedule view

## Solution Overview

Migrate constraints from IndexedDB to Supabase with:
- Multi-grade support (array of grades per constraint)
- Role-based visibility (schoolwide vs personal scope)
- Proper RLS policies for access control

---

## Task 1: Create Supabase Migration

**File:** `supabase/migrations/20260124_add_schedule_constraints.sql`

```sql
-- Schedule Constraints Table
CREATE TABLE IF NOT EXISTS public.schedule_constraints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who created it and scoping
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('schoolwide', 'personal')),

  -- Multi-grade support (array instead of single value)
  applicable_grades INTEGER[] NOT NULL,

  -- Constraint details
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lunch', 'core_instruction', 'specials', 'therapy', 'other')),

  -- Schedule
  days TEXT[] NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_schedule_constraints_created_by ON public.schedule_constraints(created_by);
CREATE INDEX idx_schedule_constraints_scope ON public.schedule_constraints(scope);
CREATE INDEX idx_schedule_constraints_grades ON public.schedule_constraints USING GIN(applicable_grades);

-- Enable RLS
ALTER TABLE public.schedule_constraints ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT: See schoolwide + own personal + (if admin via service role) all
CREATE POLICY "Users can view schoolwide and own constraints"
  ON public.schedule_constraints
  FOR SELECT
  TO authenticated
  USING (
    scope = 'schoolwide'
    OR created_by = auth.uid()
  );

-- INSERT: Anyone can create personal; check scope in app layer for schoolwide
CREATE POLICY "Users can create constraints"
  ON public.schedule_constraints
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- UPDATE: Only creator can update
CREATE POLICY "Users can update own constraints"
  ON public.schedule_constraints
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- DELETE: Only creator can delete
CREATE POLICY "Users can delete own constraints"
  ON public.schedule_constraints
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Service role has full access (for admin operations)
CREATE POLICY "Service role has full access to constraints"
  ON public.schedule_constraints
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_schedule_constraints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_constraints_updated_at
  BEFORE UPDATE ON public.schedule_constraints
  FOR EACH ROW EXECUTE FUNCTION update_schedule_constraints_updated_at();
```

**Verification:** Run migration in Supabase SQL Editor, confirm table exists with `\d schedule_constraints`

---

## Task 2: Add TypeScript Types

**File:** `src/lib/supabase/types.ts` (add to existing file)

Add after existing constraint types (~line 535):

```typescript
// ===========================================
// SCHEDULE CONSTRAINTS (Supabase-backed)
// ===========================================

export type ConstraintScope = 'schoolwide' | 'personal';

export interface ScheduleConstraint {
  id: string;
  created_by: string;
  scope: ConstraintScope;
  applicable_grades: number[];
  label: string;
  type: ConstraintType;
  days: WeekDay[];
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export type ScheduleConstraintInsert = Omit<ScheduleConstraint, 'id' | 'created_at' | 'updated_at'>;
export type ScheduleConstraintUpdate = Partial<Omit<ScheduleConstraintInsert, 'created_by'>>;

// Extended type with creator profile info (for display)
export interface ScheduleConstraintWithCreator extends ScheduleConstraint {
  creator?: {
    full_name: string;
    role: string;
  };
}
```

**Verification:** TypeScript compiles without errors

---

## Task 3: Create Constraints Service

**File:** `src/lib/supabase/constraints.ts` (new file)

```typescript
/**
 * Schedule Constraints Service
 *
 * Handles CRUD operations for schedule constraints with role-based access.
 */

import { supabase } from './client';
import { createServiceClient } from './server';
import type {
  ScheduleConstraint,
  ScheduleConstraintInsert,
  ScheduleConstraintUpdate,
  ScheduleConstraintWithCreator
} from './types';
import type { UserRole } from './profiles';

// ============================================
// FETCH OPERATIONS
// ============================================

/**
 * Fetch all constraints visible to the current user
 * - Schoolwide constraints: visible to all
 * - Personal constraints: visible only to creator (or admin via service role)
 */
export async function fetchConstraints(
  userId: string,
  role: UserRole
): Promise<ScheduleConstraintWithCreator[]> {
  // Admins use service role to see all constraints
  const client = role === 'admin' ? createServiceClient() : supabase;

  if (!client) {
    console.error('Supabase client not available');
    return [];
  }

  const { data, error } = await client
    .from('schedule_constraints')
    .select(`
      *,
      creator:profiles!created_by(full_name, role)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching constraints:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch constraints that apply to specific grades
 * Filters by applicable_grades array overlap
 */
export async function fetchConstraintsForGrades(
  userId: string,
  role: UserRole,
  grades: number[]
): Promise<ScheduleConstraint[]> {
  const client = role === 'admin' ? createServiceClient() : supabase;

  if (!client) {
    console.error('Supabase client not available');
    return [];
  }

  const { data, error } = await client
    .from('schedule_constraints')
    .select('*')
    .overlaps('applicable_grades', grades)
    .order('start_time');

  if (error) {
    console.error('Error fetching constraints for grades:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Create a new constraint
 * Note: App layer must verify admin role before allowing scope='schoolwide'
 */
export async function createConstraint(
  data: ScheduleConstraintInsert
): Promise<ScheduleConstraint> {
  const { data: constraint, error } = await supabase
    .from('schedule_constraints')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating constraint:', error);
    throw error;
  }

  return constraint;
}

/**
 * Update an existing constraint
 */
export async function updateConstraint(
  id: string,
  updates: ScheduleConstraintUpdate
): Promise<ScheduleConstraint> {
  const { data, error } = await supabase
    .from('schedule_constraints')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating constraint:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a constraint
 */
export async function deleteConstraint(id: string): Promise<void> {
  const { error } = await supabase
    .from('schedule_constraints')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting constraint:', error);
    throw error;
  }
}

/**
 * Check if user can create schoolwide constraints
 */
export function canCreateSchoolwide(role: UserRole): boolean {
  return role === 'admin';
}
```

**Verification:** Import file in another module, ensure no TypeScript errors

---

## Task 4: Update Schedule Store

**File:** `src/stores/schedule.ts` (modify existing)

Changes needed:
1. Import new Supabase constraint service
2. Replace `LocalGradeLevelConstraint` with `ScheduleConstraint`
3. Update fetch/create/update/delete to use Supabase
4. Add role-aware fetching
5. Keep local interventionists/student constraints for now (separate migration)

Key modifications:

```typescript
// Add imports
import {
  fetchConstraints as fetchConstraintsDB,
  fetchConstraintsForGrades as fetchConstraintsForGradesDB,
  createConstraint as createConstraintDB,
  updateConstraint as updateConstraintDB,
  deleteConstraint as deleteConstraintDB,
  canCreateSchoolwide,
} from '@/lib/supabase/constraints';
import type { ScheduleConstraint, ScheduleConstraintInsert, ScheduleConstraintUpdate } from '@/lib/supabase/types';
import { useAuthStore } from './auth';

// Update state interface
interface ScheduleState {
  // ... existing
  constraints: ScheduleConstraint[];  // Renamed from gradeLevelConstraints

  // Actions
  fetchConstraints: () => Promise<void>;
  createConstraint: (data: Omit<ScheduleConstraintInsert, 'created_by'>) => Promise<ScheduleConstraint | null>;
  updateConstraint: (id: string, updates: ScheduleConstraintUpdate) => Promise<void>;
  deleteConstraint: (id: string) => Promise<void>;
}

// Update implementations to use Supabase service
```

**Verification:** Schedule page loads without errors, existing functionality preserved

---

## Task 5: Update ConstraintsModal UI

**File:** `src/components/schedule/ConstraintsModal.tsx` (modify existing)

Changes needed:
1. Replace single grade select with multi-grade checkbox group
2. Add scope selector (admin only) with Building2/User icons
3. Update form state to handle arrays
4. Add grade band quick-select buttons
5. Show scope badges in constraint list

Key UI elements:
- Multi-select: Checkbox grid for grades K-8
- Quick buttons: "K-2", "3-5", "6-8", "All"
- Scope radio (admin only): Building2 icon + "Schoolwide" / User icon + "Personal"
- List badges: Building2 or User icon next to each constraint

**Verification:**
- Can select multiple grades
- Admin sees scope selector, interventionist does not
- Constraints save and reload correctly

---

## Task 6: Update ScheduleGrid Filtering

**File:** `src/components/schedule/ScheduleGrid.tsx` (modify existing)

Changes needed:
1. Update props type from `LocalGradeLevelConstraint[]` to `ScheduleConstraint[]`
2. Filter constraints by grades of visible groups
3. Update `isTimeBlocked` to check `applicable_grades` array
4. Update constraint label tooltip to show affected grades
5. Handle both schoolwide and personal constraints

Key logic:
```typescript
// Filter constraints relevant to current view
const relevantConstraints = useMemo(() => {
  const visibleGrades = new Set(groups.map(g => g.grade));
  return constraints.filter(c =>
    c.applicable_grades.some(grade => visibleGrades.has(grade))
  );
}, [constraints, groups]);
```

**Verification:**
- Constraints only show for relevant grades
- Grade 5 constraint doesn't block Grade 3 group slots
- Tooltip shows "Lunch (Grades 3, 4, 5)"

---

## Task 7: Update Schedule Page Integration

**File:** `src/app/schedule/page.tsx` (modify existing)

Changes needed:
1. Update imports to use new constraint types
2. Fetch constraints on mount with user role
3. Pass constraints to ScheduleGrid
4. Add optional filter toggle in header

**Verification:**
- Page loads and displays constraints
- Creating constraint persists across page refresh
- Different users see appropriate constraints based on role

---

## Task 8: Testing & Verification

Manual test scenarios:

1. **Admin creates schoolwide constraint**
   - Login as admin
   - Create constraint for Grades 3, 4 with scope "Schoolwide"
   - Verify it appears on schedule
   - Login as interventionist → verify constraint visible

2. **Interventionist creates personal constraint**
   - Login as interventionist
   - Create personal constraint (lunch break)
   - Verify only they can see it
   - Login as different interventionist → verify NOT visible
   - Login as admin → verify visible

3. **Persistence across sessions**
   - Create constraint
   - Logout, clear browser cache
   - Login again → verify constraint still exists

4. **Multi-grade filtering**
   - Create constraint for Grade 3 only
   - View schedule with Grade 5 group → verify NOT blocked
   - View schedule with Grade 3 group → verify IS blocked

5. **Edit and delete**
   - Edit constraint grades, time, label → verify changes persist
   - Delete constraint → verify removed from all views

---

## Implementation Order

1. Task 1: Database migration (prerequisite for all else)
2. Task 2: TypeScript types (needed for service layer)
3. Task 3: Constraints service (API layer)
4. Task 4: Schedule store (state management)
5. Task 5: ConstraintsModal UI (user interface)
6. Task 6: ScheduleGrid filtering (display logic)
7. Task 7: Schedule page integration (wire it together)
8. Task 8: Testing (verify everything works)

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/migrations/20260124_add_schedule_constraints.sql` | Create |
| `src/lib/supabase/types.ts` | Modify |
| `src/lib/supabase/constraints.ts` | Create |
| `src/stores/schedule.ts` | Modify |
| `src/components/schedule/ConstraintsModal.tsx` | Modify |
| `src/components/schedule/ScheduleGrid.tsx` | Modify |
| `src/app/schedule/page.tsx` | Modify |
