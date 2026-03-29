'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react';

// ─── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 w-full" style={{ maxWidth: 480 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-0.5 flex-1 rounded-full transition-all duration-300"
          style={{ background: i < step ? '#00e676' : 'rgba(255,255,255,0.12)' }}
        />
      ))}
    </div>
  );
}

// ─── Logo ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="13" fill="none" stroke="rgba(0,230,118,0.35)" strokeWidth="1.2" />
        <ellipse cx="15" cy="17" rx="11" ry="4.5" fill="#1565c0" />
        <ellipse cx="15" cy="16" rx="11" ry="4.5" fill="#1976d2" />
        <path d="M10 14 Q15 11 20 14 Q18 18 15 17 Q12 18 10 14Z" fill="#388e3c" />
        <ellipse cx="15" cy="16" rx="11" ry="4.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
        <circle cx="3.5" cy="14" r="2.5" fill="#ffd700" style={{ filter: 'drop-shadow(0 0 4px #ffd700)' }} />
      </svg>
      <span className="font-black tracking-widest text-sm uppercase" style={{ color: '#00e676', letterSpacing: '0.12em' }}>
        FLATEARTH
      </span>
    </div>
  );
}

// ─── Password requirements ─────────────────────────────────────────────────────
function PasswordReq({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${ok ? 'bg-green-500' : 'bg-transparent'}`}
           style={{ border: ok ? 'none' : '1.5px solid rgba(255,255,255,0.2)' }}>
        {ok && <Check size={10} color="#000" strokeWidth={3} />}
      </div>
      <span style={{ color: ok ? '#00e676' : 'rgba(255,255,255,0.4)' }}>{label}</span>
    </div>
  );
}

// ─── Input Kalshi-style ────────────────────────────────────────────────────────
function KInput({
  type = 'text', value, onChange, placeholder, autoFocus = false,
  prefix, suffix, error,
}: {
  type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
  autoFocus?: boolean; prefix?: string; suffix?: React.ReactNode; error?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-2xl px-4 py-4 transition-all"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: `1.5px solid ${error ? '#f44336' : 'rgba(255,255,255,0.12)'}`,
        outline: 'none',
      }}
    >
      {prefix && <span className="text-sm font-semibold shrink-0" style={{ color: '#6b7db3' }}>{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent outline-none text-base"
        style={{ color: '#fff', caretColor: '#00e676' }}
      />
      {suffix}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step,      setStep]     = useState(1); // 1=email 2=password 3=username 4=welcome
  const [email,     setEmail]    = useState('');
  const [password,  setPassword] = useState('');
  const [username,  setUsername] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') ?? '');
  const [showPass,  setShowPass] = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState('');

  // Password requirements
  const pwReqs = {
    length:    password.length >= 8,
    number:    /\d/.test(password),
    upper:     /[A-Z]/.test(password),
    lower:     /[a-z]/.test(password),
  };
  const pwValid = Object.values(pwReqs).every(Boolean);

  // Username validation
  const usernameValid = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);

  const goBack = () => {
    setError('');
    setStep(s => Math.max(1, s - 1));
  };

  // Step 1 → 2
  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Email invalide'); return; }
    setError('');
    setStep(2);
  };

  // Step 2 → 3
  const handlePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwValid) { setError('Le mot de passe ne remplit pas tous les critères'); return; }
    setError('');
    setStep(3);
  };

  // Step 3 → call API → auto-login → Step 4
  const handleUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameValid) { setError('Pseudo invalide (min. 3 car., lettres/chiffres/_)'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, referralCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur inscription'); setLoading(false); return; }

      // Auto-login
      const result = await signIn('credentials', {
        redirect: false, email, password,
      });
      if (result?.error) { setError('Compte créé mais connexion échouée'); setLoading(false); return; }

      setStep(4);
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f1117' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={step > 1 && step < 4 ? goBack : () => router.push('/')}
          className="p-2 rounded-xl transition-all hover:bg-white/5"
          style={{ color: '#6b7db3' }}
        >
          <ArrowLeft size={18} />
        </button>
        <Logo />
        <Link href="/" className="p-2 rounded-xl transition-all hover:bg-white/5" style={{ color: '#6b7db3' }}>
          <X size={18} />
        </Link>
      </div>

      {/* Progress */}
      {step < 4 && (
        <div className="flex justify-center px-6 pb-2">
          <ProgressBar step={step} total={3} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 pt-10">
        <div className="w-full" style={{ maxWidth: 480 }}>

          {/* ── STEP 1 : Email ─────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleEmail}>
              <h1 className="text-3xl font-black mb-8" style={{ color: '#fff' }}>
                Quelle est ton adresse e-mail ?
              </h1>
              <KInput
                type="email" value={email} onChange={setEmail}
                placeholder="Email" autoFocus error={!!error}
              />
              <div className="mt-3">
                <KInput
                  value={referralCode}
                  onChange={(value) => setReferralCode(value.toUpperCase())}
                  placeholder="Code de parrainage (optionnel)"
                  prefix="🎁"
                />
              </div>
              {error && <p className="mt-2 text-sm" style={{ color: '#f44336' }}>{error}</p>}
              <button
                type="submit"
                className="mt-4 w-full py-4 rounded-2xl text-base font-black transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: '#00e676', color: '#000' }}
              >
                Continuer
              </button>
              <p className="text-center mt-5 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Tu as déjà un compte ?{' '}
                <Link href="/auth/login" className="font-bold" style={{ color: '#00e676' }}>Se connecter</Link>
              </p>
              <p className="text-center mt-6 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
                En continuant, tu acceptes les{' '}
                <span style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>conditions d&apos;utilisation</span>
                {' '}de FlatEarth.
              </p>
            </form>
          )}

          {/* ── STEP 2 : Password ──────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handlePassword}>
              <h1 className="text-3xl font-black mb-8" style={{ color: '#fff' }}>
                Crée ton mot de passe
              </h1>
              <KInput
                type={showPass ? 'text' : 'password'}
                value={password} onChange={setPassword}
                placeholder="Mot de passe" autoFocus
                suffix={
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ color: '#4a5380' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              {/* Requirements */}
              <div className="mt-5 flex flex-col gap-2.5">
                <PasswordReq ok={pwReqs.length} label="8 à 72 caractères" />
                <PasswordReq ok={pwReqs.number} label="Inclure un chiffre" />
                <PasswordReq ok={pwReqs.lower && pwReqs.upper} label="Minuscules et majuscules" />
              </div>
              {error && <p className="mt-3 text-sm" style={{ color: '#f44336' }}>{error}</p>}
              <button
                type="submit"
                disabled={!pwValid}
                className="mt-8 w-full py-4 rounded-2xl text-base font-black transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: pwValid ? '#00e676' : 'rgba(255,255,255,0.08)', color: pwValid ? '#000' : '#4a5380' }}
              >
                Continuer
              </button>
            </form>
          )}

          {/* ── STEP 3 : Username ──────────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleUsername}>
              <h1 className="text-3xl font-black mb-2" style={{ color: '#fff' }}>
                Choisis ton pseudo
              </h1>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Tu pourras le modifier plus tard.
              </p>
              <KInput
                value={username} onChange={v => setUsername(v.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="tonpseudo" autoFocus prefix="@"
                error={!!error}
                suffix={
                  usernameValid
                    ? <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0"><Check size={12} color="#000" strokeWidth={3} /></div>
                    : null
                }
              />
              {error && <p className="mt-2 text-sm" style={{ color: '#f44336' }}>{error}</p>}

              {/* Terms checkboxes */}
              <div className="mt-6 flex flex-col gap-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required className="mt-0.5 accent-green-400" />
                  <span className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    En jouant, j&apos;accepte les{' '}
                    <span style={{ color: '#00e676' }}>Conditions d&apos;utilisation</span>{' '}
                    et certifie avoir plus de 18 ans.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 accent-green-400" />
                  <span className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    M&apos;envoyer les mises à jour importantes du marché et des produits.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!usernameValid || loading}
                className="mt-6 w-full py-4 rounded-2xl text-base font-black transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: usernameValid && !loading ? '#00e676' : 'rgba(255,255,255,0.08)',
                  color: usernameValid && !loading ? '#000' : '#4a5380',
                }}
              >
                {loading ? 'Création du compte…' : 'Continuer'}
              </button>
            </form>
          )}

          {/* ── STEP 4 : Welcome + Deposit ─────────────────────────── */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center">
              {/* Celebration icon */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6"
                style={{ background: 'rgba(0,230,118,0.1)', border: '2px solid rgba(0,230,118,0.3)' }}
              >
                🌍
              </div>
              <h1 className="text-3xl font-black mb-2" style={{ color: '#fff' }}>
                Bienvenue, @{username} !
              </h1>
              <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Ton compte est créé avec succès.
              </p>

              {/* Wallet CTA */}
              <div
                className="mt-6 mb-8 rounded-2xl px-6 py-4 flex items-center gap-4 w-full"
                style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)' }}
              >
                <div className="text-3xl shrink-0">🎁</div>
                <div className="text-left">
                  <p className="text-base font-black" style={{ color: '#00e676' }}>Prêt à parier en réel ?</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(0,230,118,0.6)' }}>Dépose des fonds pour commencer à miser.</p>
                </div>
              </div>

              {/* Deposit option */}
              <div className="w-full flex flex-col gap-3">
                <Link
                  href="/?wallet=open"
                  className="w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #00e676, #00b8d4)', color: '#000', boxShadow: '0 4px 20px rgba(0,230,118,0.25)' }}
                >
                  💳 Déposer des fonds
                </Link>
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-4 rounded-2xl text-base font-semibold transition-all hover:bg-white/8"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Explorer les marchés →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
