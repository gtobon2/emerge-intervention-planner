-- EMERGE Intervention Planner Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- GROUPS TABLE
-- ============================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  curriculum TEXT NOT NULL CHECK (curriculum IN ('wilson', 'delta_math', 'camino', 'wordgen', 'amira')),
  tier INTEGER NOT NULL CHECK (tier IN (2, 3)),
  grade INTEGER NOT NULL,
  current_position JSONB NOT NULL DEFAULT '{}',
  schedule JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STUDENTS TABLE
-- ============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  
  -- Curriculum position at time of session
  curriculum_position JSONB NOT NULL DEFAULT '{}',
  advance_after BOOLEAN DEFAULT FALSE,
  
  -- Planning fields (filled BEFORE session)
  planned_otr_target INTEGER,
  planned_response_formats TEXT[],
  planned_practice_items JSONB,
  cumulative_review_items JSONB,
  anticipated_errors JSONB,
  
  -- Logging fields (filled AFTER session)
  actual_otr_estimate INTEGER,
  pacing TEXT CHECK (pacing IN ('too_slow', 'just_right', 'too_fast')),
  components_completed TEXT[],
  exit_ticket_correct INTEGER,
  exit_ticket_total INTEGER,
  mastery_demonstrated TEXT CHECK (mastery_demonstrated IN ('yes', 'no', 'partial')),
  
  -- Error tracking
  errors_observed JSONB,
  unexpected_errors JSONB,
  
  -- Tier 3 specific
  pm_score NUMERIC,
  pm_trend TEXT CHECK (pm_trend IN ('improving', 'flat', 'declining')),
  dbi_adaptation_notes TEXT,
  
  -- General
  notes TEXT,
  next_session_notes TEXT,
  
  -- Fidelity self-check
  fidelity_checklist JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROGRESS MONITORING TABLE
-- ============================================
CREATE TABLE progress_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  measure_type TEXT NOT NULL,
  score NUMERIC NOT NULL,
  benchmark NUMERIC,
  goal NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ERROR BANK TABLE
-- ============================================
CREATE TABLE error_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum TEXT NOT NULL,
  curriculum_position JSONB,
  error_pattern TEXT NOT NULL,
  underlying_gap TEXT,
  correction_protocol TEXT NOT NULL,
  correction_prompts TEXT[],
  visual_cues TEXT,
  kinesthetic_cues TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  effectiveness_count INTEGER DEFAULT 0,
  occurrence_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CURRICULUM SEQUENCES TABLE
-- ============================================
CREATE TABLE curriculum_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum TEXT NOT NULL,
  position_key TEXT NOT NULL,
  position_label TEXT NOT NULL,
  description TEXT,
  skills TEXT[],
  sample_words JSONB,
  prerequisite_positions TEXT[],
  next_positions TEXT[],
  lesson_components JSONB,
  suggested_activities JSONB,
  materials_needed TEXT[],
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI LOGS TABLE (for debugging/improvement)
-- ============================================
CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature TEXT NOT NULL,
  input_text TEXT,
  output_text TEXT,
  model TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_sessions_group_id ON sessions(group_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_progress_monitoring_group_id ON progress_monitoring(group_id);
CREATE INDEX idx_progress_monitoring_date ON progress_monitoring(date);
CREATE INDEX idx_error_bank_curriculum ON error_bank(curriculum);
CREATE INDEX idx_curriculum_sequences_curriculum ON curriculum_sequences(curriculum);

-- ============================================
-- ROW LEVEL SECURITY (Basic - expand as needed)
-- ============================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_sequences ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (single user app)
-- Modify these policies when adding authentication
CREATE POLICY "Allow all for groups" ON groups FOR ALL USING (true);
CREATE POLICY "Allow all for students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all for sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all for progress_monitoring" ON progress_monitoring FOR ALL USING (true);
CREATE POLICY "Allow all for error_bank" ON error_bank FOR ALL USING (true);
CREATE POLICY "Allow all for curriculum_sequences" ON curriculum_sequences FOR ALL USING (true);

-- ============================================
-- SEED DATA: Initial Groups (Geraldo's 10 groups)
-- ============================================
INSERT INTO groups (name, curriculum, tier, grade, current_position) VALUES
  ('Wilson Group A', 'wilson', 3, 3, '{"step": 1, "substep": "1.3"}'),
  ('Wilson Group B', 'wilson', 2, 4, '{"step": 2, "substep": "2.1"}'),
  ('Wilson Group C', 'wilson', 2, 5, '{"step": 3, "substep": "3.2"}'),
  ('Wilson Group D', 'wilson', 3, 2, '{"step": 1, "substep": "1.1"}'),
  ('Delta Math 5A', 'delta_math', 2, 5, '{"standard": "5.NF.1"}'),
  ('Delta Math 5B', 'delta_math', 3, 5, '{"standard": "5.NBT.3"}'),
  ('Camino Group 1', 'camino', 2, 2, '{"lesson": 8}'),
  ('Camino Group 2', 'camino', 3, 3, '{"lesson": 15}'),
  ('Amira Readers', 'amira', 2, 2, '{"level": "Beginning"}'),
  ('WordGen Vocab', 'wordgen', 2, 5, '{"unit": 3, "day": 2}');
