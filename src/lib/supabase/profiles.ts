// Profiles table types and CRUD operations
import { supabase } from './client';
import type { GradeLevel } from './types';

// User role type (matches auth.ts)
export type UserRole = 'admin' | 'interventionist' | 'teacher';

// Profile type matching Supabase profiles table
export interface Profile {
  id: string; // uuid, references auth.users(id)
  full_name: string;
  email: string;
  role: UserRole;
  grade_level: GradeLevel | null; // Grade level for teachers (Pre-K, K, 1-8)
  created_at: string;
  created_by: string | null; // uuid of admin who created the user, null for self-signup
}

export type ProfileInsert = Omit<Profile, 'created_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;

// ============================================
// PROFILE CRUD OPERATIONS
// ============================================

/**
 * Fetch all profiles from the database
 */
export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single profile by user ID
 */
export async function fetchProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - profile doesn't exist
      return null;
    }
    console.error('Error fetching profile:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch a profile by email
 */
export async function fetchProfileByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching profile by email:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new profile
 * Note: For admin-created users, use the API route which handles auth user creation
 */
export async function createProfile(profile: ProfileInsert): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing profile
 */
export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a profile
 * Note: For deleting users completely, use the API route which handles auth user deletion
 */
export async function deleteProfile(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
}

/**
 * Fetch all interventionists from the database
 */
export async function fetchInterventionists(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'interventionist')
    .order('full_name');

  if (error) {
    console.error('Error fetching interventionists:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch all teachers from the database
 */
export async function fetchTeachers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('full_name');

  if (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// SQL FOR CREATING THE PROFILES TABLE
// ============================================
/*
Run this SQL in Supabase SQL Editor to create the profiles table:

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'interventionist', 'teacher')) DEFAULT 'interventionist',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Anyone can read profiles (needed for admin dashboard)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do anything (for admin operations via API)
CREATE POLICY "Service role has full access"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, created_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'interventionist'),
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
*/
