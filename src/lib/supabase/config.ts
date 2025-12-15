/**
 * EMERGE Intervention Planner - Supabase Configuration Helper
 *
 * Centralized configuration check for Supabase to ensure consistent
 * fallback behavior across all stores.
 */

/**
 * Check if Supabase is properly configured with valid credentials.
 * Returns false if using placeholder values or missing environment variables.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if both environment variables are set and not placeholders
  return !!(
    url &&
    key &&
    !url.includes('placeholder') &&
    !key.includes('placeholder')
  );
}

/**
 * Get Supabase configuration status for debugging
 */
export function getSupabaseStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    isConfigured: isSupabaseConfigured(),
    hasUrl: !!url,
    hasKey: !!key,
    isPlaceholder: url?.includes('placeholder') || key?.includes('placeholder'),
  };
}
