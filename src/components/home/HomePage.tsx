'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import MarketCard from '@/components/markets/MarketCard';
import DepositModal from '@/components/wallet/DepositModal';
import { IMarket, MarketCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '@/types';
import { OPTION_COLORS, genChartData } from '@/lib/demo-data';
import { formatTimeLeft, formatCoins } from '@/lib/utils';
import { ChevronLeft, ChevronRight, TrendingUp, Clock, Flame, ArrowUpRight } from 'lucide-react';

// ─── Multi-Line Chart (seeded, no hydration issue) ───────────────────────────

function MultiLineChart({ market }: { market: IMarket }) {
  const W = 420, H = 180;
  const PAD = { top: 28, right: 52, bottom: 32, left: 6 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const PTS = 28;

  const gridLines = [0, 25, 50, 75, 100];
  const yScale = (v: number) => PAD.top + (1 - v / 100) * cH;
  const xScale = (i: number) => PAD.left + (i / (PTS - 1)) * cW;

  const series = market.options.map((opt, idx) => ({
    label: opt.label,
    probability: opt.probability,
    color: OPTION_COLORS[idx] ?? '#fff',
    data: genChartData(market._id, idx, opt.probability, PTS),
  }));

  const today = new Date();
  const dayLabels = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (4 - i));
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  });

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-3 flex-wrap">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1 text-xs">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: s.color }} />
            <span style={{ color: '#a0aad0' }}>{s.label}</span>
            <span className="font-black" style={{ color: s.color }}>{s.probability}%</span>
          </span>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {gridLines.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left} y1={yScale(v)}
              x2={W - PAD.right} y2={yScale(v)}
              stroke="rgba(255,255,255,0.07)"
              strokeDasharray="3 4"
            />
            <text x={W - PAD.right + 8} y={yScale(v) + 4} fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="Inter">
              {v}%
            </text>
          </g>
        ))}
        {dayLabels.map((label, i) => {
          const x = PAD.left + ((i / 4) * cW);
          return (
            <text key={i} x={x} y={H - 4} fontSize="9" fill="rgba(255,255,255,0.25)" textAnchor="middle" fontFamily="Inter">
              {label}
            </text>
          );
        })}
        {series.map((s) => {
          const points = s.data.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ');
          const lastX = xScale(PTS - 1);
          const lastY = yScale(s.data[PTS - 1]);
          return (
            <g key={s.label}>
              <polyline points={points} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={lastX} cy={lastY} r="4" fill={s.color} />
              <circle cx={lastX} cy={lastY} r="7" fill={s.color} fillOpacity="0.2" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Hero Slider ──────────────────────────────────────────────────────────────

function HeroSlider({ markets }: { markets: IMarket[] }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<'right' | 'left'>('right');

  // Hero = marchés live en premier, puis les plus gros volumes
  const heroMarkets = [
    ...markets.filter(m => m.status === 'live'),
    ...markets.filter(m => m.status !== 'live').sort((a, b) => b.totalVolume - a.totalVolume),
  ].slice(0, 5);

  const total = heroMarkets.length;

  const go = useCallback((d: 'prev' | 'next') => {
    setDir(d === 'next' ? 'right' : 'left');
    setIdx((i) => d === 'next' ? (i + 1) % total : (i - 1 + total) % total);
  }, [total]);

  const market = heroMarkets[idx];
  if (!market) return null;

  const isLive = market.status === 'live';
  const timeLeft = formatTimeLeft(market.endsAt);
  const animClass = dir === 'right' ? 'animate-slideInRight' : 'animate-slideInLeft';

  function calcOdds(p: number): string {
    if (p <= 0 || p >= 100) return '—';
    return (100 / p).toFixed(2) + 'x';
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(12,14,22,0.99)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
      }}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => go('prev')}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:brightness-125"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold" style={{ color: '#6b7db3' }}>
          {idx + 1} / {total}
        </span>
        <button
          onClick={() => go('next')}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:brightness-125"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <Link href={`/market/${market._id}`}>
        <div key={market._id} className={`flex flex-col lg:flex-row ${animClass}`}>
          <div className="flex-1 min-w-0 p-6 pr-4">
            <h2 className="text-2xl font-black leading-tight mb-5 pr-24" style={{ color: '#fff' }}>
              {market.title}
            </h2>
            <div className="mb-5">
              <div
                className="grid mb-1 px-2 py-1 text-xs font-semibold uppercase tracking-wider"
                style={{ gridTemplateColumns: '1fr 80px 80px', color: '#4a5380' }}
              >
                <span>Résultat</span>
                <span className="text-center">Cote</span>
                <span className="text-right">Probabilité</span>
              </div>
              {market.options.map((opt, oi) => (
                <div
                  key={String(opt._id)}
                  className="grid items-center px-2 py-2.5 rounded-xl mb-1 transition-all hover:brightness-110"
                  style={{
                    gridTemplateColumns: '1fr 80px 80px',
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: `2px solid ${OPTION_COLORS[oi]}`,
                  }}
                >
                  <span className="text-sm font-semibold" style={{ color: '#e0e6ff' }}>{opt.label}</span>
                  <span className="text-sm font-bold text-center" style={{ color: '#6b7db3' }}>{calcOdds(opt.probability)}</span>
                  <div className="flex justify-end">
                    <span
                      className="font-black text-sm rounded-full px-2.5 py-0.5"
                      style={{
                        border: `2px solid ${OPTION_COLORS[oi]}`,
                        color: OPTION_COLORS[oi],
                        minWidth: 50,
                        textAlign: 'center',
                        display: 'inline-block',
                      }}
                    >
                      {opt.probability}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs mb-4" style={{ color: '#4a5380' }}>
              <span>
                <span className="font-semibold" style={{ color: '#8892c4' }}>{formatCoins(market.totalVolume)}</span> € vol.
              </span>
              {market.marketCount && <span>{market.marketCount} marchés</span>}
              <span className="flex items-center gap-1"><Clock size={10} /> {timeLeft}</span>
              {isLive && (
                <span className="flex items-center gap-1 font-bold" style={{ color: '#f44336' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                  EN DIRECT
                </span>
              )}
            </div>
            {market.contextNews && (
              <p className="text-xs leading-relaxed" style={{ color: '#4a5380' }}>
                <span className="font-semibold mr-1" style={{ color: '#6b7db3' }}>Contexte ·</span>
                {market.contextNews}
              </p>
            )}
          </div>

          <div
            className="hidden lg:flex flex-col justify-center gap-3 p-5 shrink-0"
            style={{
              width: 440,
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(6,8,14,0.6)',
              position: 'relative',
            }}
          >
            <span className="absolute top-4 right-4 text-xs font-black tracking-widest opacity-25" style={{ color: '#00e676' }}>
              FLATEARTH
            </span>
            <MultiLineChart market={market} />
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-center gap-1.5 pb-3">
        {heroMarkets.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDir(i > idx ? 'right' : 'left'); setIdx(i); }}
            className="rounded-full transition-all"
            style={{
              width: i === idx ? 20 : 6,
              height: 6,
              background: i === idx ? '#00e676' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({ category, markets }: { category: MarketCategory; markets: IMarket[] }) {
  if (!markets.length) return null;
  const label = CATEGORY_LABELS[category];
  const icon  = CATEGORY_ICONS[category];

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: '#fff' }}>
          <span className="text-base">{icon}</span>
          {label}
        </h2>
        <Link
          href={`/category/${category}`}
          className="flex items-center gap-1 text-xs font-medium transition-all"
          style={{ color: '#4a5380' }}
        >
          Voir tout <ChevronRight size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {markets.slice(0, 3).map((m) => (
          <MarketCard key={String(m._id)} market={m} />
        ))}
      </div>
    </section>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function RightSidebar({ markets }: { markets: IMarket[] }) {
  const top5     = [...markets].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 5);
  const trending = markets.slice(0, 6);
  const featuredMarket = markets.find(m => m.status === 'live') ?? markets[0];

  return (
    <aside className="hidden xl:flex flex-col gap-3 shrink-0" style={{ width: 340 }}>

      {/* ── Événement phare ── */}
      {featuredMarket && (
        <Link href={`/market/${featuredMarket._id}`}>
          <div
            className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(145deg, #0c2415 0%, #071510 60%, #050d08 100%)',
              border: '1px solid rgba(0,230,118,0.18)',
            }}
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#00e676', opacity: 0.75 }}>
                  ÉVÉNEMENT PHARE
                </span>
                {featuredMarket.status === 'live' && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(244,67,54,0.15)', color: '#f44336' }}>
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-base font-black leading-snug mb-3" style={{ color: '#fff' }}>
                {featuredMarket.title}
              </p>
              {/* Options mini */}
              <div className="flex flex-col gap-1.5 mb-3">
                {featuredMarket.options.slice(0, 2).map((opt, i) => (
                  <div key={String(opt._id)} className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${opt.probability}%`, background: i === 0 ? '#00e676' : '#4fc3f7', transition: 'width 0.5s ease' }}
                      />
                    </div>
                    <span className="text-xs font-black w-8 text-right shrink-0" style={{ color: i === 0 ? '#00e676' : '#4fc3f7' }}>
                      {opt.probability}%
                    </span>
                    <span className="text-xs shrink-0 truncate" style={{ color: '#6b7db3', maxWidth: 80 }}>{opt.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#3a5040' }}>
                  {formatCoins(featuredMarket.totalVolume)} € vol.
                </span>
                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#00e676' }}>
                  Voir les paris <ChevronRight size={11} />
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ── Tendances ── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: '#0e1219', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm flex items-center gap-1.5" style={{ color: '#fff' }}>
            <Flame size={13} style={{ color: '#ff6b35' }} />
            Tendances
          </h3>
          <Link href="/" className="text-xs font-semibold transition-colors hover:text-white" style={{ color: '#4a5380' }}>
            Tout voir
          </Link>
        </div>
        <div className="flex flex-col">
          {trending.map((m, i) => (
            <Link
              key={String(m._id)}
              href={`/market/${m._id}`}
              className="flex items-start gap-2.5 py-2.5 group"
              style={{ borderBottom: i < trending.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              {/* Rang */}
              <span
                className="text-xs font-black w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#4a5380' }}
              >
                {i + 1}
              </span>
              {/* Titre + option */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-snug group-hover:text-white transition-colors line-clamp-2" style={{ color: '#c0c8e8' }}>
                  {m.title}
                </p>
                {/* Mini barre proba */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.options[0]?.probability ?? 50}%`, background: '#00e676' }}
                    />
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#4a5380' }}>{m.options[0]?.label}</span>
                </div>
              </div>
              {/* % + delta */}
              <div className="flex flex-col items-end shrink-0 gap-0.5">
                <span className="text-sm font-black" style={{ color: '#00e676' }}>{m.options[0]?.probability}%</span>
                <span className="text-xs font-semibold" style={{ color: '#2a6040' }}>
                  ▲ {((m.options[0]?.probability ?? 50) % 13) + 1}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Top Volume ── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: '#0e1219', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm flex items-center gap-1.5" style={{ color: '#fff' }}>
            <TrendingUp size={13} style={{ color: '#00e676' }} />
            Top Volume
          </h3>
        </div>
        <div className="flex flex-col">
          {top5.map((m, i) => (
            <Link
              key={String(m._id)}
              href={`/market/${m._id}`}
              className="flex items-center gap-2.5 py-2.5 group"
              style={{ borderBottom: i < top5.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              <span
                className="text-xs font-black w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{ background: i === 0 ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.06)', color: i === 0 ? '#ffd700' : '#4a5380' }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate group-hover:text-white transition-colors" style={{ color: '#c0c8e8' }}>
                  {m.title}
                </p>
                <p className="text-xs mt-0.5 font-mono" style={{ color: '#3a4260' }}>
                  {formatCoins(m.totalVolume)} € vol.
                </p>
              </div>
              <div
                className="flex items-center gap-0.5 text-xs font-black px-2 py-1 rounded-lg shrink-0"
                style={{ background: 'rgba(0,230,118,0.08)', color: '#00e676', border: '1px solid rgba(0,230,118,0.15)' }}
              >
                <ArrowUpRight size={10} />
                {m.options[0]?.probability}%
              </div>
            </Link>
          ))}
        </div>
      </div>

    </aside>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl animate-pulse"
      style={{ height: 160, background: 'rgba(22,27,38,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}
    />
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const SECTIONS: MarketCategory[] = [
  'sport', 'politique', 'crypto', 'pop-culture', 'esport',
  'tele-realite', 'actualite', 'tech', 'economie', 'geopolitique',
];

function HomePageInner() {
  const searchParams = useSearchParams();
  const [markets,      setMarkets]      = useState<IMarket[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [depositOpen,  setDepositOpen]  = useState(false);

  useEffect(() => {
    fetch('/api/markets?limit=100')
      .then(r => r.json())
      .then(data => {
        setMarkets(data.markets ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Ouvrir DepositModal si ?wallet=open
  useEffect(() => {
    const w = searchParams.get('wallet');
    if (w === 'open') setDepositOpen(true);
  }, [searchParams]);

  const liveCount = markets.filter(m => m.status === 'live').length;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0f1117' }}>
      <Header isLoggedIn={false} coins={0} liveCount={liveCount} />

      {depositOpen && <DepositModal onClose={() => setDepositOpen(false)} />}

      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-5 p-5 max-w-screen-2xl mx-auto">

          <div className="flex-1 min-w-0">

            {/* ── Hero Slider ─────────────────────────────────────────── */}
            <div className="mb-6">
              {loading ? (
                <div className="rounded-2xl animate-pulse" style={{ height: 340, background: 'rgba(22,27,38,0.8)', border: '1px solid rgba(255,255,255,0.05)' }} />
              ) : (
                <HeroSlider markets={markets} />
              )}
            </div>

            {/* ── Sections catégories ───────────────────────────────── */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              SECTIONS.map((cat) => (
                <CategorySection
                  key={cat}
                  category={cat}
                  markets={markets.filter(m => m.category === cat)}
                />
              ))
            )}
          </div>

          {/* Sidebar droite */}
          {!loading && <RightSidebar markets={markets} />}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}
