import User from '@/models/User';
import ReferralReward from '@/models/ReferralReward';

export async function generateReferralCode(username: string) {
  const prefix = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'EARTH';

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const code = `${prefix}${suffix}`;
    const existing = await User.findOne({ referralCode: code }).select('_id').lean();
    if (!existing) return code;
  }

  return `${prefix}${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

export async function applyReferralRewards({
  userId,
  sourceType,
  sourceSessionId,
  sourceAmountCents,
}: {
  userId: string;
  sourceType: 'coin_pack' | 'wallet_deposit' | 'market_creation';
  sourceSessionId: string;
  sourceAmountCents: number;
}) {
  if (!userId || !sourceSessionId || sourceAmountCents <= 0) return;

  const user = await User.findById(userId).select('referredBy referralActivatedAt');
  if (!user?.referredBy) return;

  const referrerRewardCoins = Math.max(1, Math.floor(sourceAmountCents / 100));

  const existingReferrerReward = await ReferralReward.findOne({
    sourceSessionId,
    kind: 'referrer_bonus',
  }).select('_id');

  if (!existingReferrerReward) {
    await ReferralReward.create({
      referrerId: user.referredBy,
      refereeId: user._id,
      kind: 'referrer_bonus',
      sourceType,
      sourceSessionId,
      sourceAmountCents,
      rewardCoins: referrerRewardCoins,
    });

    await User.findByIdAndUpdate(user.referredBy, { $inc: { coins: referrerRewardCoins } });
  }

  if (!user.referralActivatedAt) {
    const existingRefereeReward = await ReferralReward.findOne({
      sourceSessionId,
      kind: 'referee_bonus',
    }).select('_id');

    if (!existingRefereeReward) {
      const welcomeBonusCoins = 25;

      await ReferralReward.create({
        referrerId: user.referredBy,
        refereeId: user._id,
        kind: 'referee_bonus',
        sourceType,
        sourceSessionId,
        sourceAmountCents,
        rewardCoins: welcomeBonusCoins,
      });

      await User.findByIdAndUpdate(user._id, {
        $set: { referralActivatedAt: new Date() },
        $inc: { coins: welcomeBonusCoins },
      });
    }
  }
}
