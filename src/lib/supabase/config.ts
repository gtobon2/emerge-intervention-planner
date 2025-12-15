// Supabase configuration
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseConfig.url && supabaseConfig.anonKey);
};

// Mock mode flag (when Supabase is not configured)
export const isMockMode = () => {
  return !isSupabaseConfigured();
};
