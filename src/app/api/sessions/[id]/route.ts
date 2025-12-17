import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/sessions/[id] - Get a single session with group info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const { id } = params;

    const session = db.prepare(`
      SELECT s.*, g.name as group_name, g.curriculum as group_curriculum, g.tier as group_tier
      FROM sessions s
      LEFT JOIN groups g ON s.group_id = g.id
      WHERE s.id = ?
    `).get(id) as any;

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get student errors for this session
    const studentErrors = db.prepare(`
      SELECT se.*, st.name as student_name
      FROM student_errors se
      LEFT JOIN students st ON se.student_id = st.id
      WHERE se.session_id = ?
    `).all(id);

    return NextResponse.json({
      ...parseSessionJson(session),
      group: {
        name: session.group_name,
        curriculum: session.group_curriculum,
        tier: session.group_tier,
      },
      student_errors: studentErrors,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PUT /api/sessions/[id] - Update a session (including completing it)
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

    // Basic fields
    if (body.date !== undefined) { updates.push('date = ?'); values.push(body.date); }
    if (body.time !== undefined) { updates.push('time = ?'); values.push(body.time); }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }
    if (body.curriculum_position !== undefined) {
      updates.push('curriculum_position = ?');
      values.push(JSON.stringify(body.curriculum_position));
    }
    if (body.advance_after !== undefined) {
      updates.push('advance_after = ?');
      values.push(body.advance_after ? 1 : 0);
    }

    // Planning fields
    if (body.planned_otr_target !== undefined) {
      updates.push('planned_otr_target = ?');
      values.push(body.planned_otr_target);
    }
    if (body.planned_response_formats !== undefined) {
      updates.push('planned_response_formats = ?');
      values.push(body.planned_response_formats ? JSON.stringify(body.planned_response_formats) : null);
    }
    if (body.planned_practice_items !== undefined) {
      updates.push('planned_practice_items = ?');
      values.push(body.planned_practice_items ? JSON.stringify(body.planned_practice_items) : null);
    }
    if (body.cumulative_review_items !== undefined) {
      updates.push('cumulative_review_items = ?');
      values.push(body.cumulative_review_items ? JSON.stringify(body.cumulative_review_items) : null);
    }
    if (body.anticipated_errors !== undefined) {
      updates.push('anticipated_errors = ?');
      values.push(body.anticipated_errors ? JSON.stringify(body.anticipated_errors) : null);
    }

    // Logging fields (session completion)
    if (body.actual_otr_count !== undefined) {
      updates.push('actual_otr_count = ?');
      values.push(body.actual_otr_count);
    }
    if (body.pacing !== undefined) { updates.push('pacing = ?'); values.push(body.pacing); }
    if (body.components_completed !== undefined) {
      updates.push('components_completed = ?');
      values.push(body.components_completed ? JSON.stringify(body.components_completed) : null);
    }
    if (body.exit_ticket_correct !== undefined) {
      updates.push('exit_ticket_correct = ?');
      values.push(body.exit_ticket_correct);
    }
    if (body.exit_ticket_total !== undefined) {
      updates.push('exit_ticket_total = ?');
      values.push(body.exit_ticket_total);
    }
    if (body.mastery_demonstrated !== undefined) {
      updates.push('mastery_demonstrated = ?');
      values.push(body.mastery_demonstrated);
    }

    // Error tracking
    if (body.errors_observed !== undefined) {
      updates.push('errors_observed = ?');
      values.push(body.errors_observed ? JSON.stringify(body.errors_observed) : null);
    }
    if (body.unexpected_errors !== undefined) {
      updates.push('unexpected_errors = ?');
      values.push(body.unexpected_errors ? JSON.stringify(body.unexpected_errors) : null);
    }

    // Tier 3 fields
    if (body.pm_score !== undefined) { updates.push('pm_score = ?'); values.push(body.pm_score); }
    if (body.pm_trend !== undefined) { updates.push('pm_trend = ?'); values.push(body.pm_trend); }
    if (body.dbi_adaptation_notes !== undefined) {
      updates.push('dbi_adaptation_notes = ?');
      values.push(body.dbi_adaptation_notes);
    }

    // General
    if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes); }
    if (body.next_session_notes !== undefined) {
      updates.push('next_session_notes = ?');
      values.push(body.next_session_notes);
    }
    if (body.fidelity_checklist !== undefined) {
      updates.push('fidelity_checklist = ?');
      values.push(body.fidelity_checklist ? JSON.stringify(body.fidelity_checklist) : null);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    if (updates.length === 2) {
      // Only updated_at and id, nothing to update
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const stmt = db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any;

    return NextResponse.json(parseSessionJson(session));
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE /api/sessions/[id] - Delete a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const { id } = params;

    const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
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
