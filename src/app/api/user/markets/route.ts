import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Market from '@/models/Market';
import { stripe, MARKET_CREATION_EUR } from '@/lib/stripe';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();
    const userId = (session.user as { id: string }).id;

    const {
      title, description, rules, contextNews,
      category, subcategory, options, endsAt,
      creatorFeePercent, isGoogleVerified,
    } = await req.json();

    // Validations de base
    if (!title?.trim())        return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
    if (!category)             return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 });
    if (!options || options.length < 2) return NextResponse.json({ error: 'Minimum 2 options' }, { status: 400 });
    if (!endsAt)               return NextResponse.json({ error: 'Date de fin requise' }, { status: 400 });
    if (new Date(endsAt) <= new Date()) return NextResponse.json({ error: 'Date de fin dans le passé' }, { status: 400 });
    if (options.some((o: { label: string }) => !o.label?.trim())) {
      return NextResponse.json({ error: 'Toutes les options doivent avoir un label' }, { status: 400 });
    }
    const totalProbability = options.reduce(
      (sum: number, option: { probability?: number }) => sum + (option.probability ?? 0),
      0,
    );
    if (totalProbability !== 100) {
      return NextResponse.json({ error: 'Les probabilités doivent totaliser 100%' }, { status: 400 });
    }

    // Création du marché en attente de paiement
    const market = await Market.create({
      title:            title.trim(),
      description:      description ?? '',
      rules:            rules ?? '',
      contextNews:      contextNews ?? '',
      category,
      subcategory:      subcategory ?? '',
      status:           'open',
      approvalStatus:   'pending_payment', // activé par le webhook Stripe
      isGoogleVerified: isGoogleVerified ?? false,
      currency:         'coins',
      options:          options.map((o: { label: string; probability: number }) => ({
        label:       o.label.trim(),
        probability: o.probability ?? Math.floor(100 / options.length),
        totalBets:   0,
      })),
      totalVolume:      0,
      endsAt:           new Date(endsAt),
      creatorFeePercent:Math.min(15, Math.max(0, creatorFeePercent ?? 2)),
      createdBy:        userId,
      submittedBy:      userId,
    });

    try {
      // Création de la session Stripe Checkout
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: MARKET_CREATION_EUR,
              product_data: {
                name: 'Création de marché — FLAT EARTH',
                description: `Frais de soumission : "${title.trim().slice(0, 60)}"`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: { type: 'market_creation', marketId: String(market._id), userId },
        success_url: `${BASE_URL}/create-market?success=1&marketId=${market._id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${BASE_URL}/create-market?cancelled=1&marketId=${market._id}`,
      });

      return NextResponse.json(
        { checkoutUrl: checkoutSession.url, marketId: String(market._id) },
        { status: 201 },
      );
    } catch (checkoutError) {
      // Ne laisse pas de brouillon orphelin si Stripe échoue avant la redirection.
      await Market.findByIdAndDelete(market._id);
      throw checkoutError;
    }
  } catch (err: unknown) {
    const apiError = err as { type?: string; message?: string; name?: string };
    console.error('[POST /api/user/markets]', err);
    if (apiError?.name === 'ValidationError') {
      return NextResponse.json({ error: apiError.message || 'Marché invalide' }, { status: 400 });
    }
    if (apiError?.type === 'StripeAuthenticationError') {
      return NextResponse.json({ error: 'Configuration Stripe invalide — vérifier STRIPE_SECRET_KEY' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
