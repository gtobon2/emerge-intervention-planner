import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// GET /api/admin/users - Fetch all users with profiles
export async function GET() {
  try {
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
    const supabase = createAdminClient();
    const body = await request.json();

    const { email, full_name, role, created_by } = body;

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

    // Create auth user with Supabase Admin API
    // This will trigger the handle_new_user trigger to create the profile
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        role,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user - no user returned' },
        { status: 500 }
      );
    }

    // Update the profile with the correct role and created_by
    // (The trigger sets defaults, we need to update with actual values)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name,
        role,
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

    // Send password reset email so user can set their password
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (resetError) {
      console.error('Error generating password reset link:', resetError);
      // Don't fail the request, user was created successfully
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
      message: 'User created successfully. They will receive an email to set their password.',
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
    const supabase = createAdminClient();
    const body = await request.json();

    const { user_id, role, full_name } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: { role?: string; full_name?: string } = {};

    if (role) {
      if (!['admin', 'interventionist', 'teacher'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be admin, interventionist, or teacher' },
          { status: 400 }
        );
      }
      updates.role = role;
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
      await supabase.auth.admin.updateUserById(user_id, {
        user_metadata: { role },
      });
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
      return NextResponse.json(
        { error: error.message || 'Failed to delete user' },
        { status: 500 }
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
