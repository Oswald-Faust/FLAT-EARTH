import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { getLeaderboardData, LeaderboardRange, LeaderboardSort } from '@/lib/competition';

function sanitizeRange(value: string | null): LeaderboardRange {
  return value === 'today' || value === 'weekly' || value === 'monthly' || value === 'all'
    ? value
    : 'monthly';
}

function sanitizeSort(value: string | null): LeaderboardSort {
  return value === 'profit' || value === 'volume' || value === 'rewards' || value === 'winRate'
    ? value
    : 'profit';
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    const { searchParams } = new URL(req.url);

    const range = sanitizeRange(searchParams.get('range'));
    const sort = sanitizeSort(searchParams.get('sort'));
    const category = searchParams.get('category') ?? 'all';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10), 1), 100);

    const rows = await getLeaderboardData({ range, category, sort });
    const currentUser = userId ? rows.find((row) => row.userId === userId) ?? null : null;

    return NextResponse.json({
      range,
      sort,
      category,
      leaders: rows.slice(0, limit),
      currentUser,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/leaderboard]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
