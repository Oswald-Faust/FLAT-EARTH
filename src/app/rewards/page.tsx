'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Gift, Trophy, Sparkles, Coins, CalendarDays } from 'lucide-react';

interface RewardEvent {
  id: string;
  marketTitle: string;
  status: string;
  amount: number;
  points: number;
  createdAt: string;
}

interface RewardRow {
  rank: number;
  userId: string;
  username: string;
  rewards: number;
}

interface RewardsResponse {
  user: { username: string };
  summary: {
    todayPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
    lifetimePoints: number;
    weeklyRank: number | null;
    monthlyRank: number | null;
    lifetimeRank: number | null;
    createdMarketsMonth: number;
    tier: string;
    nextTierAt: number | null;
  };
  leaderboard: {
    weeklyTop: RewardRow[];
    monthlyTop: RewardRow[];
  };
  events: RewardEvent[];
}

export default function RewardsPage() {
  const [data, setData] = useState<RewardsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rewards', { cache: 'no-store' })
      .then((r) => r.json())
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const progress = data?.summary.nextTierAt
    ? Math.min(100, Math.round((data.summary.lifetimePoints / data.summary.nextTierAt) * 100))
    : 100;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header isLoggedIn coins={0} liveCount={0} />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-5 py-8 grid gap-6 xl:grid-cols-[1.6fr_360px]">
          <div className="min-w-0 space-y-5">
            <div
              className="rounded-[28px] p-6 md:p-8 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(79,195,247,0.18), rgba(153,102,255,0.16))',
                border: '1px solid rgba(120,160,255,0.22)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Gift size={18} style={{ color: '#c4b5fd' }} />
                <p className="text-sm font-bold" style={{ color: '#cfd7ff' }}>Récompenses FlatEarth</p>
              </div>
              {loading ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Chargement des rewards...</p>
              ) : data ? (
                <>
                  <p className="text-5xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {data.summary.todayPoints.toLocaleString('fr-FR')} pts
                  </p>
                  <p className="text-sm mt-3" style={{ color: '#d8def8' }}>
                    Gains du jour pour {data.user.username}
                  </p>
                  <div className="mt-6 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.16)' }}>
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00e676, #4fc3f7, #c084fc)' }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs" style={{ color: '#d8def8' }}>
                    <span>Tier actuel: {data.summary.tier}</span>
                    <span>{data.summary.nextTierAt ? `${data.summary.nextTierAt.toLocaleString('fr-FR')} pts pour le prochain palier` : 'Palier maximum atteint'}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Impossible de charger les rewards.</p>
              )}
            </div>

            {data && (
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: 'Aujourd’hui', value: `${data.summary.todayPoints.toLocaleString('fr-FR')} pts`, icon: <CalendarDays size={15} />, color: '#4fc3f7' },
                  { label: 'Cette semaine', value: `${data.summary.weeklyPoints.toLocaleString('fr-FR')} pts`, icon: <Sparkles size={15} />, color: '#00e676' },
                  { label: 'Ce mois', value: `${data.summary.monthlyPoints.toLocaleString('fr-FR')} pts`, icon: <Trophy size={15} />, color: '#ffd700' },
                  { label: 'Lifetime', value: `${data.summary.lifetimePoints.toLocaleString('fr-FR')} pts`, icon: <Coins size={15} />, color: '#c084fc' },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: card.color }}>{card.icon}</span>
                      {card.label}
                    </div>
                    <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="font-black mb-4" style={{ color: 'var(--text-primary)' }}>Comment gagner des rewards</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['Parier régulièrement', 'Les positions ouvertes et le volume actif génèrent des points.'],
                  ['Être performant', 'Les paris gagnants augmentent fortement les rewards et le classement.'],
                  ['Créer des marchés', 'Les créateurs actifs peuvent monter plus vite dans l’écosystème.'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl p-4" style={{ background: 'var(--bg-item)', border: '1px solid var(--border-light)' }}>
                    <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>Activité récompensée récente</h2>
              </div>
              {!data ? (
                <div className="px-5 py-10 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                  Chargement...
                </div>
              ) : data.events.length === 0 ? (
                <div className="px-5 py-10 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                  Pas encore d’activité récompensée.
                </div>
              ) : (
                data.events.map((event) => (
                  <div key={event.id} className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{event.marketTitle}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {new Date(event.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} · {event.status}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black" style={{ color: '#ffd700' }}>+{event.points} pts</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{event.amount.toLocaleString('fr-FR')} € engagés</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="font-black mb-3" style={{ color: 'var(--text-primary)' }}>Top rewards semaine</h2>
              <div className="space-y-2">
                {data?.leaderboard.weeklyTop.map((row) => (
                  <div key={row.userId} className="flex items-center justify-between gap-3 py-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>#{row.rank} {row.username}</p>
                    </div>
                    <span className="text-sm font-black" style={{ color: '#ffd700' }}>{row.rewards.toLocaleString('fr-FR')} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {data && (
              <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h2 className="font-black mb-3" style={{ color: 'var(--text-primary)' }}>Tes positions rewards</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Rang hebdo</p>
                    <p className="font-black" style={{ color: 'var(--text-primary)' }}>{data.summary.weeklyRank ? `#${data.summary.weeklyRank}` : 'Non classé'}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Rang mensuel</p>
                    <p className="font-black" style={{ color: 'var(--text-primary)' }}>{data.summary.monthlyRank ? `#${data.summary.monthlyRank}` : 'Non classé'}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Rang lifetime</p>
                    <p className="font-black" style={{ color: 'var(--text-primary)' }}>{data.summary.lifetimeRank ? `#${data.summary.lifetimeRank}` : 'Non classé'}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Marchés créés ce mois</p>
                    <p className="font-black" style={{ color: 'var(--text-primary)' }}>{data.summary.createdMarketsMonth}</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
