-- Student Goals Migration
-- Migrates student goals from IndexedDB (Dexie) to Supabase

-- ============================================
-- TABLE: student_goals
-- ============================================

CREATE TABLE IF NOT EXISTS student_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  goal_score NUMERIC NOT NULL,
  smart_goal_text TEXT NOT NULL DEFAULT '',
  goal_target_date DATE,
  benchmark_score NUMERIC,
  benchmark_date DATE,
  measure_type TEXT NOT NULL DEFAULT '',
  set_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each student can have at most one goal per group
  CONSTRAINT student_goals_student_group_unique UNIQUE (student_id, group_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_student_goals_group_id ON student_goals(group_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_student_id ON student_goals(student_id);

-- ============================================
-- AUTO-UPDATE TRIGGER for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_student_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_student_goals_updated_at
  BEFORE UPDATE ON student_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_student_goals_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE student_goals ENABLE ROW LEVEL SECURITY;

-- Admin: full access to all goals
CREATE POLICY "admin_full_access_student_goals"
  ON student_goals
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

-- Interventionist: full access to goals in their own groups
CREATE POLICY "interventionist_own_groups_student_goals"
  ON student_goals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = student_goals.group_id
      AND groups.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = student_goals.group_id
      AND groups.owner_id = auth.uid()
    )
  );

-- Teacher: read-only access to all goals
CREATE POLICY "teacher_read_student_goals"
  ON student_goals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );
