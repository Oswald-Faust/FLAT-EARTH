'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { Copy, Gift, Users, Coins, Sparkles } from 'lucide-react';

interface ReferralsData {
  profile: {
    username: string;
    coins: number;
    referralCode: string;
    referralLink: string;
  };
  stats: {
    signups: number;
    activeReferrals: number;
    earningsCoins: number;
  };
  series: { date: string; total: number }[];
  referrals: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
    active: boolean;
    coins: number;
  }[];
  payouts: {
    id: string;
    refereeUsername: string;
    rewardCoins: number;
    sourceType: string;
    sourceAmountCents: number;
    createdAt: string;
  }[];
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referrals', { cache: 'no-store' })
      .then((r) => r.json())
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const maxSeries = useMemo(() => Math.max(...(data?.series.map((entry) => entry.total) ?? [1])), [data]);

  const copyLink = async () => {
    if (!data?.profile.referralLink) return;
    await navigator.clipboard.writeText(data.profile.referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header isLoggedIn coins={0} liveCount={0} />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-5 py-8 grid gap-6 xl:grid-cols-[1.6fr_360px]">
          <div className="space-y-5 min-w-0">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Gift size={18} style={{ color: '#ffd700' }} />
                  <p className="text-sm font-bold" style={{ color: '#ffd700' }}>Programme Parrainage</p>
                </div>
                <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Parrainages</h1>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Invite tes amis, active leurs premiers paiements, et gagne des coins automatiquement.
                </p>
              </div>

              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <Copy size={14} />
                {copied ? 'Lien copié' : 'Copier mon lien'}
              </button>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {loading || !data ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement du programme de parrainage...</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{data.profile.username}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Code: <strong>{data.profile.referralCode}</strong>
                      </p>
                    </div>
                    <div
                      className="px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--bg-item)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
                    >
                      {data.profile.referralLink}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { label: 'Inscriptions', value: data.stats.signups, icon: <Users size={15} />, color: '#4fc3f7' },
                      { label: 'Filleuls actifs', value: data.stats.activeReferrals, icon: <Sparkles size={15} />, color: '#00e676' },
                      { label: 'Gains', value: `${data.stats.earningsCoins.toLocaleString('fr-FR')} coins`, icon: <Coins size={15} />, color: '#ffd700' },
                    ].map((card) => (
                      <div key={card.label} className="rounded-2xl p-4" style={{ background: 'var(--bg-item)', border: '1px solid var(--border-light)' }}>
                        <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                          <span style={{ color: card.color }}>{card.icon}</span>
                          {card.label}
                        </div>
                        <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="font-black mb-4" style={{ color: 'var(--text-primary)' }}>Gains sur 7 jours</h2>
              <div className="grid grid-cols-7 gap-3 items-end" style={{ minHeight: 180 }}>
                {(data?.series ?? []).map((entry) => (
                  <div key={entry.date} className="flex flex-col items-center gap-2">
                    <div className="w-full rounded-t-xl" style={{ height: `${Math.max(8, (entry.total / maxSeries) * 140)}px`, background: 'linear-gradient(180deg, #4fc3f7, #00e676)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{entry.total}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>Filleuls</h2>
              </div>
              {!data ? (
                <div className="px-5 py-10 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Chargement...</div>
              ) : data.referrals.length === 0 ? (
                <div className="px-5 py-10 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Aucun filleul pour le moment.</div>
              ) : (
                data.referrals.map((entry) => (
                  <div key={entry.id} className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.username}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {entry.email} · inscrit le {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: entry.active ? 'rgba(0,230,118,0.12)' : 'var(--bg-item-hover)', color: entry.active ? '#00e676' : 'var(--text-muted)' }}
                    >
                      {entry.active ? 'Actif' : 'Inscrit'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="font-black mb-3" style={{ color: 'var(--text-primary)' }}>Paiements de parrainage</h2>
              {!data ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</p>
              ) : data.payouts.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun gain distribué pour le moment.</p>
              ) : (
                <div className="space-y-2">
                  {data.payouts.map((payout) => (
                    <div key={payout.id} className="rounded-xl p-3" style={{ background: 'var(--bg-item)', border: '1px solid var(--border-light)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{payout.refereeUsername}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {payout.sourceType} · {(payout.sourceAmountCents / 100).toFixed(2)} €
                      </p>
                      <p className="text-sm font-black mt-2" style={{ color: '#ffd700' }}>+{payout.rewardCoins} coins</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="font-black mb-3" style={{ color: 'var(--text-primary)' }}>Règles du programme</h2>
              <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <p>Chaque utilisateur possède un code unique et un lien de partage.</p>
                <p>Le parrain gagne des coins à chaque paiement Stripe validé de ses filleuls.</p>
                <p>Le filleul reçoit aussi un bonus unique lors de son premier paiement qualifiant.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
