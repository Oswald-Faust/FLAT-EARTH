import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Market from '@/models/Market';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[Stripe webhook] Erreur de signature :', err);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== 'paid') return NextResponse.json({ ok: true });

    const meta = session.metadata ?? {};
    await connectDB();

    /* ── Créditer des coins ──────────────────────────────────────────── */
    if (meta.type === 'coin_pack') {
      const coins = parseInt(meta.coins ?? '0', 10);
      if (coins > 0 && meta.userId) {
        await User.findByIdAndUpdate(meta.userId, { $inc: { coins } });
        console.log(`[Stripe] ${coins} coins crédités → user ${meta.userId}`);
      }
    }

    /* ── Dépôt wallet ────────────────────────────────────────────────── */
    if (meta.type === 'wallet_deposit' && meta.userId) {
      const cents = parseInt(meta.cents ?? '0', 10);
      if (cents > 0) {
        await User.findByIdAndUpdate(meta.userId, { $inc: { balance: cents } });
        console.log(`[Stripe] Wallet +${cents} centimes → user ${meta.userId}`);
      }
    }

    /* ── Activer un marché après paiement ────────────────────────────── */
    if (meta.type === 'market_creation' && meta.marketId) {
      await Market.findByIdAndUpdate(meta.marketId, { approvalStatus: 'pending' });
      console.log(`[Stripe] Marché ${meta.marketId} activé (pending)`);
    }
  }

  return NextResponse.json({ ok: true });
}
