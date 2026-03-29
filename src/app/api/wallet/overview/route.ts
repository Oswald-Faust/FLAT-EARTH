import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Bet from '@/models/Bet';
import ProcessedCheckout from '@/models/ProcessedCheckout';

function hasMarketTitle(value: unknown): value is { title?: string } {
  return !!value && typeof value === 'object' && 'title' in value;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const [user, bets, deposits] = await Promise.all([
      User.findById(userId).select('balance username').lean(),
      Bet.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('marketId', 'title status')
        .lean(),
      ProcessedCheckout.find({ userId, type: 'wallet_deposit' })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const totalDepositedCents = deposits.reduce((sum, entry) => sum + (entry.amountTotal ?? 0), 0);
    const activeExposureCents = bets
      .filter((bet) => bet.status === 'pending')
      .reduce((sum, bet) => sum + Math.round((bet.amount ?? 0) * 100), 0);
    const settledProfitCents = bets.reduce((sum, bet) => {
      if (bet.status === 'won') {
        return sum + Math.round(((bet.potentialWin ?? 0) - (bet.amount ?? 0)) * 100);
      }
      if (bet.status === 'lost') {
        return sum - Math.round((bet.amount ?? 0) * 100);
      }
      return sum;
    }, 0);

    const transactions = [
      ...deposits.map((entry) => ({
        id: `deposit_${String(entry._id)}`,
        type: 'deposit' as const,
        title: 'Dépôt wallet',
        subtitle: 'Carte / Stripe',
        amountCents: entry.amountTotal ?? 0,
        status: 'completed',
        createdAt: entry.createdAt,
      })),
      ...bets.map((bet) => ({
        id: `bet_${String(bet._id)}`,
        type: 'bet' as const,
        title: hasMarketTitle(bet.marketId) ? bet.marketId.title : 'Pari',
        subtitle: bet.status === 'pending' ? 'Position ouverte' : bet.status === 'won' ? 'Pari gagné' : bet.status === 'lost' ? 'Pari perdu' : 'Pari',
        amountCents: Math.round((bet.amount ?? 0) * 100) * -1,
        status: bet.status,
        createdAt: bet.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);

    const activePositions = bets
      .filter((bet) => bet.status === 'pending')
      .slice(0, 8)
      .map((bet) => ({
        id: String(bet._id),
        marketTitle: hasMarketTitle(bet.marketId) ? bet.marketId.title : 'Marché',
        amount: bet.amount,
        potentialWin: bet.potentialWin,
        createdAt: bet.createdAt,
      }));

    return NextResponse.json({
      wallet: {
        username: user.username,
        balanceCents: (user as { balance?: number }).balance ?? 0,
        totalDepositedCents,
        activeExposureCents,
        settledProfitCents,
      },
      activePositions,
      transactions,
    });
  } catch (err) {
    console.error('[GET /api/wallet/overview]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
