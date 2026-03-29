// Config wallet — importable côté client (pas de Stripe SDK ici)

export const WALLET_AMOUNTS: { label: string; cents: number; bonus?: string }[] = [
  { label: '10 €',  cents: 1000 },
  { label: '25 €',  cents: 2500 },
  { label: '50 €',  cents: 5000, bonus: 'Populaire' },
  { label: '100 €', cents: 10000 },
  { label: '200 €', cents: 20000, bonus: '+5% bonus' },
];
