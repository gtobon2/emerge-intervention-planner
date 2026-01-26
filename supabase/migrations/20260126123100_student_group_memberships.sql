-- ============================================
-- Student Group Memberships Junction Table
-- ============================================
-- This migration adds a junction table to support students belonging to
-- multiple intervention groups simultaneously. The existing students.group_id
-- column is kept for backward compatibility but will be deprecated.
--
-- Created: 2025-01-29
-- Purpose: Fix Bug #1 from CONNECTION_BUGS_REPORT.md

-- Create the junction table
CREATE TABLE IF NOT EXISTS student_group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  enrolled_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate enrollments
  UNIQUE(student_id, group_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sgm_student_id ON student_group_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_sgm_group_id ON student_group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_sgm_status ON student_group_memberships(status);
CREATE INDEX IF NOT EXISTS idx_sgm_enrolled_at ON student_group_memberships(enrolled_at);

-- Enable RLS
ALTER TABLE student_group_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for student_group_memberships
-- ============================================

-- Admin can see all memberships
CREATE POLICY "admin_all_memberships"
  ON student_group_memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Interventionists can see memberships for groups they own
CREATE POLICY "interventionist_own_group_memberships"
  ON student_group_memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = student_group_memberships.group_id
      AND groups.owner_id = auth.uid()
    )
  );

-- Interventionists can see memberships for students assigned to them
CREATE POLICY "interventionist_assigned_student_memberships"
  ON student_group_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_assignments
      WHERE student_assignments.student_id = student_group_memberships.student_id
      AND student_assignments.interventionist_id = auth.uid()
    )
  );

-- Teachers can view memberships for students in their grade level
CREATE POLICY "teacher_grade_level_memberships"
  ON student_group_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = student_group_memberships.student_id
      AND s.grade_level = p.grade_level
      AND p.role = 'teacher'
    )
  );

-- ============================================
-- Migrate existing data from students.group_id
-- ============================================
-- This creates memberships for existing student-group relationships

INSERT INTO student_group_memberships (student_id, group_id, enrolled_at, status, notes)
SELECT 
  s.id as student_id,
  s.group_id,
  COALESCE(s.created_at, NOW()) as enrolled_at,
  'active' as status,
  'Migrated from legacy group_id column' as notes
FROM students s
WHERE s.group_id IS NOT NULL
ON CONFLICT (student_id, group_id) DO NOTHING;

-- ============================================
-- Helper function to get student groups
-- ============================================
CREATE OR REPLACE FUNCTION get_student_groups(p_student_id UUID)
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  curriculum TEXT,
  tier INTEGER,
  grade INTEGER,
  owner_id UUID,
  owner_name TEXT,
  enrollment_status TEXT,
  enrolled_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as group_id,
    g.name as group_name,
    g.curriculum::TEXT,
    g.tier,
    g.grade,
    g.owner_id,
    p.full_name as owner_name,
    sgm.status as enrollment_status,
    sgm.enrolled_at
  FROM student_group_memberships sgm
  JOIN groups g ON g.id = sgm.group_id
  LEFT JOIN profiles p ON p.id = g.owner_id
  WHERE sgm.student_id = p_student_id
  AND sgm.status = 'active'
  ORDER BY sgm.enrolled_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Helper function to get group students
-- ============================================
CREATE OR REPLACE FUNCTION get_group_students(p_group_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  grade_level TEXT,
  notes TEXT,
  enrollment_status TEXT,
  enrolled_at TIMESTAMPTZ,
  enrolled_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.name as student_name,
    s.grade_level::TEXT,
    s.notes,
    sgm.status as enrollment_status,
    sgm.enrolled_at,
    sgm.enrolled_by
  FROM student_group_memberships sgm
  JOIN students s ON s.id = sgm.student_id
  WHERE sgm.group_id = p_group_id
  AND sgm.status = 'active'
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Trigger to sync with legacy group_id column
-- ============================================
-- This keeps students.group_id in sync as a "primary" group
-- Until the column is fully deprecated

CREATE OR REPLACE FUNCTION sync_primary_group_id()
RETURNS TRIGGER AS $$
BEGIN
  -- When a membership is added/updated to active, update the student's primary group_id
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'active') THEN
    -- Only set if student doesn't have a group_id or if this is the newest active membership
    UPDATE students
    SET group_id = NEW.group_id
    WHERE id = NEW.student_id
    AND (
      group_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM student_group_memberships
        WHERE student_id = NEW.student_id
        AND status = 'active'
        AND enrolled_at > NEW.enrolled_at
      )
    );
  END IF;
  
  -- When a membership is deleted or deactivated, clear group_id if it was the primary
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status != 'active') THEN
    DECLARE
      v_student_id UUID := COALESCE(NEW.student_id, OLD.student_id);
      v_group_id UUID := COALESCE(NEW.group_id, OLD.group_id);
      v_next_group UUID;
    BEGIN
      -- If this was the primary group, find the next active one
      IF EXISTS (SELECT 1 FROM students WHERE id = v_student_id AND group_id = v_group_id) THEN
        SELECT group_id INTO v_next_group
        FROM student_group_memberships
        WHERE student_id = v_student_id
        AND status = 'active'
        AND group_id != v_group_id
        ORDER BY enrolled_at DESC
        LIMIT 1;
        
        UPDATE students
        SET group_id = v_next_group
        WHERE id = v_student_id;
      END IF;
    END;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_sync_primary_group ON student_group_memberships;
CREATE TRIGGER trg_sync_primary_group
  AFTER INSERT OR UPDATE OR DELETE ON student_group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION sync_primary_group_id();

-- ============================================
-- Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_sgm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sgm_updated_at ON student_group_memberships;
CREATE TRIGGER trg_sgm_updated_at
  BEFORE UPDATE ON student_group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_sgm_updated_at();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE student_group_memberships IS 'Junction table allowing students to belong to multiple intervention groups simultaneously. The students.group_id column is kept for backward compatibility but this table is the source of truth for group memberships.';

COMMENT ON COLUMN student_group_memberships.status IS 'Enrollment status: active (currently enrolled), inactive (paused), graduated (completed the intervention)';

COMMENT ON COLUMN student_group_memberships.enrolled_by IS 'User who enrolled the student in this group (for audit trail)';
