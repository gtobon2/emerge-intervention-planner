-- Migration: Group Ownership and Enhanced RBAC
-- Date: 2026-01-16
-- Description: Adds owner_id to groups for role-based access control and group management

-- ============================================
-- 1. ADD OWNER_ID COLUMN TO GROUPS
-- ============================================
-- owner_id represents who currently owns/manages the group
-- created_by is historical (who originally created it)
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for owner_id lookups
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);

-- ============================================
-- 2. MIGRATE EXISTING GROUPS
-- ============================================
-- Set owner_id to created_by for existing groups (preserve ownership)
UPDATE groups
SET owner_id = created_by
WHERE owner_id IS NULL AND created_by IS NOT NULL;

-- For groups with no created_by, assign to first admin user
-- Find admin user by email 'geraldotobon@gmail.com' or fallback to first admin
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Try to find the specific admin user
  SELECT id INTO admin_id
  FROM profiles
  WHERE email = 'geraldotobon@gmail.com'
  LIMIT 1;

  -- If not found, get the first admin
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id
    FROM profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- Update groups with no owner
  IF admin_id IS NOT NULL THEN
    UPDATE groups
    SET owner_id = admin_id, created_by = admin_id
    WHERE owner_id IS NULL;
  END IF;
END $$;

-- ============================================
-- 3. DROP OLD RLS POLICIES
-- ============================================
-- Drop existing policies to recreate with owner_id support
DROP POLICY IF EXISTS "Admins can see all groups" ON groups;
DROP POLICY IF EXISTS "Interventionists can see own groups" ON groups;
DROP POLICY IF EXISTS "Teachers can see groups" ON groups;
DROP POLICY IF EXISTS "Admins have full access to groups" ON groups;
DROP POLICY IF EXISTS "Interventionists can manage own groups" ON groups;

-- ============================================
-- 4. CREATE NEW RLS POLICIES FOR GROUPS
-- ============================================

-- Policy: Admins have full access to all groups
CREATE POLICY "admin_full_access_groups"
  ON groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Interventionists can SELECT their own groups (by owner_id)
CREATE POLICY "interventionist_select_own_groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Interventionists can INSERT groups (will set themselves as owner)
CREATE POLICY "interventionist_insert_groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Interventionists can UPDATE their own groups
CREATE POLICY "interventionist_update_own_groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    -- Cannot change owner_id unless admin
    (owner_id = auth.uid() AND owner_id IS NOT DISTINCT FROM (SELECT groups.owner_id FROM groups WHERE groups.id = id))
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Interventionists can DELETE their own groups
CREATE POLICY "interventionist_delete_own_groups"
  ON groups
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Teachers can SELECT groups for viewing (no modification)
CREATE POLICY "teacher_select_groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- ============================================
-- 5. UPDATE STUDENTS RLS POLICIES
-- ============================================
-- Interventionists can manage students in their own groups

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Interventionists can manage students in own groups" ON students;

-- Policy: Interventionists can INSERT/UPDATE/DELETE students in their own groups
CREATE POLICY "interventionist_manage_students_in_own_groups"
  ON students
  FOR ALL
  TO authenticated
  USING (
    -- Admin can do anything
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    -- Interventionist can manage students in their own groups
    OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = students.group_id
      AND groups.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = students.group_id
      AND groups.owner_id = auth.uid()
    )
  );

-- ============================================
-- 6. UPDATE SESSIONS RLS FOR OWNERSHIP
-- ============================================
DROP POLICY IF EXISTS "Interventionists can manage sessions for own groups" ON sessions;
DROP POLICY IF EXISTS "Interventionists can see sessions for own groups" ON sessions;

-- Policy: Users can manage sessions in groups they own
CREATE POLICY "owner_manage_sessions"
  ON sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = sessions.group_id
      AND (
        g.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = sessions.group_id
      AND (
        g.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- ============================================
-- 7. HELPER FUNCTION: Transfer Group Ownership
-- ============================================
CREATE OR REPLACE FUNCTION transfer_group_ownership(
  p_group_id UUID,
  p_new_owner_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) INTO v_is_admin;

  -- Only admins can transfer ownership
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can transfer group ownership';
  END IF;

  -- Verify new owner exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_new_owner_id) THEN
    RAISE EXCEPTION 'New owner not found';
  END IF;

  -- Transfer ownership
  UPDATE groups
  SET owner_id = p_new_owner_id, updated_at = NOW()
  WHERE id = p_group_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. FUNCTION: Check Intervention Conflict
-- ============================================
-- Updated to use owner_id instead of created_by
CREATE OR REPLACE FUNCTION check_intervention_conflict(
  p_student_id UUID,
  p_curriculum TEXT,
  p_exclude_group_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflict_exists BOOLEAN,
  conflicting_group_name TEXT,
  conflicting_group_id UUID,
  owner_name TEXT,
  owner_id UUID,
  is_same_owner BOOLEAN
) AS $$
DECLARE
  v_current_user UUID;
BEGIN
  v_current_user := auth.uid();

  RETURN QUERY
  SELECT
    TRUE AS conflict_exists,
    g.name AS conflicting_group_name,
    g.id AS conflicting_group_id,
    p.full_name AS owner_name,
    g.owner_id,
    (g.owner_id = v_current_user) AS is_same_owner
  FROM students s
  JOIN groups g ON s.group_id = g.id
  LEFT JOIN profiles p ON g.owner_id = p.id
  WHERE s.id = p_student_id
    AND g.curriculum = p_curriculum
    AND (p_exclude_group_id IS NULL OR g.id != p_exclude_group_id)
  LIMIT 1;

  -- If no rows returned, return a single row with conflict_exists = FALSE
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::UUID, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. UPDATE STUDENT GROUP STATUS VIEW
-- ============================================
DROP VIEW IF EXISTS student_group_status;

CREATE OR REPLACE VIEW student_group_status AS
SELECT
  s.id AS student_id,
  s.name AS student_name,
  s.grade_level,
  s.group_id,
  g.name AS current_group_name,
  g.curriculum AS current_curriculum,
  g.owner_id AS group_owner_id,
  p.full_name AS owner_name,
  CASE
    WHEN g.id IS NOT NULL THEN TRUE
    ELSE FALSE
  END AS is_in_group
FROM students s
LEFT JOIN groups g ON s.group_id = g.id
LEFT JOIN profiles p ON g.owner_id = p.id;
