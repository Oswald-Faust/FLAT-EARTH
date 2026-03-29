'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CreditCard, Smartphone, Building2 } from 'lucide-react';

interface DepositModalProps {
  onClose: () => void;
  currentBalance?: number; // en centimes
}

const METHODS = [
  {
    id: 'card',
    icon: <CreditCard size={18} />,
    label: 'Carte bancaire',
    desc: 'Visa, Mastercard · Sans frais',
  },
  {
    id: 'apple',
    icon: <Smartphone size={18} />,
    label: 'Apple Pay / Google Pay',
    desc: 'Paiement instantané · Sans frais',
  },
  {
    id: 'wire',
    icon: <Building2 size={18} />,
    label: 'Virement bancaire',
    desc: 'Dépôts élevés · Disponible sous 1j ouvré',
  },
];

export default function DepositModal({ onClose, currentBalance = 0 }: DepositModalProps) {
  const [amount,  setAmount]  = useState('50');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const cents = Math.round((parseFloat(amount) || 0) * 100);

  const handleDeposit = async () => {
    if (cents < 100) { setError('Montant minimum : 1 €'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cents }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'var(--shadow-overlay)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 32px 80px var(--shadow-overlay)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Déposer sur FLAT EARTH</h2>
            {currentBalance > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Solde actuel : <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{(currentBalance / 100).toFixed(2)} €</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: '#6b7db3' }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">

          {/* ── Montant — champ discret ── */}
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: 'var(--bg-input)', border: '1.5px solid var(--border-medium)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Montant</span>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(''); }}
              className="flex-1 bg-transparent outline-none text-right font-black text-base"
              style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-green)' }}
            />
            <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>€</span>
          </div>

          {/* ── Méthodes ── */}
          <div className="space-y-2">
            {METHODS.map(m => (
              <button
                key={m.id}
                onClick={handleDeposit}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all hover:bg-white/[0.06] active:scale-[0.99]"
                style={{ background: 'var(--bg-item)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676' }}
                >
                  {loading
                    ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(0,230,118,0.3)', borderTopColor: '#00e676' }} />
                    : m.icon
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-bright)' }}>{m.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.desc}</p>
                </div>
                <span className="text-xs font-black shrink-0" style={{ color: '#00e676' }}>
                  {parseFloat(amount) > 0 ? `${parseFloat(amount).toFixed(0)} €` : '—'}
                </span>
              </button>
            ))}
          </div>

          {/* Erreur */}
          {error && (
            <p
              className="text-xs text-center px-3 py-2 rounded-xl"
              style={{ background: 'rgba(244,67,54,0.08)', color: '#f44336', border: '1px solid rgba(244,67,54,0.2)' }}
            >
              {error}
            </p>
          )}

          <p className="text-center text-[11px] pb-1" style={{ color: 'var(--text-dim)' }}>
            Paiement sécurisé via Stripe · Crédité instantanément
          </p>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
