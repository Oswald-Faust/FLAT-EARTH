import type Stripe from 'stripe';
import User from '@/models/User';
import Market from '@/models/Market';
import ProcessedCheckout from '@/models/ProcessedCheckout';
import { applyReferralRewards } from '@/lib/referrals';

export async function processCompletedCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') {
    return { ok: false, reason: 'unpaid' as const };
  }

  const meta = session.metadata ?? {};
  const type = meta.type;

  if (type !== 'coin_pack' && type !== 'wallet_deposit' && type !== 'market_creation') {
    return { ok: false, reason: 'invalid_type' as const };
  }

  const existing = await ProcessedCheckout.findOne({ sessionId: session.id }).select('_id').lean();
  if (existing) {
    return { ok: true, alreadyProcessed: true as const };
  }

  const sourceAmountCents = session.amount_total ?? 0;

  if (type === 'coin_pack') {
    const coins = parseInt(meta.coins ?? '0', 10);
    if (coins > 0 && meta.userId) {
      await User.findByIdAndUpdate(meta.userId, { $inc: { coins } });
      await applyReferralRewards({
        userId: meta.userId,
        sourceType: 'coin_pack',
        sourceSessionId: session.id,
        sourceAmountCents,
      });
    }
  }

  if (type === 'wallet_deposit') {
    const cents = parseInt(meta.cents ?? '0', 10);
    if (cents > 0 && meta.userId) {
      await User.findByIdAndUpdate(meta.userId, { $inc: { balance: cents } });
      await applyReferralRewards({
        userId: meta.userId,
        sourceType: 'wallet_deposit',
        sourceSessionId: session.id,
        sourceAmountCents: cents,
      });
    }
  }

  if (type === 'market_creation' && meta.marketId) {
    await Market.findByIdAndUpdate(meta.marketId, { approvalStatus: 'pending' });
    if (meta.userId) {
      await applyReferralRewards({
        userId: meta.userId,
        sourceType: 'market_creation',
        sourceSessionId: session.id,
        sourceAmountCents,
      });
    }
  }

  await ProcessedCheckout.create({
    sessionId: session.id,
    type,
    userId: meta.userId,
    amountTotal: sourceAmountCents,
  });

  return { ok: true, alreadyProcessed: false as const };
}
