import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Market from '@/models/Market';
import { stripe } from '@/lib/stripe';
import { processCompletedCheckoutSession } from '@/lib/stripe-checkout';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { sessionId, marketId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 });
    }
    if (!marketId || typeof marketId !== 'string') {
      return NextResponse.json({ error: 'marketId requis' }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const meta = checkoutSession.metadata ?? {};

    if (meta.type !== 'market_creation') {
      return NextResponse.json({ error: 'Session Stripe invalide pour création de marché' }, { status: 400 });
    }
    if (meta.userId !== userId || meta.marketId !== marketId) {
      return NextResponse.json({ error: 'Session non autorisée' }, { status: 403 });
    }

    await connectDB();
    const result = await processCompletedCheckoutSession(checkoutSession);
    const market = await Market.findById(marketId).select('_id approvalStatus').lean();

    return NextResponse.json({
      ok: result.ok,
      alreadyProcessed: result.ok ? result.alreadyProcessed : false,
      marketId,
      approvalStatus: market?.approvalStatus ?? null,
    });
  } catch (err) {
    console.error('[POST /api/user/markets/confirm]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
