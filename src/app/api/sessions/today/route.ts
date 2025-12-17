import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/sessions/today - Get today's sessions with group info
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    const sessions = db.prepare(`
      SELECT
        s.id,
        s.group_id,
        s.time,
        s.status,
        s.curriculum_position,
        g.name as group_name,
        g.curriculum,
        g.tier
      FROM sessions s
      LEFT JOIN groups g ON s.group_id = g.id
      WHERE s.date = ?
      ORDER BY s.time ASC
    `).all(today);

    return NextResponse.json(
      sessions.map((session: any) => ({
        id: session.id,
        groupId: session.group_id,
        groupName: session.group_name,
        curriculum: session.curriculum,
        tier: session.tier,
        time: session.time,
        status: session.status,
        position: JSON.parse(session.curriculum_position),
      }))
    );
  } catch (error) {
    console.error('Error fetching today sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch today sessions' }, { status: 500 });
  }
}
