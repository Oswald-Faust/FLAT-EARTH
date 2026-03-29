'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import { Zap, Star, Crown, Diamond, Check, ChevronRight, ShieldCheck, RefreshCw, Coins } from 'lucide-react';

// ─── Packs ─────────────────────────────────────────────────────────────────────
const PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    coins: 100,
    baseCoins: 100,
    bonus: 0,
    price: 1.99,
    icon: Zap,
    color: '#4fc3f7',
    gradient: 'linear-gradient(135deg, rgba(79,195,247,0.18), rgba(79,195,247,0.06))',
    border: 'rgba(79,195,247,0.3)',
    popular: false,
    desc: null,
  },
  {
    id: 'popular',
    name: 'Popular',
    coins: 600,
    baseCoins: 500,
    bonus: 100,
    price: 9.99,
    icon: Star,
    color: '#00e676',
    gradient: 'linear-gradient(135deg, rgba(0,230,118,0.22), rgba(0,184,212,0.12))',
    border: '#00e676',
    popular: true,
    desc: '+100 bonus',
  },
  {
    id: 'pro',
    name: 'Pro',
    coins: 1500,
    baseCoins: 1200,
    bonus: 300,
    price: 19.99,
    icon: Crown,
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,152,0,0.08))',
    border: 'rgba(255,215,0,0.4)',
    popular: false,
    desc: '+300 bonus',
  },
  {
    id: 'elite',
    name: 'Elite',
    coins: 5000,
    baseCoins: 4000,
    bonus: 1000,
    price: 49.99,
    icon: Diamond,
    color: '#ce93d8',
    gradient: 'linear-gradient(135deg, rgba(206,147,216,0.18), rgba(149,117,205,0.08))',
    border: 'rgba(206,147,216,0.35)',
    popular: false,
    desc: '+1000 bonus',
  },
];

// ─── Composant carte pack ──────────────────────────────────────────────────────
function PackCard({
  pack,
  selected,
  onSelect,
}: {
  pack: typeof PACKS[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = pack.icon;
  return (
    <div
      onClick={onSelect}
      className="relative rounded-2xl p-5 cursor-pointer transition-all"
      style={{
        background: selected ? pack.gradient : '#161b26',
        border: `1.5px solid ${selected ? pack.border : 'rgba(255,255,255,0.07)'}`,
        boxShadow: selected && pack.popular ? `0 0 28px rgba(0,230,118,0.2)` : 'none',
        transform: selected ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Badge populaire */}
      {pack.popular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap"
          style={{
            background: 'linear-gradient(90deg, #00e676, #00b8d4)',
            color: '#000',
            boxShadow: '0 2px 12px rgba(0,230,118,0.4)',
          }}
        >
          LE + POPULAIRE
        </div>
      )}

      {/* Icon + nom */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${pack.color}20`,
            border: `1px solid ${pack.color}40`,
          }}
        >
          <Icon size={18} style={{ color: pack.color }} />
        </div>
        <div>
          <p className="font-black text-sm" style={{ color: '#fff' }}>{pack.name}</p>
          {pack.desc && (
            <p className="text-xs font-semibold" style={{ color: pack.color }}>{pack.desc}</p>
          )}
        </div>
      </div>

      {/* Montant coins */}
      <div className="mb-4">
        <p className="text-3xl font-black leading-none" style={{ color: pack.color }}>
          🪙 {pack.coins.toLocaleString('fr-FR')}
        </p>
        <p className="text-xs mt-1" style={{ color: '#4a5380' }}>coins</p>
      </div>

      {/* Bouton prix */}
      <button
        className="w-full py-3 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.98]"
        style={
          pack.popular
            ? { background: 'linear-gradient(135deg, #00e676, #00b8d4)', color: '#000' }
            : {
                background: selected ? `${pack.color}22` : 'rgba(255,255,255,0.06)',
                color: selected ? pack.color : '#8d97b8',
                border: `1px solid ${selected ? pack.color + '50' : 'rgba(255,255,255,0.1)'}`,
              }
        }
      >
        {pack.price.toFixed(2)}€
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ShopPage() {
  const { data: session, status } = useSession();
  const [coins, setCoins] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>('popular');
  const [purchasing, setPurchasing] = useState(false);
  const [success, setSuccess] = useState<{ pack: string; coins: number } | null>(null);

  // Fetch coins réels + détection retour Stripe
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(r => r.json())
        .then(d => { if (d.user) setCoins(d.user.coins); });

      // Retour depuis Stripe
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === '1') {
        const pack  = params.get('pack') ?? '';
        const coins = parseInt(params.get('coins') ?? '0', 10);
        if (coins > 0) setSuccess({ pack, coins });
        // Nettoyer l'URL
        window.history.replaceState({}, '', '/shop');
      }
    }
  }, [status]);

  const selectedPack = PACKS.find(p => p.id === selected);

  const handlePurchase = async () => {
    if (!selectedPack) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'coin_pack', packId: selectedPack.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) { setPurchasing(false); return; }
      window.location.href = data.url;
    } catch {
      setPurchasing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0f1117' }}>
      <Header isLoggedIn={!!session} coins={coins ?? 0} liveCount={0} />

      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-5 py-10">

          {/* ── En-tête ───────────────────────────────────────────────────────── */}
          <div className="text-center mb-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-5"
              style={{ background: 'rgba(255,215,0,0.1)', border: '2px solid rgba(255,215,0,0.25)' }}
            >
              🪙
            </div>
            <h1 className="text-3xl font-black mb-2" style={{ color: '#fff' }}>
              Boutique de Coins
            </h1>
            <p className="text-sm" style={{ color: '#6b7db3' }}>
              Achetez des coins pour parier sur tous les marchés
            </p>
          </div>

          {/* ── Solde actuel ──────────────────────────────────────────────────── */}
          <div
            className="rounded-2xl px-5 py-4 mb-8 flex items-center justify-between"
            style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4a5380' }}>
                Votre solde
              </p>
              <p className="text-2xl font-black" style={{ color: '#ffd700' }}>
                🪙 {status === 'authenticated' ? (coins ?? '…').toLocaleString?.('fr-FR') ?? '…' : '—'} coins
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: '#4a5380' }}>1 coin ≈ 0.01€</p>
              {coins !== null && (
                <p className="text-sm font-bold mt-0.5" style={{ color: '#8d97b8' }}>
                  ≈ {(coins * 0.01).toFixed(2)}€
                </p>
              )}
            </div>
          </div>

          {/* ── Grille des packs ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {PACKS.map(pack => (
              <PackCard
                key={pack.id}
                pack={pack}
                selected={selected === pack.id}
                onSelect={() => setSelected(pack.id)}
              />
            ))}
          </div>

          {/* ── CTA Acheter ───────────────────────────────────────────────────── */}
          {selectedPack && (
            <div
              className="rounded-2xl p-5 mb-6"
              style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#fff' }}>
                    Pack sélectionné : <span style={{ color: selectedPack.color }}>{selectedPack.name}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#4a5380' }}>
                    🪙 {selectedPack.coins.toLocaleString('fr-FR')} coins
                    {selectedPack.bonus > 0 && (
                      <span style={{ color: '#00e676' }}> (dont +{selectedPack.bonus} bonus)</span>
                    )}
                  </p>
                </div>
                <p className="text-2xl font-black" style={{ color: '#fff' }}>
                  {selectedPack.price.toFixed(2)}€
                </p>
              </div>

              {success ? (
                <div
                  className="w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2"
                  style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.3)', color: '#00e676' }}
                >
                  <Check size={16} />
                  +{success.coins.toLocaleString('fr-FR')} coins crédités ! 🎉
                </div>
              ) : status !== 'authenticated' ? (
                <Link
                  href="/auth/login"
                  className="w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #00e676, #00b8d4)', color: '#000' }}
                >
                  <Coins size={16} />
                  Se connecter pour acheter
                </Link>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.99]"
                  style={{
                    background: purchasing
                      ? 'rgba(255,255,255,0.08)'
                      : 'linear-gradient(135deg, #00e676, #00b8d4)',
                    color: purchasing ? '#4a5380' : '#000',
                  }}
                >
                  {purchasing ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Traitement en cours…
                    </>
                  ) : (
                    <>
                      <Coins size={16} />
                      Acheter pour {selectedPack.price.toFixed(2)}€
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* ── Infos / Garanties ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <ShieldCheck size={18} style={{ color: '#00e676', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#fff' }}>Paiement sécurisé</p>
                <p className="text-xs leading-relaxed" style={{ color: '#4a5380' }}>
                  Stripe 3D Secure. Aucune carte stockée sur nos serveurs.
                </p>
              </div>
            </div>
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <RefreshCw size={18} style={{ color: '#4fc3f7', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#fff' }}>Crédité instantanément</p>
                <p className="text-xs leading-relaxed" style={{ color: '#4a5380' }}>
                  Les coins sont ajoutés à votre solde dès confirmation du paiement.
                </p>
              </div>
            </div>
          </div>

          {/* ── Comment ça marche ─────────────────────────────────────────────── */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-sm font-bold mb-4" style={{ color: '#fff' }}>Comment ça marche ?</p>
            <div className="flex flex-col gap-3">
              {[
                { icon: '🪙', text: 'Les coins sont la monnaie virtuelle de la plateforme, non remboursables' },
                { icon: '🎯', text: 'Pariez sur n\'importe quel marché ouvert avec vos coins' },
                { icon: '🏆', text: 'Gagnez des coins en ayant raison sur vos prédictions' },
                { icon: '✨', text: 'Les créateurs de marchés reçoivent 2% de chaque mise (configurable)' },
              ].map(({ icon, text }, i) => (
                <div key={i} className="flex items-start gap-3 text-sm" style={{ color: '#6b7db3' }}>
                  <span className="text-base shrink-0">{icon}</span>
                  {text}
                </div>
              ))}
            </div>

            <div
              className="mt-4 pt-4 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-xs" style={{ color: '#4a5380' }}>
                Tu as des questions ?
              </p>
              <Link
                href="/"
                className="flex items-center gap-1 text-xs font-semibold transition-all hover:opacity-80"
                style={{ color: '#00e676' }}
              >
                Voir les marchés
                <ChevronRight size={12} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
