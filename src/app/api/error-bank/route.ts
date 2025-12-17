import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';

// GET /api/error-bank - Get error bank entries with filters
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const curriculum = request.nextUrl.searchParams.get('curriculum');

    let query = 'SELECT * FROM error_bank WHERE 1=1';
    const params: any[] = [];

    if (curriculum) {
      query += ' AND curriculum = ?';
      params.push(curriculum);
    }

    query += ' ORDER BY occurrence_count DESC';

    const errors = db.prepare(query).all(...params);

    return NextResponse.json(
      errors.map((error: any) => ({
        ...error,
        curriculum_position: error.curriculum_position ? JSON.parse(error.curriculum_position) : null,
        correction_prompts: error.correction_prompts ? JSON.parse(error.correction_prompts) : null,
        is_custom: Boolean(error.is_custom),
      }))
    );
  } catch (error) {
    console.error('Error fetching error bank:', error);
    return NextResponse.json({ error: 'Failed to fetch error bank' }, { status: 500 });
  }
}

// POST /api/error-bank - Create a new error bank entry
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const id = generateId();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO error_bank (
        id, curriculum, curriculum_position, error_pattern, underlying_gap,
        correction_protocol, correction_prompts, visual_cues, kinesthetic_cues,
        is_custom, effectiveness_count, occurrence_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      body.curriculum,
      body.curriculum_position ? JSON.stringify(body.curriculum_position) : null,
      body.error_pattern,
      body.underlying_gap || null,
      body.correction_protocol,
      body.correction_prompts ? JSON.stringify(body.correction_prompts) : null,
      body.visual_cues || null,
      body.kinesthetic_cues || null,
      body.is_custom ? 1 : 1, // Always mark as custom when created via API
      body.effectiveness_count || 0,
      body.occurrence_count || 0,
      now
    );

    const errorEntry = db.prepare('SELECT * FROM error_bank WHERE id = ?').get(id) as any;

    return NextResponse.json({
      ...errorEntry,
      curriculum_position: errorEntry.curriculum_position ? JSON.parse(errorEntry.curriculum_position) : null,
      correction_prompts: errorEntry.correction_prompts ? JSON.parse(errorEntry.correction_prompts) : null,
      is_custom: Boolean(errorEntry.is_custom),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating error bank entry:', error);
    return NextResponse.json({ error: 'Failed to create error bank entry' }, { status: 500 });
  }
}
