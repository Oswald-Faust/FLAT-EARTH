import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Bet from '@/models/Bet';
import Market from '@/models/Market';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const userId = (session.user as { id: string }).id;

    const [user, bets] = await Promise.all([
      User.findById(userId).select('-password').lean(),
      Bet.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('marketId', 'title category status options endsAt')
        .lean(),
    ]);

    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

    // Stats
    const totalBets   = bets.length;
    const wonBets     = bets.filter(b => b.status === 'won').length;
    const totalWon    = bets.filter(b => b.status === 'won').reduce((s, b) => s + b.potentialWin, 0);
    const totalSpent  = bets.reduce((s, b) => s + b.amount, 0);
    const activeBets  = bets.filter(b => b.status === 'pending').length;
    const biggestWin  = bets.filter(b => b.status === 'won').reduce((max, b) => Math.max(max, b.potentialWin), 0);

    // Active market count
    const activeMarketsCount = await Market.countDocuments({ createdBy: userId });

    return NextResponse.json({
      user,
      stats: {
        totalBets,
        wonBets,
        lostBets: bets.filter(b => b.status === 'lost').length,
        activeBets,
        totalWon,
        totalSpent,
        biggestWin,
        winRate: totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0,
        activeMarketsCount,
      },
      recentBets: bets.slice(0, 10),
    });
  } catch (err) {
    console.error('[GET /api/user/profile]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
