import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import Market from '@/models/Market';
import MarketHistory from '@/models/MarketHistory';
import User from '@/models/User';
import Bet from '@/models/Bet';
import { strSeed, createRng } from '@/lib/demo-data';

// ─── GÉNÉRATION D'HISTORIQUE DÉMO ─────────────────────────────────────────────
// Crée N points sur `daysBack` jours avec une marche aléatoire déterministe
// qui part d'un offset et converge vers les probabilités actuelles.
function buildSeedHistory(
  marketId: string,
  options: Array<{ _id: unknown; probability: number }>,
  numPoints = 40,
  daysBack = 30
) {
  const rng = createRng(strSeed(marketId + '_hist'));
  const now = Date.now();
  const startTime = now - daysBack * 24 * 3600 * 1000;

  // Points de départ : prob actuelle ± offset aléatoire, normalisés à 100
  const rawStarts = options.map((_, i) => {
    const r = createRng(strSeed(marketId + '_s' + i));
    return Math.max(2, (r() - 0.5) * 40);
  });
  const sumStarts = rawStarts.reduce((a, b) => a + b, 0);
  // Mélange starts relatifs avec les vraies probabilités actuelles
  const normalizedStarts = options.map((opt, i) => {
    const offset = (rawStarts[i] / sumStarts - 1 / options.length) * 25;
    return Math.max(2, Math.min(96, opt.probability + offset));
  });
  // Re-normaliser pour sommer à 100
  const sSum = normalizedStarts.reduce((a, b) => a + b, 0);
  const starts = normalizedStarts.map(p => (p / sSum) * 100);

  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const recordedAt = new Date(startTime + t * (now - startTime));

    // Interpolation start→current + bruit décroissant
    const raw = options.map((opt, idx) => {
      const base = starts[idx] + (opt.probability - starts[idx]) * t;
      const noise = (rng() - 0.5) * 8 * (1 - t * 0.6);
      return Math.max(1, base + noise);
    });
    // Normaliser à 100
    const total = raw.reduce((a, b) => a + b, 0);
    const probs = raw.map(p => Math.round((p / total) * 100));
    // Corriger l'arrondi sur le premier élément
    const diff = 100 - probs.reduce((a, b) => a + b, 0);
    probs[0] = Math.max(1, probs[0] + diff);

    points.push({
      marketId,
      probabilities: options.map((opt, idx) => ({
        optionId:    opt._id!.toString(),
        probability: probs[idx],
      })),
      recordedAt,
    });
  }
  return points;
}

// ─── CATÉGORIES ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    name: 'Sport',
    slug: 'sport',
    icon: '⚽',
    description: 'Football, tennis, NBA, F1, rugby et tous les sports',
    order: 1,
    subcategories: [
      { slug: 'football', label: 'Football' },
      { slug: 'tennis', label: 'Tennis' },
      { slug: 'nba', label: 'NBA' },
      { slug: 'formule1', label: 'Formule 1' },
      { slug: 'rugby', label: 'Rugby' },
      { slug: 'mma', label: 'MMA / UFC' },
    ],
  },
  {
    name: 'Politique',
    slug: 'politique',
    icon: '🏛️',
    description: 'Élections, géopolitique, gouvernements mondiaux',
    order: 2,
    subcategories: [
      { slug: 'france', label: 'France' },
      { slug: 'usa', label: 'États-Unis' },
      { slug: 'ukraine', label: 'Ukraine' },
      { slug: 'europe', label: 'Europe' },
      { slug: 'monde', label: 'Monde' },
    ],
  },
  {
    name: 'Crypto',
    slug: 'crypto',
    icon: '₿',
    description: 'Bitcoin, Ethereum, altcoins, DeFi, NFT',
    order: 3,
    subcategories: [
      { slug: 'bitcoin', label: 'Bitcoin' },
      { slug: 'ethereum', label: 'Ethereum' },
      { slug: 'altcoins', label: 'Altcoins' },
      { slug: 'defi', label: 'DeFi' },
    ],
  },
  {
    name: 'Télé-réalité',
    slug: 'tele-realite',
    icon: '📺',
    description: 'Secret Story, Les Marseillais, Koh-Lanta et plus',
    order: 4,
    subcategories: [
      { slug: 'koh-lanta', label: 'Koh-Lanta' },
      { slug: 'secret-story', label: 'Secret Story' },
      { slug: 'les-marseillais', label: 'Les Marseillais' },
      { slug: 'the-voice', label: 'The Voice' },
    ],
  },
  {
    name: 'Pop Culture',
    slug: 'pop-culture',
    icon: '🎬',
    description: 'Cinéma, séries, musique, célébrités',
    order: 5,
    subcategories: [
      { slug: 'cinema', label: 'Cinéma' },
      { slug: 'series', label: 'Séries' },
      { slug: 'musique', label: 'Musique' },
      { slug: 'celebrites', label: 'Célébrités' },
    ],
  },
  {
    name: 'Esport',
    slug: 'esport',
    icon: '🎮',
    description: 'League of Legends, CS2, Valorant, FIFA eSport',
    order: 6,
    subcategories: [
      { slug: 'lol', label: 'League of Legends' },
      { slug: 'cs2', label: 'CS2' },
      { slug: 'valorant', label: 'Valorant' },
      { slug: 'fifa-esport', label: 'FIFA eSport' },
    ],
  },
  {
    name: 'Actualité',
    slug: 'actualite',
    icon: '📰',
    description: 'Événements en cours, faits divers, tendances',
    order: 7,
    subcategories: [
      { slug: 'france-actu', label: 'France' },
      { slug: 'monde-actu', label: 'Monde' },
      { slug: 'science', label: 'Science' },
      { slug: 'sante', label: 'Santé' },
    ],
  },
  {
    name: 'Climat',
    slug: 'climat',
    icon: '🌍',
    description: 'Réchauffement climatique, catastrophes naturelles, COP',
    order: 8,
    subcategories: [
      { slug: 'rechauffement', label: 'Réchauffement' },
      { slug: 'catastrophes', label: 'Catastrophes' },
      { slug: 'cop', label: 'COP & accords' },
    ],
  },
  {
    name: 'Économie',
    slug: 'economie',
    icon: '📈',
    description: 'Marchés financiers, entreprises, emploi, récession',
    order: 9,
    subcategories: [
      { slug: 'marches', label: 'Marchés' },
      { slug: 'entreprises', label: 'Entreprises' },
      { slug: 'emploi', label: 'Emploi' },
      { slug: 'immobilier', label: 'Immobilier' },
    ],
  },
  {
    name: 'Géopolitique',
    slug: 'geopolitique',
    icon: '🌐',
    description: 'Conflits, alliances, diplomatie internationale',
    order: 10,
    subcategories: [
      { slug: 'conflits', label: 'Conflits' },
      { slug: 'diplomatie', label: 'Diplomatie' },
      { slug: 'asie', label: 'Asie' },
      { slug: 'moyen-orient', label: 'Moyen-Orient' },
    ],
  },
  {
    name: 'Tech',
    slug: 'tech',
    icon: '💻',
    description: 'IA, startups, Big Tech, innovations technologiques',
    order: 11,
    subcategories: [
      { slug: 'ia', label: 'Intelligence Artificielle' },
      { slug: 'big-tech', label: 'Big Tech' },
      { slug: 'startups', label: 'Startups' },
      { slug: 'gadgets', label: 'Gadgets & Hardware' },
    ],
  },
  {
    name: 'Mentions',
    slug: 'mentions',
    icon: '🎓',
    description: 'Résultats du Bac, examens, concours et classements',
    order: 12,
    subcategories: [
      { slug: 'bac', label: 'Baccalauréat' },
      { slug: 'concours', label: 'Concours' },
      { slug: 'classements', label: 'Classements' },
    ],
  },
  {
    name: 'Finance',
    slug: 'finance',
    icon: '💰',
    description: 'Bourse, obligations, matières premières, forex',
    order: 13,
    subcategories: [
      { slug: 'bourse', label: 'Bourse' },
      { slug: 'forex', label: 'Forex' },
      { slug: 'matieres-premieres', label: 'Matières premières' },
      { slug: 'obligations', label: 'Obligations' },
    ],
  },
  {
    name: 'Météo',
    slug: 'meteo',
    icon: '🌤️',
    description: 'Températures records, événements météo extrêmes',
    order: 14,
    subcategories: [
      { slug: 'records', label: 'Records de température' },
      { slug: 'tempetes', label: 'Tempêtes & ouragans' },
      { slug: 'france-meteo', label: 'Météo France' },
    ],
  },
];

// ─── MARCHÉS DE DÉMO ──────────────────────────────────────────────────────────

function getMarketsData(adminId: string) {
  const now = Date.now();
  const H = 3600000;
  return [
    {
      title: 'PSG vs Barcelone — Quarts Champions League',
      description: 'Ligue des Champions · Quart de finale retour',
      rules: 'Le marché se résout sur le résultat du match retour (90min + prolongations + tirs au but si nécessaire).',
      contextNews: 'Après le nul 1-1 au Camp Nou, le PSG reçoit Barcelone au Parc des Princes pour une qualification historique.',
      category: 'sport',
      subcategory: 'football',
      status: 'live',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'PSG', probability: 42, totalBets: 154000 },
        { label: 'Barcelone', probability: 58, totalBets: 201000 },
      ],
      totalVolume: 355000,
      endsAt: new Date(now + H * 1.5),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Vainqueur de la Coupe du Monde 2026',
      description: 'Qui remportera la Coupe du Monde organisée aux USA, Canada et Mexique ?',
      rules: 'Résolution après la finale du tournoi. En cas de non-organisation, remboursement intégral.',
      contextNews: 'Le tournoi final approche. La France et le Brésil sont donnés grands favoris par les bookmakers.',
      category: 'sport',
      subcategory: 'football',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'France', probability: 24, totalBets: 412000 },
        { label: 'Brésil', probability: 21, totalBets: 362000 },
        { label: 'Espagne', probability: 18, totalBets: 309000 },
        { label: 'Angleterre', probability: 14, totalBets: 240000 },
        { label: 'Autre', probability: 23, totalBets: 396000 },
      ],
      totalVolume: 1719000,
      endsAt: new Date(now + H * 24 * 120),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Vainqueur de la présidentielle française 2027',
      description: 'Qui sera élu président de la République en 2027 ?',
      rules: 'Résolution au résultat officiel du 2ème tour. Annulation si l\'élection est reportée.',
      contextNews: 'Avec 13 mois avant l\'élection, Marine Le Pen mène dans les sondages. La gauche cherche à s\'unir.',
      category: 'politique',
      subcategory: 'france',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Marine Le Pen', probability: 41, totalBets: 512000 },
        { label: 'Candidat LFI', probability: 22, totalBets: 275000 },
        { label: 'Candidat Centre', probability: 21, totalBets: 262000 },
        { label: 'Autre droite', probability: 16, totalBets: 200000 },
      ],
      totalVolume: 1249000,
      endsAt: new Date(now + H * 24 * 365),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Midterms 2026 — Les Républicains gardent la Chambre ?',
      description: 'Le Parti Républicain conservera-t-il la majorité à la Chambre des représentants ?',
      rules: 'Résolution sur le résultat officiel des élections de mi-mandat 2026.',
      contextNews: 'Les sondages montrent un resserrement de la course. Les démocrates espèrent un retournement.',
      category: 'politique',
      subcategory: 'usa',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 58, totalBets: 742000 },
        { label: 'Non', probability: 42, totalBets: 538000 },
      ],
      totalVolume: 1280000,
      endsAt: new Date(now + H * 24 * 230),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Prix du Bitcoin fin 2026',
      description: 'Dans quelle fourchette sera le prix du Bitcoin au 31 décembre 2026 ?',
      rules: 'Résolution sur le prix CoinGecko à 00h00 UTC le 1er janvier 2027.',
      contextNews: 'Après le halving d\'avril 2024, le Bitcoin suit le cycle haussier classique.',
      category: 'crypto',
      subcategory: 'bitcoin',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: '< $50K', probability: 12, totalBets: 234000 },
        { label: '$50K–$100K', probability: 31, totalBets: 605000 },
        { label: '$100K–$150K', probability: 35, totalBets: 683000 },
        { label: '> $150K', probability: 22, totalBets: 429000 },
      ],
      totalVolume: 1951000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Ethereum dépasse Bitcoin en market cap ?',
      description: 'Ethereum dépassera-t-il Bitcoin en capitalisation boursière avant fin 2026 ?',
      rules: 'Résolution sur CoinGecko. Le flippening est validé si ETH > BTC pendant au moins 24h consécutives.',
      contextNews: 'Le rapport ETH/BTC remonte après les ETF Ethereum. Les analystes débattent du timing.',
      category: 'crypto',
      subcategory: 'ethereum',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 19, totalBets: 287000 },
        { label: 'Non', probability: 81, totalBets: 1220000 },
      ],
      totalVolume: 1507000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'ChatGPT vs Claude — Qui domine en 2026 ?',
      description: 'Quel modèle d\'IA sera le plus utilisé mondialement à fin 2026 ?',
      rules: 'Résolution basée sur les rapports de trafic Similarweb et les données d\'usage publiées.',
      contextNews: 'Anthropic (Claude) a réduit l\'écart avec OpenAI. Google Gemini entre aussi dans la course.',
      category: 'tech',
      subcategory: 'ia',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'ChatGPT (OpenAI)', probability: 54, totalBets: 412000 },
        { label: 'Claude (Anthropic)', probability: 28, totalBets: 213000 },
        { label: 'Gemini (Google)', probability: 18, totalBets: 137000 },
      ],
      totalVolume: 762000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Apple lancera-t-il un casque Vision Pro 2 ?',
      description: 'Apple annoncera-t-il un Vision Pro 2 (2ème génération) en 2026 ?',
      rules: 'Résolution dès qu\'Apple annonce officiellement le produit. Date limite : 31 décembre 2026.',
      contextNews: 'Les analystes de Ming-Chi Kuo évoquent un Vision Pro 2 plus léger pour fin 2026.',
      category: 'tech',
      subcategory: 'big-tech',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 61, totalBets: 198000 },
        { label: 'Non', probability: 39, totalBets: 127000 },
      ],
      totalVolume: 325000,
      endsAt: new Date(now + H * 24 * 280),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Guerre Ukraine — Cessez-le-feu avant fin 2026 ?',
      description: 'Un accord de cessez-le-feu Ukraine-Russie sera-t-il signé avant le 31 décembre 2026 ?',
      rules: 'Résolution sur une annonce officielle conjointe ou via ONU/OSCE d\'un cessez-le-feu durable.',
      category: 'geopolitique',
      subcategory: 'conflits',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 34, totalBets: 312000 },
        { label: 'Non', probability: 66, totalBets: 605000 },
      ],
      totalVolume: 917000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Record de chaleur mondial battu en été 2026 ?',
      description: 'Un nouveau record de température mondial sera-t-il établi durant l\'été 2026 ?',
      rules: 'Résolution sur les données WMO (Organisation Météorologique Mondiale). Période : juin–septembre 2026.',
      contextNews: '2024 et 2025 ont été les années les plus chaudes jamais enregistrées.',
      category: 'climat',
      subcategory: 'records',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 67, totalBets: 245000 },
        { label: 'Non', probability: 33, totalBets: 121000 },
      ],
      totalVolume: 366000,
      endsAt: new Date(now + H * 24 * 180),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── FOOTBALL ─────────────────────────────────────────────────────────────
    {
      title: 'Real Madrid vs Arsenal — Quarts Champions League',
      description: 'Qui se qualifie pour les demi-finales de la Ligue des Champions ?',
      rules: 'Résolution sur le résultat global après les deux matchs (aller-retour). Prolongations et tirs au but si nécessaire.',
      contextNews: 'Le Real Madrid reçoit Arsenal à Santiago Bernabéu pour le match retour. Arsenal mène 1-0 après l\'aller.',
      category: 'sport',
      subcategory: 'football',
      status: 'live',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Real Madrid', probability: 55, totalBets: 389000 },
        { label: 'Arsenal', probability: 45, totalBets: 318000 },
      ],
      totalVolume: 707000,
      endsAt: new Date(now + H * 3),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Vainqueur Champions League 2025/26',
      description: 'Quelle équipe soulèvera la coupe aux grandes oreilles à Munich en mai 2026 ?',
      rules: 'Résolution sur le résultat de la finale du 30 mai 2026.',
      contextNews: 'Les quarts de finale se jouent actuellement. Real Madrid, Arsenal, PSG et Barcelone sont encore en course.',
      category: 'sport',
      subcategory: 'football',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Real Madrid', probability: 31, totalBets: 620000 },
        { label: 'Arsenal', probability: 22, totalBets: 440000 },
        { label: 'PSG', probability: 19, totalBets: 380000 },
        { label: 'Barcelone', probability: 16, totalBets: 320000 },
        { label: 'Autre', probability: 12, totalBets: 240000 },
      ],
      totalVolume: 2000000,
      endsAt: new Date(now + H * 24 * 63),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Vainqueur Premier League 2025/26',
      description: 'Quel club remportera le titre de champion d\'Angleterre cette saison ?',
      rules: 'Résolution sur le classement final de Premier League au terme des 38 journées.',
      contextNews: 'Arsenal et Liverpool se livrent une bataille serrée en tête du classement. Manchester City est troisième à 4 points.',
      category: 'sport',
      subcategory: 'football',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Arsenal', probability: 42, totalBets: 512000 },
        { label: 'Liverpool', probability: 38, totalBets: 463000 },
        { label: 'Manchester City', probability: 15, totalBets: 183000 },
        { label: 'Autre', probability: 5, totalBets: 61000 },
      ],
      totalVolume: 1219000,
      endsAt: new Date(now + H * 24 * 55),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Vainqueur Ligue 1 2025/26',
      description: 'Qui sera sacré champion de France cette saison ?',
      rules: 'Résolution sur le classement final Ligue 1 au terme des 34 journées.',
      contextNews: 'Le PSG domine la Ligue 1 avec 8 points d\'avance sur Monaco à 10 journées de la fin.',
      category: 'sport',
      subcategory: 'football',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'PSG', probability: 78, totalBets: 421000 },
        { label: 'Monaco', probability: 14, totalBets: 76000 },
        { label: 'Marseille', probability: 5, totalBets: 27000 },
        { label: 'Autre', probability: 3, totalBets: 16000 },
      ],
      totalVolume: 540000,
      endsAt: new Date(now + H * 24 * 50),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Vainqueur Europa League 2026',
      description: 'Quelle équipe remportera l\'Europa League cette saison ?',
      rules: 'Résolution sur le résultat de la finale.',
      contextNews: 'Les quarts de finale de l\'Europa League approchent. Plusieurs clubs de Bundesliga et de Liga sont en piste.',
      category: 'sport',
      subcategory: 'football',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Bayer Leverkusen', probability: 28, totalBets: 198000 },
        { label: 'Athletic Bilbao', probability: 22, totalBets: 156000 },
        { label: 'Roma', probability: 18, totalBets: 127000 },
        { label: 'Frankfurt', probability: 15, totalBets: 106000 },
        { label: 'Autre', probability: 17, totalBets: 120000 },
      ],
      totalVolume: 707000,
      endsAt: new Date(now + H * 24 * 60),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── TENNIS ───────────────────────────────────────────────────────────────
    {
      title: 'Vainqueur Roland Garros 2026 — Messieurs',
      description: 'Qui soulèvera la Coupe des Mousquetaires en juin 2026 ?',
      rules: 'Résolution sur le résultat de la finale Roland Garros messieurs.',
      contextNews: 'Alcaraz a remporté Roland Garros 2024 et 2025. Sinner monte en puissance sur terre battue.',
      category: 'sport',
      subcategory: 'tennis',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Carlos Alcaraz', probability: 38, totalBets: 312000 },
        { label: 'Jannik Sinner', probability: 32, totalBets: 262000 },
        { label: 'Novak Djokovic', probability: 14, totalBets: 115000 },
        { label: 'Autre', probability: 16, totalBets: 131000 },
      ],
      totalVolume: 820000,
      endsAt: new Date(now + H * 24 * 76),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Vainqueur Wimbledon 2026 — Messieurs',
      description: 'Qui sera couronné champion sur le gazon de Church Road en juillet 2026 ?',
      rules: 'Résolution sur le résultat de la finale Wimbledon messieurs.',
      contextNews: 'Alcaraz est tenant du titre. Sinner cherche à compléter sa collection de Grand Chelem.',
      category: 'sport',
      subcategory: 'tennis',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Carlos Alcaraz', probability: 35, totalBets: 248000 },
        { label: 'Jannik Sinner', probability: 28, totalBets: 198000 },
        { label: 'Novak Djokovic', probability: 20, totalBets: 141000 },
        { label: 'Autre', probability: 17, totalBets: 120000 },
      ],
      totalVolume: 707000,
      endsAt: new Date(now + H * 24 * 112),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── BASKETBALL ───────────────────────────────────────────────────────────
    {
      title: 'Vainqueur NBA Finals 2026',
      description: 'Quelle franchise remportera le titre NBA en juin 2026 ?',
      rules: 'Résolution sur le résultat des NBA Finals 2026.',
      contextNews: 'Les Celtics de Boston défendent leur titre. OKC Thunder et Denver Nuggets sont donnés favoris à l\'Ouest.',
      category: 'sport',
      subcategory: 'basketball',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Boston Celtics', probability: 24, totalBets: 389000 },
        { label: 'Oklahoma City Thunder', probability: 21, totalBets: 340000 },
        { label: 'Denver Nuggets', probability: 18, totalBets: 291000 },
        { label: 'Cleveland Cavaliers', probability: 15, totalBets: 243000 },
        { label: 'Autre', probability: 22, totalBets: 356000 },
      ],
      totalVolume: 1619000,
      endsAt: new Date(now + H * 24 * 87),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'MVP NBA saison 2025/26',
      description: 'Quel joueur remportera le trophée de Most Valuable Player de la saison NBA ?',
      rules: 'Résolution sur l\'annonce officielle des NBA Awards.',
      contextNews: 'Shai Gilgeous-Alexander (OKC) et Jayson Tatum (Boston) se disputent la tête du classement MVP.',
      category: 'sport',
      subcategory: 'basketball',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Shai Gilgeous-Alexander', probability: 41, totalBets: 298000 },
        { label: 'Jayson Tatum', probability: 27, totalBets: 196000 },
        { label: 'Nikola Jokic', probability: 19, totalBets: 138000 },
        { label: 'Autre', probability: 13, totalBets: 94000 },
      ],
      totalVolume: 726000,
      endsAt: new Date(now + H * 24 * 70),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── FORMULE 1 ────────────────────────────────────────────────────────────
    {
      title: 'Champion du monde F1 2026',
      description: 'Qui sera sacré champion du monde de Formule 1 à la fin de la saison 2026 ?',
      rules: 'Résolution sur le classement pilotes officiel FIA après le dernier Grand Prix.',
      contextNews: 'La saison 2026 est la première avec les nouvelles réglementations moteur et aérodynamiques. Ferrari et Mercedes espèrent détrôner Red Bull.',
      category: 'sport',
      subcategory: 'f1',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Max Verstappen', probability: 35, totalBets: 587000 },
        { label: 'Charles Leclerc', probability: 22, totalBets: 369000 },
        { label: 'Lewis Hamilton', probability: 19, totalBets: 318000 },
        { label: 'Lando Norris', probability: 14, totalBets: 234000 },
        { label: 'Autre', probability: 10, totalBets: 167000 },
      ],
      totalVolume: 1675000,
      endsAt: new Date(now + H * 24 * 265),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Ferrari gagne le Championnat Constructeurs F1 2026 ?',
      description: 'La Scuderia Ferrari remportera-t-elle le championnat constructeurs pour la première fois depuis 2008 ?',
      rules: 'Résolution sur le classement constructeurs FIA en fin de saison 2026.',
      contextNews: 'Les nouvelles règles techniques 2026 ont été conçues pour réduire l\'écart entre les équipes. Ferrari est optimiste.',
      category: 'sport',
      subcategory: 'f1',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 31, totalBets: 198000 },
        { label: 'Non', probability: 69, totalBets: 441000 },
      ],
      totalVolume: 639000,
      endsAt: new Date(now + H * 24 * 265),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── UFC / MMA ────────────────────────────────────────────────────────────
    {
      title: 'Islam Makhachev conserve son titre UFC poids légers ?',
      description: 'Islam Makhachev gardera-t-il sa ceinture de champion poids légers lors de sa prochaine défense de titre ?',
      rules: 'Résolution sur le résultat du prochain combat de championnat poids légers UFC.',
      contextNews: 'Makhachev est invaincu depuis 2020 et a dominé tous ses challengers. Poirier et Oliveira sont en embuscade.',
      category: 'sport',
      subcategory: 'ufc',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui, il retient le titre', probability: 73, totalBets: 186000 },
        { label: 'Non, il perd le titre', probability: 27, totalBets: 69000 },
      ],
      totalVolume: 255000,
      endsAt: new Date(now + H * 24 * 90),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── POLITIQUE — FRANCE ───────────────────────────────────────────────────
    {
      title: 'Macron termine son mandat présidentiel en 2027 ?',
      description: 'Emmanuel Macron ira-t-il jusqu\'au bout de son mandat (fin mai 2027) sans démissionner ?',
      rules: 'Résolution si Macron est toujours président au 14 mai 2027. Résolution anticipée en cas de démission ou destitution.',
      contextNews: 'Malgré une impopularité record et une majorité relative fragile, Macron a répété ne pas vouloir démissionner.',
      category: 'politique',
      subcategory: 'france',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 81, totalBets: 612000 },
        { label: 'Non', probability: 19, totalBets: 143000 },
      ],
      totalVolume: 755000,
      endsAt: new Date(now + H * 24 * 410),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Marine Le Pen éligible à la présidentielle 2027 ?',
      description: 'Marine Le Pen sera-t-elle autorisée à se présenter à l\'élection présidentielle de 2027 ?',
      rules: 'Résolution sur décision définitive de justice. Oui si elle peut se présenter, Non si une condamnation l\'en empêche.',
      contextNews: 'Condamnée en première instance dans l\'affaire des assistants parlementaires, Le Pen a fait appel. Une peine avec inéligibilité immédiate serait décisive.',
      category: 'politique',
      subcategory: 'france',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui, elle est éligible', probability: 58, totalBets: 489000 },
        { label: 'Non, inéligible', probability: 42, totalBets: 354000 },
      ],
      totalVolume: 843000,
      endsAt: new Date(now + H * 24 * 300),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Le RN premier parti aux législatives françaises 2027 ?',
      description: 'Le Rassemblement National obtiendra-t-il le plus grand nombre de sièges à l\'Assemblée nationale lors des législatives 2027 ?',
      rules: 'Résolution sur les résultats officiels du second tour des élections législatives 2027.',
      contextNews: 'Après avoir manqué la majorité absolue en 2024, le RN vise la majorité absolue en 2027.',
      category: 'politique',
      subcategory: 'france',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 62, totalBets: 398000 },
        { label: 'Non', probability: 38, totalBets: 243000 },
      ],
      totalVolume: 641000,
      endsAt: new Date(now + H * 24 * 400),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── POLITIQUE — USA ───────────────────────────────────────────────────────
    {
      title: 'Trump est-il impeaché avant fin 2026 ?',
      description: 'La Chambre des représentants votera-t-elle une mise en accusation (impeachment) de Donald Trump avant le 31 décembre 2026 ?',
      rules: 'Résolution sur un vote officiel d\'impeachment à la Chambre. Pas besoin de condamnation au Sénat.',
      contextNews: 'Les Républicains contrôlent actuellement la Chambre et le Sénat. Un impeachment nécessiterait un retournement politique majeur.',
      category: 'politique',
      subcategory: 'usa',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 8, totalBets: 89000 },
        { label: 'Non', probability: 92, totalBets: 1024000 },
      ],
      totalVolume: 1113000,
      endsAt: new Date(now + H * 24 * 280),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── POLITIQUE — EUROPE ───────────────────────────────────────────────────
    {
      title: 'Le gouvernement Merz tient jusqu\'aux élections 2029 ?',
      description: 'La coalition CDU/CSU-SPD dirigée par Friedrich Merz gouvernera-t-elle l\'Allemagne jusqu\'aux prochaines élections fédérales ?',
      rules: 'Résolution si le gouvernement Merz est encore en place au 1er septembre 2029.',
      contextNews: 'Merz a formé une coalition malgré la montée en puissance de l\'AfD. La stabilité de la coalition dépend de l\'économie allemande.',
      category: 'politique',
      subcategory: 'europe',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 64, totalBets: 287000 },
        { label: 'Non', probability: 36, totalBets: 161000 },
      ],
      totalVolume: 448000,
      endsAt: new Date(now + H * 24 * 1100),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── POLITIQUE — UKRAINE ──────────────────────────────────────────────────
    {
      title: 'Ukraine rejoint l\'OTAN avant fin 2028 ?',
      description: 'L\'Ukraine obtiendra-t-elle une invitation formelle à rejoindre l\'Alliance Atlantique avant le 31 décembre 2028 ?',
      rules: 'Résolution sur une invitation officielle par vote unanime des membres de l\'OTAN.',
      contextNews: 'Malgré le soutien américain et européen, l\'adhésion de l\'Ukraine reste bloquée par certains alliés. Trump a signalé son scepticisme.',
      category: 'politique',
      subcategory: 'ukraine',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 22, totalBets: 198000 },
        { label: 'Non', probability: 78, totalBets: 703000 },
      ],
      totalVolume: 901000,
      endsAt: new Date(now + H * 24 * 1010),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── CRYPTO ────────────────────────────────────────────────────────────────
    {
      title: 'Bitcoin atteint $200 000 avant fin 2026 ?',
      description: 'Le prix du Bitcoin atteindra-t-il $200 000 à n\'importe quel moment avant le 31 décembre 2026 ?',
      rules: 'Résolution sur le prix spot CoinGecko. Il suffit que le prix touche $200 000 une seule fois.',
      contextNews: 'Le Bitcoin a atteint $107K début 2025. Le cycle haussier post-halving est en cours. Les ETF Bitcoin accumulent massivement.',
      category: 'crypto',
      subcategory: 'bitcoin',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 44, totalBets: 687000 },
        { label: 'Non', probability: 56, totalBets: 874000 },
      ],
      totalVolume: 1561000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Ethereum dépasse $10 000 avant fin 2026 ?',
      description: 'L\'Ethereum franchira-t-il le seuil des $10 000 avant le 31 décembre 2026 ?',
      rules: 'Résolution sur le prix spot CoinGecko. Il suffit que le prix touche $10 000 une seule fois.',
      contextNews: 'ETH n\'a jamais dépassé $5 000. La mise à niveau Pectra et les ETF ETH sont des catalyseurs potentiels.',
      category: 'crypto',
      subcategory: 'ethereum',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 27, totalBets: 341000 },
        { label: 'Non', probability: 73, totalBets: 921000 },
      ],
      totalVolume: 1262000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Solana dépasse $500 avant fin 2026 ?',
      description: 'Le prix de Solana (SOL) atteindra-t-il $500 à n\'importe quel moment avant le 31 décembre 2026 ?',
      rules: 'Résolution sur le prix spot CoinGecko. Il suffit que le prix touche $500 une seule fois.',
      contextNews: 'Solana a atteint un ATH de $295 en 2025. L\'écosystème DeFi et memecoins sur Solana est en forte croissance.',
      category: 'crypto',
      subcategory: 'altcoins',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 31, totalBets: 287000 },
        { label: 'Non', probability: 69, totalBets: 638000 },
      ],
      totalVolume: 925000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'ETF Solana approuvé par la SEC en 2026 ?',
      description: 'La Securities and Exchange Commission (SEC) américaine approuvera-t-elle un ETF Solana spot en 2026 ?',
      rules: 'Résolution sur une approbation officielle de la SEC d\'au moins un ETF Solana spot avant le 31 décembre 2026.',
      contextNews: 'Après les ETF Bitcoin et Ethereum, plusieurs sociétés ont déposé des demandes d\'ETF Solana. La SEC plus favorable sous la nouvelle administration.',
      category: 'crypto',
      subcategory: 'regulation',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 68, totalBets: 412000 },
        { label: 'Non', probability: 32, totalBets: 194000 },
      ],
      totalVolume: 606000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'XRP dépasse $5 avant fin 2026 ?',
      description: 'Le prix de XRP dépassera-t-il $5 à n\'importe quel moment avant le 31 décembre 2026 ?',
      rules: 'Résolution sur le prix spot CoinGecko. Il suffit que le prix touche $5 une seule fois.',
      contextNews: 'Ripple a gagné son procès face à la SEC. XRP a atteint $3.40 en 2025. L\'adoption institutionnelle croît.',
      category: 'crypto',
      subcategory: 'altcoins',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 38, totalBets: 298000 },
        { label: 'Non', probability: 62, totalBets: 487000 },
      ],
      totalVolume: 785000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── TECH / IA ─────────────────────────────────────────────────────────────
    {
      title: 'GPT-5 lancé avant décembre 2026 ?',
      description: 'OpenAI lancera-t-il officiellement GPT-5 (ou équivalent sous un autre nom) avant le 1er décembre 2026 ?',
      rules: 'Résolution sur une annonce de disponibilité publique officielle d\'OpenAI.',
      contextNews: 'OpenAI a accéléré son rythme de sorties avec GPT-4o, o1 et o3. GPT-5 est attendu mais sans date officielle.',
      category: 'tech',
      subcategory: 'ia',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 71, totalBets: 487000 },
        { label: 'Non', probability: 29, totalBets: 199000 },
      ],
      totalVolume: 686000,
      endsAt: new Date(now + H * 24 * 247),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'OpenAI atteint une valorisation de $300Mds en 2026 ?',
      description: 'OpenAI sera-t-il valorisé à $300 milliards ou plus lors d\'une levée de fonds ou introduction en bourse en 2026 ?',
      rules: 'Résolution sur une valorisation officielle de $300Mds ou plus lors d\'une opération financière documentée.',
      contextNews: 'OpenAI était valorisé $157Mds en 2024. Sa croissance explosive et son modèle d\'abonnement attirent des investisseurs.',
      category: 'tech',
      subcategory: 'ia',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 52, totalBets: 312000 },
        { label: 'Non', probability: 48, totalBets: 287000 },
      ],
      totalVolume: 599000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Apple Intelligence disponible en français en 2026 ?',
      description: 'Apple Intelligence (IA d\'Apple) sera-t-il disponible en langue française avant fin 2026 ?',
      rules: 'Résolution sur une disponibilité officielle confirmée par Apple dans les paramètres de langue française.',
      contextNews: 'Apple Intelligence est disponible en anglais depuis 2025 mais pas encore en français. Apple a promis une expansion.',
      category: 'tech',
      subcategory: 'apple',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 82, totalBets: 298000 },
        { label: 'Non', probability: 18, totalBets: 66000 },
      ],
      totalVolume: 364000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'SpaceX Starship réussit une mission orbitale complète en 2026 ?',
      description: 'SpaceX réalisera-t-il une mission orbitale complète avec Starship (décollage + orbite + rentrée + récupération) avant fin 2026 ?',
      rules: 'Résolution sur la réussite d\'une mission orbitale complète confirmée par SpaceX et NASA.',
      contextNews: 'Starship a effectué des vols de test réussis en 2024/2025. La NASA compte sur Starship pour Artemis III.',
      category: 'tech',
      subcategory: 'space',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 74, totalBets: 312000 },
        { label: 'Non', probability: 26, totalBets: 110000 },
      ],
      totalVolume: 422000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── GÉOPOLITIQUE ─────────────────────────────────────────────────────────
    {
      title: 'Gaza : accord de cessez-le-feu durable avant fin 2026 ?',
      description: 'Un accord de cessez-le-feu permanent à Gaza sera-t-il conclu et maintenu pendant au moins 30 jours avant fin 2026 ?',
      rules: 'Résolution sur la signature d\'un accord formel médiatisé par l\'Égypte, le Qatar ou les USA, maintenu 30 jours sans violation majeure.',
      contextNews: 'Les négociations entre Israël et le Hamas se poursuivent avec médiation américaine et qatarienne. Pression internationale croissante.',
      category: 'geopolitique',
      subcategory: 'moyen-orient',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 41, totalBets: 387000 },
        { label: 'Non', probability: 59, totalBets: 558000 },
      ],
      totalVolume: 945000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Trump impose des tarifs > 50% sur les produits chinois ?',
      description: 'L\'administration Trump portera-t-elle les droits de douane sur les importations chinoises au-dessus de 50% en 2026 ?',
      rules: 'Résolution sur une annonce officielle de la Maison Blanche ou publication au Federal Register de tarifs > 50% sur au moins 70% des importations chinoises.',
      contextNews: 'Trump a déjà imposé 25% puis 35% de droits. Il menace régulièrement d\'aller plus loin dans la guerre commerciale.',
      category: 'geopolitique',
      subcategory: 'ameriques',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 48, totalBets: 412000 },
        { label: 'Non', probability: 52, totalBets: 446000 },
      ],
      totalVolume: 858000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── ÉCONOMIE ─────────────────────────────────────────────────────────────
    {
      title: 'La Fed baisse ses taux 3 fois ou plus en 2026 ?',
      description: 'La Réserve fédérale américaine réduira-t-elle ses taux directeurs lors de 3 réunions ou plus en 2026 ?',
      rules: 'Résolution sur le nombre de baisses de taux lors des réunions du FOMC en 2026 (janvier à décembre).',
      contextNews: 'La Fed a maintenu ses taux en 2025 face à la persistance de l\'inflation. Les marchés anticipent un cycle de baisses si l\'inflation ralentit.',
      category: 'economie',
      subcategory: 'banques',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui, 3 baisses ou plus', probability: 35, totalBets: 298000 },
        { label: 'Non, moins de 3 baisses', probability: 65, totalBets: 554000 },
      ],
      totalVolume: 852000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'CAC 40 franchit les 9 000 points en 2026 ?',
      description: 'L\'indice CAC 40 atteindra-t-il 9 000 points à n\'importe quel moment en 2026 ?',
      rules: 'Résolution sur le cours officiel de clôture du CAC 40 publié par Euronext.',
      contextNews: 'Le CAC 40 stagne autour de 7 500-8 000 points depuis fin 2024. Les incertitudes géopolitiques pèsent sur les marchés européens.',
      category: 'economie',
      subcategory: 'marches',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 28, totalBets: 187000 },
        { label: 'Non', probability: 72, totalBets: 481000 },
      ],
      totalVolume: 668000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Récession économique aux USA en 2026 ?',
      description: 'Les États-Unis entreront-ils officiellement en récession (deux trimestres consécutifs de croissance négative) en 2026 ?',
      rules: 'Résolution sur la confirmation du NBER (National Bureau of Economic Research) d\'une récession ayant débuté en 2026.',
      contextNews: 'Les droits de douane de Trump, l\'inflation persistante et le ralentissement du marché immobilier font craindre une récession.',
      category: 'economie',
      subcategory: 'emploi',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 34, totalBets: 312000 },
        { label: 'Non', probability: 66, totalBets: 606000 },
      ],
      totalVolume: 918000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Inflation France descend sous 2% fin 2026 ?',
      description: 'L\'inflation annuelle en France (IPC) sera-t-elle inférieure à 2% au mois de décembre 2026 ?',
      rules: 'Résolution sur les données INSEE d\'inflation pour décembre 2026, publiées en janvier 2027.',
      contextNews: 'L\'inflation en France est autour de 2.3% début 2026. La BCE a commencé à baisser ses taux pour relancer l\'économie.',
      category: 'economie',
      subcategory: 'inflation',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 58, totalBets: 287000 },
        { label: 'Non', probability: 42, totalBets: 208000 },
      ],
      totalVolume: 495000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── ESPORT ────────────────────────────────────────────────────────────────
    {
      title: 'T1 remporte les Worlds 2026 — League of Legends ?',
      description: 'T1 (Faker et son équipe) remportera-t-il le Championnat du Monde de League of Legends 2026 ?',
      rules: 'Résolution sur le résultat de la finale des Worlds 2026 LoL.',
      contextNews: 'T1 et Faker ont remporté les Worlds 2023 et restent l\'équipe la plus titrée. La concurrence coréenne et chinoise est féroce.',
      category: 'esport',
      subcategory: 'lol',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 24, totalBets: 187000 },
        { label: 'Non', probability: 76, totalBets: 593000 },
      ],
      totalVolume: 780000,
      endsAt: new Date(now + H * 24 * 230),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Une équipe française gagne un Major CS2 en 2026 ?',
      description: 'Une équipe avec une majorité de joueurs français remportera-t-elle un tournoi Major de CS2 en 2026 ?',
      rules: 'Résolution sur la victoire d\'une équipe majoritairement française (3 joueurs sur 5 ou plus) lors d\'un Major CS2 Valve en 2026.',
      contextNews: 'Vitality (avec ZywOo) est la meilleure équipe française. ZywOo est considéré comme le meilleur joueur mondial.',
      category: 'esport',
      subcategory: 'cs2',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 41, totalBets: 198000 },
        { label: 'Non', probability: 59, totalBets: 285000 },
      ],
      totalVolume: 483000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'Vainqueur VCT Champions 2026 — Valorant',
      description: 'Quelle équipe remportera le VCT Champions 2026, le championnat du monde de Valorant ?',
      rules: 'Résolution sur le résultat de la grande finale du VCT Champions 2026.',
      contextNews: 'Sentinels (NA) et Fnatic (EMEA) dominent. Les équipes coréennes de T1 et DRX sont en embuscade.',
      category: 'esport',
      subcategory: 'valorant',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Sentinels', probability: 21, totalBets: 98000 },
        { label: 'Fnatic', probability: 18, totalBets: 84000 },
        { label: 'T1 (Corée)', probability: 22, totalBets: 102000 },
        { label: 'NRG Esports', probability: 14, totalBets: 65000 },
        { label: 'Autre', probability: 25, totalBets: 116000 },
      ],
      totalVolume: 465000,
      endsAt: new Date(now + H * 24 * 200),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── TÉLÉ-RÉALITÉ ──────────────────────────────────────────────────────────
    {
      title: 'Koh-Lanta 2026 — Qui remporte la saison ?',
      description: 'Quel candidat sera sacré grand vainqueur de Koh-Lanta saison 2026 ?',
      rules: 'Résolution sur le résultat du vote final des aventuriers lors de l\'épisode de conclusion diffusé sur TF1.',
      contextNews: 'La nouvelle saison Koh-Lanta 2026 a démarré avec 24 candidats sur une île des Philippines. Les rivalités s\'intensifient.',
      category: 'tele-realite',
      subcategory: 'koh-lanta',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Manon (21 ans, Lyon)', probability: 28, totalBets: 112000 },
        { label: 'Théo (34 ans, Marseille)', probability: 23, totalBets: 92000 },
        { label: 'Céleste (26 ans, Paris)', probability: 19, totalBets: 76000 },
        { label: 'Jordan (29 ans, Bordeaux)', probability: 16, totalBets: 64000 },
        { label: 'Autre', probability: 14, totalBets: 56000 },
      ],
      totalVolume: 400000,
      endsAt: new Date(now + H * 24 * 95),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'The Voice France 2026 — Vainqueur de la saison ?',
      description: 'Quel talent remportera The Voice saison 2026 sur TF1 ?',
      rules: 'Résolution sur le résultat du vote du public lors de la grande finale diffusée sur TF1.',
      contextNews: 'The Voice 2026 a démarré avec des coaches inédits. Les battles et les knockouts ont révélé plusieurs talents exceptionnels.',
      category: 'tele-realite',
      subcategory: 'the-voice',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Team Vitaa', probability: 31, totalBets: 87000 },
        { label: 'Team Soprano', probability: 27, totalBets: 76000 },
        { label: 'Team Amel Bent', probability: 22, totalBets: 62000 },
        { label: 'Team Vianney', probability: 20, totalBets: 56000 },
      ],
      totalVolume: 281000,
      endsAt: new Date(now + H * 24 * 80),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── CLIMAT ────────────────────────────────────────────────────────────────
    {
      title: 'Sécheresse exceptionnelle en France été 2026 ?',
      description: 'La France connaîtra-t-elle une sécheresse classée "exceptionnelle" par Météo-France durant l\'été 2026 ?',
      rules: 'Résolution si Météo-France classe la situation de sécheresse comme "exceptionnelle" dans au moins 30 départements durant l\'été 2026.',
      contextNews: 'Les étés 2022, 2023 et 2025 ont été marqués par des sécheresses historiques en France. Les nappes phréatiques sont au plus bas.',
      category: 'climat',
      subcategory: 'secheresse',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 59, totalBets: 198000 },
        { label: 'Non', probability: 41, totalBets: 137000 },
      ],
      totalVolume: 335000,
      endsAt: new Date(now + H * 24 * 180),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── FINANCE ───────────────────────────────────────────────────────────────
    {
      title: 'L\'or dépasse $3 500 l\'once avant fin 2026 ?',
      description: 'Le prix de l\'or (XAU/USD) atteindra-t-il $3 500 l\'once troy à n\'importe quel moment avant le 31 décembre 2026 ?',
      rules: 'Résolution sur le cours spot de l\'or publié par le London Bullion Market (LBMA).',
      contextNews: 'L\'or a atteint $2 800 en 2024 et $3 100 en mars 2026, porté par la demande des banques centrales et l\'incertitude géopolitique.',
      category: 'finance',
      subcategory: 'matieres-premieres',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 45, totalBets: 287000 },
        { label: 'Non', probability: 55, totalBets: 350000 },
      ],
      totalVolume: 637000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
    {
      title: 'S&P 500 franchit 7 000 points en 2026 ?',
      description: 'L\'indice S&P 500 atteindra-t-il 7 000 points à n\'importe quel moment en 2026 ?',
      rules: 'Résolution sur le cours de clôture officiel du S&P 500 publié par la Bourse de New York.',
      contextNews: 'Le S&P 500 a frôlé les 6 100 points début 2025. Les incertitudes liées aux tarifs douaniers et à l\'IA pèsent sur les valorisations.',
      category: 'finance',
      subcategory: 'bourse',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Oui', probability: 41, totalBets: 387000 },
        { label: 'Non', probability: 59, totalBets: 558000 },
      ],
      totalVolume: 945000,
      endsAt: new Date(now + H * 24 * 279),
      creatorFeePercent: 2,
      createdBy: adminId,
    },

    // ── POP-CULTURE ───────────────────────────────────────────────────────────
    {
      title: 'Vainqueur de l\'Oscar du Meilleur Film 2027 ?',
      description: 'Quel film remportera l\'Oscar du Meilleur Film lors de la 99ème cérémonie des Academy Awards en 2027 ?',
      rules: 'Résolution sur le résultat officiel de la cérémonie des Oscars 2027.',
      contextNews: 'Les studios commencent à positionner leurs films pour la saison des prix. Christopher Nolan et Denis Villeneuve préparent leurs prochains projets.',
      category: 'pop-culture',
      subcategory: 'cinema',
      status: 'open',
      approvalStatus: 'approved',
      isGoogleVerified: true,
      currency: 'coins',
      options: [
        { label: 'Nouveau Nolan', probability: 19, totalBets: 87000 },
        { label: 'Nouveau Villeneuve', probability: 16, totalBets: 73000 },
        { label: 'Film A24', probability: 22, totalBets: 100000 },
        { label: 'Film Marvel/Disney', probability: 8, totalBets: 37000 },
        { label: 'Autre', probability: 35, totalBets: 160000 },
      ],
      totalVolume: 457000,
      endsAt: new Date(now + H * 24 * 365),
      creatorFeePercent: 2,
      createdBy: adminId,
    },
  ];
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export async function POST() {
  try {
    await connectDB();

    const results: Record<string, unknown> = {};

    // ── 1. Admin user ──────────────────────────────────────────────────────────
    let adminUser = await User.findOne({ role: 'admin' }).lean();
    if (!adminUser) {
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@flatearth.com',
        password: 'FlatEarth2026!',
        role: 'admin',
        coins: 999999,
      });
      results.admin = { created: true, email: 'admin@flatearth.com', password: 'FlatEarth2026!' };
    } else {
      results.admin = { created: false, message: 'Admin existe déjà' };
    }

    // ── 2. Catégories ──────────────────────────────────────────────────────────
    let categoriesCreated = 0;
    let categoriesSkipped = 0;
    for (const cat of CATEGORIES) {
      const exists = await Category.findOne({ slug: cat.slug }).lean();
      if (!exists) {
        await Category.create(cat);
        categoriesCreated++;
      } else {
        categoriesSkipped++;
      }
    }
    results.categories = { created: categoriesCreated, skipped: categoriesSkipped };

    // ── 3. Marchés de démo ─────────────────────────────────────────────────────
    const adminId = String(adminUser._id);
    const marketsData = getMarketsData(adminId);
    let marketsCreated = 0;
    let marketsSkipped = 0;
    const createdMarkets: Array<{ _id: unknown; options: Array<{ _id: unknown; probability: number }> }> = [];
    for (const market of marketsData) {
      const exists = await Market.findOne({ title: market.title }).lean();
      if (!exists) {
        const created = await Market.create(market);
        createdMarkets.push(created);
        marketsCreated++;
      } else {
        // Inclure les marchés existants aussi pour seeder l'historique si manquant
        createdMarkets.push(exists as typeof createdMarkets[0]);
        marketsSkipped++;
      }
    }
    results.markets = { created: marketsCreated, skipped: marketsSkipped };

    // ── 4. Historique de démo ──────────────────────────────────────────────────
    let historyCreated = 0;
    let historySkipped = 0;
    for (const market of createdMarkets) {
      const marketId = String(market._id);
      const alreadyHasHistory = await MarketHistory.exists({ marketId });
      if (alreadyHasHistory) {
        historySkipped++;
        continue;
      }
      const points = buildSeedHistory(marketId, market.options);
      await MarketHistory.insertMany(points);
      historyCreated++;
    }
    results.history = { created: historyCreated, skipped: historySkipped };

    // ── 5. Bettors fictifs + Bets de démo ─────────────────────────────────────
    // Crée des utilisateurs fictifs et des Bet qui correspondent aux volumes
    // seedés sur les marchés — rend Market.totalVolume cohérent avec les Bet en DB.

    const DEMO_BETTORS_DATA = [
      { username: 'bettor_alpha',   email: 'bettor.alpha@fe-demo.com',   password: 'Demo2026!', role: 'demo' as const, coins: 9_999_999 },
      { username: 'bettor_beta',    email: 'bettor.beta@fe-demo.com',    password: 'Demo2026!', role: 'demo' as const, coins: 9_999_999 },
      { username: 'bettor_gamma',   email: 'bettor.gamma@fe-demo.com',   password: 'Demo2026!', role: 'demo' as const, coins: 9_999_999 },
      { username: 'bettor_delta',   email: 'bettor.delta@fe-demo.com',   password: 'Demo2026!', role: 'demo' as const, coins: 9_999_999 },
      { username: 'bettor_epsilon', email: 'bettor.epsilon@fe-demo.com', password: 'Demo2026!', role: 'demo' as const, coins: 9_999_999 },
    ];

    const demoBettorIds: mongoose.Types.ObjectId[] = [];
    let bettorsCreated = 0;
    for (const b of DEMO_BETTORS_DATA) {
      let bettor = await User.findOne({ email: b.email }).lean();
      if (!bettor) {
        bettor = await User.create(b);
        bettorsCreated++;
      }
      demoBettorIds.push(new mongoose.Types.ObjectId(String(bettor._id)));
    }
    results.bettors = { created: bettorsCreated, total: demoBettorIds.length };

    let betsMarketsSeeded = 0;
    let betsMarketsSkipped = 0;
    // Plage : entre -30j et -8j pour ne pas polluer les stats récentes (24h/7j)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
    const eightDaysAgo  = Date.now() - 8  * 24 * 3600 * 1000;

    for (const market of createdMarkets) {
      const marketId = String(market._id);
      const hasBets = await Bet.exists({ marketId: new mongoose.Types.ObjectId(marketId) });
      if (hasBets) { betsMarketsSkipped++; continue; }

      const rng = createRng(strSeed(marketId + '_bets'));
      const betsToInsert: object[] = [];

      for (const option of market.options) {
        const optionId = String(option._id);
        const targetTotal: number = (option as { totalBets?: number }).totalBets ?? 0;
        if (targetTotal <= 0) continue;

        const probability = Math.max(1, (option as { probability?: number }).probability ?? 50);
        const odds = parseFloat((100 / probability).toFixed(2));
        const NUM_BETS = 5;

        let remaining = targetTotal;
        for (let i = 0; i < NUM_BETS; i++) {
          const isLast = i === NUM_BETS - 1;
          const amount = isLast
            ? remaining
            : Math.max(1, Math.round(remaining * (0.1 + rng() * 0.3)));
          remaining = Math.max(0, remaining - amount);
          if (amount <= 0) continue;

          const bettorId = demoBettorIds[Math.floor(rng() * demoBettorIds.length)];
          const potentialWin = parseFloat((amount * odds).toFixed(2));
          const createdAt = new Date(thirtyDaysAgo + rng() * (eightDaysAgo - thirtyDaysAgo));

          betsToInsert.push({
            _id: new mongoose.Types.ObjectId(),
            userId: bettorId,
            marketId: new mongoose.Types.ObjectId(marketId),
            optionId,
            amount,
            odds,
            potentialWin,
            status: 'pending',
            createdAt,
            updatedAt: createdAt,
          });
        }
      }

      if (betsToInsert.length > 0) {
        await Bet.collection.insertMany(betsToInsert);
        betsMarketsSeeded++;
      }
    }
    results.bets = { markets_seeded: betsMarketsSeeded, markets_skipped: betsMarketsSkipped };

    return NextResponse.json({
      success: true,
      message: 'Seed terminé avec succès',
      results,
    });
  } catch (err) {
    console.error('[POST /api/admin/seed]', err);
    return NextResponse.json(
      { error: 'Erreur lors du seed', details: String(err) },
      { status: 500 }
    );
  }
}

// GET pour vérifier l'état de la DB
export async function GET() {
  try {
    await connectDB();
    const [usersCount, categoriesCount, marketsCount] = await Promise.all([
      User.countDocuments(),
      Category.countDocuments(),
      Market.countDocuments(),
    ]);
    return NextResponse.json({
      connected: true,
      counts: { users: usersCount, categories: categoriesCount, markets: marketsCount },
    });
  } catch (err) {
    return NextResponse.json({ connected: false, error: String(err) }, { status: 500 });
  }
}
