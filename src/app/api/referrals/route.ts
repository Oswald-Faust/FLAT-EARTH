import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import ReferralReward from '@/models/ReferralReward';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

function hasUsername(value: unknown): value is { username?: string } {
  return !!value && typeof value === 'object' && 'username' in value;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const [user, referrals, rewardEvents] = await Promise.all([
      User.findById(userId).select('username referralCode coins').lean(),
      User.find({ referredBy: userId })
        .sort({ createdAt: -1 })
        .select('username email createdAt referralActivatedAt coins')
        .lean(),
      ReferralReward.find({ referrerId: userId, kind: 'referrer_bonus' })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('refereeId', 'username')
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const signups = referrals.length;
    const activeReferrals = referrals.filter((entry) => !!entry.referralActivatedAt).length;
    const earningsCoins = rewardEvents.reduce((sum, event) => sum + (event.rewardCoins ?? 0), 0);

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const series = last7Days.map((date) => {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const total = rewardEvents
        .filter((event) => {
          const createdAt = new Date(event.createdAt);
          return createdAt >= date && createdAt < next;
        })
        .reduce((sum, event) => sum + (event.rewardCoins ?? 0), 0);

      return {
        date: date.toISOString(),
        total,
      };
    });

    return NextResponse.json({
      profile: {
        username: user.username,
        coins: user.coins,
        referralCode: user.referralCode,
        referralLink: `${BASE_URL}/auth/register?ref=${user.referralCode}`,
      },
      stats: {
        signups,
        activeReferrals,
        earningsCoins,
      },
      series,
      referrals: referrals.map((entry) => ({
        id: String(entry._id),
        username: entry.username,
        email: entry.email,
        createdAt: entry.createdAt,
        active: !!entry.referralActivatedAt,
        coins: entry.coins ?? 0,
      })),
      payouts: rewardEvents.map((event) => ({
        id: String(event._id),
        refereeUsername: hasUsername(event.refereeId) ? event.refereeId.username : 'Utilisateur',
        rewardCoins: event.rewardCoins,
        sourceType: event.sourceType,
        sourceAmountCents: event.sourceAmountCents,
        createdAt: event.createdAt,
      })),
    });
  } catch (err) {
    console.error('[GET /api/referrals]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
