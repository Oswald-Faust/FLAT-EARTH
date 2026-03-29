import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Bet from '@/models/Bet';
import ProcessedCheckout from '@/models/ProcessedCheckout';

type AdminPaymentType = 'coin_pack' | 'wallet_deposit' | 'market_creation' | 'bet' | 'all';

interface AdminTransaction {
  _id: string;
  amountCents: number;
  type: 'coin_pack' | 'wallet_deposit' | 'market_creation' | 'bet';
  createdAt: Date;
  reference?: string;
  userId?: { _id: string; username?: string; email?: string };
  label: string;
  status?: string;
}

interface PopulatedUserRef {
  _id: string;
  username?: string;
  email?: string;
}

function isPopulatedUserRef(value: unknown): value is PopulatedUserRef {
  return !!value && typeof value === 'object' && '_id' in value;
}

function sanitizeType(value: string | null): AdminPaymentType {
  return value === 'coin_pack' || value === 'wallet_deposit' || value === 'market_creation' || value === 'bet' || value === 'all'
    ? value
    : 'all';
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await connectDB();

    const adminUser = await User.findById(session.user.id).select('role').lean();
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const type = sanitizeType(searchParams.get('type'));

    const [checkouts, bets, totalCheckoutAgg, totalBetAgg] = await Promise.all([
      type === 'bet'
        ? []
        : ProcessedCheckout.find(type === 'all' ? {} : { type })
            .sort({ createdAt: -1 })
            .limit(300)
            .populate('userId', 'username email')
            .lean(),
      type !== 'all' && type !== 'bet'
        ? []
        : Bet.find({})
            .sort({ createdAt: -1 })
            .limit(300)
            .populate('userId', 'username email')
            .lean(),
      ProcessedCheckout.aggregate([
        { $group: { _id: '$type', total: { $sum: '$amountTotal' }, count: { $sum: 1 } } },
      ]),
      Bet.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    const checkoutTransactions: AdminTransaction[] = checkouts.map((entry) => ({
      _id: String(entry._id),
      amountCents: entry.amountTotal ?? 0,
      type: entry.type,
      createdAt: entry.createdAt,
      reference: entry.sessionId,
      userId: isPopulatedUserRef(entry.userId) ? {
        _id: String(entry.userId._id),
        username: entry.userId.username,
        email: entry.userId.email,
      } : undefined,
      label:
        entry.type === 'wallet_deposit'
          ? 'Dépôt wallet'
          : entry.type === 'coin_pack'
            ? 'Achat pack coins'
            : 'Paiement création marché',
      status: 'completed',
    }));

    const betTransactions: AdminTransaction[] = bets.map((bet) => ({
      _id: String(bet._id),
      amountCents: Math.round((bet.amount ?? 0) * 100),
      type: 'bet',
      createdAt: bet.createdAt,
      reference: String(bet.marketId),
      userId: isPopulatedUserRef(bet.userId) ? {
        _id: String(bet.userId._id),
        username: bet.userId.username,
        email: bet.userId.email,
      } : undefined,
      label: 'Placement de pari',
      status: bet.status,
    }));

    const allTransactions = [...checkoutTransactions, ...betTransactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = allTransactions.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const transactions = allTransactions.slice(start, start + limit);

    const checkoutStats: Record<string, { total: number; count: number }> = Object.fromEntries(
      totalCheckoutAgg.map((entry) => [entry._id, { total: entry.total ?? 0, count: entry.count ?? 0 }]),
    );

    return NextResponse.json({
      transactions,
      total,
      pages,
      stats: {
        totalCheckoutVolumeCents: Object.values(checkoutStats).reduce((sum, entry) => sum + Number(entry.total ?? 0), 0),
        totalBetVolumeCents: Math.round(Number(totalBetAgg[0]?.total ?? 0) * 100),
        totalTransactions: total,
        counts: {
          wallet_deposit: Number(checkoutStats.wallet_deposit?.count ?? 0),
          coin_pack: Number(checkoutStats.coin_pack?.count ?? 0),
          market_creation: Number(checkoutStats.market_creation?.count ?? 0),
          bet: Number(totalBetAgg[0]?.count ?? 0),
        },
      },
    });
  } catch (error) {
    console.error('[GET /api/admin/payments]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
