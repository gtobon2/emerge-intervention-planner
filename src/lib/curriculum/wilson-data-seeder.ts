/**
 * Wilson Data Seeder
 *
 * Transparently seeds IndexedDB with Wilson curriculum data on first wizard use.
 * Uses localStorage as a fast-path guard to avoid repeated IndexedDB checks.
 */

import { db } from '@/lib/local-db';
import { loadWilsonData } from './wilson-data-loader';

const SEED_FLAG_KEY = 'emerge_wilson_seeded_v1';

export async function ensureWilsonDataSeeded(): Promise<void> {
  // Fast path: localStorage flag means we already seeded
  if (typeof window !== 'undefined' && localStorage.getItem(SEED_FLAG_KEY)) {
    return;
  }

  // Check if IndexedDB already has data
  const count = await db.wilsonLessonElements.count();
  if (count > 0) {
    // Data exists (perhaps from manual import), set the flag and return
    if (typeof window !== 'undefined') {
      localStorage.setItem(SEED_FLAG_KEY, Date.now().toString());
    }
    return;
  }

  // IndexedDB is empty — seed it
  const result = await loadWilsonData();
  if (result.success && typeof window !== 'undefined') {
    localStorage.setItem(SEED_FLAG_KEY, Date.now().toString());
  }
}

export function clearWilsonSeedFlag(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SEED_FLAG_KEY);
  }
}
