import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Market from '@/models/Market';
import User from '@/models/User';
import Bet from '@/models/Bet';

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalMarkets,
      liveMarkets,
      openMarkets,
      pendingMarkets,
      resolvedMarkets,
      totalUsers,
      totalBets,
      volumeAgg,
      recentMarkets,
      recentUsers,
      creatorUsers,
      adminUsers,
      newUsers7d,
      bets24h,
      bets7d,
      volume24hAgg,
      topMarkets,
      endingSoonMarkets,
      pendingApprovalMarkets,
      topCategories,
    ] = await Promise.all([
      Market.countDocuments(),
      Market.countDocuments({ status: 'live' }),
      Market.countDocuments({ status: 'open' }),
      Market.countDocuments({ approvalStatus: 'pending' }),
      Market.countDocuments({ status: 'resolved' }),
      User.countDocuments({ role: { $nin: ['demo'] } }),
      Bet.countDocuments(),
      Bet.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Market.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select('title category status totalVolume endsAt createdAt approvalStatus')
        .lean(),
      User.find({ role: { $nin: ['demo'] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username email coins role createdAt')
        .lean(),
      User.countDocuments({ role: 'creator' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: { $nin: ['demo'] }, createdAt: { $gte: sevenDaysAgo } }),
      Bet.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }),
      Bet.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Bet.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Market.find()
        .sort({ totalVolume: -1, createdAt: -1 })
        .limit(6)
        .select('title category status totalVolume endsAt approvalStatus')
        .lean(),
      Market.find({
        status: { $in: ['open', 'live'] },
        endsAt: { $gte: now, $lte: next72h },
      })
        .sort({ endsAt: 1, totalVolume: -1 })
        .limit(6)
        .select('title category status totalVolume endsAt approvalStatus')
        .lean(),
      Market.find({ approvalStatus: 'pending' })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title category status totalVolume endsAt approvalStatus createdAt')
        .lean(),
      Market.aggregate([
        {
          $group: {
            _id: '$category',
            marketCount: { $sum: 1 },
            liveCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'live'] }, 1, 0],
              },
            },
            totalVolume: { $sum: '$totalVolume' },
          },
        },
        { $sort: { totalVolume: -1, marketCount: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const totalVolume = volumeAgg[0]?.total ?? 0;
    const volume24h = volume24hAgg[0]?.total ?? 0;
    const activeMarkets = liveMarkets + openMarkets;
    const resolutionRate = totalMarkets > 0 ? Math.round((resolvedMarkets / totalMarkets) * 100) : 0;
    const liveShare = totalMarkets > 0 ? Math.round((liveMarkets / totalMarkets) * 100) : 0;
    const pendingApprovalVolume = pendingApprovalMarkets.reduce((sum, market) => sum + (market.totalVolume ?? 0), 0);
    const marketsEnding24h = endingSoonMarkets.filter((market) => new Date(market.endsAt) <= next24h).length;

    return NextResponse.json({
      totalMarkets,
      liveMarkets,
      openMarkets,
      pendingMarkets,
      resolvedMarkets,
      totalUsers,
      totalBets,
      totalVolume,
      creatorUsers,
      adminUsers,
      newUsers7d,
      bets24h,
      bets7d,
      volume24h,
      activeMarkets,
      resolutionRate,
      liveShare,
      marketsEnding24h,
      pendingApprovalVolume,
      recentMarkets,
      recentUsers,
      topMarkets,
      endingSoonMarkets,
      pendingApprovalMarkets,
      topCategories,
    });
  } catch (err) {
    console.error('[GET /api/admin/stats]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
