-- Migration: Fix Interventionist Student Update Permission
-- Date: 2026-01-26
-- Description: Allow interventionists to update students (specifically group_id) 
-- so they can add existing students to their groups

-- Allow interventionists to update students
-- This is needed for adding existing students to groups they own
CREATE POLICY "Interventionists can update students for their groups"
  ON students
  FOR UPDATE
  TO authenticated
  USING (
    -- User is an interventionist
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'interventionist'
    )
  )
  WITH CHECK (
    -- The target group belongs to this interventionist (owner_id check)
    -- OR the student is being assigned to a group they created
    group_id IS NULL
    OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = students.group_id
      AND (groups.owner_id = auth.uid() OR groups.created_by = auth.uid())
    )
  );

-- Also allow interventionists to insert into student_assignments
-- (they may need to create assignments for students they're adding)
CREATE POLICY "Interventionists can create own assignments"
  ON student_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    interventionist_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'interventionist'
    )
  );

-- Allow interventionists to insert into student_group_memberships for their groups
CREATE POLICY "Interventionists can add students to own groups"
  ON student_group_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = student_group_memberships.group_id
      AND (groups.owner_id = auth.uid() OR groups.created_by = auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'interventionist'
    )
  );
