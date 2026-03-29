'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { CATEGORY_LABELS, MarketCategory } from '@/types';
import { Trophy, TrendingUp, Coins, Medal, Search } from 'lucide-react';

type Range = 'today' | 'weekly' | 'monthly' | 'all';
type SortKey = 'profit' | 'volume' | 'rewards' | 'winRate';

interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  role: string;
  volume: number;
  profit: number;
  rewards: number;
  winRate: number;
  totalBets: number;
}

const RANGE_LABELS: Record<Range, string> = {
  today: "Aujourd'hui",
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  all: 'Tout',
};

const SORT_LABELS: Record<SortKey, string> = {
  profit: 'Profit / Perte',
  volume: 'Volume',
  rewards: 'Rewards',
  winRate: 'Win rate',
};

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Toutes les catégories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

function formatSigned(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('fr-FR')} €`;
}

export default function LeaderboardPage() {
  const [range, setRange] = useState<Range>('monthly');
  const [sort, setSort] = useState<SortKey>('profit');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leaderboard?range=${range}&sort=${sort}&category=${category}&limit=100`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setLeaders(data.leaders ?? []);
        setCurrentUser(data.currentUser ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range, sort, category]);

  const filteredLeaders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return leaders;
    return leaders.filter((row) => row.username.toLowerCase().includes(term));
  }, [leaders, query]);

  const spotlight = leaders.slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header isLoggedIn coins={0} liveCount={0} />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-5 py-8 grid gap-6 xl:grid-cols-[1.7fr_340px]">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Classement</h1>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Les meilleurs utilisateurs de FlatEarth par performance, volume et rewards.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Object.keys(RANGE_LABELS) as Range[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => { setLoading(true); setRange(value); }}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: range === value ? 'var(--bg-item-hover)' : 'transparent',
                      border: `1px solid ${range === value ? 'var(--border-medium)' : 'var(--border)'}`,
                      color: range === value ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {RANGE_LABELS[value]}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher par nom"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>

                <select
                  value={category}
                  onChange={(e) => { setLoading(true); setCategory(e.target.value); }}
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => { setLoading(true); setSort(value); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: sort === value ? 'rgba(0,230,118,0.12)' : 'var(--bg-item)',
                      border: `1px solid ${sort === value ? 'rgba(0,230,118,0.2)' : 'var(--border)'}`,
                      color: sort === value ? '#00e676' : 'var(--text-secondary)',
                    }}
                  >
                    {SORT_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div
                className="grid px-4 py-3 text-xs font-bold uppercase tracking-wider"
                style={{ gridTemplateColumns: '70px 1.3fr 1fr 120px 100px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
              >
                <span>Rang</span>
                <span>Utilisateur</span>
                <span>{SORT_LABELS[sort]}</span>
                <span className="text-right">Volume</span>
                <span className="text-right">Win rate</span>
              </div>

              {loading ? (
                <div className="px-4 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Chargement du classement...
                </div>
              ) : filteredLeaders.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Aucun utilisateur classé pour ce filtre.
                </div>
              ) : (
                filteredLeaders.map((row) => (
                  <div
                    key={row.userId}
                    className="grid items-center px-4 py-4 text-sm"
                    style={{ gridTemplateColumns: '70px 1.3fr 1fr 120px 100px', borderBottom: '1px solid var(--border-light)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style={{ background: row.rank <= 3 ? 'rgba(255,215,0,0.12)' : 'var(--bg-item-hover)', color: row.rank <= 3 ? '#ffd700' : 'var(--text-muted)' }}>
                        {row.rank}
                      </span>
                      {row.rank <= 3 && <Medal size={14} style={{ color: '#ffd700' }} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{row.username}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.totalBets} paris</p>
                    </div>
                    <div className="font-bold" style={{ color: sort === 'profit' ? (row.profit >= 0 ? '#00e676' : '#f44336') : sort === 'rewards' ? '#ffd700' : 'var(--text-primary)' }}>
                      {sort === 'profit' && formatSigned(row.profit)}
                      {sort === 'volume' && `${row.volume.toLocaleString('fr-FR')} €`}
                      {sort === 'rewards' && `${row.rewards.toLocaleString('fr-FR')} pts`}
                      {sort === 'winRate' && `${row.winRate}%`}
                    </div>
                    <div className="text-right font-semibold" style={{ color: 'var(--text-bright)' }}>{row.volume.toLocaleString('fr-FR')} €</div>
                    <div className="text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>{row.winRate}%</div>
                  </div>
                ))
              )}
            </div>

            {currentUser && (
              <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,230,118,0.2)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#00e676' }}>
                  Ta position
                </p>
                <div className="grid gap-2 md:grid-cols-4 text-sm">
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Rang</p>
                    <p className="font-black" style={{ color: 'var(--text-primary)' }}>#{currentUser.rank}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Profit</p>
                    <p className="font-black" style={{ color: currentUser.profit >= 0 ? '#00e676' : '#f44336' }}>{formatSigned(currentUser.profit)}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Volume</p>
                    <p className="font-black" style={{ color: 'var(--text-primary)' }}>{currentUser.volume.toLocaleString('fr-FR')} €</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Rewards</p>
                    <p className="font-black" style={{ color: '#ffd700' }}>{currentUser.rewards.toLocaleString('fr-FR')} pts</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} style={{ color: '#ffd700' }} />
                <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>Top Performers</h2>
              </div>
              <div className="space-y-2">
                {spotlight.map((row) => (
                  <div key={row.userId} className="flex items-center justify-between gap-3 py-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>#{row.rank} {row.username}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.volume.toLocaleString('fr-FR')} € volume</p>
                    </div>
                    <span className="text-sm font-black" style={{ color: row.profit >= 0 ? '#00e676' : '#f44336' }}>
                      {formatSigned(row.profit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Coins size={16} style={{ color: '#ffd700' }} />
                <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>Comment monter</h2>
              </div>
              <div className="space-y-3 text-sm">
                <p style={{ color: 'var(--text-secondary)' }}>Le classement combine performance réalisée, volume et rewards.</p>
                <p style={{ color: 'var(--text-secondary)' }}>Les paris gagnants à fort volume améliorent le plus vite le rang.</p>
                <p style={{ color: 'var(--text-secondary)' }}>Les rewards valorisent aussi l’activité régulière, même hors top profit.</p>
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} style={{ color: '#00e676' }} />
                <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>Métrique active</h2>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Tri actuel: <strong style={{ color: 'var(--text-primary)' }}>{SORT_LABELS[sort]}</strong>
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Catégorie: {category === 'all' ? 'Toutes' : CATEGORY_LABELS[category as MarketCategory]}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Période: {RANGE_LABELS[range]}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
