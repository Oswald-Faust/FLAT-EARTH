import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const STRIPE_PACKS: Record<string, { name: string; coins: number; priceEur: number }> = {
  starter: { name: 'Starter', coins: 100,  priceEur: 1.99 },
  popular: { name: 'Popular', coins: 600,  priceEur: 9.99 },
  pro:     { name: 'Pro',     coins: 1500, priceEur: 19.99 },
  elite:   { name: 'Elite',   coins: 5000, priceEur: 49.99 },
};

// Coût de création d'un marché en centimes (€5.00)
export const MARKET_CREATION_EUR = 500;

// Montants de dépôt wallet — définis dans wallet-config.ts (client-safe)
export { WALLET_AMOUNTS } from '@/lib/wallet-config';
