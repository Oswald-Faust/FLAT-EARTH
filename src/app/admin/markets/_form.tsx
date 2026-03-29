'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, CheckCircle, AlertCircle, Shuffle,
  Info, Tag, ToggleLeft, Calendar, Save, FileEdit
} from 'lucide-react';
import CategoryIcon, { CATEGORY_COLORS } from '@/components/ui/CategoryIcon';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Option { label: string; probability: number }
interface Subcategory { slug: string; label: string }
interface Category { _id: string; name: string; slug: string; icon: string; subcategories: Subcategory[] }

export interface MarketFormProps {
  initial?: {
    _id?: string;
    title?: string; description?: string; rules?: string; contextNews?: string;
    category?: string; subcategory?: string; status?: string;
    options?: Option[]; endsAt?: string;
    creatorFeePercent?: number; currency?: string; isGoogleVerified?: boolean;
    resolvedOption?: string;
  };
  mode: 'create' | 'edit';
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const OPTION_COLORS = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-fuchsia-500'];

const STATUS_OPTIONS = [
  { value: 'open',   label: 'Ouvert',     icon: '🟢' },
  { value: 'live',   label: 'En direct',  icon: '🔴' },
  { value: 'closed', label: 'Fermé',      icon: '⚫' },
];

function MInput({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-1">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-500 font-medium">{hint}</p>}
    </div>
  );
}

// ─── Form principal ───────────────────────────────────────────────────────────
export default function MarketForm({ initial, mode }: MarketFormProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcats,    setSubcats]    = useState<Subcategory[]>([]);

  const [title,             setTitle]            = useState(initial?.title ?? '');
  const [description,       setDescription]      = useState(initial?.description ?? '');
  const [rules,             setRules]            = useState(initial?.rules ?? '');
  const [contextNews,       setContextNews]      = useState(initial?.contextNews ?? '');
  const [category,          setCategory]         = useState(initial?.category ?? '');
  const [subcategory,       setSubcategory]      = useState(initial?.subcategory ?? '');
  const [status,            setStatus]           = useState(initial?.status ?? 'open');
  const [currency,          setCurrency]         = useState(initial?.currency ?? 'coins');
  const [creatorFeePercent, setCreatorFeePercent]= useState(initial?.creatorFeePercent ?? 2);
  const [isGoogleVerified,  setIsGoogleVerified] = useState(initial?.isGoogleVerified ?? false);
  const [endsAt,            setEndsAt]           = useState(() => {
    if (initial?.endsAt) return new Date(initial.endsAt).toISOString().slice(0, 16);
    const d = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [options, setOptions] = useState<Option[]>(
    initial?.options?.length
      ? initial.options
      : [{ label: 'Oui', probability: 50 }, { label: 'Non', probability: 50 }]
  );

  const [resolveMode,    setResolveMode]    = useState(false);
  const [resolvedOption, setResolvedOption] = useState(initial?.resolvedOption ?? '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const cat = categories.find(c => c.slug === category);
    setSubcats(cat?.subcategories ?? []);
    if (!cat?.subcategories.find(s => s.slug === subcategory)) setSubcategory('');
  }, [category, categories, subcategory]);

  const autoBalance = () => {
    const equal = Math.floor(100 / options.length);
    const remainder = 100 - equal * options.length;
    setOptions(options.map((o, i) => ({ ...o, probability: equal + (i === 0 ? remainder : 0) })));
  };

  const updateOptionLabel = (i: number, val: string) => {
    const n = [...options]; n[i] = { ...n[i], label: val }; setOptions(n);
  };
  const updateOptionProb = (i: number, val: number) => {
    const n = [...options]; n[i] = { ...n[i], probability: Math.min(99, Math.max(1, val)) }; setOptions(n);
  };
  const addOption = () => {
    if (options.length >= 8) return;
    setOptions(prev => [...prev, { label: `Option ${prev.length + 1}`, probability: Math.floor(100 / (prev.length + 1)) }]);
  };
  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, idx) => idx !== i));
  };

  const totalProb = options.reduce((s, o) => s + (o.probability || 0), 0);

  const save = async () => {
    if (!title.trim())    { setError('Titre requis'); return; }
    if (!category)        { setError('Catégorie requise'); return; }
    if (options.length < 2) { setError('Minimum 2 options'); return; }
    if (options.some(o => !o.label.trim())) { setError('Toutes les options doivent avoir un label'); return; }

    setSaving(true); setError(''); setSuccess('');
    try {
      const body = { title, description, rules, contextNews, category, subcategory, status, currency, creatorFeePercent, isGoogleVerified, options, endsAt };
      const url    = mode === 'create' ? '/api/admin/markets' : `/api/admin/markets/${initial?._id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur serveur'); return; }
      setSuccess(mode === 'create' ? 'Marché créé avec succès !' : 'Modifications enregistrées !');
      if (mode === 'create') setTimeout(() => router.push('/admin/markets'), 900);
    } catch { setError('Erreur réseau'); }
    finally { setSaving(false); }
  };

  const resolve = async () => {
    if (!resolvedOption) { setError('Choisissez l\'option gagnante'); return; }
    setSaving(true); setError('');
    try {
      const res  = await fetch(`/api/admin/markets/${initial?._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolve: true, resolvedOption }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      setSuccess('Marché résolu ! Période de vérification 48h démarrée.');
      setResolveMode(false);
    } catch { setError('Erreur réseau'); }
    finally { setSaving(false); }
  };

  const inputClass = "w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-500 transition-all";

  return (
    <div className="flex flex-col gap-6">

      {/* ── Feedback ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-medium font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-medium">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* ══ SECTION 1 — Contenu ═══════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
          <Info className="w-5 h-5 text-zinc-500" />
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Contenu</h2>
            <p className="text-xs text-zinc-500">Titre, description et règles du marché</p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <MInput label="Titre du pari" required hint="Question claire, réponse vérifiable via Google">
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex : PSG vs Barcelone — Qui gagne ?"
              className={inputClass}
            />
          </MInput>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MInput label="Description" hint="Contexte court affiché sous le titre">
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                rows={3} placeholder="Quart de finale retour Champions League..."
                className={`${inputClass} resize-y min-h-[100px]`}
              />
            </MInput>
            <MInput label="Contexte / Actu" hint="Optionnel — affiché sur la card">
              <textarea
                value={contextNews} onChange={e => setContextNews(e.target.value)}
                rows={3} placeholder="Après le nul 1-1 à l'aller..."
                className={`${inputClass} resize-y min-h-[100px]`}
              />
            </MInput>
          </div>

          <MInput label="Règles de résolution" hint="Comment l'admin déterminera le résultat">
            <textarea
              value={rules} onChange={e => setRules(e.target.value)}
              rows={2} placeholder="Résolution basée sur le score final. Sources : L'Équipe, UEFA..."
              className={`${inputClass} resize-y min-h-[80px]`}
            />
          </MInput>
        </div>
      </div>

      {/* ══ SECTION 2 — Classification ════════════════════════════════════════ */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
          <Tag className="w-5 h-5 text-zinc-500" />
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Classification</h2>
            <p className="text-xs text-zinc-500">Catégorie, statut, monnaie et date</p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 mb-3">
              Catégorie <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {categories.map(c => {
                const active = category === c.slug;
                const icolor = CATEGORY_COLORS[c.slug] ?? '#8d97b8';
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setCategory(c.slug)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border ${!active ? 'bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-800' : ''}`}
                    style={active ? {
                      background: `${icolor}18`,
                      borderColor: `${icolor}55`,
                      color: icolor,
                    } : {}}
                  >
                    <CategoryIcon slug={c.slug} size={14} strokeWidth={2} />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {subcats.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 mb-3">Sous-catégorie</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSubcategory('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${!subcategory ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                  Toutes
                </button>
                {subcats.map(s => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => setSubcategory(s.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${subcategory === s.slug ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MInput label="Statut">
              <div className="flex gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border flex items-center justify-center gap-1.5 ${status === s.value ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  >
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
            </MInput>

            <MInput label="Monnaie">
              <div className="flex gap-2">
                {[{ v: 'coins', icon: '🪙', label: 'Coins' }, { v: 'euros', icon: '💶', label: 'Euros' }].map(({ v, icon, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCurrency(v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border flex items-center justify-center gap-1.5 ${currency === v ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 ring-1 ring-amber-500/50' : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  >
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </div>
            </MInput>

            <MInput label="Date de fin" required>
              <input
                type="datetime-local" value={endsAt}
                onChange={e => setEndsAt(e.target.value)}
                className={inputClass}
              />
            </MInput>

            <MInput label="Frais créateur (%)">
              <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 p-2.5 rounded-lg">
                <input
                  type="range" min={0} max={15} step={0.5}
                  value={creatorFeePercent}
                  onChange={e => setCreatorFeePercent(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
                />
                <span className="text-sm font-bold w-12 text-right text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded">
                  {creatorFeePercent}%
                </span>
              </div>
            </MInput>
          </div>

          <label className={`mt-6 flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${isGoogleVerified ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isGoogleVerified ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isGoogleVerified ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={isGoogleVerified} onChange={() => setIsGoogleVerified(!isGoogleVerified)} />
            <div>
              <p className={`text-sm font-bold ${isGoogleVerified ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                Pari Google-vérifiable
              </p>
              <p className="text-xs text-zinc-500">Le résultat est clairement trouvable via une recherche web.</p>
            </div>
          </label>
        </div>
      </div>

      {/* ══ SECTION 3 — Options ═══════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="flex items-center gap-3">
            <ToggleLeft className="w-5 h-5 text-zinc-500" />
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Options de pari</h2>
              <p className={`text-xs font-medium ${totalProb !== 100 ? 'text-red-500' : 'text-zinc-500'}`}>
                Total : <strong>{totalProb}%</strong>{totalProb !== 100 && ' — doit être exactement 100%'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button" onClick={autoBalance}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors border border-transparent blur-0"
            >
              <Shuffle className="w-4 h-4" /> Équilibrer
            </button>
            <button
              type="button" onClick={addOption} disabled={options.length >= 8}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-3">
            {options.map((opt, i) => {
              const colorClass = OPTION_COLORS[i % OPTION_COLORS.length];
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 rounded-xl relative overflow-hidden group">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`} />
                  
                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0 ml-1">
                    {i + 1}
                  </div>
                  
                  <input
                    value={opt.label}
                    onChange={e => updateOptionLabel(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                  />
                  
                  <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 overflow-hidden focus-within:border-zinc-400 dark:focus-within:border-zinc-500">
                    <input
                      type="number" min={1} max={99}
                      value={opt.probability}
                      onChange={e => updateOptionProb(i, parseInt(e.target.value) || 0)}
                      className="w-12 py-2 text-sm text-center font-bold outline-none bg-transparent"
                    />
                    <span className="text-zinc-400 font-bold text-xs pr-1">%</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    disabled={options.length <= 2}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ SECTION 4 — Résolution (edit only) ═══════════════════════════════ */}
      {mode === 'edit' && (
        <div className={`rounded-xl border shadow-sm transition-all overflow-hidden ${resolveMode ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5 dark:border-blue-500/50' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 ${resolveMode ? 'border-b border-blue-200 dark:border-blue-900/50' : ''}`}>
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${resolveMode ? 'text-blue-500' : 'text-zinc-500'}`} />
              <h2 className={`text-base font-bold ${resolveMode ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                Résoudre le marché
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setResolveMode(v => !v)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${resolveMode ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700/50'}`}
            >
              {resolveMode ? 'Annuler' : 'Démarrer la résolution →'}
            </button>
          </div>

          {resolveMode && (
            <div className="p-6">
              <p className="text-sm font-medium text-zinc-500 mb-4 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                ⚠️ Une fois résolu, le marché entre en période de vérification 48h avant la distribution des gains.
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {options.map((o, i) => {
                  const active = resolvedOption === o.label;
                  return (
                    <button
                      key={i} type="button"
                      onClick={() => setResolvedOption(o.label)}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-xl text-sm font-semibold transition-all text-left ${active ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-blue-500 bg-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                        {active && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <span className="flex-1">{o.label}</span>
                      <span className="text-xs font-bold text-zinc-400">{o.probability}%</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button" onClick={resolve}
                disabled={saving || !resolvedOption}
                className="w-full py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-sm flex justify-center items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Confirmer la résolution
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ Save bar ══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg sticky bottom-6 mt-4">
        <button
          type="button"
          onClick={() => router.push('/admin/markets')}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Annuler
        </button>
        <button
          type="button" onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-sm"
        >
          {mode === 'create' ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement…' : mode === 'create' ? 'Publier le marché' : 'Enregistrer les modifications'}
        </button>
      </div>

    </div>
  );
}
