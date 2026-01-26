-- Schedule Constraints Table
-- Supports multi-grade constraints with role-based visibility (schoolwide vs personal)

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

-- ============================================
-- RLS Policies
-- ============================================

-- SELECT: See schoolwide + own personal
-- (Admins use service role client to see all)
CREATE POLICY "Users can view schoolwide and own constraints"
  ON public.schedule_constraints
  FOR SELECT
  TO authenticated
  USING (
    scope = 'schoolwide'
    OR created_by = auth.uid()
  );

-- INSERT: Anyone can create (app layer verifies admin for schoolwide)
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

-- ============================================
-- Updated_at Trigger
-- ============================================

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
