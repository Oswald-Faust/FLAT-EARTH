'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Crown, User, UserPlus,
  X, Check, Trash2, KeyRound, Coins, Shield, ShieldCheck,
  TrendingUp, Zap, Trophy, AlertTriangle,
} from 'lucide-react';
import { formatCoins } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRecord {
  _id: string; username: string; email: string;
  coins: number; role: string; createdAt: string;
}

interface UserDetailResponse {
  user: UserRecord;
  stats: {
    totalBets: number; wonBets: number; activeBets: number;
    totalSpent: number; winRate: number;
  };
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const ROLE_STYLE: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  admin:   { label: 'Admin',    color: '#ffd700', bg: 'rgba(255,215,0,0.12)',  icon: <Crown size={10} /> },
  creator: { label: 'Créateur', color: '#4fc3f7', bg: 'rgba(79,195,247,0.12)', icon: <Shield size={10} /> },
  user:    { label: 'User',     color: '#8d97b8', bg: 'rgba(255,255,255,0.06)', icon: <User size={10} /> },
};

const AVATAR_COLORS = [
  'linear-gradient(135deg, #00e676, #4fc3f7)',
  'linear-gradient(135deg, #ff6b9d, #c44dff)',
  'linear-gradient(135deg, #ffd700, #ff9800)',
  'linear-gradient(135deg, #4fc3f7, #1976d2)',
  'linear-gradient(135deg, #00e676, #00b8d4)',
];
function avatarGradient(username: string) {
  const sum = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// ─── Mini input inline ────────────────────────────────────────────────────────
function FInput({ label, type = 'text', value, onChange, placeholder, required = false }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a5380' }}>
        {label}{required && <span style={{ color: '#f44336' }}> *</span>}
      </label>
      <input
        type={type} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#fff', caretColor: '#00e676' }}
      />
    </div>
  );
}

// ─── Modale créer utilisateur ─────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('user');
  const [coins,    setCoins]    = useState('100');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role, coins: Number(coins) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
    onCreated();
    onClose();
  };

  const previewName = username.trim() || 'Nouveau compte';
  const roleMeta = ROLE_STYLE[role] ?? ROLE_STYLE.user;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(3,6,10,0.76)', backdropFilter: 'blur(10px)' }}>
      <div
        className="w-full rounded-[28px] overflow-hidden"
        style={{
          maxWidth: 560,
          background: 'linear-gradient(180deg, rgba(22,27,39,0.98) 0%, rgba(17,21,31,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 28px 90px rgba(0,0,0,0.72)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'radial-gradient(circle at top left, rgba(0,230,118,0.12) 0%, rgba(79,195,247,0.07) 34%, rgba(255,255,255,0) 70%)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.2)' }}
              >
                <UserPlus size={18} style={{ color: '#00e676' }} />
              </div>
              <div>
                <p className="font-black text-lg leading-none mb-1" style={{ color: '#fff' }}>Créer un utilisateur</p>
                <p className="text-sm leading-relaxed max-w-sm" style={{ color: '#90a0cb' }}>
                  Prépare un nouveau compte avec son rôle, son capital initial et un accès immédiat au produit.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all shrink-0" style={{ color: '#60719b' }}>
              <X size={16} />
            </button>
          </div>

          <div
            className="mt-5 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black shrink-0"
              style={{ background: avatarGradient(previewName), color: '#09110f' }}
            >
              {previewName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-sm font-bold truncate" style={{ color: '#fff' }}>{previewName}</p>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1"
                  style={{ color: roleMeta.color, background: roleMeta.bg }}
                >
                  {roleMeta.icon}
                  {roleMeta.label}
                </span>
              </div>
              <p className="text-xs truncate" style={{ color: '#7181ac' }}>
                {email.trim() || 'email@example.com'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: '#5f6f98' }}>Capital</p>
              <p className="text-sm font-black" style={{ color: '#00e676' }}>{coins || '0'} coins</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FInput label="Pseudo" value={username} onChange={setUsername} placeholder="tonpseudo" required />
            <FInput label="Email" type="email" value={email} onChange={setEmail} placeholder="email@example.com" required />
          </div>

          <FInput label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="6 caractères minimum" required />

          <div className="grid grid-cols-1 sm:grid-cols-[1.35fr_0.8fr] gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5f6f98' }}>Rôle</label>
              <div className="grid grid-cols-3 gap-2">
                {(['user', 'creator', 'admin'] as const).map((roleOption) => {
                  const meta = ROLE_STYLE[roleOption];
                  const active = role === roleOption;

                  return (
                    <button
                      key={roleOption}
                      type="button"
                      onClick={() => setRole(roleOption)}
                      className="rounded-2xl px-3 py-3 text-left transition-all"
                      style={{
                        background: active ? meta.bg : 'rgba(255,255,255,0.035)',
                        border: active ? `1px solid ${meta.color}55` : '1px solid rgba(255,255,255,0.08)',
                        color: active ? meta.color : '#a6b4dd',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {meta.icon}
                        <span className="text-xs font-black uppercase tracking-[0.12em]">{meta.label}</span>
                      </div>
                      <p className="text-[11px] leading-snug" style={{ color: active ? meta.color : '#6d7ba4' }}>
                        {roleOption === 'admin' ? 'Accès total' : roleOption === 'creator' ? 'Création avancée' : 'Compte standard'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <FInput label="Coins de départ" type="number" value={coins} onChange={setCoins} placeholder="100" />
              <div
                className="rounded-2xl px-3 py-2.5 text-xs leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)', color: '#7d8db8' }}
              >
                Recommandé: 100 à 500 coins pour les nouveaux comptes.
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-1" style={{ color: '#5f6f98' }}>Accès</p>
              <p className="text-sm font-semibold" style={{ color: '#edf2ff' }}>{roleMeta.label}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-1" style={{ color: '#5f6f98' }}>Sécurité</p>
              <p className="text-sm font-semibold" style={{ color: '#edf2ff' }}>{password.length >= 6 ? 'Mot de passe valide' : '6 caractères minimum'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-1" style={{ color: '#5f6f98' }}>Initialisation</p>
              <p className="text-sm font-semibold" style={{ color: '#edf2ff' }}>{coins || '0'} coins de départ</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-3 rounded-2xl text-xs" style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)', color: '#ff8f88' }}>
              <AlertTriangle size={13} />
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#7f8fba', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl text-sm font-black transition-all hover:brightness-110"
              style={{
                background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #79f07d, #53e085)',
                color: loading ? '#617198' : '#03110a',
                boxShadow: loading ? 'none' : '0 10px 30px rgba(83,224,133,0.22)',
              }}
            >
              {loading ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Panel détail utilisateur ─────────────────────────────────────────────────
function UserDetailPanel({ userId, onClose, onUpdated }: {
  userId: string; onClose: () => void; onUpdated: () => void;
}) {
  const [detail,       setDetail]       = useState<UserDetailResponse | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Edit states
  const [role,         setRole]         = useState('user');
  const [coinsInput,   setCoinsInput]   = useState('');
  const [coinsMode,    setCoinsMode]    = useState<'set' | 'add' | 'remove'>('set');
  const [newPassword,  setNewPassword]  = useState('');
  const [showPwField,  setShowPwField]  = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/users/${userId}`)
      .then(r => r.json())
      .then(d => {
        setDetail(d);
        setRole(d.user.role);
        setCoinsInput(String(d.user.coins));
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true); setError(''); setSuccessMsg('');
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? 'Erreur'); return false; }
    setDetail(prev => prev ? { ...prev, user: { ...prev.user, ...data.user } } : prev);
    onUpdated();
    return true;
  };

  const handleRoleSave = async () => {
    const ok = await patch({ role });
    if (ok) setSuccessMsg('Rôle mis à jour');
  };

  const handleCoinsSave = async () => {
    const val = parseInt(coinsInput);
    if (isNaN(val)) { setError('Valeur invalide'); return; }
    let body: Record<string, unknown> = {};
    if (coinsMode === 'set')    body = { coins: val };
    if (coinsMode === 'add')    body = { coinsAdjust: val };
    if (coinsMode === 'remove') body = { coinsAdjust: -val };
    const ok = await patch(body);
    if (ok) setSuccessMsg('Coins mis à jour');
  };

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) { setError('Mot de passe trop court (min. 6)'); return; }
    const ok = await patch({ password: newPassword });
    if (ok) { setNewPassword(''); setShowPwField(false); setSuccessMsg('Mot de passe réinitialisé'); }
  };

  const handleDelete = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    setSaving(false);
    if (res.ok) { onUpdated(); onClose(); }
    else { const d = await res.json(); setError(d.error ?? 'Erreur'); }
  };

  if (loading || !detail) {
    return (
      <aside className="flex items-center justify-center" style={{ width: 380, background: '#0d0f14', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#00e676', borderTopColor: 'transparent' }} />
      </aside>
    );
  }

  const u = detail.user;
  const stats = detail.stats;
  const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.user;

  return (
    <aside
      className="flex flex-col shrink-0 overflow-y-auto"
      style={{ width: 360, background: '#0d0f14', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header panel */}
      <div className="flex items-center justify-between px-4 py-3.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4a5380' }}>Détail utilisateur</p>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: '#4a5380' }}>
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-5 p-4">

        {/* Avatar + infos */}
        <div className="flex flex-col items-center text-center pt-2 pb-1">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-3"
            style={{ background: avatarGradient(u.username), color: '#000' }}
          >
            {u.username[0]?.toUpperCase()}
          </div>
          <p className="text-base font-black" style={{ color: '#fff' }}>{u.username}</p>
          <p className="text-xs mt-0.5" style={{ color: '#4a5380' }}>{u.email}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: rs.bg, color: rs.color }}>
            {rs.icon}
            {rs.label}
          </div>
          <p className="text-xs mt-2" style={{ color: '#4a5380' }}>
            Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <TrendingUp size={12} />, label: 'Paris total',   value: stats.totalBets,  color: '#8d97b8' },
              { icon: <Trophy size={12} />,     label: 'Paris gagnés',  value: stats.wonBets,    color: '#00e676' },
              { icon: <Zap size={12} />,        label: 'Paris actifs',  value: stats.activeBets, color: '#ffd700' },
              { icon: <Coins size={12} />,      label: 'Volume misé',   value: `🪙 ${formatCoins(stats.totalSpent)}`, color: '#4fc3f7' },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: '#4a5380' }}>
                  <span style={{ color }}>{icon}</span>
                  {label}
                </div>
                <p className="text-base font-black" style={{ color: '#fff' }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Toast */}
        {successMsg && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: '#00e676' }}>
            <Check size={13} />
            {successMsg}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)', color: '#f44336' }}>
            <AlertTriangle size={13} />
            {error}
          </div>
        )}

        {/* ── Changer le rôle ─────────────────────────────────────────────── */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4a5380' }}>
            <ShieldCheck size={11} className="inline mr-1.5" />
            Rôle
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {['user', 'creator', 'admin'].map(r => {
              const rs2 = ROLE_STYLE[r];
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: active ? rs2.bg : 'transparent',
                    color: active ? rs2.color : '#4a5380',
                    border: `1px solid ${active ? rs2.color + '50' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  {rs2.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleRoleSave}
            disabled={saving || role === u.role}
            className="w-full py-2 rounded-lg text-xs font-black transition-all hover:brightness-110"
            style={{
              background: (saving || role === u.role) ? 'rgba(255,255,255,0.05)' : '#00e676',
              color: (saving || role === u.role) ? '#4a5380' : '#000',
            }}
          >
            {saving ? 'Sauvegarde…' : 'Appliquer le rôle'}
          </button>
        </div>

        {/* ── Ajuster les coins ────────────────────────────────────────────── */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4a5380' }}>
              <Coins size={11} className="inline mr-1.5" />
              Coins
            </p>
            <span className="text-sm font-black" style={{ color: '#ffd700' }}>🪙 {u.coins.toLocaleString()}</span>
          </div>
          {/* Mode toggle */}
          <div className="flex gap-1">
            {(['set', 'add', 'remove'] as const).map(m => (
              <button
                key={m}
                onClick={() => setCoinsMode(m)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: coinsMode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: coinsMode === m ? '#fff' : '#4a5380',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {m === 'set' ? 'Définir' : m === 'add' ? '+ Ajouter' : '- Retirer'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number" value={coinsInput}
              onChange={e => setCoinsInput(e.target.value)}
              placeholder="Montant"
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
            <button
              onClick={handleCoinsSave} disabled={saving}
              className="px-3 py-2 rounded-lg text-xs font-black transition-all hover:brightness-110"
              style={{ background: '#ffd700', color: '#000' }}
            >
              OK
            </button>
          </div>
        </div>

        {/* ── Réinitialiser mot de passe ───────────────────────────────────── */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4a5380' }}>
            <KeyRound size={11} className="inline mr-1.5" />
            Mot de passe
          </p>
          {!showPwField ? (
            <button
              onClick={() => setShowPwField(true)}
              className="w-full py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#8d97b8', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Réinitialiser le mot de passe
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <button
                onClick={handlePasswordReset} disabled={saving}
                className="px-3 py-2 rounded-lg text-xs font-black transition-all hover:brightness-110"
                style={{ background: '#4fc3f7', color: '#000' }}
              >
                <Check size={13} />
              </button>
              <button onClick={() => { setShowPwField(false); setNewPassword(''); }}
                className="px-2.5 py-2 rounded-lg transition-all hover:bg-white/5" style={{ color: '#4a5380' }}>
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* ── Supprimer ────────────────────────────────────────────────────── */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(244,67,54,0.05)', border: '1px solid rgba(244,67,54,0.15)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(244,67,54,0.7)' }}>
            <Trash2 size={11} className="inline mr-1.5" />
            Zone de danger
          </p>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="w-full py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(244,67,54,0.1)', color: '#f44336', border: '1px solid rgba(244,67,54,0.2)' }}
            >
              Supprimer ce compte
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-center" style={{ color: '#f44336' }}>
                Confirmer la suppression de <strong>{u.username}</strong> ?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 transition-all" style={{ color: '#6b7db3', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={saving} className="flex-1 py-2 rounded-lg text-xs font-black transition-all" style={{ background: '#f44336', color: '#fff' }}>
                  {saving ? '…' : 'Supprimer'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function UsersAdmin() {
  const [users,      setUsers]      = useState<UserRecord[]>([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: '20',
      ...(search && { search }),
      ...(roleFilter && { role: roleFilter }),
    });
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f1117' }}>

      {/* ── Liste ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black" style={{ color: '#fff' }}>Utilisateurs</h1>
              <p className="text-sm mt-0.5" style={{ color: '#4a5380' }}>
                {total} compte{total > 1 ? 's' : ''} inscrit{total > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all hover:brightness-110"
              style={{ background: '#00e676', color: '#000' }}
            >
              <UserPlus size={15} />
              Créer un compte
            </button>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
              style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)', minWidth: 200, maxWidth: 380 }}
            >
              <Search size={13} style={{ color: '#4a5380' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Rechercher par nom ou email…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: '#fff' }}
              />
            </div>

            {/* Filtre rôle */}
            <div className="flex items-center gap-1">
              {[
                { value: '',        label: 'Tous' },
                { value: 'user',    label: 'Users' },
                { value: 'creator', label: 'Créateurs' },
                { value: 'admin',   label: 'Admins' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setRoleFilter(value); setPage(1); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: roleFilter === value ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: roleFilter === value ? '#fff' : '#4a5380',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Header table */}
            <div
              className="grid px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
              style={{ gridTemplateColumns: '1fr 1fr 90px 90px 100px 36px', borderBottom: '1px solid rgba(255,255,255,0.07)', color: '#4a5380' }}
            >
              <span>Utilisateur</span>
              <span>Email</span>
              <span>Rôle</span>
              <span>Coins</span>
              <span>Inscrit le</span>
              <span />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#00e676', borderTopColor: 'transparent' }} />
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-center py-16" style={{ color: '#4a5380' }}>Aucun utilisateur trouvé</p>
            ) : (
              users.map((u, i) => {
                const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.user;
                const isSelected = selectedId === u._id;
                return (
                  <div
                    key={u._id}
                    onClick={() => setSelectedId(isSelected ? null : u._id)}
                    className="grid px-5 py-3.5 items-center cursor-pointer transition-all"
                    style={{
                      gridTemplateColumns: '1fr 1fr 90px 90px 100px 36px',
                      borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      background: isSelected ? 'rgba(0,230,118,0.05)' : 'transparent',
                      borderLeft: isSelected ? '2px solid #00e676' : '2px solid transparent',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: avatarGradient(u.username), color: '#000' }}
                      >
                        {u.username[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold truncate" style={{ color: '#e0e6ff' }}>{u.username}</span>
                    </div>
                    <span className="text-xs truncate" style={{ color: '#6b7db3' }}>{u.email}</span>
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full w-fit" style={{ background: rs.bg, color: rs.color }}>
                      {rs.icon}
                      {rs.label}
                    </span>
                    <span className="text-xs font-mono" style={{ color: '#8d97b8' }}>🪙 {formatCoins(u.coins)}</span>
                    <span className="text-xs" style={{ color: '#4a5380' }}>
                      {new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                    <ChevronRight size={13} style={{ color: isSelected ? '#00e676' : '#4a5380', transition: 'transform 0.15s', transform: isSelected ? 'rotate(90deg)' : 'none' }} />
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30" style={{ color: '#6b7db3' }}>
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm" style={{ color: '#8d97b8' }}>Page {page} / {pages}</span>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30" style={{ color: '#6b7db3' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel latéral de détail ───────────────────────────────────────── */}
      {selectedId && (
        <UserDetailPanel
          userId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={load}
        />
      )}

      {/* ── Modale créer utilisateur ──────────────────────────────────────── */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
