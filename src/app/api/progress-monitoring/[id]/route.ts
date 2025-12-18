import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET - Fetch single data point
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const dataPoint = db
      .prepare('SELECT * FROM progress_monitoring WHERE id = ?')
      .get(id);

    if (!dataPoint) {
      return NextResponse.json(
        { error: 'Data point not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(dataPoint);
  } catch (error) {
    console.error('Error fetching progress data point:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress data point' },
      { status: 500 }
    );
  }
}

// PUT - Update data point
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    const existing = db
      .prepare('SELECT * FROM progress_monitoring WHERE id = ?')
      .get(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Data point not found' },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (body.date !== undefined) {
      updates.push('date = ?');
      values.push(body.date);
    }
    if (body.measure_type !== undefined) {
      updates.push('measure_type = ?');
      values.push(body.measure_type);
    }
    if (body.score !== undefined) {
      updates.push('score = ?');
      values.push(body.score);
    }
    if (body.benchmark !== undefined) {
      updates.push('benchmark = ?');
      values.push(body.benchmark);
    }
    if (body.goal !== undefined) {
      updates.push('goal = ?');
      values.push(body.goal);
    }
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      values.push(body.notes);
    }
    if (body.student_id !== undefined) {
      updates.push('student_id = ?');
      values.push(body.student_id);
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(
        `UPDATE progress_monitoring SET ${updates.join(', ')} WHERE id = ?`
      ).run(...values);
    }

    const updated = db
      .prepare('SELECT * FROM progress_monitoring WHERE id = ?')
      .get(id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating progress data point:', error);
    return NextResponse.json(
      { error: 'Failed to update progress data point' },
      { status: 500 }
    );
  }
}

// DELETE - Remove data point
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();
    const { id } = await params;

    const existing = db
      .prepare('SELECT * FROM progress_monitoring WHERE id = ?')
      .get(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Data point not found' },
        { status: 404 }
      );
    }

    db.prepare('DELETE FROM progress_monitoring WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting progress data point:', error);
    return NextResponse.json(
      { error: 'Failed to delete progress data point' },
      { status: 500 }
    );
  }
}
