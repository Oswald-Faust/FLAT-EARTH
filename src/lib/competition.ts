import mongoose from 'mongoose';
import Bet from '@/models/Bet';
import Market from '@/models/Market';
import User from '@/models/User';

export type LeaderboardRange = 'today' | 'weekly' | 'monthly' | 'all';
export type LeaderboardSort = 'profit' | 'volume' | 'rewards' | 'winRate';

export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  role: string;
  volume: number;
  profit: number;
  rewards: number;
  winRate: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
}

interface RawLeaderboardRow {
  userId: mongoose.Types.ObjectId;
  username: string;
  avatar?: string;
  role: string;
  volume: number;
  profit: number;
  rewards: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
}

function getRangeStart(range: LeaderboardRange): Date | null {
  const now = new Date();

  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (range === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return null;
}

function getSortValue(row: RawLeaderboardRow, sort: LeaderboardSort): number {
  if (sort === 'volume') return row.volume;
  if (sort === 'rewards') return row.rewards;
  if (sort === 'winRate') return row.winRate;
  return row.profit;
}

function compareRows(a: RawLeaderboardRow, b: RawLeaderboardRow, sort: LeaderboardSort): number {
  const primary = getSortValue(b, sort) - getSortValue(a, sort);
  if (primary !== 0) return primary;

  const profitDiff = b.profit - a.profit;
  if (profitDiff !== 0) return profitDiff;

  const volumeDiff = b.volume - a.volume;
  if (volumeDiff !== 0) return volumeDiff;

  return a.username.localeCompare(b.username, 'fr');
}

function normalizeRows(rows: RawLeaderboardRow[], sort: LeaderboardSort): LeaderboardRow[] {
  return rows
    .map((row) => ({
      ...row,
      userId: row.userId.toString(),
      volume: Number(row.volume ?? 0),
      profit: Number(row.profit ?? 0),
      rewards: Math.round(Number(row.rewards ?? 0)),
      totalBets: Number(row.totalBets ?? 0),
      wonBets: Number(row.wonBets ?? 0),
      lostBets: Number(row.lostBets ?? 0),
      pendingBets: Number(row.pendingBets ?? 0),
      winRate: Number(row.wonBets ?? 0) + Number(row.lostBets ?? 0) > 0
        ? Math.round((Number(row.wonBets ?? 0) / (Number(row.wonBets ?? 0) + Number(row.lostBets ?? 0))) * 100)
        : 0,
    }))
    .sort((a, b) => compareRows(a, b, sort))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function getLeaderboardData({
  range = 'monthly',
  category,
  sort = 'profit',
}: {
  range?: LeaderboardRange;
  category?: string;
  sort?: LeaderboardSort;
}) {
  const rangeStart = getRangeStart(range);
  const match: Record<string, unknown> = {};

  if (rangeStart) {
    match.createdAt = { $gte: rangeStart };
  }

  const pipeline: Record<string, unknown>[] = [
    { $match: match },
    {
      $lookup: {
        from: 'markets',
        localField: 'marketId',
        foreignField: '_id',
        as: 'market',
      },
    },
    { $unwind: '$market' },
  ];

  if (category && category !== 'all') {
    pipeline.push({ $match: { 'market.category': category } });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $match: { 'user.role': { $ne: 'demo' } } },
    {
      $group: {
        _id: '$userId',
        username: { $first: '$user.username' },
        avatar: { $first: '$user.avatar' },
        role: { $first: '$user.role' },
        volume: { $sum: '$amount' },
        profit: {
          $sum: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$status', 'won'] },
                  then: { $subtract: ['$potentialWin', '$amount'] },
                },
                {
                  case: { $eq: ['$status', 'lost'] },
                  then: { $multiply: ['$amount', -1] },
                },
              ],
              default: 0,
            },
          },
        },
        rewards: {
          $sum: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$status', 'won'] },
                  then: {
                    $add: [
                      { $multiply: ['$amount', 2] },
                      { $multiply: [{ $max: [{ $subtract: ['$potentialWin', '$amount'] }, 0] }, 0.15] },
                    ],
                  },
                },
                {
                  case: { $eq: ['$status', 'pending'] },
                  then: { $multiply: ['$amount', 0.8] },
                },
                {
                  case: { $eq: ['$status', 'lost'] },
                  then: { $multiply: ['$amount', 0.35] },
                },
              ],
              default: { $multiply: ['$amount', 0.25] },
            },
          },
        },
        totalBets: { $sum: 1 },
        wonBets: {
          $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] },
        },
        lostBets: {
          $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] },
        },
        pendingBets: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        username: 1,
        avatar: 1,
        role: 1,
        volume: 1,
        profit: 1,
        rewards: 1,
        totalBets: 1,
        wonBets: 1,
        lostBets: 1,
        pendingBets: 1,
      },
    },
  );

  const rows = await Bet.aggregate<RawLeaderboardRow>(pipeline);
  return normalizeRows(rows, sort);
}

export async function getRewardOverview(userId: string) {
  const objectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const todayStart = getRangeStart('today')!;
  const monthStart = getRangeStart('monthly')!;

  const [user, recentBets, createdMarketsMonth] = await Promise.all([
    User.findById(objectId).select('username avatar role').lean(),
    Bet.find({ userId: objectId })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('marketId', 'title category')
      .lean(),
    Market.countDocuments({ createdBy: objectId, createdAt: { $gte: monthStart } }),
  ]);

  if (!user) return null;

  const leaderboardAll = await getLeaderboardData({ range: 'all', sort: 'rewards' });
  const leaderboardMonthly = await getLeaderboardData({ range: 'monthly', sort: 'rewards' });
  const leaderboardWeekly = await getLeaderboardData({ range: 'weekly', sort: 'rewards' });

  const currentAll = leaderboardAll.find((row) => row.userId === userId);
  const currentMonth = leaderboardMonthly.find((row) => row.userId === userId);
  const currentWeek = leaderboardWeekly.find((row) => row.userId === userId);

  const recentEvents = recentBets.map((bet) => {
    const basePoints =
      bet.status === 'won'
        ? Math.round((bet.amount * 2) + Math.max((bet.potentialWin ?? 0) - bet.amount, 0) * 0.15)
        : bet.status === 'pending'
          ? Math.round(bet.amount * 0.8)
          : bet.status === 'lost'
            ? Math.round(bet.amount * 0.35)
            : Math.round(bet.amount * 0.25);

    return {
      id: String(bet._id),
      marketTitle: typeof bet.marketId === 'object' && bet.marketId ? bet.marketId.title : 'Marché',
      status: bet.status,
      amount: bet.amount,
      points: basePoints,
      createdAt: bet.createdAt,
    };
  });

  const lifetimePoints = currentAll?.rewards ?? 0;
  const tier = lifetimePoints >= 5000
    ? 'Diamant'
    : lifetimePoints >= 2500
      ? 'Or'
      : lifetimePoints >= 1000
        ? 'Argent'
        : 'Bronze';

  return {
    user: {
      id: userId,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
    },
    summary: {
      todayPoints: recentEvents.filter((event) => new Date(event.createdAt) >= todayStart).reduce((sum, event) => sum + event.points, 0),
      weeklyPoints: currentWeek?.rewards ?? 0,
      monthlyPoints: currentMonth?.rewards ?? 0,
      lifetimePoints,
      weeklyRank: currentWeek?.rank ?? null,
      monthlyRank: currentMonth?.rank ?? null,
      lifetimeRank: currentAll?.rank ?? null,
      createdMarketsMonth,
      tier,
      nextTierAt: tier === 'Bronze' ? 1000 : tier === 'Argent' ? 2500 : tier === 'Or' ? 5000 : null,
    },
    leaderboard: {
      weeklyTop: leaderboardWeekly.slice(0, 8),
      monthlyTop: leaderboardMonthly.slice(0, 8),
    },
    events: recentEvents,
    generatedAt: now.toISOString(),
  };
}
