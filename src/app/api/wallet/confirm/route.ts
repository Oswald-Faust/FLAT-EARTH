import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { stripe } from '@/lib/stripe';
import { processCompletedCheckoutSession } from '@/lib/stripe-checkout';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const meta = checkoutSession.metadata ?? {};

    if (meta.type !== 'wallet_deposit') {
      return NextResponse.json({ error: 'Session Stripe invalide pour wallet' }, { status: 400 });
    }

    if (meta.userId !== userId) {
      return NextResponse.json({ error: 'Session non autorisée' }, { status: 403 });
    }

    await connectDB();
    const result = await processCompletedCheckoutSession(checkoutSession);

    return NextResponse.json({
      ok: result.ok,
      alreadyProcessed: result.ok ? result.alreadyProcessed : false,
      amount: parseInt(meta.cents ?? '0', 10),
    });
  } catch (err) {
    console.error('[POST /api/wallet/confirm]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
