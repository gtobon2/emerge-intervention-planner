-- Migration: Role-Based Student & Group Visibility
-- Date: 2026-01-16
-- Description: Adds fields and tables to support role-based visibility for students and groups

-- ============================================
-- 1. UPDATE PROFILES TABLE
-- ============================================
-- Add grade_level field for teachers
-- Grade levels: Pre-K, K, 1, 2, 3, 4, 5, 6, 7, 8
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS grade_level TEXT;

-- Add constraint for valid grade levels (allows NULL for non-teachers)
-- Note: Using a separate check since ALTER TABLE ADD CONSTRAINT doesn't support IF NOT EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_grade_level_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_grade_level_check
    CHECK (grade_level IS NULL OR grade_level IN ('Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8'));
  END IF;
END $$;

-- Create index for grade level lookups
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);

-- ============================================
-- 2. CREATE STUDENT_ASSIGNMENTS TABLE
-- ============================================
-- Junction table for assigning students to interventionists
-- Allows a student to have MULTIPLE interventionists
CREATE TABLE IF NOT EXISTS student_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  interventionist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique combination of student and interventionist
  UNIQUE(student_id, interventionist_id)
);

-- Enable RLS
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_student_assignments_student ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_interventionist ON student_assignments(interventionist_id);
CREATE INDEX IF NOT EXISTS idx_student_assignments_assigned_by ON student_assignments(assigned_by);

-- RLS Policies for student_assignments
-- Admins can do everything
CREATE POLICY "Admins have full access to student_assignments"
  ON student_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Interventionists can view their own assignments
CREATE POLICY "Interventionists can view own assignments"
  ON student_assignments
  FOR SELECT
  TO authenticated
  USING (
    interventionist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 3. UPDATE STUDENTS TABLE
-- ============================================
-- Add grade_level field for students
ALTER TABLE students
ADD COLUMN IF NOT EXISTS grade_level TEXT;

-- Add constraint for valid grade levels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_grade_level_check'
  ) THEN
    ALTER TABLE students
    ADD CONSTRAINT students_grade_level_check
    CHECK (grade_level IS NULL OR grade_level IN ('Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8'));
  END IF;
END $$;

-- Create index for grade level lookups
CREATE INDEX IF NOT EXISTS idx_students_grade_level ON students(grade_level);

-- ============================================
-- 4. UPDATE GROUPS TABLE
-- ============================================
-- Add created_by field to track who created the group
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for created_by lookups
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);

-- ============================================
-- 5. UPDATE RLS POLICIES FOR ROLE-BASED ACCESS
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all for groups" ON groups;
DROP POLICY IF EXISTS "Allow all for students" ON students;
DROP POLICY IF EXISTS "Allow all for sessions" ON sessions;

-- GROUPS POLICIES
-- Admins can see all groups
CREATE POLICY "Admins can see all groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Interventionists can see groups they created
CREATE POLICY "Interventionists can see own groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Teachers can see groups (for viewing purposes)
CREATE POLICY "Teachers can see groups"
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

-- Admins can do all operations on groups
CREATE POLICY "Admins have full access to groups"
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

-- Interventionists can create and manage their own groups
CREATE POLICY "Interventionists can manage own groups"
  ON groups
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'interventionist'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'interventionist'
    )
  );

-- STUDENTS POLICIES
-- Admins can see all students
CREATE POLICY "Admins can see all students"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Interventionists can see students assigned to them
CREATE POLICY "Interventionists can see assigned students"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_assignments sa
      WHERE sa.student_id = students.id
      AND sa.interventionist_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Teachers can see students in their grade level
CREATE POLICY "Teachers can see students in their grade"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.grade_level = students.grade_level
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins have full access to students
CREATE POLICY "Admins have full access to students"
  ON students
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

-- SESSIONS POLICIES
-- Admins can see all sessions
CREATE POLICY "Admins can see all sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Interventionists can see sessions for their groups
CREATE POLICY "Interventionists can see sessions for own groups"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = sessions.group_id
      AND g.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins have full access to sessions
CREATE POLICY "Admins have full access to sessions"
  ON sessions
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

-- Interventionists can manage sessions for their own groups
CREATE POLICY "Interventionists can manage sessions for own groups"
  ON sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = sessions.group_id
      AND g.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'interventionist'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = sessions.group_id
      AND g.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'interventionist'
    )
  );

-- ============================================
-- 6. HELPER FUNCTION: Check intervention conflicts
-- ============================================
-- Function to check if a student is already in a group with the same intervention type
CREATE OR REPLACE FUNCTION check_intervention_conflict(
  p_student_id UUID,
  p_curriculum TEXT,
  p_exclude_group_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflict_exists BOOLEAN,
  conflicting_group_name TEXT,
  interventionist_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE AS conflict_exists,
    g.name AS conflicting_group_name,
    p.full_name AS interventionist_name
  FROM students s
  JOIN groups g ON s.group_id = g.id
  LEFT JOIN profiles p ON g.created_by = p.id
  WHERE s.id = p_student_id
    AND g.curriculum = p_curriculum
    AND (p_exclude_group_id IS NULL OR g.id != p_exclude_group_id)
  LIMIT 1;

  -- If no rows returned, return a single row with conflict_exists = FALSE
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. VIEW: Students with group status for interventionists
-- ============================================
-- This view helps interventionists see if a student is in another group
-- without revealing sensitive details about that group
CREATE OR REPLACE VIEW student_group_status AS
SELECT
  s.id AS student_id,
  s.name AS student_name,
  s.grade_level,
  s.group_id,
  g.name AS current_group_name,
  g.curriculum AS current_curriculum,
  g.created_by AS group_owner_id,
  CASE
    WHEN g.id IS NOT NULL THEN TRUE
    ELSE FALSE
  END AS is_in_group
FROM students s
LEFT JOIN groups g ON s.group_id = g.id;
