import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// PUT /api/error-bank/[id] - Update an error bank entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const { id } = params;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (body.error_pattern !== undefined) {
      updates.push('error_pattern = ?');
      values.push(body.error_pattern);
    }
    if (body.underlying_gap !== undefined) {
      updates.push('underlying_gap = ?');
      values.push(body.underlying_gap);
    }
    if (body.correction_protocol !== undefined) {
      updates.push('correction_protocol = ?');
      values.push(body.correction_protocol);
    }
    if (body.correction_prompts !== undefined) {
      updates.push('correction_prompts = ?');
      values.push(body.correction_prompts ? JSON.stringify(body.correction_prompts) : null);
    }
    if (body.visual_cues !== undefined) {
      updates.push('visual_cues = ?');
      values.push(body.visual_cues);
    }
    if (body.kinesthetic_cues !== undefined) {
      updates.push('kinesthetic_cues = ?');
      values.push(body.kinesthetic_cues);
    }
    if (body.effectiveness_count !== undefined) {
      updates.push('effectiveness_count = ?');
      values.push(body.effectiveness_count);
    }
    if (body.occurrence_count !== undefined) {
      updates.push('occurrence_count = ?');
      values.push(body.occurrence_count);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);

    const stmt = db.prepare(`UPDATE error_bank SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Error bank entry not found' }, { status: 404 });
    }

    const errorEntry = db.prepare('SELECT * FROM error_bank WHERE id = ?').get(id) as any;

    return NextResponse.json({
      ...errorEntry,
      curriculum_position: errorEntry.curriculum_position ? JSON.parse(errorEntry.curriculum_position) : null,
      correction_prompts: errorEntry.correction_prompts ? JSON.parse(errorEntry.correction_prompts) : null,
      is_custom: Boolean(errorEntry.is_custom),
    });
  } catch (error) {
    console.error('Error updating error bank entry:', error);
    return NextResponse.json({ error: 'Failed to update error bank entry' }, { status: 500 });
  }
}

// DELETE /api/error-bank/[id] - Delete an error bank entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const { id } = params;

    const result = db.prepare('DELETE FROM error_bank WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Error bank entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting error bank entry:', error);
    return NextResponse.json({ error: 'Failed to delete error bank entry' }, { status: 500 });
  }
}
