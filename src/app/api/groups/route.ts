import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';

// GET /api/groups - Get all groups (with optional students)
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const includeStudents = request.nextUrl.searchParams.get('include') === 'students';

    const groups = db.prepare('SELECT * FROM groups ORDER BY created_at DESC').all();

    if (includeStudents) {
      const studentsStmt = db.prepare('SELECT * FROM students WHERE group_id = ?');
      return NextResponse.json(
        groups.map((group: any) => ({
          ...group,
          current_position: JSON.parse(group.current_position),
          schedule: group.schedule ? JSON.parse(group.schedule) : null,
          students: studentsStmt.all(group.id),
        }))
      );
    }

    return NextResponse.json(
      groups.map((group: any) => ({
        ...group,
        current_position: JSON.parse(group.current_position),
        schedule: group.schedule ? JSON.parse(group.schedule) : null,
      }))
    );
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const id = generateId();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO groups (id, name, curriculum, tier, grade, current_position, schedule, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      body.name,
      body.curriculum,
      body.tier,
      body.grade,
      JSON.stringify(body.current_position),
      body.schedule ? JSON.stringify(body.schedule) : null,
      now,
      now
    );

    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as any;

    return NextResponse.json({
      ...group,
      current_position: JSON.parse(group.current_position),
      schedule: group.schedule ? JSON.parse(group.schedule) : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
