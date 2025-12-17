import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';

// GET /api/student-errors - Get student errors with filters
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const studentId = request.nextUrl.searchParams.get('studentId');

    let query = `
      SELECT se.*, st.name as student_name
      FROM student_errors se
      LEFT JOIN students st ON se.student_id = st.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (sessionId) {
      query += ' AND se.session_id = ?';
      params.push(sessionId);
    }
    if (studentId) {
      query += ' AND se.student_id = ?';
      params.push(studentId);
    }

    query += ' ORDER BY se.created_at DESC';

    const errors = db.prepare(query).all(...params);

    return NextResponse.json(
      errors.map((error: any) => ({
        ...error,
        correction_worked: error.correction_worked !== null ? Boolean(error.correction_worked) : null,
      }))
    );
  } catch (error) {
    console.error('Error fetching student errors:', error);
    return NextResponse.json({ error: 'Failed to fetch student errors' }, { status: 500 });
  }
}

// POST /api/student-errors - Create a new student error
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const id = generateId();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO student_errors (id, session_id, student_id, error_pattern, correction_used, correction_worked, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      body.session_id,
      body.student_id,
      body.error_pattern,
      body.correction_used || null,
      body.correction_worked !== undefined ? (body.correction_worked ? 1 : 0) : null,
      body.notes || null,
      now
    );

    const studentError = db.prepare(`
      SELECT se.*, st.name as student_name
      FROM student_errors se
      LEFT JOIN students st ON se.student_id = st.id
      WHERE se.id = ?
    `).get(id) as any;

    return NextResponse.json({
      ...studentError,
      correction_worked: studentError.correction_worked !== null ? Boolean(studentError.correction_worked) : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating student error:', error);
    return NextResponse.json({ error: 'Failed to create student error' }, { status: 500 });
  }
}

// POST /api/student-errors/bulk - Create multiple student errors at once
export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    if (!Array.isArray(body.errors)) {
      return NextResponse.json({ error: 'errors must be an array' }, { status: 400 });
    }

    const insertStmt = db.prepare(`
      INSERT INTO student_errors (id, session_id, student_id, error_pattern, correction_used, correction_worked, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const insertMany = db.transaction((errors: any[]) => {
      const results: string[] = [];
      for (const error of errors) {
        const id = generateId();
        insertStmt.run(
          id,
          error.session_id,
          error.student_id,
          error.error_pattern,
          error.correction_used || null,
          error.correction_worked !== undefined ? (error.correction_worked ? 1 : 0) : null,
          error.notes || null,
          now
        );
        results.push(id);
      }
      return results;
    });

    const insertedIds = insertMany(body.errors);

    return NextResponse.json({ inserted: insertedIds.length, ids: insertedIds }, { status: 201 });
  } catch (error) {
    console.error('Error creating student errors:', error);
    return NextResponse.json({ error: 'Failed to create student errors' }, { status: 500 });
  }
}
