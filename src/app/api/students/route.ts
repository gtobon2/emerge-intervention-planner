import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';

// GET /api/students - Get students with optional group filter
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const groupId = request.nextUrl.searchParams.get('groupId');

    let query = 'SELECT * FROM students';
    const params: any[] = [];

    if (groupId) {
      query += ' WHERE group_id = ?';
      params.push(groupId);
    }

    query += ' ORDER BY name ASC';

    const students = db.prepare(query).all(...params);

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const id = generateId();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO students (id, group_id, name, notes, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      body.group_id,
      body.name,
      body.notes || null,
      now
    );

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
