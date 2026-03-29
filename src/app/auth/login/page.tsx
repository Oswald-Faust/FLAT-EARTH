'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, ArrowLeft, X } from 'lucide-react';

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

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5 w-full" style={{ maxWidth: 480 }}>
      {[1, 2].map(i => (
        <div
          key={i}
          className="h-0.5 flex-1 rounded-full transition-all duration-300"
          style={{ background: i <= step ? '#00e676' : 'rgba(255,255,255,0.12)' }}
        />
      ))}
    </div>
  );
}

function KInput({
  type = 'text', value, onChange, placeholder, autoFocus = false, suffix,
}: {
  type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoFocus?: boolean; suffix?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-2xl px-4 py-4"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.12)' }}
    >
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus}
        className="flex-1 bg-transparent outline-none text-base"
        style={{ color: '#fff', caretColor: '#00e676' }}
      />
      {suffix}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step,     setStep]    = useState(1);
  const [email,    setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Email invalide'); return; }
    setError('');
    setStep(2);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        redirect: false, email, password,
      });
      if (result?.error) {
        setError('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Erreur de connexion au serveur');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f1117' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={step === 2 ? () => { setStep(1); setError(''); } : () => router.push('/')}
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
      <div className="flex justify-center px-6 pb-2">
        <ProgressBar step={step} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 pt-10">
        <div className="w-full" style={{ maxWidth: 480 }}>

          {/* Step 1 — Email */}
          {step === 1 && (
            <form onSubmit={handleEmail}>
              <h1 className="text-3xl font-black mb-8" style={{ color: '#fff' }}>
                Quelle est ton adresse e-mail ?
              </h1>
              <KInput
                type="email" value={email} onChange={setEmail}
                placeholder="Email" autoFocus
              />
              {error && <p className="mt-2 text-sm" style={{ color: '#f44336' }}>{error}</p>}
              <button
                type="submit"
                className="mt-4 w-full py-4 rounded-2xl text-base font-black transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: '#00e676', color: '#000' }}
              >
                Continuer
              </button>
              <p className="text-center mt-5 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Pas encore de compte ?{' '}
                <Link href="/auth/register" className="font-bold" style={{ color: '#00e676' }}>S&apos;inscrire</Link>
              </p>
            </form>
          )}

          {/* Step 2 — Password */}
          {step === 2 && (
            <form onSubmit={handlePassword}>
              <h1 className="text-3xl font-black mb-2" style={{ color: '#fff' }}>
                Ton mot de passe
              </h1>
              <p className="text-sm mb-8 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {email}
              </p>
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
              {error && (
                <div className="mt-3 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.25)', color: '#f44336' }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !password}
                className="mt-6 w-full py-4 rounded-2xl text-base font-black transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: password && !loading ? '#00e676' : 'rgba(255,255,255,0.08)',
                  color: password && !loading ? '#000' : '#4a5380',
                }}
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
              <p className="text-center mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Mot de passe oublié ?{' '}
                <span className="font-semibold cursor-pointer" style={{ color: '#00e676' }}>Réinitialiser</span>
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
