import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe, STRIPE_PACKS, MARKET_CREATION_EUR } from '@/lib/stripe';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    const { type, packId, marketId } = await req.json();

    /* ── Pack de coins ──────────────────────────────────────────────────── */
    if (type === 'coin_pack') {
      const pack = STRIPE_PACKS[packId];
      if (!pack) return NextResponse.json({ error: 'Pack introuvable' }, { status: 400 });

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(pack.priceEur * 100),
              product_data: {
                name: `Pack ${pack.name} — ${pack.coins} coins`,
                description: `${pack.coins} coins crédités instantanément sur FLAT EARTH`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: { type: 'coin_pack', packId, coins: String(pack.coins), userId },
        success_url: `${BASE_URL}/shop?success=1&pack=${packId}&coins=${pack.coins}`,
        cancel_url:  `${BASE_URL}/shop`,
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    /* ── Création de marché ─────────────────────────────────────────────── */
    if (type === 'market_creation') {
      if (!marketId) return NextResponse.json({ error: 'marketId requis' }, { status: 400 });

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: MARKET_CREATION_EUR,
              product_data: {
                name: 'Création de marché — FLAT EARTH',
                description: 'Frais de création et validation de votre pari prédictif',
              },
            },
            quantity: 1,
          },
        ],
        metadata: { type: 'market_creation', marketId, userId },
        success_url: `${BASE_URL}/create-market?success=1&marketId=${marketId}`,
        cancel_url:  `${BASE_URL}/create-market?cancelled=1&marketId=${marketId}`,
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    return NextResponse.json({ error: 'Type de paiement invalide' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/stripe/checkout]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
