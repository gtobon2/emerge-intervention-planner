import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/groups/[id] - Get a single group with students
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const { id } = params;

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as any;

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const students = db.prepare('SELECT * FROM students WHERE group_id = ?').all(id);

    return NextResponse.json({
      ...group,
      current_position: JSON.parse(group.current_position),
      schedule: group.schedule ? JSON.parse(group.schedule) : null,
      students,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

// PUT /api/groups/[id] - Update a group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const { id } = params;
    const body = await request.json();
    const now = new Date().toISOString();

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.curriculum !== undefined) {
      updates.push('curriculum = ?');
      values.push(body.curriculum);
    }
    if (body.tier !== undefined) {
      updates.push('tier = ?');
      values.push(body.tier);
    }
    if (body.grade !== undefined) {
      updates.push('grade = ?');
      values.push(body.grade);
    }
    if (body.current_position !== undefined) {
      updates.push('current_position = ?');
      values.push(JSON.stringify(body.current_position));
    }
    if (body.schedule !== undefined) {
      updates.push('schedule = ?');
      values.push(body.schedule ? JSON.stringify(body.schedule) : null);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`UPDATE groups SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as any;

    return NextResponse.json({
      ...group,
      current_position: JSON.parse(group.current_position),
      schedule: group.schedule ? JSON.parse(group.schedule) : null,
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE /api/groups/[id] - Delete a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const { id } = params;

    const result = db.prepare('DELETE FROM groups WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
