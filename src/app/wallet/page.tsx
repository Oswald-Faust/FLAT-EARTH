'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import DepositModal from '@/components/wallet/DepositModal';
import { ArrowDownToLine, ArrowUpRight, Wallet, Clock3, Landmark, Eye, EyeOff } from 'lucide-react';
import { getStoredWalletVisibility, maskCurrency, setStoredWalletVisibility } from '@/lib/wallet-privacy';

interface WalletData {
  wallet: {
    username: string;
    balanceCents: number;
    totalDepositedCents: number;
    activeExposureCents: number;
    settledProfitCents: number;
  };
  activePositions: Array<{
    id: string;
    marketTitle: string;
    amount: number;
    potentialWin: number;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    type: 'deposit' | 'bet';
    title: string;
    subtitle: string;
    amountCents: number;
    status: string;
    createdAt: string;
  }>;
}

function formatEur(cents: number) {
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(() => getStoredWalletVisibility());

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible((current) => {
      const nextValue = !current;
      setStoredWalletVisibility(nextValue);
      return nextValue;
    });
  };

  const displayAmount = (amount: string) => (
    isBalanceVisible ? amount : maskCurrency(amount)
  );

  const load = (withLoading = true) => {
    if (withLoading) setLoading(true);
    fetch('/api/wallet/overview', { cache: 'no-store' })
      .then((r) => r.json())
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/wallet/overview', { cache: 'no-store' })
      .then((r) => r.json())
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header isLoggedIn coins={0} liveCount={0} initialBalance={data?.wallet.balanceCents ?? 0} />

      {depositOpen && (
        <DepositModal
          onClose={() => {
            setDepositOpen(false);
            load();
          }}
          currentBalance={data?.wallet.balanceCents ?? 0}
        />
      )}

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-5 py-8 grid gap-6 xl:grid-cols-[1.6fr_360px]">
          <div className="space-y-5 min-w-0">
            <div className="grid gap-4 md:grid-cols-[1.15fr_1fr]">
              <div className="rounded-3xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Portefeuille</p>
                      <button
                        type="button"
                        onClick={toggleBalanceVisibility}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:brightness-110"
                        style={{ background: 'var(--bg-item)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
                        aria-label={isBalanceVisible ? 'Masquer le solde' : 'Afficher le solde'}
                        title={isBalanceVisible ? 'Masquer le solde' : 'Afficher le solde'}
                      >
                        {isBalanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                    <h1 className="text-4xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>
                      {loading || !data ? '...' : displayAmount(formatEur(data.wallet.balanceCents))}
                    </h1>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                      Disponible pour trader
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,230,118,0.08)', color: '#00e676' }}>
                    <Wallet size={22} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDepositOpen(true)}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #00e676, #00b8d4)', color: '#000' }}
                  >
                    <ArrowDownToLine size={15} />
                    Déposer
                  </button>
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
                    style={{ background: 'var(--bg-item)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    <Landmark size={15} />
                    Retirer
                  </button>
                </div>
              </div>

              <div className="rounded-3xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowUpRight size={16} style={{ color: '#00e676' }} />
                  <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Aperçu</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total déposé</p>
                    <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                      {loading || !data ? '...' : displayAmount(formatEur(data.wallet.totalDepositedCents))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Exposition en cours</p>
                    <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                      {loading || !data ? '...' : displayAmount(formatEur(data.wallet.activeExposureCents))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>P&L réalisé</p>
                    <p
                      className="text-xl font-black"
                      style={{ color: !data ? 'var(--text-primary)' : data.wallet.settledProfitCents >= 0 ? '#00e676' : '#f44336' }}
                    >
                      {loading || !data ? '...' : `${data.wallet.settledProfitCents >= 0 ? '+' : '-'}${displayAmount(formatEur(Math.abs(data.wallet.settledProfitCents)))}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>Transactions</h2>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Historique wallet</span>
              </div>

              {loading ? (
                <div className="px-5 py-12 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Chargement des transactions...</div>
              ) : !data || data.transactions.length === 0 ? (
                <div className="px-5 py-12 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Aucune transaction pour le moment.</div>
              ) : (
                data.transactions.map((tx) => (
                  <div key={tx.id} className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{tx.title}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {tx.subtitle} · {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-black"
                        style={{ color: tx.amountCents >= 0 ? '#00e676' : '#f44336' }}
                      >
                        {tx.amountCents >= 0 ? '+' : '-'}{displayAmount(formatEur(Math.abs(tx.amountCents)))}
                      </p>
                      <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{tx.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock3 size={16} style={{ color: '#4fc3f7' }} />
                <h2 className="font-black" style={{ color: 'var(--text-primary)' }}>Positions ouvertes</h2>
              </div>
              {!data || data.activePositions.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune position active.</p>
              ) : (
                <div className="space-y-2">
                  {data.activePositions.map((position) => (
                    <div key={position.id} className="rounded-xl p-3" style={{ background: 'var(--bg-item)', border: '1px solid var(--border-light)' }}>
                      <p className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--text-primary)' }}>{position.marketTitle}</p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span style={{ color: 'var(--text-muted)' }}>Mise {displayAmount(`${position.amount.toFixed(2)} €`)}</span>
                        <span style={{ color: '#00e676', fontWeight: 700 }}>Gain pot. {displayAmount(`${position.potentialWin.toFixed(2)} €`)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h2 className="font-black mb-3" style={{ color: 'var(--text-primary)' }}>Ce que tu vois ici</h2>
              <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <p>Les dépôts Stripe crédités sur ton wallet.</p>
                <p>Les mises engagées sur tes paris, affichées en débit.</p>
                <p>Le P&amp;L réalisé calculé à partir des paris gagnés et perdus déjà résolus.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
