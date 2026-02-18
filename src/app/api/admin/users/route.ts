import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

// Create admin client with service role key for admin operations
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Verify the caller is an authenticated admin user
async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null; // Authorized
}

// GET /api/admin/users - Fetch all users with profiles
export async function GET() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const supabase = createAdminClient();

    // Fetch all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user (admin operation)
export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const supabase = createAdminClient();
    const body = await request.json();

    const { email, full_name, role, grade_level, created_by } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, full_name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'interventionist', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, interventionist, or teacher' },
        { status: 400 }
      );
    }

    // Validate grade_level if provided
    const validGradeLevels = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8'];
    if (grade_level && !validGradeLevels.includes(grade_level)) {
      return NextResponse.json(
        { error: 'Invalid grade level' },
        { status: 400 }
      );
    }

    // Create auth user with Supabase Admin API
    // This will trigger the handle_new_user trigger to create the profile
    // Set a temporary password that the admin will share with the user
    const tempPassword = 'Welcome123!';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        role,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      const status = authError.message?.toLowerCase().includes('already') ? 409 : 400;
      return NextResponse.json(
        { error: authError.message || 'Failed to create user' },
        { status }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user - no user returned' },
        { status: 500 }
      );
    }

    // Update the profile with the correct role, grade_level, and created_by
    // (The trigger sets defaults, we need to update with actual values)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name,
        role,
        grade_level: role === 'teacher' ? grade_level || null : null,
        created_by: created_by || null,
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Profile should have been created by trigger, but update failed
      // Return success anyway since auth user exists
    }

    return NextResponse.json({
      user: profile || {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role,
        created_at: authData.user.created_at,
        created_by: created_by || null,
      },
      tempPassword,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Update user role
export async function PATCH(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const supabase = createAdminClient();
    const body = await request.json();

    const { user_id, role, full_name, grade_level } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: { role?: string; full_name?: string; grade_level?: string | null } = {};

    if (role) {
      if (!['admin', 'interventionist', 'teacher'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be admin, interventionist, or teacher' },
          { status: 400 }
        );
      }
      updates.role = role;

      // If role is changing to teacher and grade_level is provided, set it
      // If role is changing from teacher, clear grade_level
      if (role === 'teacher') {
        const validGradeLevels = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8'];
        if (grade_level && validGradeLevels.includes(grade_level)) {
          updates.grade_level = grade_level;
        }
      } else {
        updates.grade_level = null;
      }
    } else if (grade_level !== undefined) {
      // Only update grade_level if explicitly provided and role is teacher
      const validGradeLevels = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8'];
      if (grade_level === null || validGradeLevels.includes(grade_level)) {
        updates.grade_level = grade_level;
      }
    }

    if (full_name) {
      updates.full_name = full_name;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Also update user metadata in auth.users if role changed
    if (role) {
      try {
        await supabase.auth.admin.updateUserById(user_id, {
          user_metadata: { role },
        });
      } catch (metadataError) {
        console.error('Failed to update user role metadata:', metadataError);
        return NextResponse.json(
          { error: 'Profile updated but role metadata update failed' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Delete auth user (this will cascade delete the profile due to FK constraint)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      const status = error.message?.toLowerCase().includes('not found') ? 404 : 500;
      return NextResponse.json(
        { error: error.message || 'Failed to delete user' },
        { status }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
