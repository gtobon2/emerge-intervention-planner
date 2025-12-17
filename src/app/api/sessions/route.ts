import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';

// GET /api/sessions - Get sessions with optional filters
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const groupId = request.nextUrl.searchParams.get('groupId');
    const date = request.nextUrl.searchParams.get('date');
    const status = request.nextUrl.searchParams.get('status');

    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params: any[] = [];

    if (groupId) {
      query += ' AND group_id = ?';
      params.push(groupId);
    }
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY date DESC, time DESC';

    const sessions = db.prepare(query).all(...params);

    return NextResponse.json(
      sessions.map((session: any) => parseSessionJson(session))
    );
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const id = generateId();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO sessions (
        id, group_id, date, time, status, curriculum_position, advance_after,
        planned_otr_target, planned_response_formats, planned_practice_items,
        cumulative_review_items, anticipated_errors, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      body.group_id,
      body.date,
      body.time || null,
      body.status || 'planned',
      JSON.stringify(body.curriculum_position),
      body.advance_after ? 1 : 0,
      body.planned_otr_target || null,
      body.planned_response_formats ? JSON.stringify(body.planned_response_formats) : null,
      body.planned_practice_items ? JSON.stringify(body.planned_practice_items) : null,
      body.cumulative_review_items ? JSON.stringify(body.cumulative_review_items) : null,
      body.anticipated_errors ? JSON.stringify(body.anticipated_errors) : null,
      now,
      now
    );

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any;

    return NextResponse.json(parseSessionJson(session), { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// Helper to parse JSON fields in session
function parseSessionJson(session: any) {
  return {
    ...session,
    advance_after: Boolean(session.advance_after),
    curriculum_position: JSON.parse(session.curriculum_position),
    planned_response_formats: session.planned_response_formats ? JSON.parse(session.planned_response_formats) : null,
    planned_practice_items: session.planned_practice_items ? JSON.parse(session.planned_practice_items) : null,
    cumulative_review_items: session.cumulative_review_items ? JSON.parse(session.cumulative_review_items) : null,
    anticipated_errors: session.anticipated_errors ? JSON.parse(session.anticipated_errors) : null,
    components_completed: session.components_completed ? JSON.parse(session.components_completed) : null,
    errors_observed: session.errors_observed ? JSON.parse(session.errors_observed) : null,
    unexpected_errors: session.unexpected_errors ? JSON.parse(session.unexpected_errors) : null,
    fidelity_checklist: session.fidelity_checklist ? JSON.parse(session.fidelity_checklist) : null,
  };
}
