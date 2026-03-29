'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, X, Check, Plus, Trash2, Shuffle,
  Search, Target, Scale, Globe, AlertTriangle,
  ChevronRight, Sparkles, CreditCard, RotateCcw,
} from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_LABELS, type MarketCategory } from '@/types';

// ─── Constantes ────────────────────────────────────────────────────────────────
const CREATION_COST_EUR = 5;
const OPTION_COLORS = ['#00e676', '#f44336', '#4fc3f7', '#ffd700', '#ce93d8', '#ff9800'];
const CATEGORIES = Object.entries(CATEGORY_LABELS) as [MarketCategory, string][];

// ─── Google-isable checklist ──────────────────────────────────────────────────
const GOOGLE_CHECKS = [
  { id: 'searchable',  icon: <Search size={15} />,  label: 'Le résultat est trouvable via une recherche Google', desc: 'Ex : "PSG Barcelone score final 2026"' },
  { id: 'clear',       icon: <Target size={15} />,  label: 'La question est claire et sans ambiguïté', desc: 'Une seule interprétation possible' },
  { id: 'source',      icon: <Globe size={15} />,   label: 'Il existe une source officielle vérifiable', desc: 'Stats, article, résultat officiel, communiqué' },
  { id: 'timebound',   icon: <Scale size={15} />,   label: 'Le résultat sera connu avant la date de fin', desc: 'On peut trancher avec certitude' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface MarketOption { label: string; probability: number }

// ─── Composants utilitaires ──────────────────────────────────────────────────
function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0"
      style={{
        background: done ? '#00e676' : active ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.07)',
        border: `2px solid ${done ? '#00e676' : active ? '#00e676' : 'rgba(255,255,255,0.1)'}`,
        color: done ? '#000' : active ? '#00e676' : '#4a5380',
      }}
    >
      {done ? <Check size={12} strokeWidth={3} /> : n}
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1" style={{ maxWidth: 480, width: '100%' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-0.5 flex-1 rounded-full transition-all duration-500"
          style={{ background: i < step ? '#00e676' : 'rgba(255,255,255,0.1)' }}
        />
      ))}
    </div>
  );
}

function SInput({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4a5380' }}>
        {label}{required && <span style={{ color: '#f44336' }}> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs" style={{ color: '#4a5380' }}>{hint}</p>}
    </div>
  );
}

const IS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1.5px solid rgba(255,255,255,0.1)',
  color: '#fff',
  borderRadius: 14,
  caretColor: '#00e676',
};

// ─── Page principale ──────────────────────────────────────────────────────────
export default function CreateMarketPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1); // 1-4

  // ── State success / cancel (retour depuis Stripe) ──────────────────────────
  const [submitted,   setSubmitted]   = useState(false);
  const [cancelled,   setCancelled]   = useState(false);
  const [createdId,   setCreatedId]   = useState('');

  // ── Step 1 — Question ──────────────────────────────────────────────────────
  const [title,        setTitle]       = useState('');
  const [description,  setDescription] = useState('');
  const [contextNews,  setContextNews] = useState('');
  const [checks,       setChecks]      = useState<Record<string, boolean>>({});

  // ── Step 2 — Options ───────────────────────────────────────────────────────
  const [options,  setOptions]  = useState<MarketOption[]>([
    { label: 'Oui', probability: 50 },
    { label: 'Non', probability: 50 },
  ]);

  // ── Step 3 — Config ────────────────────────────────────────────────────────
  const [category,          setCategory]         = useState<MarketCategory | ''>('');
  const [subcategory,       setSubcategory]       = useState('');
  const [endsAt,            setEndsAt]            = useState(() => {
    const d = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [creatorFeePercent, setCreatorFeePercent] = useState(2);
  const [rules,             setRules]             = useState('');

  // ── Step 4 — Submit ────────────────────────────────────────────────────────
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');

  const allChecked = GOOGLE_CHECKS.every(c => checks[c.id]);
  const totalProb  = options.reduce((s, o) => s + (o.probability || 0), 0);

  // Redirect si non connecté + détection retour Stripe
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login?from=/create-market');
    if (status === 'authenticated') {
      const params = new URLSearchParams(window.location.search);
      const isSuccess   = params.get('success') === '1';
      const isCancelled = params.get('cancelled') === '1';
      const mId         = params.get('marketId') ?? '';
      if (isSuccess && mId) { setCreatedId(mId); setSubmitted(true); }
      if (isCancelled)       { setCancelled(true); }
    }
  }, [status, router]);

  // ── Step validation ────────────────────────────────────────────────────────
  const canProceed1 = title.trim().length >= 10 && allChecked;
  const canProceed2 = options.length >= 2 && options.every(o => o.label.trim()) && totalProb === 100;
  const canProceed3 = !!category && !!endsAt && new Date(endsAt) > new Date();

  // ── Options helpers ────────────────────────────────────────────────────────
  const autoBalance = () => {
    const eq = Math.floor(100 / options.length);
    const rem = 100 - eq * options.length;
    setOptions(opts => opts.map((o, i) => ({ ...o, probability: eq + (i === 0 ? rem : 0) })));
  };
  const addOption = () => {
    if (options.length >= 6) return;
    setOptions(prev => [...prev, { label: `Option ${prev.length + 1}`, probability: Math.floor(100 / (prev.length + 1)) }]);
  };
  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, idx) => idx !== i));
  };

  // ── Submit → crée le marché (draft) + redirect Stripe ─────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/user/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, rules, contextNews,
          category, subcategory, options, endsAt,
          creatorFeePercent, isGoogleVerified: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error ?? 'Erreur'); setSubmitting(false); return; }
      // Redirect vers Stripe Checkout
      window.location.href = data.checkoutUrl;
    } catch {
      setSubmitError('Erreur réseau');
      setSubmitting(false);
    }
  };

  // ── Auth loading ───────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1117' }}>
        <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: '#00e676', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // ── Succès (retour Stripe) ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: '#0f1117' }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6"
          style={{ background: 'rgba(0,230,118,0.1)', border: '2px solid rgba(0,230,118,0.3)' }}
        >
          🎉
        </div>
        <h1 className="text-3xl font-black text-center mb-3" style={{ color: '#fff' }}>
          Paiement confirmé !
        </h1>
        <p className="text-sm text-center mb-2 max-w-sm" style={{ color: '#6b7db3' }}>
          Ton marché a été soumis pour validation. L&apos;équipe FlatEarth va le vérifier sous{' '}
          <strong style={{ color: '#00e676' }}>24 à 48h</strong>.
        </p>
        <p className="text-xs text-center mb-8" style={{ color: '#4a5380' }}>
          Tu seras notifié dès qu&apos;il sera approuvé et visible publiquement.
        </p>

        {/* Confirmation paiement */}
        <div
          className="mb-8 px-5 py-3.5 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)' }}
        >
          <CreditCard size={16} style={{ color: '#00e676' }} />
          <div>
            <p className="text-sm font-black" style={{ color: '#00e676' }}>
              {CREATION_COST_EUR},00€ payés via Stripe
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(0,230,118,0.5)' }}>
              Paiement sécurisé · Ref : {createdId.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full" style={{ maxWidth: 380 }}>
          {createdId && (
            <Link
              href={`/market/${createdId}`}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-center transition-all hover:brightness-110"
              style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', color: '#00e676' }}
            >
              Voir mon marché →
            </Link>
          )}
          <button
            onClick={() => router.push('/')}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#6b7db3', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Retour aux marchés
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f1117' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <button
          onClick={step > 1 ? () => setStep(s => s - 1) : () => router.push('/')}
          className="p-2 rounded-xl transition-all hover:bg-white/5"
          style={{ color: '#6b7db3' }}
        >
          <ArrowLeft size={18} />
        </button>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(n => (
            <StepBadge key={n} n={n} active={step === n} done={step > n} />
          ))}
        </div>

        <Link href="/" className="p-2 rounded-xl transition-all hover:bg-white/5" style={{ color: '#6b7db3' }}>
          <X size={18} />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="flex justify-center px-6 pb-2">
        <ProgressBar step={step} total={4} />
      </div>

      {/* Alerte annulation paiement */}
      {cancelled && (
        <div className="flex justify-center px-6 mt-2">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm w-full"
            style={{ maxWidth: 560, background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.25)', color: '#ff9800' }}
          >
            <RotateCcw size={14} />
            Paiement annulé. Tu peux réessayer à l&apos;étape 4.
            <button onClick={() => setCancelled(false)} className="ml-auto p-1 hover:opacity-70"><X size={12} /></button>
          </div>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex justify-center px-6 pt-8 pb-10">
        <div className="w-full" style={{ maxWidth: 560 }}>

          {/* ════ ÉTAPE 1 — La question ════════════════════════════════════════ */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#00e676' }}>
                  Étape 1 sur 4
                </p>
                <h1 className="text-3xl font-black" style={{ color: '#fff' }}>
                  Quelle est ta question ?
                </h1>
                <p className="text-sm mt-2" style={{ color: '#6b7db3' }}>
                  Formule ton pari comme une question avec une réponse vérifiable.
                </p>
              </div>

              {/* Titre */}
              <SInput label="Titre du pari" required hint="Minimum 10 caractères · Ex : « PSG va-t-il gagner la Ligue des Champions 2026 ? »">
                <textarea
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  rows={2}
                  placeholder="PSG va-t-il remporter la Ligue des Champions 2026 ?"
                  className="w-full px-4 py-3 text-sm outline-none resize-none"
                  style={{ ...IS, lineHeight: 1.6 }}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs" style={{ color: title.length < 10 ? '#f44336' : '#4a5380' }}>
                    {title.length} / 10 min
                  </span>
                </div>
              </SInput>

              {/* Description */}
              <SInput label="Contexte (optionnel)" hint="Donne du contexte pour que les autres comprennent l'enjeu">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Le PSG est qualifié en demi-finale après..."
                  className="w-full px-4 py-3 text-sm outline-none resize-none"
                  style={{ ...IS, lineHeight: 1.6 }}
                />
              </SInput>

              {/* Actu */}
              <SInput label="Actu / Source (optionnel)" hint="Lien ou extrait d'actualité qui justifie ce pari">
                <input
                  value={contextNews}
                  onChange={e => setContextNews(e.target.value)}
                  placeholder="Selon L'Équipe, le PSG..."
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={IS}
                />
              </SInput>

              {/* ── Checklist Google-isable ────────────────────────────────── */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ background: 'rgba(0,230,118,0.08)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <Sparkles size={15} style={{ color: '#00e676' }} />
                  <div>
                    <p className="text-sm font-black" style={{ color: '#fff' }}>Mon pari est Google-isable</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a5380' }}>
                      Coche les 4 critères pour pouvoir continuer
                    </p>
                  </div>
                  <span
                    className="ml-auto text-xs font-black px-2 py-0.5 rounded-full"
                    style={{
                      background: allChecked ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.07)',
                      color: allChecked ? '#00e676' : '#4a5380',
                    }}
                  >
                    {Object.values(checks).filter(Boolean).length}/4
                  </span>
                </div>

                {GOOGLE_CHECKS.map(({ id, icon, label, desc }) => {
                  const checked = !!checks[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setChecks(prev => ({ ...prev, [id]: !prev[id] }))}
                      className="w-full flex items-start gap-3.5 px-4 py-3.5 text-left transition-all hover:bg-white/[0.03]"
                      style={{
                        background: checked ? 'rgba(0,230,118,0.04)' : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all"
                        style={{
                          background: checked ? '#00e676' : 'rgba(255,255,255,0.07)',
                          border: `1.5px solid ${checked ? '#00e676' : 'rgba(255,255,255,0.15)'}`,
                        }}
                      >
                        {checked && <Check size={11} color="#000" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: checked ? '#00e676' : '#4a5380' }}>{icon}</span>
                          <p className="text-sm font-semibold" style={{ color: checked ? '#e0e6ff' : '#8d97b8' }}>
                            {label}
                          </p>
                        </div>
                        <p className="text-xs mt-0.5 pl-6" style={{ color: '#4a5380' }}>{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceed1}
                className="w-full py-4 rounded-2xl text-base font-black transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: canProceed1 ? '#00e676' : 'rgba(255,255,255,0.07)',
                  color: canProceed1 ? '#000' : '#4a5380',
                }}
              >
                Continuer →
              </button>
            </div>
          )}

          {/* ════ ÉTAPE 2 — Les options ════════════════════════════════════════ */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#00e676' }}>
                  Étape 2 sur 4
                </p>
                <h1 className="text-3xl font-black" style={{ color: '#fff' }}>
                  Quelles sont les réponses ?
                </h1>
                <p className="text-sm mt-2" style={{ color: '#6b7db3' }}>
                  Définis les options sur lesquelles les gens vont parier. Les probabilités doivent totaliser 100%.
                </p>
              </div>

              {/* Total prob indicator */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  background: totalProb === 100 ? 'rgba(0,230,118,0.07)' : 'rgba(244,67,54,0.07)',
                  border: `1px solid ${totalProb === 100 ? 'rgba(0,230,118,0.2)' : 'rgba(244,67,54,0.2)'}`,
                }}
              >
                <span className="text-sm font-semibold" style={{ color: totalProb === 100 ? '#00e676' : '#f44336' }}>
                  {totalProb === 100 ? '✓ Total : 100%' : `⚠ Total : ${totalProb}% — doit être 100%`}
                </span>
                <button
                  type="button" onClick={autoBalance}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-110"
                  style={{ background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.25)', color: '#4fc3f7' }}
                >
                  <Shuffle size={11} /> Équilibrer
                </button>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {options.map((opt, i) => {
                  const color = OPTION_COLORS[i] ?? '#aaa';
                  return (
                    <div
                      key={i}
                      className="rounded-2xl p-4"
                      style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                          style={{ background: `${color}22`, color }}
                        >
                          {i + 1}
                        </div>
                        <input
                          value={opt.label}
                          onChange={e => {
                            const n = [...options]; n[i] = { ...n[i], label: e.target.value }; setOptions(n);
                          }}
                          placeholder={i === 0 ? 'Ex : Oui' : i === 1 ? 'Ex : Non' : `Option ${i + 1}`}
                          className="flex-1 px-3 py-2.5 text-sm outline-none rounded-xl"
                          style={IS}
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number" min={1} max={99}
                            value={opt.probability}
                            onChange={e => {
                              const n = [...options]; n[i] = { ...n[i], probability: parseInt(e.target.value) || 0 }; setOptions(n);
                            }}
                            className="w-14 px-2 py-2.5 text-sm text-center font-black outline-none rounded-xl"
                            style={{ ...IS, color }}
                          />
                          <span className="text-xs font-bold" style={{ color: '#4a5380' }}>%</span>
                        </div>
                        <button
                          type="button" onClick={() => removeOption(i)}
                          disabled={options.length <= 2}
                          className="p-1.5 rounded-lg transition-all hover:bg-red-500/10 disabled:opacity-20 shrink-0"
                          style={{ color: '#6b7db3' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${opt.probability}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {options.length < 6 && (
                <button
                  type="button" onClick={addOption}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ border: '1.5px dashed rgba(255,255,255,0.12)', color: '#6b7db3' }}
                >
                  <Plus size={15} />
                  Ajouter une option ({options.length}/6)
                </button>
              )}

              <button
                onClick={() => setStep(3)}
                disabled={!canProceed2}
                className="w-full py-4 rounded-2xl text-base font-black transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: canProceed2 ? '#00e676' : 'rgba(255,255,255,0.07)',
                  color: canProceed2 ? '#000' : '#4a5380',
                }}
              >
                Continuer →
              </button>
            </div>
          )}

          {/* ════ ÉTAPE 3 — Configuration ══════════════════════════════════════ */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#00e676' }}>
                  Étape 3 sur 4
                </p>
                <h1 className="text-3xl font-black" style={{ color: '#fff' }}>
                  Configuration
                </h1>
                <p className="text-sm mt-2" style={{ color: '#6b7db3' }}>
                  Catégorie, date de clôture et tes frais de créateur.
                </p>
              </div>

              {/* Catégorie */}
              <SInput label="Catégorie" required>
                <div className="grid gap-2 mt-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                  {CATEGORIES.map(([slug, label]) => {
                    const icon = CATEGORY_ICONS[slug];
                    const active = category === slug;
                    return (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => { setCategory(slug); setSubcategory(''); }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all hover:brightness-110"
                        style={{
                          background: active ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)',
                          border: `1.5px solid ${active ? 'rgba(0,230,118,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: active ? '#00e676' : '#6b7db3',
                        }}
                      >
                        <span>{icon}</span>
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </SInput>

              {/* Date de fin */}
              <SInput label="Date de clôture" required hint="Quand le résultat sera connu et le pari fermé">
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={e => setEndsAt(e.target.value)}
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={IS}
                />
              </SInput>

              {/* Frais créateur */}
              <div className="rounded-2xl p-4" style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-black" style={{ color: '#fff' }}>Tes frais de créateur</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4a5380' }}>
                      Tu recevras {creatorFeePercent}% de chaque mise placée sur ton marché
                    </p>
                  </div>
                  <span className="text-2xl font-black" style={{ color: '#00e676' }}>{creatorFeePercent}%</span>
                </div>
                <input
                  type="range" min={0} max={15} step={0.5}
                  value={creatorFeePercent}
                  onChange={e => setCreatorFeePercent(parseFloat(e.target.value))}
                  className="w-full accent-green-400"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: '#4a5380' }}>
                  <span>0% (gratuit)</span>
                  <span>15% (maximum)</span>
                </div>
              </div>

              {/* Règles de résolution */}
              <SInput label="Règles de résolution (optionnel)" hint="Comment saura-t-on qui a raison ?">
                <textarea
                  value={rules}
                  onChange={e => setRules(e.target.value)}
                  rows={2}
                  placeholder="Ex : Basé sur le score final officiel à 90min selon L'Équipe.fr"
                  className="w-full px-4 py-3 text-sm outline-none resize-none"
                  style={{ ...IS, lineHeight: 1.6 }}
                />
              </SInput>

              <button
                onClick={() => setStep(4)}
                disabled={!canProceed3}
                className="w-full py-4 rounded-2xl text-base font-black transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: canProceed3 ? '#00e676' : 'rgba(255,255,255,0.07)',
                  color: canProceed3 ? '#000' : '#4a5380',
                }}
              >
                Vérifier mon pari →
              </button>
            </div>
          )}

          {/* ════ ÉTAPE 4 — Récapitulatif + Paiement ══════════════════════════ */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#00e676' }}>
                  Étape 4 sur 4
                </p>
                <h1 className="text-3xl font-black" style={{ color: '#fff' }}>
                  Récapitulatif
                </h1>
                <p className="text-sm mt-2" style={{ color: '#6b7db3' }}>
                  Vérifie tout avant de payer. Tu ne pourras plus modifier après.
                </p>
              </div>

              {/* Card récap */}
              <div className="rounded-2xl overflow-hidden" style={{ background: '#161b26', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Header */}
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: '#6b7db3' }}>
                      {CATEGORY_ICONS[category as MarketCategory]} {CATEGORY_LABELS[category as MarketCategory]}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,230,118,0.1)', color: '#00e676' }}>
                      ✓ Google-isable
                    </span>
                  </div>
                  <p className="text-base font-black leading-snug" style={{ color: '#fff' }}>{title}</p>
                  {description && <p className="text-sm mt-1.5 line-clamp-2" style={{ color: '#6b7db3' }}>{description}</p>}
                </div>

                {/* Options */}
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4a5380' }}>Options</p>
                  {options.map((o, i) => {
                    const color = OPTION_COLORS[i] ?? '#aaa';
                    return (
                      <div key={i} className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ background: `${color}22`, color }}>{i + 1}</div>
                        <span className="flex-1 text-sm font-semibold" style={{ color: '#e0e6ff' }}>{o.label}</span>
                        <span className="text-sm font-black" style={{ color }}>{o.probability}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Infos */}
                <div className="grid grid-cols-2 gap-0">
                  {[
                    { label: 'Clôture', value: new Date(endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                    { label: 'Frais créateur', value: `${creatorFeePercent}%` },
                  ].map(({ label, value }, i) => (
                    <div key={label} className="px-5 py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderRight: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#4a5380' }}>{label}</p>
                      <p className="text-sm font-bold" style={{ color: '#c0c8e8' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coût en euros */}
              <div
                className="flex items-center justify-between px-5 py-4 rounded-2xl"
                style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)' }}
              >
                <div>
                  <p className="text-sm font-black" style={{ color: '#00e676' }}>Frais de création</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(0,230,118,0.5)' }}>
                    Paiement sécurisé via Stripe · Carte bancaire
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard size={18} style={{ color: '#00e676' }} />
                  <span className="text-xl font-black" style={{ color: '#00e676' }}>{CREATION_COST_EUR},00€</span>
                </div>
              </div>

              {/* Info validation */}
              <div
                className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
                style={{ background: 'rgba(79,195,247,0.07)', border: '1px solid rgba(79,195,247,0.2)' }}
              >
                <AlertTriangle size={15} style={{ color: '#4fc3f7', flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs leading-relaxed" style={{ color: '#6b7db3' }}>
                  Ton pari sera relu par l&apos;équipe FlatEarth avant publication. Délai :{' '}
                  <strong style={{ color: '#4fc3f7' }}>24–48h</strong>. Les {CREATION_COST_EUR}€ sont débités immédiatement et ne sont pas remboursables si le pari est rejeté.
                </p>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.2)', color: '#f44336' }}>
                  <AlertTriangle size={14} /> {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: submitting ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #00e676, #00b8d4)',
                  color: submitting ? '#4a5380' : '#000',
                }}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#4a5380', borderTopColor: 'transparent' }} />
                    Préparation du paiement…
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Payer {CREATION_COST_EUR},00€ et soumettre
                  </>
                )}
              </button>

              <p className="text-xs text-center" style={{ color: '#4a5380' }}>
                En payant, tu acceptes les{' '}
                <span style={{ color: '#6b7db3', cursor: 'pointer' }}>conditions d&apos;utilisation</span>{' '}
                de FlatEarth. Paiement sécurisé par Stripe.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
