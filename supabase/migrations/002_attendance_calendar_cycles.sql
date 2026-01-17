-- EMERGE Intervention Planner - Migration 002
-- Adds: Session Attendance, School Calendar, Intervention Cycles
-- Run this in Supabase SQL Editor

-- ============================================
-- SESSION ATTENDANCE TABLE
-- Tracks individual student attendance per session
-- ============================================
CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'tardy', 'excused')),
  notes TEXT,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  marked_by UUID REFERENCES auth.users(id),

  -- Ensure one attendance record per student per session
  UNIQUE(session_id, student_id)
);

-- Indexes for session_attendance
CREATE INDEX IF NOT EXISTS idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_student_id ON session_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_status ON session_attendance(status);

-- ============================================
-- SCHOOL CALENDAR TABLE
-- Tracks non-student days (holidays, PD, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS school_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  end_date DATE, -- For date ranges (winter break, etc.)
  type TEXT NOT NULL CHECK (type IN (
    'holiday',
    'pd_day',
    'institute_day',
    'early_dismissal',
    'late_start',
    'testing_day',
    'emergency_closure',
    'break'
  )),
  title TEXT NOT NULL,
  affects_grades INTEGER[], -- null = all grades
  modified_start_time TIME, -- For late starts
  modified_end_time TIME,   -- For early dismissals
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for school_calendar
CREATE INDEX IF NOT EXISTS idx_school_calendar_date ON school_calendar(date);
CREATE INDEX IF NOT EXISTS idx_school_calendar_type ON school_calendar(type);
CREATE INDEX IF NOT EXISTS idx_school_calendar_date_range ON school_calendar(date, end_date);

-- ============================================
-- INTERVENTION CYCLES TABLE
-- Manages intervention cycle periods
-- ============================================
CREATE TABLE IF NOT EXISTS intervention_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- "Cycle 3"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  grade_band TEXT, -- "K-2", "3-5", "6-8" or null for all
  weeks_count INTEGER NOT NULL DEFAULT 6,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure dates are valid
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Indexes for intervention_cycles
CREATE INDEX IF NOT EXISTS idx_intervention_cycles_status ON intervention_cycles(status);
CREATE INDEX IF NOT EXISTS idx_intervention_cycles_dates ON intervention_cycles(start_date, end_date);

-- ============================================
-- UPDATE SESSIONS TABLE
-- Add cycle reference
-- ============================================
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES intervention_cycles(id);
CREATE INDEX IF NOT EXISTS idx_sessions_cycle_id ON sessions(cycle_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_cycles ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (modify when adding stricter auth)
CREATE POLICY "Allow all for session_attendance" ON session_attendance FOR ALL USING (true);
CREATE POLICY "Allow all for school_calendar" ON school_calendar FOR ALL USING (true);
CREATE POLICY "Allow all for intervention_cycles" ON intervention_cycles FOR ALL USING (true);

-- ============================================
-- FUNCTIONS: Check if date is a non-student day
-- ============================================
CREATE OR REPLACE FUNCTION is_non_student_day(check_date DATE, grade_level INTEGER DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM school_calendar sc
    WHERE
      -- Check if date falls within the event range
      (sc.date = check_date OR (sc.end_date IS NOT NULL AND check_date BETWEEN sc.date AND sc.end_date))
      -- Check if event affects this grade (null = all grades)
      AND (sc.affects_grades IS NULL OR grade_level = ANY(sc.affects_grades) OR grade_level IS NULL)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTIONS: Get non-student days in date range
-- ============================================
CREATE OR REPLACE FUNCTION get_non_student_days(
  from_date DATE,
  to_date DATE,
  grade_level INTEGER DEFAULT NULL
)
RETURNS TABLE (
  event_date DATE,
  event_type TEXT,
  event_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    CASE
      WHEN sc.end_date IS NOT NULL THEN
        generate_series(sc.date, LEAST(sc.end_date, to_date), '1 day'::interval)::DATE
      ELSE sc.date
    END as event_date,
    sc.type as event_type,
    sc.title as event_title
  FROM school_calendar sc
  WHERE
    (sc.date BETWEEN from_date AND to_date OR
     (sc.end_date IS NOT NULL AND sc.date <= to_date AND sc.end_date >= from_date))
    AND (sc.affects_grades IS NULL OR grade_level = ANY(sc.affects_grades) OR grade_level IS NULL)
  ORDER BY event_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Update sessions.updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to intervention_cycles
DROP TRIGGER IF EXISTS update_intervention_cycles_updated_at ON intervention_cycles;
CREATE TRIGGER update_intervention_cycles_updated_at
  BEFORE UPDATE ON intervention_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Sample Intervention Cycles
-- ============================================
INSERT INTO intervention_cycles (name, start_date, end_date, weeks_count, status, notes) VALUES
  ('Cycle 1', '2025-09-02', '2025-10-24', 8, 'completed', 'Fall cycle - completed'),
  ('Cycle 2', '2025-10-27', '2025-12-19', 8, 'completed', 'Pre-winter break cycle'),
  ('Cycle 3', '2026-01-06', '2026-02-27', 8, 'active', 'Current cycle'),
  ('Cycle 4', '2026-03-02', '2026-04-24', 8, 'planning', 'Spring cycle')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Sample School Calendar Events
-- ============================================
INSERT INTO school_calendar (date, end_date, type, title, notes) VALUES
  -- Holidays
  ('2025-11-27', '2025-11-28', 'holiday', 'Thanksgiving Break', 'Thursday and Friday'),
  ('2025-12-23', '2026-01-03', 'break', 'Winter Break', 'Two weeks'),
  ('2026-01-20', NULL, 'holiday', 'MLK Day', 'No school'),
  ('2026-02-16', '2026-02-17', 'holiday', 'Presidents Day Break', 'Monday-Tuesday'),

  -- PD Days
  ('2025-11-05', NULL, 'pd_day', 'Election Day PD', 'Professional development'),
  ('2026-01-05', NULL, 'pd_day', 'Winter PD Day', 'Staff returns before students'),
  ('2026-03-13', NULL, 'pd_day', 'End of Quarter PD', 'Grading day'),

  -- Testing
  ('2026-02-10', '2026-02-14', 'testing_day', 'NWEA MAP Testing', 'Winter MAP window'),

  -- Schedule Modifications
  ('2025-12-22', NULL, 'early_dismissal', 'Winter Break Early Dismissal', 'Dismiss at 1:00 PM')
ON CONFLICT DO NOTHING;
