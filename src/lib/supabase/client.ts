import { createClient } from '@supabase/supabase-js';
import type {
  Group,
  Student,
  Session,
  ProgressMonitoring,
  ErrorBankEntry,
  CurriculumSequence,
  GroupInsert,
  GroupUpdate,
  StudentInsert,
  StudentUpdate,
  SessionInsert,
  SessionUpdate,
  ProgressMonitoringInsert,
  ErrorBankInsert,
  ErrorBankUpdate
} from './types';

// Type definition for the database
export interface Database {
  public: {
    Tables: {
      groups: {
        Row: Group;
        Insert: GroupInsert;
        Update: GroupUpdate;
      };
      students: {
        Row: Student;
        Insert: StudentInsert;
        Update: StudentUpdate;
      };
      sessions: {
        Row: Session;
        Insert: SessionInsert;
        Update: SessionUpdate;
      };
      progress_monitoring: {
        Row: ProgressMonitoring;
        Insert: ProgressMonitoringInsert;
        Update: Partial<ProgressMonitoringInsert>;
      };
      error_bank: {
        Row: ErrorBankEntry;
        Insert: ErrorBankInsert;
        Update: ErrorBankUpdate;
      };
      curriculum_sequences: {
        Row: CurriculumSequence;
        Insert: Omit<CurriculumSequence, 'id' | 'created_at'>;
        Update: Partial<Omit<CurriculumSequence, 'id' | 'created_at'>>;
      };
    };
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using placeholder values for development.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Export a typed client for server-side operations
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn('Supabase service role key not configured.');
    return supabase;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
