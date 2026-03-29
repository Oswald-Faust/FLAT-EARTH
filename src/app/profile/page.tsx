'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Header from '@/components/layout/Header';
import { formatCoins } from '@/lib/utils';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/types';
import {
  Settings, LogOut, ArrowDownToLine, ArrowUpFromLine,
  TrendingUp, Trophy, Zap, Target,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileData {
  user: {
    _id: string; username: string; email: string; coins: number;
    role: string; createdAt: string;
  };
  stats: {
    totalBets: number; wonBets: number; lostBets: number; activeBets: number;
    totalWon: number; totalSpent: number; biggestWin: number;
    winRate: number; activeMarketsCount: number;
  };
  recentBets: {
    _id: string; amount: number; status: string; potentialWin: number;
    odds: number; createdAt: string;
    marketId?: { _id: string; title: string; category: string; status: string };
  }[];
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'En cours', color: '#ffd700', bg: 'rgba(255,215,0,0.1)' },
    won:     { label: 'Gagné',    color: '#00e676', bg: 'rgba(0,230,118,0.1)' },
    lost:    { label: 'Perdu',    color: '#f44336', bg: 'rgba(244,67,54,0.1)' },
    cancelled:{ label: 'Annulé', color: '#6b7db3', bg: 'rgba(107,125,179,0.1)' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = '#8d97b8' }: {
  icon: React.ReactNode; label: string; value: string | number; color?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2"
      style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-2 text-xs" style={{ color: '#4a5380' }}>
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <span className="text-xl font-black" style={{ color: '#fff' }}>{value}</span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router   = useRouter();
  const { data: session, status } = useSession();
  const [data,    setData]    = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'positions' | 'activity'>('positions');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: '#0f1117' }}>
        <Header isLoggedIn={!!session} coins={0} liveCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#00e676', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  if (!data?.user) return null;

  const { user, stats, recentBets } = data;
  const joinDate = new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const activeBets = recentBets.filter(b => b.status === 'pending');
  const closedBets = recentBets.filter(b => b.status !== 'pending');

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0f1117' }}>
      <Header isLoggedIn={true} coins={user.coins} liveCount={0} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-5 py-8">

          {/* ── Profile card + P&L ────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">

            {/* Left: Profile card */}
            <div
              className="md:col-span-3 rounded-2xl p-5"
              style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-start gap-4 mb-5">
                {/* Avatar gradient (Polymarket style) */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shrink-0"
                  style={{ background: 'linear-gradient(135deg, #00e676, #4fc3f7, #ff6b9d)', color: '#000' }}
                >
                  {user.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-black" style={{ color: '#fff' }}>{user.username}</h1>
                    {user.role === 'admin' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700' }}>Admin</span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#4a5380' }}>
                    Inscrit {joinDate} · {stats.totalBets} prédictions
                  </p>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link href="/settings" className="p-2 rounded-xl hover:bg-white/5 transition-all" style={{ color: '#4a5380' }}>
                    <Settings size={15} />
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="p-2 rounded-xl hover:bg-white/5 transition-all"
                    style={{ color: '#f44336' }}
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </div>

              {/* Key stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Valeur des positions', value: formatCoins(stats.activeBets * 50) + ' 🪙' },
                  { label: 'Plus gros gain', value: stats.biggestWin > 0 ? formatCoins(stats.biggestWin) + ' 🪙' : '—' },
                  { label: 'Prédictions', value: stats.totalBets },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-lg font-black" style={{ color: '#fff' }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a5380' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex items-center gap-2">
                <Link
                  href="/shop"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                  style={{ background: '#00e676', color: '#000' }}
                >
                  <ArrowDownToLine size={14} />
                  Déposer
                </Link>
                <button
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/8"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#8d97b8', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <ArrowUpFromLine size={14} />
                  Retirer
                </button>
              </div>
            </div>

            {/* Right: Coins + win rate */}
            <div className="md:col-span-2 flex flex-col gap-4">
              {/* Coins balance */}
              <div
                className="rounded-2xl p-5 flex flex-col justify-between"
                style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)', flex: 1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a5380' }}>Balance</span>
                  <span className="text-xs" style={{ color: '#4a5380' }}>coins</span>
                </div>
                <div>
                  <p className="text-3xl font-black" style={{ color: '#ffd700' }}>
                    🪙 {user.coins.toLocaleString()}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#4a5380' }}>
                    {stats.activeBets} paris en cours
                  </p>
                </div>
                {/* Mini bar chart placeholder */}
                <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (user.coins / 1000) * 100)}%`, background: 'linear-gradient(90deg, #ffd700, #00e676)' }} />
                </div>
              </div>

              {/* Win rate */}
              <div
                className="rounded-2xl p-5"
                style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: '#4a5380' }}>Taux de victoire</span>
                <p className="text-3xl font-black" style={{ color: stats.winRate >= 50 ? '#00e676' : '#f44336' }}>
                  {stats.winRate}%
                </p>
                <p className="text-xs mt-1" style={{ color: '#4a5380' }}>
                  {stats.wonBets}W · {stats.lostBets}L
                </p>
              </div>
            </div>
          </div>

          {/* ── Stats grid ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard icon={<TrendingUp size={14} />} label="Volume total" value={'🪙 ' + formatCoins(stats.totalSpent)} color="#00e676" />
            <StatCard icon={<Trophy size={14} />} label="Coins gagnés" value={'🪙 ' + formatCoins(stats.totalWon)} color="#ffd700" />
            <StatCard icon={<Zap size={14} />} label="Paris actifs" value={stats.activeBets} color="#ff6b35" />
            <StatCard icon={<Target size={14} />} label="Marchés créés" value={stats.activeMarketsCount} color="#4fc3f7" />
          </div>

          {/* ── Positions / Activity tabs ─────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 pt-4 mb-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {(['positions', 'activity'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2.5 text-sm font-bold transition-all relative"
                  style={{ color: tab === t ? '#fff' : '#4a5380' }}
                >
                  {t === 'positions' ? 'Positions' : 'Activité'}
                  {tab === t && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: '#00e676' }} />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4">

              {/* Positions (active bets) */}
              {tab === 'positions' && (
                <>
                  {/* Filters */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      {['Actives', 'Fermées'].map((label, i) => (
                        <button
                          key={label}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: i === 0 ? '#fff' : '#4a5380',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table header */}
                  <div className="grid text-xs font-semibold uppercase tracking-wider pb-2 px-2" style={{ gridTemplateColumns: '1fr 80px 80px 80px', color: '#4a5380', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>Marché</span>
                    <span className="text-right">Mise</span>
                    <span className="text-right">Gain pot.</span>
                    <span className="text-right">Statut</span>
                  </div>

                  {activeBets.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-3xl mb-3">🎯</p>
                      <p className="text-sm" style={{ color: '#4a5380' }}>Aucune position active</p>
                      <Link href="/" className="mt-3 inline-block text-xs font-bold" style={{ color: '#00e676' }}>
                        Explorer les marchés →
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {activeBets.map(bet => (
                        <div
                          key={bet._id}
                          className="grid items-center px-2 py-3.5 transition-all hover:bg-white/[0.02]"
                          style={{ gridTemplateColumns: '1fr 80px 80px 80px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <div className="min-w-0 pr-3">
                            {bet.marketId ? (
                              <Link href={`/market/${bet.marketId._id}`} className="text-sm font-medium leading-snug hover:text-white transition-colors line-clamp-2" style={{ color: '#c0c8e8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {bet.marketId.title}
                              </Link>
                            ) : (
                              <p className="text-sm" style={{ color: '#4a5380' }}>Marché supprimé</p>
                            )}
                            {bet.marketId && (
                              <p className="text-xs mt-0.5" style={{ color: '#4a5380' }}>
                                {CATEGORY_ICONS[bet.marketId.category as keyof typeof CATEGORY_ICONS]} {CATEGORY_LABELS[bet.marketId.category as keyof typeof CATEGORY_LABELS]}
                              </p>
                            )}
                          </div>
                          <p className="text-sm font-bold text-right" style={{ color: '#fff' }}>
                            🪙 {bet.amount}
                          </p>
                          <p className="text-sm font-bold text-right" style={{ color: '#00e676' }}>
                            🪙 {bet.potentialWin}
                          </p>
                          <div className="flex justify-end">
                            <StatusBadge status={bet.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Activity (recent bets) */}
              {tab === 'activity' && (
                <>
                  {recentBets.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-3xl mb-3">📊</p>
                      <p className="text-sm" style={{ color: '#4a5380' }}>Aucune activité récente</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {recentBets.map((bet, i) => (
                        <div
                          key={bet._id}
                          className="flex items-center gap-3 py-3.5 transition-all hover:bg-white/[0.02]"
                          style={{ borderBottom: i < recentBets.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                        >
                          {/* Icon */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                            style={{
                              background: bet.status === 'won' ? 'rgba(0,230,118,0.1)' : bet.status === 'lost' ? 'rgba(244,67,54,0.1)' : 'rgba(255,215,0,0.1)',
                            }}
                          >
                            {bet.status === 'won' ? '✅' : bet.status === 'lost' ? '❌' : '🎯'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug" style={{ color: '#c0c8e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {bet.marketId?.title ?? 'Marché supprimé'}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#4a5380' }}>
                              {new Date(bet.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black" style={{ color: bet.status === 'won' ? '#00e676' : bet.status === 'lost' ? '#f44336' : '#ffd700' }}>
                              {bet.status === 'won' ? '+' : bet.status === 'lost' ? '-' : ''}{formatCoins(bet.status === 'won' ? bet.potentialWin : bet.amount)} 🪙
                            </p>
                            <StatusBadge status={bet.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
