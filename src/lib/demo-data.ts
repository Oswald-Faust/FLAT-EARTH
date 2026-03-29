import { IMarket } from '@/types';

const D = Date.now();
const H = 3600000;

// Seeded RNG for deterministic chart data (no hydration mismatch)
export function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return (s >>> 0) / 0x7fffffff;
  };
}

export function strSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function genChartData(marketId: string, optIdx: number, endProb: number, pts = 28): number[] {
  const rng = createRng(strSeed(marketId + String(optIdx)));
  const startOff = (rng() - 0.5) * 40;
  const start = Math.max(3, Math.min(93, endProb + startOff));
  return Array.from({ length: pts }, (_, i) => {
    const t = i / (pts - 1);
    const base = start + (endProb - start) * t;
    const noise = (rng() - 0.5) * 10;
    return Math.max(1, Math.min(99, base + noise));
  });
}

// ─── DEMO MARKETS ────────────────────────────────────────────────────────────

export const ALL_MARKETS: IMarket[] = [
  // ── SPORT ──────────────────────────────────────────────────────────────────
  {
    _id: 'sp1',
    title: 'PSG vs Barcelone — Quarts Champions League',
    description: 'Ligue des Champions · Quart de finale retour',
    contextNews: 'Après le nul 1-1 au Camp Nou, le PSG reçoit Barcelone au Parc des Princes pour une qualification historique.',
    category: 'sport',
    subcategory: 'football',
    status: 'live',
    options: [
      { _id: 'a', label: 'PSG', probability: 42, totalBets: 154000 },
      { _id: 'b', label: 'Barcelone', probability: 58, totalBets: 201000 },
    ],
    totalVolume: 355000,
    marketCount: 3,
    createdBy: 'admin',
    endsAt: new Date(D + H * 1.2),
    creatorFeePercent: 2,
    createdAt: new Date(D - H * 24),
  },
  {
    _id: 'sp2',
    title: 'Atlético Madrid vs Borussia Dortmund',
    description: 'Champions League · Quart de finale',
    contextNews: 'Le Atlético cherche à renverser le Borussia après une défaite 0-1 à l\'aller.',
    category: 'sport',
    subcategory: 'football',
    status: 'live',
    options: [
      { _id: 'a', label: 'Atlético', probability: 55, totalBets: 120000 },
      { _id: 'b', label: 'Dortmund', probability: 45, totalBets: 98000 },
    ],
    totalVolume: 218000,
    marketCount: 2,
    createdBy: 'admin',
    endsAt: new Date(D + H * 1.5),
    creatorFeePercent: 2,
    createdAt: new Date(D - H * 12),
  },
  {
    _id: 'sp3',
    title: 'Meilleur buteur de La Liga 2025-26',
    description: 'Qui terminera meilleur buteur du championnat espagnol ?',
    contextNews: 'Mbappé domine avec 28 buts, mais Bellingham et Vini Jr reviennent fort dans la dernière ligne droite.',
    category: 'sport',
    subcategory: 'football',
    status: 'open',
    options: [
      { _id: 'a', label: 'Mbappé', probability: 51, totalBets: 187000 },
      { _id: 'b', label: 'Bellingham', probability: 28, totalBets: 103000 },
      { _id: 'c', label: 'Vini Jr', probability: 21, totalBets: 77000 },
    ],
    totalVolume: 367000,
    marketCount: 3,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 40),
    creatorFeePercent: 2,
    createdAt: new Date(D - H * 48),
  },
  {
    _id: 'sp4',
    title: 'Vainqueur de la Coupe du Monde 2026',
    description: 'Qui remportera la Coupe du Monde organisée aux USA, Canada et Mexique ?',
    contextNews: 'Le tournoi final approche. La France et le Brésil sont donnés grands favoris par les bookmakers.',
    category: 'sport',
    subcategory: 'football',
    status: 'open',
    options: [
      { _id: 'a', label: 'France', probability: 24, totalBets: 412000 },
      { _id: 'b', label: 'Brésil', probability: 21, totalBets: 362000 },
      { _id: 'c', label: 'Espagne', probability: 18, totalBets: 309000 },
      { _id: 'd', label: 'Angleterre', probability: 14, totalBets: 240000 },
      { _id: 'e', label: 'Autre', probability: 23, totalBets: 396000 },
    ],
    totalVolume: 1719000,
    marketCount: 12,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 120),
    creatorFeePercent: 2,
    createdAt: new Date(D - H * 72),
  },
  {
    _id: 'sp5',
    title: 'Real Madrid champion de Liga 2025-26 ?',
    description: 'Le Real Madrid remportera-t-il le titre cette saison ?',
    category: 'sport',
    subcategory: 'football',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 71, totalBets: 280000 },
      { _id: 'b', label: 'Non', probability: 29, totalBets: 115000 },
    ],
    totalVolume: 395000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 45),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'sp6',
    title: 'Vainqueur Champions League 2025-26',
    description: 'Quel club remportera la Champions League cette saison ?',
    category: 'sport',
    subcategory: 'football',
    status: 'open',
    options: [
      { _id: 'a', label: 'Real Madrid', probability: 32, totalBets: 340000 },
      { _id: 'b', label: 'PSG', probability: 24, totalBets: 255000 },
      { _id: 'c', label: 'Man City', probability: 19, totalBets: 202000 },
      { _id: 'd', label: 'Autre', probability: 25, totalBets: 265000 },
    ],
    totalVolume: 1062000,
    marketCount: 8,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 60),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'sp7',
    title: 'Mbappé meilleur buteur de l\'Euro ?',
    description: 'Kylian Mbappé sera-t-il le meilleur buteur du prochain Euro ?',
    category: 'sport',
    subcategory: 'football',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 38, totalBets: 95000 },
      { _id: 'b', label: 'Non', probability: 62, totalBets: 155000 },
    ],
    totalVolume: 250000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 30),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── POLITIQUE ───────────────────────────────────────────────────────────────
  {
    _id: 'pol1',
    title: 'Vainqueur de la présidentielle française 2027',
    description: 'Qui sera élu président de la République en 2027 ?',
    contextNews: 'Avec 13 mois avant l\'élection, Marine Le Pen mène dans les sondages. La gauche cherche à s\'unir.',
    category: 'politique',
    subcategory: 'france',
    status: 'open',
    options: [
      { _id: 'a', label: 'Marine Le Pen', probability: 41, totalBets: 512000 },
      { _id: 'b', label: 'Candidat LFI', probability: 22, totalBets: 275000 },
      { _id: 'c', label: 'Candidat Centre', probability: 21, totalBets: 262000 },
      { _id: 'd', label: 'Autre droite', probability: 16, totalBets: 200000 },
    ],
    totalVolume: 1249000,
    marketCount: 15,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 365),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'pol2',
    title: 'Macron annoncera-t-il sa candidature en 2027 ?',
    description: 'Emmanuel Macron tentera-t-il un troisième mandat ?',
    category: 'politique',
    subcategory: 'france',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 18, totalBets: 45000 },
      { _id: 'b', label: 'Non', probability: 82, totalBets: 205000 },
    ],
    totalVolume: 250000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 300),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'pol3',
    title: 'Trump sera-t-il en prison d\'ici 2027 ?',
    description: 'Donald Trump sera-t-il incarcéré avant la fin de son mandat ?',
    category: 'politique',
    subcategory: 'usa',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 8, totalBets: 124000 },
      { _id: 'b', label: 'Non', probability: 92, totalBets: 1425000 },
    ],
    totalVolume: 1549000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 400),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'pol4',
    title: 'Midterms 2026 — Les Républicains gardent la Chambre ?',
    description: 'Le Parti Républicain conservera-t-il la majorité à la Chambre des représentants ?',
    contextNews: 'Les sondages montrent un resserrement de la course. Les démocrates espèrent un retournement.',
    category: 'politique',
    subcategory: 'usa',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 58, totalBets: 742000 },
      { _id: 'b', label: 'Non', probability: 42, totalBets: 538000 },
    ],
    totalVolume: 1280000,
    marketCount: 47,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 230),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'pol5',
    title: 'Guerre Ukraine — Cessez-le-feu avant fin 2026 ?',
    description: 'Un accord de cessez-le-feu Ukraine-Russie sera-t-il signé avant le 31 décembre 2026 ?',
    category: 'politique',
    subcategory: 'ukraine',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 34, totalBets: 312000 },
      { _id: 'b', label: 'Non', probability: 66, totalBets: 605000 },
    ],
    totalVolume: 917000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 279),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── CRYPTO ──────────────────────────────────────────────────────────────────
  {
    _id: 'cry1',
    title: 'Prix du Bitcoin fin 2026',
    description: 'Dans quelle fourchette sera le prix du Bitcoin au 31 décembre 2026 ?',
    contextNews: 'Après le halving d\'avril 2024, le Bitcoin suit le cycle haussier classique. Les analystes divergent sur les cibles.',
    category: 'crypto',
    subcategory: 'bitcoin',
    status: 'open',
    options: [
      { _id: 'a', label: '< $50K', probability: 12, totalBets: 234000 },
      { _id: 'b', label: '$50K–$100K', probability: 31, totalBets: 605000 },
      { _id: 'c', label: '$100K–$150K', probability: 35, totalBets: 683000 },
      { _id: 'd', label: '> $150K', probability: 22, totalBets: 429000 },
    ],
    totalVolume: 1951000,
    marketCount: 28,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 279),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'cry2',
    title: 'Ethereum dépasse $10,000 en 2026 ?',
    description: 'Le prix d\'Ethereum franchira-t-il les $10,000 cette année ?',
    category: 'crypto',
    subcategory: 'ethereum',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 44, totalBets: 387000 },
      { _id: 'b', label: 'Non', probability: 56, totalBets: 493000 },
    ],
    totalVolume: 880000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 279),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'cry3',
    title: 'Bitcoin atteindra-t-il $200K un jour ?',
    description: 'Le Bitcoin franchira-t-il les $200,000 lors de ce cycle ?',
    category: 'crypto',
    subcategory: 'bitcoin',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 37, totalBets: 521000 },
      { _id: 'b', label: 'Non', probability: 63, totalBets: 888000 },
    ],
    totalVolume: 1409000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 500),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── ESPORT ──────────────────────────────────────────────────────────────────
  {
    _id: 'es1',
    title: 'Vainqueur du Major CS2 — Printemps 2026',
    description: 'Quel team remportera le prochain Major Counter-Strike 2 ?',
    category: 'esport',
    subcategory: 'cs2',
    status: 'open',
    options: [
      { _id: 'a', label: 'Team Vitality', probability: 28, totalBets: 87000 },
      { _id: 'b', label: 'NAVI', probability: 22, totalBets: 68000 },
      { _id: 'c', label: 'FaZe', probability: 19, totalBets: 59000 },
      { _id: 'd', label: 'Autre', probability: 31, totalBets: 96000 },
    ],
    totalVolume: 310000,
    marketCount: 8,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 14),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'es2',
    title: 'Faker jouera-t-il encore en LCK en 2027 ?',
    description: 'Lee Sang-hyeok (Faker) sera-t-il encore joueur professionnel en 2027 ?',
    category: 'esport',
    subcategory: 'lol',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 73, totalBets: 200000 },
      { _id: 'b', label: 'Non', probability: 27, totalBets: 74000 },
    ],
    totalVolume: 274000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 300),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'es3',
    title: 'Team Liquid gagne le VCT Champions 2026 ?',
    description: 'Valorant Champions Tour — Team Liquid remportera-t-il le titre mondial ?',
    category: 'esport',
    subcategory: 'valorant',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 19, totalBets: 42000 },
      { _id: 'b', label: 'Non', probability: 81, totalBets: 179000 },
    ],
    totalVolume: 221000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 90),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── POP CULTURE ─────────────────────────────────────────────────────────────
  {
    _id: 'pc1',
    title: 'Kendrick vs Drake — Beef terminé en 2026 ?',
    description: 'Les deux rappeurs se réconcilieront-ils publiquement cette année ?',
    category: 'pop-culture',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 18, totalBets: 34000 },
      { _id: 'b', label: 'Non', probability: 82, totalBets: 155000 },
    ],
    totalVolume: 189000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 270),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'pc2',
    title: 'Beyoncé en concert à Paris en 2026 ?',
    description: 'Beyoncé annoncera-t-elle des dates en France cette année ?',
    category: 'pop-culture',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 62, totalBets: 98000 },
      { _id: 'b', label: 'Non', probability: 38, totalBets: 60000 },
    ],
    totalVolume: 158000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 90),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'pc3',
    title: 'Oscar du meilleur film 2027',
    description: 'Quel film remportera l\'Oscar du meilleur film en 2027 ?',
    category: 'pop-culture',
    status: 'open',
    options: [
      { _id: 'a', label: 'The Brutalist', probability: 34, totalBets: 67000 },
      { _id: 'b', label: 'Emilia Pérez', probability: 28, totalBets: 55000 },
      { _id: 'c', label: 'Autre', probability: 38, totalBets: 75000 },
    ],
    totalVolume: 197000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 30),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── TÉLÉ-RÉALITÉ ────────────────────────────────────────────────────────────
  {
    _id: 'tv1',
    title: 'Star Academy — Qui sera éliminé cette semaine ?',
    description: 'Vote de l\'académie lors de la prochaine prime',
    category: 'tele-realite',
    status: 'open',
    options: [
      { _id: 'a', label: 'Serena', probability: 35, totalBets: 78000 },
      { _id: 'b', label: 'Julien', probability: 65, totalBets: 145000 },
    ],
    totalVolume: 223000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 48),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'tv2',
    title: 'Koh-Lanta : vainqueur de l\'édition 2026',
    description: 'Qui remportera le titre de Koh-Lanta 2026 ?',
    category: 'tele-realite',
    status: 'open',
    options: [
      { _id: 'a', label: 'Laura', probability: 44, totalBets: 89000 },
      { _id: 'b', label: 'Théo', probability: 56, totalBets: 113000 },
    ],
    totalVolume: 202000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 10),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'tv3',
    title: 'The Voice — Qui gagne l\'édition 2026 ?',
    description: 'Vainqueur de la saison actuelle de The Voice France',
    category: 'tele-realite',
    status: 'open',
    options: [
      { _id: 'a', label: 'Amira', probability: 41, totalBets: 67000 },
      { _id: 'b', label: 'Lucas', probability: 33, totalBets: 54000 },
      { _id: 'c', label: 'Sofia', probability: 26, totalBets: 43000 },
    ],
    totalVolume: 164000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 20),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── ACTUALITÉ ───────────────────────────────────────────────────────────────
  {
    _id: 'act1',
    title: 'Inflation France > 3% en 2026 ?',
    description: 'L\'inflation annuelle française dépassera-t-elle 3% cette année ?',
    category: 'actualite',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 41, totalBets: 89000 },
      { _id: 'b', label: 'Non', probability: 59, totalBets: 128000 },
    ],
    totalVolume: 217000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 180),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'act2',
    title: 'IA dépasse l\'humain en créativité d\'ici 2027 ?',
    description: 'Une IA gagnera-t-elle un concours artistique majeur face aux humains ?',
    category: 'actualite',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 55, totalBets: 145000 },
      { _id: 'b', label: 'Non', probability: 45, totalBets: 119000 },
    ],
    totalVolume: 264000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 365),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'act3',
    title: 'Prochaine pandémie mondiale avant 2030 ?',
    description: 'L\'OMS déclarera-t-elle une nouvelle pandémie avant 2030 ?',
    category: 'actualite',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 31, totalBets: 212000 },
      { _id: 'b', label: 'Non', probability: 69, totalBets: 471000 },
    ],
    totalVolume: 683000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 1460),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── TECH ────────────────────────────────────────────────────────────────────
  {
    _id: 'tech1',
    title: 'OpenAI lancera GPT-5 avant juin 2026 ?',
    description: 'OpenAI publiera-t-il GPT-5 avant le 30 juin 2026 ?',
    category: 'tech',
    subcategory: 'ia',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 67, totalBets: 312000 },
      { _id: 'b', label: 'Non', probability: 33, totalBets: 154000 },
    ],
    totalVolume: 466000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 97),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'tech2',
    title: 'Apple lancera une voiture autonome avant 2028 ?',
    description: 'Apple Car sera-t-il disponible à la vente avant 2028 ?',
    category: 'tech',
    subcategory: 'apple',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 14, totalBets: 89000 },
      { _id: 'b', label: 'Non', probability: 86, totalBets: 546000 },
    ],
    totalVolume: 635000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 600),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'tech3',
    title: 'Elon Musk restera-t-il à la tête de Tesla en 2027 ?',
    description: 'Elon Musk sera-t-il encore PDG de Tesla fin 2027 ?',
    category: 'tech',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 61, totalBets: 234000 },
      { _id: 'b', label: 'Non', probability: 39, totalBets: 150000 },
    ],
    totalVolume: 384000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 450),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── ÉCONOMIE ────────────────────────────────────────────────────────────────
  {
    _id: 'eco1',
    title: 'Récession aux USA en 2026 ?',
    description: 'Les États-Unis entreront-ils en récession technique en 2026 (2 trimestres négatifs) ?',
    category: 'economie',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 38, totalBets: 521000 },
      { _id: 'b', label: 'Non', probability: 62, totalBets: 850000 },
    ],
    totalVolume: 1371000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 280),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'eco2',
    title: 'Taux BCE en dessous de 2% fin 2026 ?',
    description: 'La BCE abaissera-t-elle ses taux sous 2% avant le 31 décembre 2026 ?',
    category: 'economie',
    subcategory: 'banques',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 56, totalBets: 312000 },
      { _id: 'b', label: 'Non', probability: 44, totalBets: 246000 },
    ],
    totalVolume: 558000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 280),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── GÉOPOLITIQUE ────────────────────────────────────────────────────────────
  {
    _id: 'geo1',
    title: 'Iran — Accord nucléaire signé en 2026 ?',
    description: 'L\'Iran signera-t-il un accord sur son programme nucléaire en 2026 ?',
    category: 'geopolitique',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 27, totalBets: 412000 },
      { _id: 'b', label: 'Non', probability: 73, totalBets: 1113000 },
    ],
    totalVolume: 1525000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 280),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
  {
    _id: 'geo2',
    title: 'La Chine envahira-t-elle Taïwan avant 2030 ?',
    description: 'Une offensive militaire chinoise sur Taïwan sera-t-elle lancée avant 2030 ?',
    category: 'geopolitique',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 12, totalBets: 876000 },
      { _id: 'b', label: 'Non', probability: 88, totalBets: 6424000 },
    ],
    totalVolume: 7300000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 1460),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── CLIMAT ──────────────────────────────────────────────────────────────────
  {
    _id: 'cli1',
    title: '2026 sera l\'année la plus chaude de l\'histoire ?',
    description: 'L\'année 2026 battra-t-elle le record de température mondiale ?',
    category: 'climat',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 61, totalBets: 287000 },
      { _id: 'b', label: 'Non', probability: 39, totalBets: 184000 },
    ],
    totalVolume: 471000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 280),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── FINANCE ─────────────────────────────────────────────────────────────────
  {
    _id: 'fin1',
    title: 'CAC 40 au-dessus de 9000 fin 2026 ?',
    description: 'L\'indice CAC 40 clôturera-t-il au-dessus de 9000 points le 31 décembre 2026 ?',
    category: 'finance',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 43, totalBets: 234000 },
      { _id: 'b', label: 'Non', probability: 57, totalBets: 310000 },
    ],
    totalVolume: 544000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 280),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── MÉTÉO ───────────────────────────────────────────────────────────────────
  {
    _id: 'met1',
    title: 'Été 2026 — Canicule record en France ?',
    description: 'La France enregistrera-t-elle plus de 10 jours à 40°C cet été ?',
    category: 'meteo',
    status: 'open',
    options: [
      { _id: 'a', label: 'Oui', probability: 52, totalBets: 134000 },
      { _id: 'b', label: 'Non', probability: 48, totalBets: 124000 },
    ],
    totalVolume: 258000,
    createdBy: 'admin',
    endsAt: new Date(D + H * 24 * 180),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },

  // ── MENTIONS ────────────────────────────────────────────────────────────────
  {
    _id: 'men1',
    title: 'Elon Musk tweete > 50 fois aujourd\'hui ?',
    description: 'Elon Musk publiera-t-il plus de 50 tweets ce jour ?',
    category: 'mentions',
    status: 'live',
    options: [
      { _id: 'a', label: 'Oui', probability: 73, totalBets: 45000 },
      { _id: 'b', label: 'Non', probability: 27, totalBets: 16700 },
    ],
    totalVolume: 61700,
    createdBy: 'admin',
    endsAt: new Date(D + H * 14),
    creatorFeePercent: 2,
    createdAt: new Date(),
  },
];

// Hero featured markets (for the slider — need chart data)
export const HERO_MARKETS = [
  ALL_MARKETS.find(m => m._id === 'sp3')!, // Meilleur buteur Liga (3 options)
  ALL_MARKETS.find(m => m._id === 'pol1')!, // Présidentielle 2027 (4 options)
  ALL_MARKETS.find(m => m._id === 'cry1')!, // Bitcoin fin 2026 (4 options)
  ALL_MARKETS.find(m => m._id === 'sp4')!, // Coupe du Monde (5 options)
  ALL_MARKETS.find(m => m._id === 'sp1')!, // PSG vs Barça LIVE (2 options)
  ALL_MARKETS.find(m => m._id === 'sp6')!, // CL 2026 (4 options)
  ALL_MARKETS.find(m => m._id === 'es1')!, // Major CS2 (4 options)
].filter(Boolean) as IMarket[];

// Option colors for chart lines and badges
export const OPTION_COLORS = [
  '#ffd700', // gold — option 0
  '#00e676', // green — option 1
  '#f44336', // red — option 2
  '#4fc3f7', // blue — option 3
  '#ce93d8', // purple — option 4
];

export const BADGE_COLORS = [
  '#00e676', // green — first option (Oui)
  '#f44336', // red — second option (Non)
  '#4fc3f7',
  '#ffd700',
  '#ce93d8',
];
