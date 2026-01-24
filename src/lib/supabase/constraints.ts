/**
 * Schedule Constraints Service
 *
 * Handles CRUD operations for schedule constraints with role-based access.
 * Constraints are stored in Supabase for cross-device persistence.
 *
 * Visibility is enforced by RLS policies:
 * - All users see schoolwide constraints
 * - Users see their own personal constraints
 * - Admin "see all" feature requires API route (future enhancement)
 */

import { supabase } from './client';
import type {
  ScheduleConstraint,
  ScheduleConstraintInsert,
  ScheduleConstraintUpdate,
  ScheduleConstraintWithCreator,
} from './types';
import type { UserRole } from './profiles';

// ============================================
// FETCH OPERATIONS
// ============================================

/**
 * Fetch all constraints visible to the current user
 * RLS handles visibility:
 * - Schoolwide constraints: visible to all
 * - Personal constraints: visible only to creator
 */
export async function fetchConstraints(): Promise<ScheduleConstraintWithCreator[]> {
  // Fetch constraints
  const { data: constraints, error } = await supabase
    .from('schedule_constraints')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching constraints:', error);
    throw error;
  }

  if (!constraints || constraints.length === 0) {
    return [];
  }

  // Fetch creator profiles for the constraints
  const creatorIds = [...new Set(constraints.map(c => c.created_by))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', creatorIds);

  // Map profiles to constraints
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return constraints.map(c => ({
    ...c,
    creator: profileMap.get(c.created_by) || undefined,
  }));
}

/**
 * Fetch constraints that apply to specific grades
 * Filters by applicable_grades array overlap
 */
export async function fetchConstraintsForGrades(
  grades: number[]
): Promise<ScheduleConstraint[]> {
  if (grades.length === 0) {
    return [];
  }

  const { data, error } = await supabase
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

/**
 * Fetch constraints created by a specific user
 */
export async function fetchConstraintsByCreator(
  creatorId: string
): Promise<ScheduleConstraint[]> {
  const { data, error } = await supabase
    .from('schedule_constraints')
    .select('*')
    .eq('created_by', creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching constraints by creator:', error);
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

// ============================================
// PERMISSION HELPERS
// ============================================

/**
 * Check if user can create schoolwide constraints
 * Only admins can create schoolwide constraints
 */
export function canCreateSchoolwide(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Check if user can edit/delete a constraint
 * Users can edit their own constraints; admins can edit any
 */
export function canModifyConstraint(
  constraint: ScheduleConstraint,
  userId: string,
  role: UserRole
): boolean {
  return role === 'admin' || constraint.created_by === userId;
}

/**
 * Get default scope for a user role
 * Admins default to schoolwide, others to personal
 */
export function getDefaultScope(role: UserRole): 'schoolwide' | 'personal' {
  return role === 'admin' ? 'schoolwide' : 'personal';
}
