import Database from 'better-sqlite3';
import path from 'path';

// Database file location - stored in the project root
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'emerge.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeTables(db);
  }
  return db;
}

function initializeTables(database: Database.Database) {
  database.exec(`
    -- Groups table
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      curriculum TEXT NOT NULL,
      tier INTEGER NOT NULL,
      grade INTEGER NOT NULL,
      current_position TEXT NOT NULL,
      schedule TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Students table
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      status TEXT DEFAULT 'planned',
      curriculum_position TEXT NOT NULL,
      advance_after INTEGER DEFAULT 0,

      -- Planning fields
      planned_otr_target INTEGER,
      planned_response_formats TEXT,
      planned_practice_items TEXT,
      cumulative_review_items TEXT,
      anticipated_errors TEXT,

      -- Logging fields
      actual_otr_count INTEGER,
      pacing TEXT,
      components_completed TEXT,
      exit_ticket_correct INTEGER,
      exit_ticket_total INTEGER,
      mastery_demonstrated TEXT,

      -- Error tracking
      errors_observed TEXT,
      unexpected_errors TEXT,

      -- Tier 3 specific
      pm_score REAL,
      pm_trend TEXT,
      dbi_adaptation_notes TEXT,

      -- General
      notes TEXT,
      next_session_notes TEXT,
      fidelity_checklist TEXT,

      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    -- Student errors (per-student error tracking within sessions)
    CREATE TABLE IF NOT EXISTS student_errors (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      error_pattern TEXT NOT NULL,
      correction_used TEXT,
      correction_worked INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    -- Progress monitoring
    CREATE TABLE IF NOT EXISTS progress_monitoring (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      student_id TEXT,
      date TEXT NOT NULL,
      measure_type TEXT NOT NULL,
      score REAL NOT NULL,
      benchmark REAL,
      goal REAL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
    );

    -- Error bank
    CREATE TABLE IF NOT EXISTS error_bank (
      id TEXT PRIMARY KEY,
      curriculum TEXT NOT NULL,
      curriculum_position TEXT,
      error_pattern TEXT NOT NULL,
      underlying_gap TEXT,
      correction_protocol TEXT NOT NULL,
      correction_prompts TEXT,
      visual_cues TEXT,
      kinesthetic_cues TEXT,
      is_custom INTEGER DEFAULT 0,
      effectiveness_count INTEGER DEFAULT 0,
      occurrence_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Curriculum sequences
    CREATE TABLE IF NOT EXISTS curriculum_sequences (
      id TEXT PRIMARY KEY,
      curriculum TEXT NOT NULL,
      position_key TEXT NOT NULL,
      position_label TEXT NOT NULL,
      description TEXT,
      skills TEXT,
      sample_words TEXT,
      prerequisite_positions TEXT,
      next_positions TEXT,
      lesson_components TEXT,
      suggested_activities TEXT,
      materials_needed TEXT,
      sort_order INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(curriculum, position_key)
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_group ON sessions(group_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
    CREATE INDEX IF NOT EXISTS idx_student_errors_session ON student_errors(session_id);
    CREATE INDEX IF NOT EXISTS idx_student_errors_student ON student_errors(student_id);
    CREATE INDEX IF NOT EXISTS idx_progress_group ON progress_monitoring(group_id);
    CREATE INDEX IF NOT EXISTS idx_progress_student ON progress_monitoring(student_id);
    CREATE INDEX IF NOT EXISTS idx_error_bank_curriculum ON error_bank(curriculum);
  `);
}

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

// Close database connection (for cleanup)
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
