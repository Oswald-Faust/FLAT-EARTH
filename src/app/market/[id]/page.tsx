'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import DepositModal from '@/components/wallet/DepositModal';
import { IMarket, CATEGORY_LABELS } from '@/types';
import CategoryIcon, { CATEGORY_COLORS } from '@/components/ui/CategoryIcon';
import { BADGE_COLORS } from '@/lib/demo-data';
import { formatCoins } from '@/lib/utils';
import {
  Calendar, MessageCircle, Share2, Download,
  ChevronDown, ChevronUp, Info, TrendingUp, Search,
  CornerDownRight, Heart,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PageProps { params: Promise<{ id: string }> }

const PERIODS = ['1D', '1W', '1M', 'ALL'] as const;
type Period = (typeof PERIODS)[number];

interface ChartSeries {
  optionId:           string;
  label:              string;
  color:              string;
  data:               { time: number; probability: number }[];
  currentProbability: number;
}

interface CommentUser { _id: string; username: string; avatar?: string }
interface CommentData {
  _id: string;
  content: string;
  likes: number;
  parentId: string | null;
  createdAt: string;
  userId: CommentUser | null;
  replies?: CommentData[];
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "À l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

// ─── Chart Kalshi-style (données réelles) ────────────────────────────────────
const VW = 900, VH = 220;
const PL = 8, PR = 52, PT = 12, PB = 28;
const CW = VW - PL - PR;
const CH = VH - PT - PB;
const xOf = (i: number, n: number) => PL + (i / Math.max(n - 1, 1)) * CW;

function KalshiChart({ series, loading }: { series: ChartSeries[]; loading: boolean }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Format des dates selon la plage temporelle
  function fmtTime(ts: number, spanMs: number): string {
    const d = new Date(ts);
    if (spanMs < 2 * 86400_000)
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (spanMs < 14 * 86400_000)
      return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    if (spanMs < 90 * 86400_000)
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !series[0]) return;
    const n = series[0].data.length;
    const left  = rect.left + (PL / VW) * rect.width;
    const right = rect.left + ((VW - PR) / VW) * rect.width;
    const frac  = Math.max(0, Math.min(1, (e.clientX - left) / (right - left)));
    setHoverIdx(Math.round(frac * (n - 1)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 220 }}>
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#00e676', borderTopColor: 'transparent' }} />
      </div>
    );
  }
  if (!series.length || !series[0]?.data.length) {
    return (
      <div className="flex items-center justify-center text-sm" style={{ height: 220, color: 'var(--text-muted)' }}>
        Aucune donnée disponible pour cette période.
      </div>
    );
  }

  const n      = series[0].data.length;
  const times  = series[0].data.map(d => d.time);
  const spanMs = times[times.length - 1] - times[0];

  // ── Échelle Y dynamique ──────────────────────────────────────────────────────
  const allProbs = series.flatMap(s => s.data.map(d => d.probability));
  const maxProb  = Math.max(...allProbs);
  const yTop     = Math.min(100, Math.max(maxProb * 1.25, 10));
  const scaleY   = (v: number) => PT + CH * (1 - v / yTop);

  const yStep  = yTop <= 15 ? 3 : yTop <= 30 ? 5 : yTop <= 60 ? 10 : 20;
  const yTicks = Array.from(
    { length: Math.ceil(yTop / yStep) + 1 },
    (_, i) => i * yStep
  ).filter(v => v <= yTop + 0.5);

  const xLabelIdxs = [0, Math.floor(n * 0.33), Math.floor(n * 0.66), n - 1]
    .filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="relative w-full" onMouseLeave={() => setHoverIdx(null)}>

      {/* ── Tooltip hover ─────────────────────────────────────────────────── */}
      {hoverIdx !== null && (() => {
        const ts  = times[hoverIdx];
        const d   = new Date(ts);
        const lbl = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
          (spanMs < 7 * 86400_000 ? ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');
        const xPct = ((xOf(hoverIdx, n) - PL) / CW) * 100;
        return (
          <div
            className="absolute z-10 pointer-events-none"
            style={{ left: `${xPct}%`, top: 0, transform: 'translateX(-50%)' }}
          >
            <div
              className="rounded-xl px-3 py-2 text-xs whitespace-nowrap"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-bright)' }}
            >
              <div className="font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{lbl}</div>
              {series.map(s => (
                <div key={s.optionId} className="flex items-center gap-2 mb-0.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span style={{ color: s.color }}>{s.label}</span>
                  <span className="font-black ml-3" style={{ color: 'var(--text-primary)' }}>
                    {s.data[hoverIdx]?.probability ?? 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        aria-hidden
      >
        {/* Grid horizontale */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PL} x2={VW - PR} y1={scaleY(v)} y2={scaleY(v)}
              stroke="var(--border-light)" strokeWidth="1"
              strokeDasharray={v === 0 ? 'none' : '3,5'}
            />
            <text x={VW - PR + 8} y={scaleY(v) + 4}
              fill="var(--text-muted)" fontSize="10" fontFamily="Inter, sans-serif">
              {v}%
            </text>
          </g>
        ))}

        {/* Labels axe X (vraies dates) */}
        {xLabelIdxs.map(i => (
          <text key={i} x={xOf(i, n)} y={VH - 6}
            textAnchor="middle" fill="var(--text-dim)"
            fontSize="10" fontFamily="Inter, sans-serif">
            {fmtTime(times[i], spanMs)}
          </text>
        ))}

        {/* Area fills */}
        {series.map((s, si) => {
          const pts = s.data.map((d, i) => `${xOf(i, n)},${scaleY(d.probability)}`).join(' ');
          return (
            <polygon key={si}
              points={`${PL},${scaleY(0)} ${pts} ${xOf(n - 1, n)},${scaleY(0)}`}
              fill={s.color} fillOpacity="0.06"
            />
          );
        })}

        {/* Lines */}
        {series.map((s, si) => (
          <polyline key={si}
            points={s.data.map((d, i) => `${xOf(i, n)},${scaleY(d.probability)}`).join(' ')}
            fill="none" stroke={s.color} strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round"
          />
        ))}

        {/* End labels + cercles */}
        {series.map((s, si) => {
          const last = s.data[n - 1];
          const cx   = xOf(n - 1, n);
          const cy   = scaleY(last.probability);
          return (
            <g key={si}>
              <circle cx={cx} cy={cy} r="4" fill={s.color} />
              <text x={cx - 8} y={cy - 8} textAnchor="end"
                fill={s.color} fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">
                {s.label.length > 6 ? s.label.slice(0, 5).toUpperCase() : s.label.toUpperCase()}
              </text>
              <text x={cx - 8} y={cy + 4} textAnchor="end"
                fill={s.color} fontSize="13" fontWeight="900" fontFamily="Inter, sans-serif">
                {s.currentProbability}%
              </text>
            </g>
          );
        })}

        {/* Hover : ligne + cercles */}
        {hoverIdx !== null && (
          <g>
            <line
              x1={xOf(hoverIdx, n)} x2={xOf(hoverIdx, n)}
              y1={PT} y2={VH - PB}
              stroke="var(--border-medium)" strokeWidth="1" strokeDasharray="3,3"
            />
            {series.map(s => (
              <circle key={s.optionId}
                cx={xOf(hoverIdx, n)} cy={scaleY(s.data[hoverIdx].probability)}
                r="5" fill={s.color} stroke="var(--bg-primary)" strokeWidth="2"
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ title, icon, children, defaultOpen = false }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full py-3.5 text-left">
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
          {title}
        </span>
        {open
          ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
          : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        }
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

// ─── Trade Panel — style Kalshi/Polymarket ────────────────────────────────────
function TradePanel({
  market,
  selectedIdx,
  setSelectedIdx,
  betSide,
  setBetSide,
  amount,
  setAmount,
}: {
  market: IMarket;
  selectedIdx: number;
  setSelectedIdx: (i: number) => void;
  betSide: 'yes' | 'no';
  setBetSide: (s: 'yes' | 'no') => void;
  amount: string;
  setAmount: (v: string) => void;
}) {
  const { data: session } = useSession();
  const [submitting,    setSubmitting]    = useState(false);
  const [result,        setResult]        = useState<{ ok: boolean; msg: string } | null>(null);
  const [gainVisible,   setGainVisible]   = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [depositOpen,   setDepositOpen]   = useState(false);

  const isLoggedIn = !!session?.user;
  const isClosed   = market.status === 'closed' || market.status === 'resolved';

  // Charger le solde wallet
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/wallet/balance')
      .then(r => r.json())
      .then(d => { if (typeof d.balance === 'number') setWalletBalance(d.balance); })
      .catch(() => {});
  }, [isLoggedIn]);
  const isBinary   = market.options.length === 2;

  const actualIdx    = betSide === 'no' && isBinary ? (selectedIdx === 0 ? 1 : 0) : selectedIdx;
  const opt          = market.options[actualIdx] ?? market.options[0];
  const displayOpt   = market.options[selectedIdx] ?? market.options[0];
  const numAmount    = parseInt(amount) || 0;
  const effectiveAmt = numAmount > 0 ? numAmount : 1;
  const odds         = opt.probability > 0 ? 100 / opt.probability : 1;
  const potWin       = parseFloat((effectiveAmt * odds).toFixed(2));
  const profit       = parseFloat((potWin - effectiveAmt).toFixed(2));
  const sideColor    = betSide === 'yes' ? '#00e676' : '#f44336';

  const handleAmountChange = (v: string) => {
    setAmount(v);
    setResult(null);
    // Animation flash sur la section gains
    setGainVisible(false);
    setTimeout(() => setGainVisible(true), 40);
  };

  const handleBet = async () => {
    if (!isLoggedIn || submitting || isClosed) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId: String(market._id), optionId: String(opt._id), amount: effectiveAmt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, msg: data.error ?? 'Erreur' });
      } else {
        setResult({ ok: true, msg: `✓ Pari placé — gain potentiel ${potWin.toFixed(2)} €` });
        setAmount('1');
        // Rafraîchir le solde wallet
        fetch('/api/wallet/balance')
          .then(r => r.json())
          .then(d => { if (typeof d.balance === 'number') setWalletBalance(d.balance); })
          .catch(() => {});
      }
    } catch {
      setResult({ ok: false, msg: 'Erreur réseau' });
    } finally {
      setSubmitting(false);
    }
  };

  const insufficientFunds = isLoggedIn && walletBalance !== null && walletBalance < effectiveAmt * 100;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg-item-hover)', color: 'var(--text-secondary)' }}>
          <CategoryIcon slug={market.category} size={15} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{market.title}</p>
          <p className="text-xs font-black mt-0.5" style={{ color: sideColor }}>
            Acheter · {opt.label}
          </p>
        </div>
      </div>

      {/* ── Tabs Acheter / Vendre ── */}
      <div className="flex px-4 pt-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <button
            className="px-3 pb-2 text-sm font-bold"
            style={{ color: 'var(--text-primary)', borderBottom: `2px solid ${sideColor}` }}
          >
            Parier
          </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">

        {/* ── Solde wallet ── */}
        {isLoggedIn && walletBalance !== null && (
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2"
            style={{ background: 'var(--bg-item)', border: '1px solid var(--border-light)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Solde disponible</span>
            <span className="text-xs font-black" style={{ color: walletBalance > 0 ? '#00e676' : '#f44336' }}>
              {(walletBalance / 100).toFixed(2)} €
            </span>
          </div>
        )}

        {/* ── Sélecteur multi-options ── */}
        {market.options.length > 2 && (
          <div className="flex gap-1.5 flex-wrap">
            {market.options.slice(0, 6).map((o, i) => (
              <button
                key={String(o._id)}
                onClick={() => { setSelectedIdx(i); setResult(null); }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: selectedIdx === i ? `${BADGE_COLORS[i]}22` : 'var(--bg-item)',
                  border: `1px solid ${selectedIdx === i ? BADGE_COLORS[i] + '70' : 'var(--border)'}`,
                  color: selectedIdx === i ? BADGE_COLORS[i] : 'var(--text-secondary)',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Option pills (binary) ── */}
        {isBinary && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setBetSide('yes'); setResult(null); }}
              className="py-2.5 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97] truncate px-2"
              style={{
                background: betSide === 'yes' ? '#00e676' : 'rgba(0,230,118,0.08)',
                border: betSide === 'yes' ? 'none' : '1.5px solid rgba(0,230,118,0.3)',
                color: betSide === 'yes' ? '#000' : '#00e676',
              }}
            >
              {market.options[0].label}&nbsp;{market.options[0].probability}¢
            </button>
            <button
              onClick={() => { setBetSide('no'); setResult(null); }}
              className="py-2.5 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97] truncate px-2"
              style={{
                background: betSide === 'no' ? '#f44336' : 'rgba(244,67,54,0.08)',
                border: betSide === 'no' ? 'none' : '1.5px solid rgba(244,67,54,0.3)',
                color: betSide === 'no' ? '#fff' : '#f44336',
              }}
            >
              {market.options[1].label}&nbsp;{market.options[1].probability}¢
            </button>
          </div>
        )}

        {/* ── Bloc Montant (style Polymarket) ── */}
        <div
          className="rounded-xl"
          style={{ background: 'var(--bg-item)', border: '1px solid var(--border-medium)', padding: '12px 14px' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Montant</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Min. 1 €</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-black" style={{ color: 'var(--text-muted)', fontSize: 20 }}>€</span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={e => handleAmountChange(e.target.value)}
                placeholder="1"
                className="bg-transparent outline-none font-black text-right"
                style={{ color: 'var(--text-primary)', fontSize: 30, width: 110 }}
              />
            </div>
          </div>
          {/* Quick picks */}
          <div className="flex gap-1.5 mt-3">
            {[1, 5, 10, 25].map(a => (
              <button
                key={a}
                onClick={() => handleAmountChange(String((numAmount || 0) + a))}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{ background: 'var(--bg-item-hover)', color: 'var(--text-secondary)' }}
              >
                +{a}€
              </button>
            ))}
          </div>
        </div>

        {/* ── Section "Pour gagner" — animée (style Polymarket) ── */}
        <div
          style={{
            background: 'var(--bg-item)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 16px',
            opacity:    gainVisible ? 1 : 0,
            transform:  gainVisible ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
          }}
        >
          {/* Ligne "Pour gagner" */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Pour gagner</span>
            <span className="font-black" style={{ color: '#00e676', fontSize: 26, lineHeight: 1 }}>
              {potWin.toFixed(2)} €
            </span>
          </div>

          {/* Barre de progression probabilité */}
          <div style={{ background: 'var(--bg-item-hover)', borderRadius: 99, height: 4, marginBottom: 10 }}>
            <div
              style={{
                width: `${opt.probability}%`,
                background: `linear-gradient(90deg, ${sideColor}, ${betSide === 'yes' ? '#00b8d4' : '#ff6b6b'})`,
                borderRadius: 99,
                height: 4,
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {/* Profit net */}
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Profit net</span>
            <span className="font-bold" style={{ color: '#00e676' }}>+{profit.toFixed(2)} €</span>
          </div>
        </div>

        {/* ── Résultat ── */}
        {result && (
          <div
            className="px-3 py-2.5 rounded-xl text-xs font-semibold"
            style={{
              background: result.ok ? 'rgba(0,230,118,0.08)' : 'rgba(244,67,54,0.08)',
              border: `1px solid ${result.ok ? 'rgba(0,230,118,0.2)' : 'rgba(244,67,54,0.2)'}`,
              color: result.ok ? '#00e676' : '#f44336',
            }}
          >
            {result.msg}
          </div>
        )}

        {/* ── CTA ── */}
        {!isLoggedIn ? (
          <Link
            href="/auth/login"
            className="w-full py-4 rounded-xl text-sm font-black flex items-center justify-center transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #00e676, #00b8d4)', color: '#000' }}
          >
            Se connecter pour parier
          </Link>
        ) : isClosed ? (
          <div className="w-full py-4 rounded-xl text-sm font-black flex items-center justify-center" style={{ background: 'var(--bg-item)', color: 'var(--text-muted)' }}>
            Marché fermé
          </div>
        ) : (
          <button
            onClick={insufficientFunds ? () => setDepositOpen(true) : handleBet}
            disabled={submitting}
            className="w-full py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: submitting
                ? 'var(--bg-item-hover)'
                : betSide === 'yes'
                  ? 'linear-gradient(135deg, #00e676, #00c853)'
                  : 'linear-gradient(135deg, #f44336, #e53935)',
              color: submitting ? 'var(--text-muted)' : '#fff',
              boxShadow: submitting ? 'none' : betSide === 'yes'
                ? '0 4px 24px rgba(0,230,118,0.35)'
                : '0 4px 24px rgba(244,67,54,0.35)',
            }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                Traitement…
              </>
            ) : (
              `Parier ${effectiveAmt} € · ${opt.label}`
            )}
          </button>
        )}

      </div>

      {/* DepositModal */}
      {depositOpen && (
        <DepositModal
          onClose={() => setDepositOpen(false)}
          currentBalance={walletBalance ?? 0}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MarketPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: session } = useSession();

  const [market,      setMarket]      = useState<IMarket | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [period,      setPeriod]      = useState<Period>('1M');
  const [chartSeries, setChartSeries] = useState<ChartSeries[]>([]);
  const [chartLoading,setChartLoading]= useState(true);

  // Comments
  const [comment,     setComment]     = useState('');
  const [comments,    setComments]    = useState<CommentData[]>([]);
  const [commLoading, setCommLoading] = useState(false);
  const [commError,   setCommError]   = useState('');
  const [replyingTo,  setReplyingTo]  = useState<string | null>(null);
  const [replyText,   setReplyText]   = useState('');
  const [likedIds,    setLikedIds]    = useState<Set<string>>(new Set());

  // Trade panel state (partagé avec la table Chance)
  const [selectedIdx,  setSelectedIdx]  = useState(0);
  const [betSide,      setBetSide]      = useState<'yes' | 'no'>('yes');
  const [tradeAmount,  setTradeAmount]  = useState('1');
  const panelRef    = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // ── Chargement marché ──
  useEffect(() => {
    setLoading(true);
    fetch(`/api/markets/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data._id) setMarket(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // ── Chargement historique chart (re-fetch quand period change) ──
  useEffect(() => {
    setChartLoading(true);
    fetch(`/api/markets/${id}/history?period=${period}`)
      .then(r => r.json())
      .then(data => { setChartSeries(data.series ?? []); setChartLoading(false); })
      .catch(() => setChartLoading(false));
  }, [id, period]);

  // ── Chargement commentaires ──
  useEffect(() => {
    setCommLoading(true);
    fetch(`/api/comments?marketId=${id}`)
      .then(r => r.json())
      .then(data => { setComments(data.comments ?? []); setCommLoading(false); })
      .catch(() => setCommLoading(false));
  }, [id]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Header isLoggedIn={false} coins={0} liveCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: '#00e676', borderTopColor: 'transparent' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement…</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!market) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Header isLoggedIn={false} coins={0} liveCount={0} />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <p className="text-4xl">🌐</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Marché introuvable</p>
          <Link href="/" className="text-xs font-bold" style={{ color: '#00e676' }}>← Retour</Link>
        </div>
      </div>
    );
  }

  const isLive   = market.status === 'live';
  const catLabel = CATEGORY_LABELS[market.category];
  const iconColor = CATEGORY_COLORS[market.category] ?? '#8d97b8';
  const mId      = String(market._id);

  const handleScrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: market.title, url }); } catch { /* annulé */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadCSV = () => {
    const rows: (string | number)[][] = [
      ['Titre', market.title],
      ['Statut', market.status],
      ['Catégorie', catLabel ?? market.category],
      ['Volume total', market.totalVolume],
      ['Frais créateur (%)', market.creatorFeePercent],
      ['Date de résolution', new Date(market.endsAt).toLocaleDateString('fr-FR')],
      [],
      ['Option', 'Probabilité (%)', 'Paris totaux (coins)'],
      ...market.options.map(o => [o.label, o.probability, (o as { totalBets?: number }).totalBets ?? '']),
    ];

    if (chartSeries.length > 0 && chartSeries[0].data.length > 0) {
      rows.push([], ['Date', ...chartSeries.map(s => s.label)]);
      const n = chartSeries[0].data.length;
      for (let i = 0; i < n; i++) {
        rows.push([
          new Date(chartSeries[0].data[i].time).toLocaleDateString('fr-FR'),
          ...chartSeries.map(s => s.data[i]?.probability ?? ''),
        ]);
      }
    }

    const csv = rows
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${market.title.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComment = async () => {
    if (!comment.trim() || !session) return;
    setCommError('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId: id, content: comment }),
      });
      const data = await res.json();
      if (!res.ok) { setCommError(data.error ?? 'Erreur'); return; }
      setComments(prev => [{ ...data.comment, replies: [] }, ...prev]);
      setComment('');
    } catch { setCommError('Erreur réseau'); }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || !session) return;
    setCommError('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId: id, content: replyText, parentId }),
      });
      const data = await res.json();
      if (!res.ok) { setCommError(data.error ?? 'Erreur'); return; }
      setComments(prev => prev.map(c =>
        c._id === parentId
          ? { ...c, replies: [...(c.replies ?? []), data.comment] }
          : c
      ));
      setReplyText('');
      setReplyingTo(null);
    } catch { setCommError('Erreur réseau'); }
  };

  const handleLike = async (commentId: string, isReply = false, parentId?: string) => {
    if (likedIds.has(commentId)) return;
    setLikedIds(prev => new Set(prev).add(commentId));
    try {
      await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
      setComments(prev => prev.map(c => {
        if (!isReply && c._id === commentId) return { ...c, likes: c.likes + 1 };
        if (isReply && c._id === parentId) {
          return { ...c, replies: (c.replies ?? []).map(r => r._id === commentId ? { ...r, likes: r.likes + 1 } : r) };
        }
        return c;
      }));
    } catch { setLikedIds(prev => { const s = new Set(prev); s.delete(commentId); return s; }); }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header isLoggedIn={!!session} coins={0} liveCount={isLive ? 1 : 0} />

      {/* ══ BODY ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══ MAIN ══════════════════════════════════════════════════════════ */}
        <main
          className="flex-1 min-w-0 overflow-y-auto"
          style={{ padding: '20px 24px 40px 24px' }}
        >

          {/* ── Breadcrumb + Title ─────────────────────────────────────────── */}
          <div className="flex items-start gap-4 mb-6">

            {/* Big icon (Kalshi style) */}
            <div
              className="shrink-0 rounded-2xl flex items-center justify-center"
              style={{
                width: 72, height: 72,
                background: `${iconColor}14`,
                border: `1.5px solid ${iconColor}35`,
                color: iconColor,
              }}
            >
              <CategoryIcon slug={market.category} size={30} strokeWidth={1.5} />
            </div>

            {/* Title block */}
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs mb-2 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                <Link href="/" className="hover:text-white transition-colors">Marchés</Link>
                <span>·</span>
                <Link href={`/category/${market.category}`} className="hover:text-white transition-colors capitalize">{catLabel}</Link>
                {market.subcategory && (
                  <>
                    <span>·</span>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{market.subcategory}</span>
                  </>
                )}
                {isLive && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-bold" style={{ color: '#f44336' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                      EN DIRECT
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                {market.title}
              </h1>
              {market.description && (
                <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: 600 }}>
                  {market.description}
                </p>
              )}
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-0.5 shrink-0 mt-1 relative">
              <button
                title="Calendrier"
                className="p-2.5 rounded-xl transition-all hover:bg-white/8"
                style={{ color: 'var(--text-muted)' }}
              >
                <Calendar size={16} />
              </button>
              <button
                title="Commentaires"
                onClick={handleScrollToComments}
                className="p-2.5 rounded-xl transition-all hover:bg-white/8"
                style={{ color: 'var(--text-muted)' }}
              >
                <MessageCircle size={16} />
              </button>
              <button
                title={copied ? 'Lien copié !' : 'Partager'}
                onClick={handleShare}
                className="p-2.5 rounded-xl transition-all hover:bg-white/8 relative"
                style={{ color: copied ? '#00e676' : 'var(--text-muted)' }}
              >
                <Share2 size={16} />
                {copied && (
                  <span
                    className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap pointer-events-none"
                    style={{ background: '#00e676', color: '#000' }}
                  >
                    Copié !
                  </span>
                )}
              </button>
              <button
                title="Télécharger CSV"
                onClick={handleDownloadCSV}
                className="p-2.5 rounded-xl transition-all hover:bg-white/8"
                style={{ color: 'var(--text-muted)' }}
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          {/* ── Chart ──────────────────────────────────────────────────────── */}
          <div
            className="rounded-2xl mb-1 overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '20px 8px 8px 8px' }}
          >
            <KalshiChart series={chartSeries} loading={chartLoading} />
          </div>

          {/* ── Volume + Periods ────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-2 py-3 mb-5"
            style={{ borderBottom: '1px solid var(--border-light)' }}
          >
            <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <TrendingUp size={13} />
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatCoins(market.totalVolume)}</span>
              <span>€ vol.</span>
            </span>
            <div className="flex items-center gap-0.5">
              {PERIODS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: period === p ? 'var(--bg-item-hover)' : 'transparent',
                    color:      period === p ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {p}
                </button>
              ))}
              {/* Options icon like Kalshi */}
              <button
                className="ml-1 p-1.5 rounded-lg transition-all hover:bg-white/5"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Chance Table (Kalshi style) ─────────────────────────────────── */}
          <div className="mb-6">
            {/* Table header */}
            <div
              className="flex items-center justify-between px-2 py-2 mb-1"
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Chance</span>
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color: 'var(--text-muted)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                <button className="p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color: 'var(--text-muted)' }}>
                  <Search size={13} />
                </button>
              </div>
            </div>

            {/* Rows */}
            {market.options.map((opt, idx) => {
              const color  = BADGE_COLORS[idx] ?? '#aaa';
              const change = ((opt.probability % 7) + 1) * (idx % 2 === 0 ? 1 : -1);
              const isUp   = change >= 0;
              return (
                <div
                  key={String(opt._id)}
                  className="flex items-center gap-3 px-3 py-3.5 transition-all hover:bg-white/[0.025] cursor-pointer"
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  {/* Option icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${color}15`,
                      border: `1.5px solid ${color}30`,
                      color,
                    }}
                  >
                    <CategoryIcon slug={market.category} size={17} strokeWidth={1.75} />
                  </div>

                  {/* Name */}
                  <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text-label)' }}>
                    {opt.label}
                  </span>

                  {/* % + trend */}
                  <div className="flex items-center gap-1.5 shrink-0" style={{ minWidth: 80 }}>
                    <span className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                      {opt.probability}%
                    </span>
                    <span
                      className="text-xs font-bold flex items-center gap-0.5"
                      style={{ color: isUp ? '#00e676' : '#f44336' }}
                    >
                      {isUp ? '▲' : '▼'} {Math.abs(change)}
                    </span>
                  </div>

                  {/* Yes button */}
                  <button
                    onClick={() => {
                      setSelectedIdx(idx);
                      setBetSide('yes');
                      if (!tradeAmount) setTradeAmount('10');
                      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }}
                    className="rounded-full font-black text-sm transition-all hover:brightness-115 active:scale-95"
                    style={{
                      background: selectedIdx === idx && betSide === 'yes' ? 'rgba(0,230,118,0.2)' : 'rgba(0,230,118,0.1)',
                      border:     `1.5px solid ${selectedIdx === idx && betSide === 'yes' ? '#00e676' : 'rgba(0,230,118,0.5)'}`,
                      color:      '#00e676',
                      padding:    '6px 22px',
                      minWidth:   100,
                    }}
                  >
                    Yes&nbsp;{opt.probability}¢
                  </button>

                  {/* No button */}
                  <button
                    onClick={() => {
                      setSelectedIdx(idx);
                      setBetSide('no');
                      if (!tradeAmount) setTradeAmount('10');
                      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }}
                    className="rounded-full font-black text-sm transition-all hover:brightness-115 active:scale-95"
                    style={{
                      background: selectedIdx === idx && betSide === 'no' ? 'rgba(244,67,54,0.15)' : 'var(--bg-item)',
                      border:     `1.5px solid ${selectedIdx === idx && betSide === 'no' ? '#f44336' : 'var(--border)'}`,
                      color:      selectedIdx === idx && betSide === 'no' ? '#f44336' : 'var(--text-bright)',
                      padding:    '6px 22px',
                      minWidth:   100,
                    }}
                  >
                    No&nbsp;{100 - opt.probability}¢
                  </button>
                </div>
              );
            })}

            <Link
              href={`/category/${market.category}`}
              className="flex items-center gap-1 text-sm px-3 py-3 hover:text-white transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              More markets
            </Link>
          </div>

          {/* ── Accordions ─────────────────────────────────────────────────── */}
          <div
            className="rounded-2xl px-5 mb-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <Accordion title="Règles du marché" icon={<Info size={13} />} defaultOpen>
              {market.rules && (
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{market.rules}</p>
              )}
              {market.contextNews && (
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Contexte · </span>
                  {market.contextNews}
                </p>
              )}
              {!market.rules && !market.contextNews && (
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {`Si "${market.options[0]?.label}" est l'issue correcte, ce marché se résout en Oui. Les sources officielles feront foi.`}
                </p>
              )}
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                Si aucune issue n&apos;est déterminée avant la date d&apos;expiration, tous les marchés se résolvent en Non.
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/5 transition-all" style={{ border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                  Règles complètes
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/5 transition-all" style={{ border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}>
                  Centre d&apos;aide
                </button>
              </div>
            </Accordion>

            <Accordion title="Calendrier et paiement" icon={<Calendar size={13} />}>
              <div className="flex flex-col gap-3">
                {([
                  ['Date de résolution', new Date(market.endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })],
                  ['Frais créateur', `${market.creatorFeePercent}%`],
                  ['Volume total', `${formatCoins(market.totalVolume)} €`],
                  ['Statut', market.status === 'live' ? '🔴 En direct' : market.status === 'open' ? '🟢 Ouvert' : '⚫ Fermé'],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ color: 'var(--text-bright)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </Accordion>

            <Accordion title="Restrictions de trading" icon={<span style={{ fontSize: 13 }}>🚫</span>}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Ce marché est réservé aux utilisateurs vérifiés. Paris exclusivement en coins FlatEarth.
              </p>
            </Accordion>
          </div>

          {/* ── Comments ───────────────────────────────────────────────────── */}
          <div
            ref={commentsRef}
            className="rounded-2xl p-5 mb-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Header */}
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-bright)' }}>
              <MessageCircle size={14} style={{ color: 'var(--text-muted)' }} />
              Avis de la communauté
              {!commLoading && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-black" style={{ background: 'var(--bg-item-hover)', color: 'var(--text-secondary)' }}>
                  {comments.length}
                </span>
              )}
            </h3>

            {/* Champ nouveau commentaire */}
            {session ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4" style={{ background: 'var(--bg-item)', border: '1px solid var(--border-medium)' }}>
                <input
                  type="text" value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleComment()}
                  placeholder="Écrire un commentaire…"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  onClick={handleComment}
                  disabled={!comment.trim()}
                  className="px-3 py-1 rounded-lg text-xs font-black hover:brightness-110 transition-all shrink-0 disabled:opacity-40"
                  style={{ background: '#00e676', color: '#000' }}
                >
                  Envoyer
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl mb-4 text-sm transition-all hover:bg-white/5"
                style={{ background: 'var(--bg-item)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
              >
                <MessageCircle size={14} />
                Connecte-toi pour commenter
              </Link>
            )}

            {commError && (
              <p className="text-xs mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.2)', color: '#f44336' }}>
                {commError}
              </p>
            )}

            {/* Liste commentaires */}
            {commLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: '#00e676', borderTopColor: 'transparent' }} />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                Aucun commentaire pour l&apos;instant. Sois le premier !
              </p>
            ) : (
              <div className="flex flex-col">
                {comments.map((c, i) => {
                  const username = c.userId?.username ?? 'Utilisateur';
                  const isLiked  = likedIds.has(c._id);
                  const isReplying = replyingTo === c._id;
                  return (
                    <div key={c._id} style={{ borderBottom: i < comments.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      {/* Commentaire principal */}
                      <div className="flex gap-3 py-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                          style={{ background: 'linear-gradient(135deg, #00e676, #4fc3f7)', color: '#000' }}
                        >
                          {username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold" style={{ color: 'var(--text-bright)' }}>{username}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{relativeTime(c.createdAt)}</span>
                          </div>
                          <p className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>{c.content}</p>
                          {session && (
                            <button
                              onClick={() => { setReplyingTo(isReplying ? null : c._id); setReplyText(''); }}
                              className="mt-2 text-xs font-semibold flex items-center gap-1 transition-colors hover:text-white"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <CornerDownRight size={11} />
                              Répondre
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => handleLike(c._id)}
                          className="flex items-center gap-1 text-xs shrink-0 self-start pt-1 transition-colors hover:text-red-400"
                          style={{ color: isLiked ? '#f44336' : 'var(--text-muted)' }}
                        >
                          <Heart size={11} fill={isLiked ? 'currentColor' : 'none'} />
                          {c.likes}
                        </button>
                      </div>

                      {/* Champ réponse inline */}
                      {isReplying && (
                        <div className="ml-11 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-item)', border: '1px solid var(--border-medium)' }}>
                          <input
                            type="text"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleReply(c._id)}
                            placeholder={`Répondre à ${username}…`}
                            autoFocus
                            className="flex-1 bg-transparent outline-none text-xs"
                            style={{ color: 'var(--text-primary)' }}
                          />
                          <button
                            onClick={() => handleReply(c._id)}
                            disabled={!replyText.trim()}
                            className="px-2.5 py-1 rounded-lg text-xs font-black hover:brightness-110 transition-all shrink-0 disabled:opacity-40"
                            style={{ background: '#00e676', color: '#000' }}
                          >
                            ↵
                          </button>
                        </div>
                      )}

                      {/* Réponses */}
                      {(c.replies ?? []).length > 0 && (
                        <div className="ml-11 mb-2 flex flex-col gap-0">
                          {(c.replies ?? []).map(r => {
                            const rUsername = r.userId?.username ?? 'Utilisateur';
                            const rLiked = likedIds.has(r._id);
                            return (
                              <div key={r._id} className="flex gap-2.5 py-2.5" style={{ borderTop: '1px solid var(--border-light)' }}>
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4fc3f7)', color: 'var(--text-primary)', fontSize: 9 }}
                                >
                                  {rUsername[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold" style={{ color: 'var(--text-bright)' }}>{rUsername}</span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{relativeTime(r.createdAt)}</span>
                                  </div>
                                  <p className="text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>{r.content}</p>
                                </div>
                                <button
                                  onClick={() => handleLike(r._id, true, c._id)}
                                  className="flex items-center gap-1 text-xs shrink-0 self-start pt-0.5 transition-colors hover:text-red-400"
                                  style={{ color: rLiked ? '#f44336' : 'var(--text-muted)' }}
                                >
                                  <Heart size={10} fill={rLiked ? 'currentColor' : 'none'} />
                                  {r.likes}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>

        {/* ══ SIDEBAR ═══════════════════════════════════════════════════════ */}
        <aside
          className="hidden lg:flex flex-col shrink-0 py-5 pr-5 pl-1"
          style={{ width: 340 }}
        >
          <div className="sticky flex flex-col gap-3" style={{ top: 72 }}>

            <div ref={panelRef}>
              <TradePanel
                market={market}
                selectedIdx={selectedIdx}
                setSelectedIdx={setSelectedIdx}
                betSide={betSide}
                setBetSide={setBetSide}
                amount={tradeAmount}
                setAmount={setTradeAmount}
              />
            </div>


          </div>
        </aside>
      </div>

      {/* ══ MOBILE BOTTOM BAR ═════════════════════════════════════════════════ */}
      <MobileTradeBar
        market={market}
        selectedIdx={selectedIdx}
        setSelectedIdx={setSelectedIdx}
        betSide={betSide}
        setBetSide={setBetSide}
        amount={tradeAmount}
        setAmount={setTradeAmount}
      />

    </div>
  );
}

// ─── Mobile Trade Bar + Bottom Sheet ─────────────────────────────────────────
function MobileTradeBar({
  market, selectedIdx, setSelectedIdx, betSide, setBetSide, amount, setAmount,
}: {
  market: IMarket;
  selectedIdx: number;
  setSelectedIdx: (i: number) => void;
  betSide: 'yes' | 'no';
  setBetSide: (s: 'yes' | 'no') => void;
  amount: string;
  setAmount: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const opt0 = market.options[0];

  return (
    <>
      {/* Barre sticky du bas */}
      <div
        className="lg:hidden sticky bottom-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{
          background: 'var(--header-bg)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-medium)',
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{market.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-black truncate max-w-[100px]" style={{ color: '#00e676' }}>{market.options[0]?.label} {opt0?.probability}¢</span>
            <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>·</span>
            <span className="text-xs font-black truncate max-w-[100px]" style={{ color: 'var(--text-bright)' }}>{market.options[1]?.label ?? 'Non'} {100 - (opt0?.probability ?? 50)}¢</span>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-6 py-2.5 rounded-xl text-sm font-black transition-all hover:brightness-110 shrink-0"
          style={{ background: 'linear-gradient(135deg, #00e676, #00b8d4)', color: '#000' }}
        >
          Parier
        </button>
      </div>

      {/* Overlay + bottom sheet */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'var(--shadow-overlay)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="rounded-t-3xl overflow-y-auto"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-medium)', maxHeight: '90vh' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-medium)' }} />
            </div>
            <div className="px-4 pb-8">
              <TradePanel
                market={market}
                selectedIdx={selectedIdx}
                setSelectedIdx={setSelectedIdx}
                betSide={betSide}
                setBetSide={setBetSide}
                amount={amount}
                setAmount={setAmount}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
