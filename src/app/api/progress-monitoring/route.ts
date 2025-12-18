import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';

// GET - Fetch progress monitoring data
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('group_id');
    const studentId = searchParams.get('student_id');
    const includeStudent = searchParams.get('include') === 'student';

    let query: string;
    let params: any[];

    if (studentId) {
      query = `
        SELECT * FROM progress_monitoring
        WHERE student_id = ?
        ORDER BY date ASC
      `;
      params = [studentId];
    } else if (groupId) {
      if (includeStudent) {
        query = `
          SELECT
            pm.*,
            s.id as student_id,
            s.name as student_name,
            s.notes as student_notes
          FROM progress_monitoring pm
          LEFT JOIN students s ON pm.student_id = s.id
          WHERE pm.group_id = ?
          ORDER BY pm.date ASC
        `;
      } else {
        query = `
          SELECT * FROM progress_monitoring
          WHERE group_id = ?
          ORDER BY date ASC
        `;
      }
      params = [groupId];
    } else {
      return NextResponse.json(
        { error: 'group_id or student_id required' },
        { status: 400 }
      );
    }

    const rows = db.prepare(query).all(...params);

    // Format student data if included
    const data = includeStudent
      ? rows.map((row: any) => ({
          id: row.id,
          group_id: row.group_id,
          student_id: row.student_id,
          date: row.date,
          measure_type: row.measure_type,
          score: row.score,
          benchmark: row.benchmark,
          goal: row.goal,
          notes: row.notes,
          created_at: row.created_at,
          student: row.student_id
            ? {
                id: row.student_id,
                name: row.student_name,
                notes: row.student_notes,
              }
            : null,
        }))
      : rows;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching progress data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}

// POST - Add new data point
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const id = generateId();
    const {
      group_id,
      student_id,
      date,
      measure_type,
      score,
      benchmark,
      goal,
      notes,
    } = body;

    if (!group_id || !date || !measure_type || score === undefined) {
      return NextResponse.json(
        { error: 'group_id, date, measure_type, and score are required' },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO progress_monitoring (id, group_id, student_id, date, measure_type, score, benchmark, goal, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      group_id,
      student_id || null,
      date,
      measure_type,
      score,
      benchmark || null,
      goal || null,
      notes || null
    );

    const created = db
      .prepare('SELECT * FROM progress_monitoring WHERE id = ?')
      .get(id);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating progress data:', error);
    return NextResponse.json(
      { error: 'Failed to create progress data' },
      { status: 500 }
    );
  }
}
