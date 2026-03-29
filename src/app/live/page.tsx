'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useSession } from 'next-auth/react';
import { IMarket, CATEGORY_LABELS, CATEGORY_ICONS } from '@/types';
import { formatCoins } from '@/lib/utils';
import { Settings } from 'lucide-react';

// ─── Catégories sidebar ──────────────────────────────────────────────────────
const SIDEBAR_CATS: { key: string; label: string; icon: string }[] = [
  { key: 'all',         label: 'Tous',          icon: '🌐' },
  { key: 'sport',       label: 'Sport',         icon: '⚽' },
  { key: 'politique',   label: 'Politique',     icon: '🏛️' },
  { key: 'crypto',      label: 'Crypto',        icon: '₿'  },
  { key: 'esport',      label: 'eSport',        icon: '🎮' },
  { key: 'economie',    label: 'Économie',      icon: '📈' },
  { key: 'geopolitique',label: 'Géopolitique',  icon: '🌍' },
  { key: 'tech',        label: 'Tech & Science',icon: '🔬' },
  { key: 'pop-culture', label: 'Culture',       icon: '🎬' },
  { key: 'actualite',   label: 'Actualité',     icon: '📰' },
  { key: 'mentions',    label: 'Mentions',      icon: '💬' },
  { key: 'finance',     label: 'Finance',       icon: '💰' },
  { key: 'meteo',       label: 'Météo',         icon: '🌤️' },
  { key: 'tele-realite',label: 'Télé-réalité',  icon: '📺' },
  { key: 'climat',      label: 'Climat',        icon: '🌱' },
];

// ─── Demo live markets (fallback si DB vide) ─────────────────────────────────
const DEMO_LIVE: Partial<IMarket>[] = [
  {
    _id: 'demo-1',
    title: 'PSG vs Barcelone — Quarts Champions League',
    category: 'sport',
    subcategory: 'Football',
    status: 'live',
    totalVolume: 355000,
    endsAt: new Date(Date.now() + 7200000) as unknown as Date,
    options: [
      { _id: 'o1', label: 'PSG',       probability: 42, totalBets: 42000 },
      { _id: 'o2', label: 'Barcelone', probability: 58, totalBets: 58000 },
    ],
  },
  {
    _id: 'demo-2',
    title: 'Bitcoin dépasse $100K avant fin mars ?',
    category: 'crypto',
    subcategory: 'Bitcoin',
    status: 'live',
    totalVolume: 128000,
    endsAt: new Date(Date.now() + 3600000) as unknown as Date,
    options: [
      { _id: 'o3', label: 'Oui', probability: 34, totalBets: 34000 },
      { _id: 'o4', label: 'Non', probability: 66, totalBets: 66000 },
    ],
  },
  {
    _id: 'demo-3',
    title: 'Aryna Sabalenka remporte WTA Miami Open ?',
    category: 'sport',
    subcategory: 'Tennis',
    status: 'live',
    totalVolume: 5756000,
    endsAt: new Date(Date.now() + 5400000) as unknown as Date,
    options: [
      { _id: 'o5', label: 'Sabalenka', probability: 84, totalBets: 84000 },
      { _id: 'o6', label: 'Gauff',     probability: 16, totalBets: 16000 },
    ],
  },
  {
    _id: 'demo-4',
    title: 'Ethereum dépasse $4K cette semaine ?',
    category: 'crypto',
    subcategory: 'Ethereum',
    status: 'live',
    totalVolume: 89000,
    endsAt: new Date(Date.now() + 86400000) as unknown as Date,
    options: [
      { _id: 'o7', label: 'Oui', probability: 22, totalBets: 22000 },
      { _id: 'o8', label: 'Non', probability: 78, totalBets: 78000 },
    ],
  },
  {
    _id: 'demo-5',
    title: 'Real Madrid élimine Manchester City en quarts ?',
    category: 'sport',
    subcategory: 'Football',
    status: 'live',
    totalVolume: 412000,
    endsAt: new Date(Date.now() + 9000000) as unknown as Date,
    options: [
      { _id: 'o9',  label: 'Real Madrid',       probability: 61, totalBets: 61000 },
      { _id: 'o10', label: 'Manchester City',   probability: 39, totalBets: 39000 },
    ],
  },
  {
    _id: 'demo-6',
    title: 'Apple présente un casque AR avant juin 2026 ?',
    category: 'tech',
    subcategory: 'Apple',
    status: 'live',
    totalVolume: 44000,
    endsAt: new Date(Date.now() + 172800000) as unknown as Date,
    options: [
      { _id: 'o11', label: 'Oui', probability: 48, totalBets: 48000 },
      { _id: 'o12', label: 'Non', probability: 52, totalBets: 52000 },
    ],
  },
];

// ─── Live Market Card ─────────────────────────────────────────────────────────
function LiveCard({ market }: { market: Partial<IMarket> }) {
  const cat      = (market.category ?? 'sport') as keyof typeof CATEGORY_ICONS;
  const icon     = CATEGORY_ICONS[cat] ?? '🌐';
  const catLabel = CATEGORY_LABELS[cat] ?? market.category;
  const opts     = market.options ?? [];

  return (
    <Link href={`/market/${market._id}`}>
      <div
        className="rounded-2xl overflow-hidden transition-all hover:brightness-105 cursor-pointer"
        style={{ background: '#131720', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#4a5380' }}>
                {catLabel?.toString().toUpperCase()}
                {market.subcategory && <span style={{ color: '#2a3050' }}>&nbsp;·&nbsp;{market.subcategory}</span>}
              </p>
              <h3 className="text-sm font-black leading-snug" style={{ color: '#fff', maxWidth: 480 }}>
                {market.title}
              </h3>
              {/* LIVE badge */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                <span className="text-xs font-bold" style={{ color: '#f44336' }}>EN DIRECT</span>
                <span className="text-xs" style={{ color: '#3a4260' }}>·</span>
                <span className="text-xs" style={{ color: '#3a4260' }}>
                  Fin dans {Math.round((new Date(market.endsAt!).getTime() - Date.now()) / 60000)} min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="px-5 pb-4 flex flex-col gap-1.5">
          {opts.slice(0, 4).map((opt, i) => {
            const isLeader = opt.probability === Math.max(...opts.map(o => o.probability));
            return (
              <div
                key={String(opt._id)}
                className="flex items-center gap-3"
              >
                {/* Barre de progression */}
                <div className="flex-1 relative h-8 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                    style={{
                      width: `${opt.probability}%`,
                      background: i === 0
                        ? 'rgba(0,230,118,0.12)'
                        : i === 1
                          ? 'rgba(79,195,247,0.1)'
                          : 'rgba(255,255,255,0.06)',
                    }}
                  />
                  <div className="relative flex items-center justify-between h-full px-3">
                    <span className="text-sm font-semibold" style={{ color: '#c0c8e8' }}>{opt.label}</span>
                    {isLeader && (
                      <span className="text-xs font-bold" style={{ color: '#00e676' }}>★</span>
                    )}
                  </div>
                </div>

                {/* % badge */}
                <div
                  className="shrink-0 w-14 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                  style={{
                    background: isLeader ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.07)',
                    color: isLeader ? '#00e676' : '#8d97b8',
                    border: isLeader ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {opt.probability}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Card Footer */}
        <div
          className="flex items-center justify-between px-5 py-2.5 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#3a4260' }}
        >
          <span>{formatCoins(market.totalVolume ?? 0)} vol.</span>
          <span style={{ color: '#2a3050' }}>
            {(market as IMarket).options?.length ?? opts.length} options
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LivePage() {
  const { data: session } = useSession();
  const [markets,    setMarkets]    = useState<Partial<IMarket>[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activecat,  setActivecat]  = useState('all');
  const [count,      setCount]      = useState(0);
  const [tick,       setTick]       = useState(0);

  // Tick toutes les 30s pour simuler les mises à jour temps réel
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('/api/markets?status=live&limit=50')
      .then(r => r.json())
      .then(d => {
        const live = d.markets ?? [];
        // Si DB vide, utiliser démo
        const data = live.length > 0 ? live : DEMO_LIVE;
        setMarkets(data);
        setCount(data.length);
        setLoading(false);
      })
      .catch(() => {
        setMarkets(DEMO_LIVE);
        setCount(DEMO_LIVE.length);
        setLoading(false);
      });
  }, [tick]);

  const filtered = activecat === 'all'
    ? markets
    : markets.filter(m => m.category === activecat);

  // Compter par catégorie
  const catCounts: Record<string, number> = {};
  markets.forEach(m => {
    catCounts[m.category as string] = (catCounts[m.category as string] ?? 0) + 1;
  });

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0f1117' }}>
      <Header isLoggedIn={!!session} coins={0} liveCount={count} />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside
          className="hidden lg:flex flex-col shrink-0 py-4 overflow-y-auto"
          style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="px-5 pb-3 text-xs font-black uppercase tracking-widest" style={{ color: '#2a3260' }}>
            Catégories
          </p>
          <div className="flex flex-col gap-0.5 px-3">
            {SIDEBAR_CATS.map(cat => {
              const n = cat.key === 'all' ? markets.length : (catCounts[cat.key] ?? 0);
              const isActive = activecat === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActivecat(cat.key)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all hover:bg-white/5 text-left w-full"
                  style={{
                    background: isActive ? 'rgba(0,230,118,0.08)' : 'transparent',
                    color: isActive ? '#00e676' : n > 0 ? '#c0c8e8' : '#3a4260',
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <span style={{ fontSize: 15 }}>{cat.icon}</span>
                    <span className="font-semibold">{cat.label}</span>
                  </span>
                  {n > 0 && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: isActive ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.07)',
                        color: isActive ? '#00e676' : '#6b7db3',
                      }}
                    >
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto px-6 py-5">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
              <h1 className="text-2xl font-black" style={{ color: '#fff' }}>
                EN DIRECT
              </h1>
              <span
                className="px-2.5 py-1 rounded-full text-sm font-black"
                style={{ background: 'rgba(244,67,54,0.15)', color: '#f44336', border: '1px solid rgba(244,67,54,0.3)' }}
              >
                {count}
              </span>
            </div>
            <button
              className="p-2 rounded-xl transition-all hover:bg-white/5"
              style={{ color: '#4a5380' }}
              title="Paramètres"
            >
              <Settings size={16} />
            </button>
          </div>

          {/* Filtre mobile catégories */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
            {SIDEBAR_CATS.slice(0, 8).map(cat => (
              <button
                key={cat.key}
                onClick={() => setActivecat(cat.key)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: activecat === cat.key ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.06)',
                  color: activecat === cat.key ? '#00e676' : '#6b7db3',
                  border: `1px solid ${activecat === cat.key ? 'rgba(0,230,118,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Grille */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#f44336', borderTopColor: 'transparent' }} />
                <span className="text-sm" style={{ color: '#4a5380' }}>Chargement des événements en direct…</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <span className="text-5xl">📡</span>
              <p className="text-sm font-semibold" style={{ color: '#4a5380' }}>
                Aucun événement en direct dans cette catégorie
              </p>
              <button
                onClick={() => setActivecat('all')}
                className="text-xs font-bold px-4 py-2 rounded-xl transition-all hover:brightness-110"
                style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676', border: '1px solid rgba(0,230,118,0.25)' }}
              >
                Voir tout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-3xl">
              {filtered.map(m => (
                <LiveCard key={String(m._id)} market={m} />
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
