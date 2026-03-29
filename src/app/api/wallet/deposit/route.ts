import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    const { cents } = await req.json();
    const amount = parseInt(cents, 10);

    if (!amount || amount < 100) { // minimum 1€ = 100 centimes
      return NextResponse.json({ error: 'Montant minimum : 1 €' }, { status: 400 });
    }
    if (amount > 200_000) { // maximum 2000€
      return NextResponse.json({ error: 'Montant maximum : 2 000 €' }, { status: 400 });
    }

    const euros = (amount / 100).toFixed(2);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amount,
            product_data: {
              name: `Dépôt wallet — ${euros} €`,
              description: `Crédit de ${euros} € sur votre wallet FLAT EARTH`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'wallet_deposit',
        userId,
        cents: String(amount),
      },
      success_url: `${BASE_URL}/?wallet=success&amount=${amount}`,
      cancel_url:  `${BASE_URL}/?wallet=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: unknown) {
    const stripeErr = err as { type?: string; statusCode?: number; message?: string };
    console.error('[POST /api/wallet/deposit]', err);
    if (stripeErr?.type === 'StripeAuthenticationError') {
      return NextResponse.json({ error: 'Configuration Stripe invalide — vérifier STRIPE_SECRET_KEY' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
