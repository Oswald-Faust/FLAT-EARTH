'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Header from '@/components/layout/Header';
import {
  User, Lock, Mail, Bell, Shield, LogOut,
  ChevronRight, Check, AlertTriangle,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface UserData {
  username: string;
  email: string;
  role: string;
  coins: number;
  createdAt: string;
}

// ─── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl animate-in slide-in-from-bottom-4"
      style={{
        background: type === 'success' ? 'rgba(0,230,118,0.15)' : 'rgba(244,67,54,0.15)',
        border: `1px solid ${type === 'success' ? 'rgba(0,230,118,0.3)' : 'rgba(244,67,54,0.3)'}`,
        color: type === 'success' ? '#00e676' : '#f44336',
        backdropFilter: 'blur(12px)',
      }}
    >
      {type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}
      {message}
    </div>
  );
}

// ─── Input component ──────────────────────────────────────────────────────────
function SInput({
  label, type = 'text', value, onChange, placeholder, disabled = false,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
        style={{
          background: disabled ? 'var(--bg-item)' : 'var(--bg-input)',
          border: '1.5px solid var(--border-medium)',
          color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          caretColor: '#00e676',
        }}
      />
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span style={{ color: '#00e676' }}>{icon}</span>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

// ─── Save button ──────────────────────────────────────────────────────────────
function SaveBtn({ loading, disabled }: { loading: boolean; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="px-5 py-2.5 rounded-xl text-sm font-black transition-all hover:brightness-110 active:scale-[0.98]"
      style={{
        background: (!disabled && !loading) ? '#00e676' : 'var(--bg-item-hover)',
        color: (!disabled && !loading) ? '#000' : 'var(--text-muted)',
      }}
    >
      {loading ? 'Enregistrement…' : 'Enregistrer'}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Profile form
  const [username, setUsername] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Email form
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Notifications (local-only for now)
  const [notifMarkets, setNotifMarkets] = useState(true);
  const [notifResults, setNotifResults] = useState(true);
  const [notifNewsletter, setNotifNewsletter] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setUserData(d.user);
            setUsername(d.user.username);
            setNewEmail(d.user.email);
          }
        });
    }
  }, [status, router]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const callSettings = async (payload: Record<string, string>) => {
    const res = await fetch('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  // ── Submit: profile ──────────────────────────────────────────────────────
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === userData?.username) return;
    setLoadingProfile(true);
    const data = await callSettings({ type: 'profile', username });
    setLoadingProfile(false);
    if (data.success) {
      setUserData(prev => prev ? { ...prev, username: data.username } : prev);
      showToast('Pseudo mis à jour !', 'success');
    } else {
      showToast(data.error ?? 'Erreur', 'error');
    }
  };

  // ── Submit: email ────────────────────────────────────────────────────────
  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail === userData?.email || !emailPassword) return;
    setLoadingEmail(true);
    const data = await callSettings({ type: 'email', newEmail, password: emailPassword });
    setLoadingEmail(false);
    if (data.success) {
      setUserData(prev => prev ? { ...prev, email: data.email } : prev);
      setEmailPassword('');
      showToast('Email mis à jour !', 'success');
    } else {
      showToast(data.error ?? 'Erreur', 'error');
    }
  };

  // ── Submit: password ─────────────────────────────────────────────────────
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Mot de passe trop court (min. 8 caractères)', 'error');
      return;
    }
    setLoadingPassword(true);
    const data = await callSettings({ type: 'password', currentPassword, newPassword });
    setLoadingPassword(false);
    if (data.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Mot de passe mis à jour !', 'success');
    } else {
      showToast(data.error ?? 'Erreur', 'error');
    }
  };

  if (status === 'loading' || !userData) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Header isLoggedIn={!!session} coins={0} liveCount={0} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#00e676', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  const joinDate = new Date(userData.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header isLoggedIn={true} coins={userData.coins} liveCount={0} />

      <div className="flex-1">
        <div className="max-w-2xl mx-auto px-5 py-8">

          {/* Page header */}
          <div className="flex items-center gap-3 mb-8">
            <Link href="/profile" className="p-2 rounded-xl transition-all" style={{ color: 'var(--text-muted)' }}>
              <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
            </Link>
            <div>
              <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Paramètres</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Inscrit le {joinDate}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">

            {/* ── Profil ──────────────────────────────────────────────────── */}
            <SectionCard title="Profil" icon={<User size={15} />}>
              <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
                {/* Avatar preview */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shrink-0"
                    style={{ background: 'linear-gradient(135deg, #00e676, #4fc3f7, #ff6b9d)', color: '#000' }}
                  >
                    {(username[0] ?? '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>@{username}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {userData.role === 'admin' ? '👑 Administrateur' : userData.role === 'creator' ? '✨ Créateur' : '👤 Utilisateur'}
                    </p>
                  </div>
                </div>

                <SInput
                  label="Pseudo"
                  value={username}
                  onChange={setUsername}
                  placeholder="tonpseudo"
                />

                <div className="flex justify-end">
                  <SaveBtn loading={loadingProfile} disabled={username === userData.username || username.length < 3} />
                </div>
              </form>
            </SectionCard>

            {/* ── Email ───────────────────────────────────────────────────── */}
            <SectionCard title="Adresse e-mail" icon={<Mail size={15} />}>
              <form onSubmit={handleEmailSave} className="flex flex-col gap-4">
                <SInput
                  label="Nouvel email"
                  type="email"
                  value={newEmail}
                  onChange={setNewEmail}
                  placeholder="nouveau@email.com"
                />
                <SInput
                  label="Mot de passe actuel (confirmation)"
                  type="password"
                  value={emailPassword}
                  onChange={setEmailPassword}
                  placeholder="••••••••"
                />
                <div className="flex justify-end">
                  <SaveBtn
                    loading={loadingEmail}
                    disabled={newEmail === userData.email || !newEmail.includes('@') || !emailPassword}
                  />
                </div>
              </form>
            </SectionCard>

            {/* ── Mot de passe ─────────────────────────────────────────────── */}
            <SectionCard title="Mot de passe" icon={<Lock size={15} />}>
              <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
                <SInput
                  label="Mot de passe actuel"
                  type="password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="••••••••"
                />
                <SInput
                  label="Nouveau mot de passe"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="8 caractères minimum"
                />
                <SInput
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                />
                {/* Requirements mini */}
                {newPassword.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {[
                      { ok: newPassword.length >= 8, label: '8 caractères minimum' },
                      { ok: /[A-Z]/.test(newPassword), label: 'Une majuscule' },
                      { ok: /\d/.test(newPassword), label: 'Un chiffre' },
                      { ok: newPassword === confirmPassword && confirmPassword.length > 0, label: 'Les mots de passe correspondent' },
                    ].map(({ ok, label }) => (
                      <div key={label} className="flex items-center gap-2 text-xs">
                        <div
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: ok ? '#00e676' : 'var(--bg-item-hover)' }}
                        >
                          {ok && <Check size={8} color="#000" strokeWidth={3} />}
                        </div>
                        <span style={{ color: ok ? '#00e676' : 'var(--text-muted)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <SaveBtn
                    loading={loadingPassword}
                    disabled={!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                  />
                </div>
              </form>
            </SectionCard>

            {/* ── Notifications ───────────────────────────────────────────── */}
            <SectionCard title="Notifications" icon={<Bell size={15} />}>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Résultats de marchés', desc: 'Alertes quand un marché où tu as parié est résolu', value: notifResults, onChange: setNotifResults },
                  { label: 'Nouveaux marchés', desc: 'Alertes pour les nouveaux marchés dans tes catégories favorites', value: notifMarkets, onChange: setNotifMarkets },
                  { label: 'Newsletter FlatEarth', desc: 'Récapitulatif hebdomadaire des meilleurs marchés', value: notifNewsletter, onChange: setNotifNewsletter },
                ].map(({ label, desc, value, onChange }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                    {/* Toggle switch */}
                    <button
                      type="button"
                      onClick={() => onChange(v => !v)}
                      className="relative w-11 h-6 rounded-full transition-all shrink-0"
                      style={{ background: value ? '#00e676' : 'var(--bg-item-hover)' }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{
                          background: 'var(--bg-card)',
                          left: value ? 'calc(100% - 22px)' : '2px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── Sécurité & compte ───────────────────────────────────────── */}
            <SectionCard title="Sécurité & Compte" icon={<Shield size={15} />}>
              <div className="flex flex-col gap-2">
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'var(--bg-item)', border: '1px solid var(--border-light)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>Authentification à deux facteurs</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Bientôt disponible (Phase 2)</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700' }}>
                    À venir
                  </span>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all hover:bg-white/[0.04]"
                  style={{ color: '#f44336', border: '1px solid rgba(244,67,54,0.15)' }}
                >
                  <LogOut size={15} />
                  Se déconnecter de tous les appareils
                </button>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
