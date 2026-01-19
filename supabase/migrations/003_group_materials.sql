-- EMERGE Intervention Planner - Migration 003
-- Adds: Group-Based Materials System
-- Date: 2026-01-19
-- Description: Transforms materials tracking from curriculum-based to group-based
--   with support for session-specific materials checklists

-- ============================================
-- MATERIAL CATALOG TABLE
-- Master list of materials by curriculum with lesson-range support
-- ============================================
CREATE TABLE IF NOT EXISTS material_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curriculum TEXT NOT NULL CHECK (curriculum IN ('wilson', 'delta_math', 'camino', 'wordgen', 'amira', 'despegando', 'fundations')),
  category TEXT NOT NULL CHECK (category IN (
    'cards',           -- Sound cards, word cards, flashcards
    'manipulatives',   -- Letter tiles, counters, boards
    'texts',           -- Decodable readers, fluency passages
    'workbooks',       -- Student workbooks, worksheets
    'teacher',         -- Teacher manuals, lesson plans
    'visuals',         -- Posters, charts, word walls
    'technology',      -- Apps, digital tools
    'assessment',      -- PM probes, assessments
    'other'            -- Miscellaneous
  )),
  name TEXT NOT NULL,
  description TEXT,
  quantity_hint TEXT,              -- e.g., "1 per student", "full deck", "set of 10"
  is_consumable BOOLEAN DEFAULT FALSE, -- Need to restock (worksheets, paper)

  -- Lesson/position specificity
  -- NULL = needed for all lessons, otherwise array of position keys
  -- For Wilson: ["1.1", "1.2", "1.3"] or ["step_1"] for entire step
  -- For Camino: ["1", "2", "3"] or ["phase_1"] for entire phase
  applicable_positions JSONB,      -- Array of position keys or ranges

  -- Ordering and display
  sort_order INTEGER DEFAULT 0,
  is_essential BOOLEAN DEFAULT TRUE,  -- vs. optional/supplemental

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for material_catalog
CREATE INDEX IF NOT EXISTS idx_material_catalog_curriculum ON material_catalog(curriculum);
CREATE INDEX IF NOT EXISTS idx_material_catalog_category ON material_catalog(category);
CREATE INDEX IF NOT EXISTS idx_material_catalog_curriculum_category ON material_catalog(curriculum, category);

-- ============================================
-- GROUP MATERIALS TABLE
-- Links groups to their collected base materials
-- ============================================
CREATE TABLE IF NOT EXISTS group_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES material_catalog(id) ON DELETE CASCADE,

  -- Collection status
  is_collected BOOLEAN DEFAULT FALSE,
  collected_at TIMESTAMPTZ,
  collected_by UUID REFERENCES auth.users(id),

  -- Custom notes for this group's copy of the material
  notes TEXT,
  location TEXT,  -- e.g., "Blue bin", "Cabinet 3", "Room 204"

  -- For custom materials (not in catalog)
  is_custom BOOLEAN DEFAULT FALSE,
  custom_name TEXT,        -- Only used if is_custom = true
  custom_description TEXT,
  custom_category TEXT CHECK (custom_category IS NULL OR custom_category IN (
    'cards', 'manipulatives', 'texts', 'workbooks', 'teacher', 'visuals', 'technology', 'assessment', 'other'
  )),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per group per catalog material
  UNIQUE(group_id, material_id)
);

-- Indexes for group_materials
CREATE INDEX IF NOT EXISTS idx_group_materials_group_id ON group_materials(group_id);
CREATE INDEX IF NOT EXISTS idx_group_materials_material_id ON group_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_group_materials_is_collected ON group_materials(is_collected);

-- ============================================
-- SESSION MATERIAL CHECKLISTS TABLE
-- Session-specific materials preparation tracking
-- ============================================
CREATE TABLE IF NOT EXISTS session_material_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  -- Reference to catalog material (if from catalog)
  material_id UUID REFERENCES material_catalog(id) ON DELETE CASCADE,

  -- OR custom session-specific material
  custom_material_name TEXT,
  custom_material_description TEXT,

  -- Preparation status
  is_prepared BOOLEAN DEFAULT FALSE,
  prepared_at TIMESTAMPTZ,
  prepared_by UUID REFERENCES auth.users(id),

  -- Specific details for this session
  specific_item TEXT,  -- e.g., "Reader 3.2", "Trick words cards: was, were, where"
  quantity_needed TEXT, -- e.g., "5 copies", "1 per student"
  notes TEXT,

  -- Auto-generated vs manual
  is_auto_generated BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: must have either material_id or custom name
  CONSTRAINT session_material_source CHECK (
    material_id IS NOT NULL OR custom_material_name IS NOT NULL
  )
);

-- Indexes for session_material_checklists
CREATE INDEX IF NOT EXISTS idx_session_materials_session_id ON session_material_checklists(session_id);
CREATE INDEX IF NOT EXISTS idx_session_materials_material_id ON session_material_checklists(material_id);
CREATE INDEX IF NOT EXISTS idx_session_materials_is_prepared ON session_material_checklists(is_prepared);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE material_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_material_checklists ENABLE ROW LEVEL SECURITY;

-- Material Catalog: Read-only for all authenticated users (system data)
CREATE POLICY "material_catalog_read_all"
  ON material_catalog
  FOR SELECT
  TO authenticated
  USING (true);

-- Material Catalog: Only admins can modify
CREATE POLICY "material_catalog_admin_modify"
  ON material_catalog
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

-- Group Materials: Users can manage materials for groups they own
CREATE POLICY "group_materials_owner_access"
  ON group_materials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_materials.group_id
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
      WHERE g.id = group_materials.group_id
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

-- Session Material Checklists: Users can manage for sessions in their groups
CREATE POLICY "session_materials_owner_access"
  ON session_material_checklists
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN groups g ON s.group_id = g.id
      WHERE s.id = session_material_checklists.session_id
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
      SELECT 1 FROM sessions s
      JOIN groups g ON s.group_id = g.id
      WHERE s.id = session_material_checklists.session_id
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
-- HELPER FUNCTIONS
-- ============================================

-- Function: Get materials needed for a curriculum position
CREATE OR REPLACE FUNCTION get_materials_for_position(
  p_curriculum TEXT,
  p_position JSONB
)
RETURNS TABLE (
  material_id UUID,
  category TEXT,
  name TEXT,
  description TEXT,
  quantity_hint TEXT,
  is_essential BOOLEAN,
  specific_item TEXT
) AS $$
DECLARE
  v_position_key TEXT;
BEGIN
  -- Extract position key based on curriculum type
  CASE p_curriculum
    WHEN 'wilson' THEN
      -- For Wilson, position is like {"step": 1, "substep": "1.3"}
      v_position_key := p_position->>'substep';
    WHEN 'camino', 'despegando' THEN
      -- For Camino/Despegando, position is like {"lesson": 8, "phase": 1}
      v_position_key := (p_position->>'lesson')::TEXT;
    WHEN 'delta_math' THEN
      -- For Delta Math, position is like {"standard": "5.NF.1"}
      v_position_key := p_position->>'standard';
    WHEN 'wordgen' THEN
      -- For WordGen, position is like {"unit": 3, "day": 2}
      v_position_key := (p_position->>'unit')::TEXT || '.' || (p_position->>'day')::TEXT;
    WHEN 'amira' THEN
      -- For Amira, position is like {"level": "Beginning"}
      v_position_key := p_position->>'level';
    ELSE
      v_position_key := NULL;
  END CASE;

  RETURN QUERY
  SELECT
    mc.id AS material_id,
    mc.category,
    mc.name,
    mc.description,
    mc.quantity_hint,
    mc.is_essential,
    -- Generate specific item based on position
    CASE
      WHEN mc.applicable_positions IS NOT NULL THEN
        mc.name || ' - ' || COALESCE(v_position_key, 'All')
      ELSE
        NULL
    END AS specific_item
  FROM material_catalog mc
  WHERE mc.curriculum = p_curriculum
    AND (
      -- Material applies to all positions
      mc.applicable_positions IS NULL
      -- Or position matches one of the applicable positions
      OR mc.applicable_positions ? v_position_key
      -- Or position matches a range (e.g., "step_1" for all of step 1)
      OR (p_curriculum = 'wilson' AND mc.applicable_positions ? ('step_' || (p_position->>'step')::TEXT))
      OR (p_curriculum IN ('camino', 'despegando') AND mc.applicable_positions ? ('phase_' || (p_position->>'phase')::TEXT))
    )
  ORDER BY mc.is_essential DESC, mc.sort_order, mc.category, mc.name;
END;
$$ LANGUAGE plpgsql;

-- Function: Initialize group materials from catalog
CREATE OR REPLACE FUNCTION initialize_group_materials(p_group_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_curriculum TEXT;
  v_count INTEGER;
BEGIN
  -- Get the curriculum for this group
  SELECT curriculum INTO v_curriculum
  FROM groups
  WHERE id = p_group_id;

  IF v_curriculum IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  -- Insert materials from catalog that aren't position-specific
  -- (Position-specific materials are added when sessions are created)
  INSERT INTO group_materials (group_id, material_id, is_collected)
  SELECT
    p_group_id,
    mc.id,
    FALSE
  FROM material_catalog mc
  WHERE mc.curriculum = v_curriculum
    AND mc.applicable_positions IS NULL  -- Only base materials
    AND mc.is_essential = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM group_materials gm
      WHERE gm.group_id = p_group_id AND gm.material_id = mc.id
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate session materials checklist
CREATE OR REPLACE FUNCTION generate_session_materials(p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_group_id UUID;
  v_curriculum TEXT;
  v_position JSONB;
  v_count INTEGER;
BEGIN
  -- Get session details
  SELECT s.group_id, g.curriculum, s.curriculum_position
  INTO v_group_id, v_curriculum, v_position
  FROM sessions s
  JOIN groups g ON s.group_id = g.id
  WHERE s.id = p_session_id;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Delete existing auto-generated materials for this session
  DELETE FROM session_material_checklists
  WHERE session_id = p_session_id AND is_auto_generated = TRUE;

  -- Insert materials based on curriculum position
  INSERT INTO session_material_checklists (
    session_id,
    material_id,
    specific_item,
    quantity_needed,
    is_prepared,
    is_auto_generated
  )
  SELECT
    p_session_id,
    m.material_id,
    m.specific_item,
    m.quantity_hint,
    FALSE,
    TRUE
  FROM get_materials_for_position(v_curriculum, v_position) m;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger for group_materials
CREATE TRIGGER update_group_materials_updated_at
  BEFORE UPDATE ON group_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for material_catalog
CREATE TRIGGER update_material_catalog_updated_at
  BEFORE UPDATE ON material_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- View: Group materials progress summary
CREATE OR REPLACE VIEW group_materials_summary AS
SELECT
  g.id AS group_id,
  g.name AS group_name,
  g.curriculum,
  COUNT(gm.id) AS total_materials,
  COUNT(CASE WHEN gm.is_collected THEN 1 END) AS collected_count,
  ROUND(
    (COUNT(CASE WHEN gm.is_collected THEN 1 END)::NUMERIC / NULLIF(COUNT(gm.id), 0)) * 100,
    0
  ) AS collection_percent
FROM groups g
LEFT JOIN group_materials gm ON g.id = gm.group_id
GROUP BY g.id, g.name, g.curriculum;

-- View: Weekly session materials
CREATE OR REPLACE VIEW weekly_session_materials AS
SELECT
  s.id AS session_id,
  s.date AS session_date,
  s.time AS session_time,
  g.id AS group_id,
  g.name AS group_name,
  g.curriculum,
  smc.id AS checklist_id,
  COALESCE(mc.name, smc.custom_material_name) AS material_name,
  COALESCE(mc.category, 'other') AS category,
  smc.specific_item,
  smc.quantity_needed,
  smc.is_prepared,
  smc.notes
FROM sessions s
JOIN groups g ON s.group_id = g.id
LEFT JOIN session_material_checklists smc ON s.id = smc.session_id
LEFT JOIN material_catalog mc ON smc.material_id = mc.id
WHERE s.date >= CURRENT_DATE
  AND s.date < CURRENT_DATE + INTERVAL '7 days'
  AND s.status = 'planned'
ORDER BY s.date, s.time, g.name, mc.sort_order;

-- ============================================
-- SEED DATA: Material Catalog
-- ============================================

-- Wilson Reading System Materials
INSERT INTO material_catalog (curriculum, category, name, description, sort_order, is_essential) VALUES
  ('wilson', 'cards', 'Sound Cards - Full Deck', 'Letter-sound correspondence cards for all sounds', 1, TRUE),
  ('wilson', 'cards', 'Syllable Type Cards', '6 syllable type reference cards (closed, VCe, open, r-controlled, vowel team, C+le)', 2, TRUE),
  ('wilson', 'manipulatives', 'Sound Tapping Board', 'For phoneme segmentation - students tap out sounds', 1, TRUE),
  ('wilson', 'manipulatives', 'Magnetic Letter Tiles', 'Lowercase letter tiles for word building', 2, TRUE),
  ('wilson', 'manipulatives', 'Magnetic Board', 'Board for letter tiles - word building activities', 3, TRUE),
  ('wilson', 'manipulatives', 'Dry Erase Boards', 'Individual student whiteboards', 5, TRUE),
  ('wilson', 'manipulatives', 'Dry Erase Markers', 'Fine tip markers, multiple colors', 6, TRUE),
  ('wilson', 'workbooks', 'Student Reader Notebook', 'Wilson student composition notebook', 1, TRUE),
  ('wilson', 'workbooks', 'Dictation Paper', 'Lined paper for word and sentence dictation', 2, TRUE),
  ('wilson', 'teacher', 'Wilson Instructor Manual', 'Complete instructor guide with lesson plans', 1, TRUE),
  ('wilson', 'teacher', 'Progress Monitoring Forms', 'Student progress tracking sheets', 3, TRUE);

-- Wilson Step-specific materials
INSERT INTO material_catalog (curriculum, category, name, description, applicable_positions, sort_order, is_essential) VALUES
  ('wilson', 'cards', 'Trick Word Cards - Step 1', 'Irregular high-frequency words for Step 1', '["step_1", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6"]', 10, TRUE),
  ('wilson', 'cards', 'Trick Word Cards - Step 2', 'Irregular high-frequency words for Step 2', '["step_2", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6"]', 11, TRUE),
  ('wilson', 'cards', 'Trick Word Cards - Step 3', 'Irregular high-frequency words for Step 3', '["step_3", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6"]', 12, TRUE),
  ('wilson', 'cards', 'Word Cards - Substep 1.1', 'CVC words with short a', '["1.1"]', 20, TRUE),
  ('wilson', 'cards', 'Word Cards - Substep 1.2', 'CVC words with short i', '["1.2"]', 21, TRUE),
  ('wilson', 'cards', 'Word Cards - Substep 1.3', 'CVC words with short o', '["1.3"]', 22, TRUE),
  ('wilson', 'cards', 'Word Cards - Substep 1.4', 'CVC words with short u', '["1.4"]', 23, TRUE),
  ('wilson', 'cards', 'Word Cards - Substep 1.5', 'CVC words with short e', '["1.5"]', 24, TRUE),
  ('wilson', 'texts', 'Wilson Reader Book 1', 'Decodable reader for Step 1', '["step_1", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6"]', 1, TRUE),
  ('wilson', 'texts', 'Wilson Reader Book 2', 'Decodable reader for Step 2', '["step_2", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6"]', 2, TRUE),
  ('wilson', 'texts', 'Wilson Reader Book 3', 'Decodable reader for Step 3', '["step_3", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6"]', 3, TRUE),
  ('wilson', 'manipulatives', 'Peeling Off Board', 'For syllable and morpheme work', '["step_4", "step_5", "step_6"]', 4, TRUE);

-- Camino/Despegando Materials
INSERT INTO material_catalog (curriculum, category, name, description, sort_order, is_essential) VALUES
  ('camino', 'cards', 'Tarjetas de Vocales', 'Vowel cards A, E, I, O, U with images', 1, TRUE),
  ('camino', 'cards', 'Tarjetas de Sílabas Directas', 'CV syllable cards (ma, me, mi, mo, mu, etc.)', 2, TRUE),
  ('camino', 'cards', 'Tarjetas de Palabras de Alta Frecuencia', 'High-frequency Spanish word cards', 20, TRUE),
  ('camino', 'manipulatives', 'Cajas Elkonin', 'Sound boxes for phonemic awareness', 1, TRUE),
  ('camino', 'manipulatives', 'Fichas de Colores', 'Colored counters for sound mapping', 2, TRUE),
  ('camino', 'manipulatives', 'Letras Magnéticas', 'Spanish magnetic letters including ñ, ll, ch', 3, TRUE),
  ('camino', 'manipulatives', 'Pizarras Individuales', 'Student whiteboards', 5, TRUE),
  ('camino', 'workbooks', 'Cuaderno del Estudiante', 'EMERGE student workbook', 1, TRUE),
  ('camino', 'workbooks', 'Hojas de Trazado', 'Letter formation practice sheets', 2, TRUE),
  ('camino', 'visuals', 'Cartel de Vocales', 'Large vowel poster', 1, TRUE),
  ('camino', 'visuals', 'Cartel de Sílabas', 'Syllable reference chart', 2, TRUE);

-- Camino Phase-specific materials
INSERT INTO material_catalog (curriculum, category, name, description, applicable_positions, sort_order, is_essential) VALUES
  ('camino', 'cards', 'Tarjetas de Consonantes - Fase 1', 'Consonant cards for m, p, l, s, t, d', '["phase_1", "1", "2", "3", "4", "5", "6", "7", "8"]', 10, TRUE),
  ('camino', 'cards', 'Tarjetas de Consonantes - Fase 2', 'Consonant cards for n, r, c, b, g, f, v, z, j, ñ', '["phase_2", "9", "10", "11", "12", "13", "14", "15", "16"]', 11, TRUE),
  ('camino', 'cards', 'Tarjetas de Dígrafos - Fase 3', 'Digraph cards for ch, ll, rr, qu, h', '["phase_3", "17", "18", "19", "20", "21", "22", "23", "24"]', 12, TRUE),
  ('camino', 'texts', 'Lecturas Decodificables - Fase 1', 'Decodable readers for vowels + m, p, l, s, t, d', '["phase_1", "1", "2", "3", "4", "5", "6", "7", "8"]', 1, TRUE),
  ('camino', 'texts', 'Lecturas Decodificables - Fase 2', 'Decodable readers for n, r, c, b, g, f, v, z, j, ñ', '["phase_2", "9", "10", "11", "12", "13", "14", "15", "16"]', 2, TRUE),
  ('camino', 'texts', 'Lecturas Decodificables - Fase 3', 'Decodable readers for ch, ll, rr, qu, h + blends', '["phase_3", "17", "18", "19", "20", "21", "22", "23", "24"]', 3, TRUE),
  ('camino', 'texts', 'Lecturas Decodificables - Fase 4', 'Decodable readers for complex syllables', '["phase_4", "25", "26", "27", "28", "29", "30", "31", "32"]', 4, TRUE),
  ('camino', 'texts', 'Lecturas Decodificables - Fase 5', 'Decodable readers for multisyllabic words', '["phase_5", "33", "34", "35", "36", "37", "38", "39", "40"]', 5, TRUE);

-- Delta Math Materials
INSERT INTO material_catalog (curriculum, category, name, description, sort_order, is_essential) VALUES
  ('delta_math', 'manipulatives', 'Base-10 Blocks', 'Units, rods, flats, and cubes for place value', 1, TRUE),
  ('delta_math', 'manipulatives', 'Two-Color Counters', 'Red/yellow counters for modeling operations', 2, TRUE),
  ('delta_math', 'manipulatives', 'Number Lines', 'Student number lines (0-20, 0-100, open)', 3, TRUE),
  ('delta_math', 'manipulatives', 'Dry Erase Boards with Grid', 'Whiteboards with coordinate grid', 8, TRUE),
  ('delta_math', 'workbooks', 'Math Intervention Workbook', 'Student workbook with intervention activities', 1, TRUE),
  ('delta_math', 'workbooks', 'Graph Paper', 'Centimeter graph paper for arrays', 2, TRUE),
  ('delta_math', 'assessment', 'Math Fact Fluency Probes', 'Timed fact fluency assessments', 1, TRUE),
  ('delta_math', 'teacher', 'Delta Math Teacher Guide', 'Intervention lesson plans by standard', 1, TRUE);

-- Delta Math Standard-specific materials
INSERT INTO material_catalog (curriculum, category, name, description, applicable_positions, sort_order, is_essential) VALUES
  ('delta_math', 'manipulatives', 'Fraction Tiles', 'Color-coded fraction pieces', '["3.NF.1", "3.NF.2", "3.NF.3", "4.NF.1", "4.NF.2", "5.NF.1", "5.NF.2"]', 4, TRUE),
  ('delta_math', 'manipulatives', 'Multiplication Arrays Cards', 'Visual array cards for multiplication', '["3.OA.1", "3.OA.3", "3.OA.5", "3.OA.7"]', 6, TRUE),
  ('delta_math', 'manipulatives', 'Decimal Place Value Disks', 'Disks for ones, tenths, hundredths', '["4.NF.6", "4.NF.7", "5.NBT.1", "5.NBT.3", "5.NBT.7"]', 7, TRUE);

-- WordGen Materials
INSERT INTO material_catalog (curriculum, category, name, description, sort_order, is_essential) VALUES
  ('wordgen', 'cards', 'Vocabulary Word Cards', 'Target vocabulary words with definitions', 1, TRUE),
  ('wordgen', 'workbooks', 'WordGen Student Workbook', 'Student workbook with vocabulary activities', 1, TRUE),
  ('wordgen', 'texts', 'WordGen Passage Collection', 'Reading passages organized by unit', 1, TRUE),
  ('wordgen', 'assessment', 'Weekly Vocabulary Assessments', 'End-of-unit vocabulary quizzes', 1, TRUE),
  ('wordgen', 'teacher', 'WordGen Teacher Manual', 'Complete teacher guide with 5-day lesson plans', 1, TRUE);

-- Amira Materials
INSERT INTO material_catalog (curriculum, category, name, description, sort_order, is_essential) VALUES
  ('amira', 'technology', 'Amira App Access', 'Student login credentials for Amira platform', 1, TRUE),
  ('amira', 'technology', 'Headphones with Microphone', 'For Amira reading sessions', 2, TRUE),
  ('amira', 'technology', 'Tablets or Chromebooks', 'Devices for accessing Amira', 3, TRUE);

-- Amira Level-specific materials
INSERT INTO material_catalog (curriculum, category, name, description, applicable_positions, sort_order, is_essential) VALUES
  ('amira', 'texts', 'Decodable Readers - Emergent', 'Print decodables for emergent readers', '["Emergent"]', 1, FALSE),
  ('amira', 'texts', 'Decodable Readers - Beginning', 'Print decodables for beginning readers', '["Beginning"]', 2, FALSE),
  ('amira', 'texts', 'Leveled Readers - Transitional', 'Print readers for transitional level', '["Transitional"]', 3, FALSE),
  ('amira', 'texts', 'Leveled Readers - Fluent', 'Print readers for fluent level', '["Fluent"]', 4, FALSE);

-- Despegando Materials (similar to Camino)
INSERT INTO material_catalog (curriculum, category, name, description, sort_order, is_essential) VALUES
  ('despegando', 'cards', 'Tarjetas de Vocales', 'Vowel cards A, E, I, O, U with images', 1, TRUE),
  ('despegando', 'cards', 'Tarjetas de Sílabas', 'Syllable cards for CV combinations', 2, TRUE),
  ('despegando', 'manipulatives', 'Cajas Elkonin', 'Sound boxes for phonemic awareness', 1, TRUE),
  ('despegando', 'manipulatives', 'Fichas de Colores', 'Colored counters for sound mapping', 2, TRUE),
  ('despegando', 'manipulatives', 'Letras Magnéticas', 'Spanish magnetic letters including ñ', 3, TRUE),
  ('despegando', 'texts', 'Lecturas Decodificables Despegando', 'Decodable readers aligned to Despegando', 1, TRUE),
  ('despegando', 'workbooks', 'Cuaderno Despegando', 'Student workbook for Despegando curriculum', 1, TRUE);
