'use client';

import Link from 'next/link';
import { Clock, TrendingUp, Share2, Bookmark } from 'lucide-react';
import { IMarket, CATEGORY_LABELS, CATEGORY_ICONS } from '@/types';
import { BADGE_COLORS } from '@/lib/demo-data';
import { formatTimeLeft, formatCoins } from '@/lib/utils';

interface MarketCardProps {
  market: IMarket;
  variant?: 'default' | 'compact' | 'large';
}

function calcOdds(p: number): string {
  if (p <= 0 || p >= 100) return '—';
  return (100 / p).toFixed(2) + 'x';
}

function LiveBadge() {
  return (
    <span
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold shrink-0"
      style={{ background: 'rgba(244,67,54,0.18)', color: '#f44336', fontSize: 9 }}
    >
      <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse inline-block" />
      LIVE
    </span>
  );
}

// ── COMPACT (sidebar) ─────────────────────────────────────────────────────────
function CompactCard({ market }: { market: IMarket }) {
  return (
    <Link href={`/market/${market._id}`}>
      <div
        className="p-3 rounded-xl cursor-pointer transition-all hover:brightness-110 group"
        style={{
          background: 'rgba(18,22,34,0.8)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <p className="text-xs font-semibold mb-2 leading-snug group-hover:text-white transition-colors" style={{ color: '#cbd5f0' }}>
          {market.title}
        </p>
        <div className="flex items-center gap-1.5">
          {market.options.slice(0, 2).map((opt, idx) => (
            <div
              key={opt._id}
              className="flex-1 px-2 py-1 rounded-lg text-center text-xs font-bold"
              style={{
                background: `${BADGE_COLORS[idx]}14`,
                color: BADGE_COLORS[idx],
                border: `1px solid ${BADGE_COLORS[idx]}35`,
              }}
            >
              {opt.label} {opt.probability}%
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ── LARGE (featured, spans 2 col rows in category grid) ──────────────────────
function LargeCard({ market }: { market: IMarket }) {
  const isLive = market.status === 'live';
  const icon = CATEGORY_ICONS[market.category];
  const timeLeft = formatTimeLeft(market.endsAt);

  // Gradient per category
  const gradients: Partial<Record<string, string>> = {
    politique:   'linear-gradient(145deg, #0f1e3a 0%, #0a1228 100%)',
    sport:       'linear-gradient(145deg, #0b2216 0%, #071410 100%)',
    crypto:      'linear-gradient(145deg, #1a1500 0%, #0f0d00 100%)',
    esport:      'linear-gradient(145deg, #140a26 0%, #0c0618 100%)',
    'pop-culture':'linear-gradient(145deg, #200a26 0%, #130618 100%)',
  };
  const bg = gradients[market.category] ?? 'linear-gradient(145deg, #161b26 0%, #0f1117 100%)';

  return (
    <Link href={`/market/${market._id}`}>
      <div
        className="rounded-2xl overflow-hidden cursor-pointer h-full group transition-all hover:brightness-105"
        style={{ background: bg, border: '1px solid rgba(255,255,255,0.07)', minHeight: 260 }}
      >
        {/* Banner area */}
        <div className="relative flex items-center justify-center" style={{ height: 120, overflow: 'hidden' }}>
          <span style={{ fontSize: 64, opacity: 0.18, filter: 'blur(2px)' }}>{icon}</span>
          <span className="absolute" style={{ fontSize: 40, opacity: 0.7 }}>{icon}</span>
          {isLive && (
            <div className="absolute top-3 right-3">
              <LiveBadge />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#4a5380' }}>
            {CATEGORY_LABELS[market.category]}
          </p>
          <h3 className="text-base font-black leading-snug mb-4 group-hover:text-green-300 transition-colors" style={{ color: '#fff' }}>
            {market.title}
          </h3>

          <div className="flex flex-col gap-1.5 mb-3">
            {market.options.slice(0, 3).map((opt, idx) => (
              <div key={opt._id} className="flex items-center gap-2">
                <span className="text-sm flex-1 truncate" style={{ color: '#c8d0f0' }}>{opt.label}</span>
                <span className="text-xs font-semibold" style={{ color: '#4a5380' }}>{calcOdds(opt.probability)}</span>
                <div
                  className="font-black text-xs rounded-full px-2.5 py-0.5 shrink-0"
                  style={{
                    border: `1.5px solid ${BADGE_COLORS[idx]}`,
                    color: BADGE_COLORS[idx],
                    minWidth: 46,
                    textAlign: 'center',
                  }}
                >
                  {opt.probability}%
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs" style={{ color: '#4a5380' }}>
            <span className="flex items-center gap-1">
              <TrendingUp size={10} />
              {formatCoins(market.totalVolume)} € Vol.
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {timeLeft}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── DEFAULT (Polymarket grid card) ────────────────────────────────────────────
export default function MarketCard({ market, variant = 'default' }: MarketCardProps) {
  if (variant === 'compact') return <CompactCard market={market} />;
  if (variant === 'large')   return <LargeCard market={market} />;

  const isLive = market.status === 'live';
  const timeLeft = formatTimeLeft(market.endsAt);
  const icon = CATEGORY_ICONS[market.category];

  return (
    <Link href={`/market/${market._id}`} className="block h-full">
      <div
        className="card flex flex-col h-full cursor-pointer group"
        style={{ padding: '14px 16px' }}
      >
        {/* Header: icon + category + live badge */}
        <div className="flex items-start gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest truncate" style={{ color: '#4a5380', fontSize: 9 }}>
              {CATEGORY_LABELS[market.category]}
            </p>
          </div>
          {isLive && <LiveBadge />}
        </div>

        {/* Title */}
        <h3
          className="text-sm font-bold leading-snug mb-3 flex-1 group-hover:text-green-300 transition-colors"
          style={{ color: '#fff', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {market.title}
        </h3>

        {/* Options — Polymarket style with Oui/Non buttons */}
        <div className="flex flex-col gap-2 mb-3">
          {market.options.slice(0, 3).map((opt, idx) => (
            <div key={opt._id} className="flex items-center gap-2">
              <span className="text-xs flex-1 truncate" style={{ color: '#a0aad0' }}>
                {opt.label}
              </span>
              <span
                className="text-sm font-black shrink-0"
                style={{ color: BADGE_COLORS[idx] }}
              >
                {opt.probability}%
              </span>
              <button className="btn-yes shrink-0" style={{ color: BADGE_COLORS[idx], borderColor: `${BADGE_COLORS[idx]}55`, background: `${BADGE_COLORS[idx]}12` }}>
                Oui.
              </button>
              <button className="btn-no shrink-0">
                Non.
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-2 text-xs"
          style={{ color: '#4a5380', borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="flex items-center gap-1">
            <TrendingUp size={10} />
            {formatCoins(market.totalVolume)} € Vol.
          </span>
          <div className="flex items-center gap-1.5">
            <button className="p-1 rounded transition-all hover:text-white" style={{ color: '#4a5380' }}>
              <Share2 size={11} />
            </button>
            <button className="p-1 rounded transition-all hover:text-white" style={{ color: '#4a5380' }}>
              <Bookmark size={11} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
