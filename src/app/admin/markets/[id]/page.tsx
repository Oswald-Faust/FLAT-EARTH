'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, Trash2, CheckCircle, Clock,
  TrendingUp, Users, Coins, BarChart2, AlertTriangle, ExternalLink,
  ChevronRight, AlignLeft, Info, CalendarClock, ShieldCheck
} from 'lucide-react';
import { formatCoins, formatTimeLeft } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/types';
import CategoryIcon, { CATEGORY_COLORS } from '@/components/ui/CategoryIcon';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MarketOption { _id: string; label: string; probability: number; totalBets: number }
interface MarketDetail {
  _id: string; title: string; description: string; rules: string; contextNews?: string;
  category: string; subcategory?: string; status: string; approvalStatus: string;
  currency: string; options: MarketOption[]; totalVolume: number;
  endsAt: string; createdAt: string; isGoogleVerified: boolean;
  resolvedOption?: string; creatorFeePercent: number;
  createdBy?: { username: string };
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const OPTION_COLORS = ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-fuchsia-500', 'bg-orange-500', 'bg-teal-500'];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string; border: string }> = {
  live:               { bg: 'bg-red-500/10',    text: 'text-red-600 dark:text-red-400',       border: 'border-red-500/20',     label: 'En direct' },
  open:               { bg: 'bg-emerald-500/10',text: 'text-emerald-600 dark:text-emerald-400',border: 'border-emerald-500/20',label: 'Ouvert'    },
  closed:             { bg: 'bg-zinc-500/10',   text: 'text-zinc-600 dark:text-zinc-400',     border: 'border-zinc-500/20',    label: 'Fermé'     },
  resolved:           { bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400',     border: 'border-blue-500/20',    label: 'Résolu'    },
  pending_validation: { bg: 'bg-amber-500/10',  text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-500/20',   label: 'En attente' },
};

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, colorClass = 'text-zinc-500' }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; colorClass?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
          {label}
        </div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
      </div>
      <div className={`p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
        {icon && <span className="text-zinc-500 dark:text-zinc-400">{icon}</span>}
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [market,       setMarket]       = useState<MarketDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);
  const [deleteConfirm,setDeleteConfirm]= useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [resolveMode,  setResolveMode]  = useState(false);
  const [resolvedOpt,  setResolvedOpt]  = useState('');
  const [resolving,    setResolving]    = useState(false);
  const [resolveMsg,   setResolveMsg]   = useState('');
  const [approving,    setApproving]    = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/markets/${id}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setMarket(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/admin/markets/${id}`, { method: 'DELETE' });
    router.push('/admin/markets');
  };

  const handleApprove = async () => {
    setApproving(true);
    await fetch(`/api/admin/markets/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus: 'approved', status: 'open' }),
    });
    setApproving(false);
    load();
  };

  const handleResolve = async () => {
    if (!resolvedOpt) return;
    setResolving(true);
    const res = await fetch(`/api/admin/markets/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolve: true, resolvedOption: resolvedOpt }),
    });
    setResolving(false);
    if (res.ok) {
      setResolveMsg('✅ Marché résolu — période de vérification 48h démarrée.');
      setResolveMode(false);
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
      </div>
    );
  }

  if (notFound || !market) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-4xl">🔍</p>
        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Marché introuvable</p>
        <Link href="/admin/markets" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">← Retour à la liste</Link>
      </div>
    );
  }

  const ss = STATUS_STYLE[market.status] ?? STATUS_STYLE.closed;
  const catLabel   = CATEGORY_LABELS[market.category as keyof typeof CATEGORY_LABELS] ?? market.category;
  const catColor   = CATEGORY_COLORS[market.category] ?? '#8d97b8';
  const totalBets = market.options.reduce((s, o) => s + o.totalBets, 0);
  const timeLeft  = formatTimeLeft(market.endsAt);
  const isExpired = new Date(market.endsAt) < new Date();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
        <Link href="/admin/markets" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Marchés</Link>
        <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
        <span className="text-zinc-900 dark:text-zinc-100 truncate max-w-[300px] md:max-w-md">{market.title}</span>
      </nav>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex gap-4 md:gap-6 items-start">
            <div className="hidden sm:flex w-16 h-16 rounded-2xl items-center justify-center shrink-0 shadow-sm"
              style={{ background: `${catColor}14`, border: `1.5px solid ${catColor}35`, color: catColor }}>
              <CategoryIcon slug={market.category} size={28} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold uppercase tracking-wide border border-zinc-200 dark:border-zinc-700">
                  {catLabel}
                </span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide border ${ss.bg} ${ss.text} ${ss.border}`}>
                  {ss.label}
                </span>
                {market.isGoogleVerified && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Google Verif
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{market.title}</h1>
              {market.description && (
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-2xl">{market.description}</p>
              )}
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 shrink-0 self-start">
            <Link
              href={`/market/${id}`}
              target="_blank"
              className="p-2.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 transition-colors"
              title="Ouvrir le marché"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link
              href={`/admin/markets/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Éditer
            </Link>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="p-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-2 text-sm font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? '...' : 'Confirmer'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Approval Banner */}
        {market.approvalStatus === 'pending' && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-amber-800 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Ce marché est en attente d'approbation et n'est pas public.
            </div>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              {approving ? '...' : 'Approuver'}
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Coins className="w-5 h-5 text-amber-500" />} 
          label="Volume Total" 
          value={`🪙 ${formatCoins(market.totalVolume)}`} 
        />
        <StatCard 
          icon={<Users className="w-5 h-5 text-emerald-500" />} 
          label="Total des Paris" 
          value={totalBets.toLocaleString('fr-FR')} 
        />
        <StatCard 
          icon={<Clock className={`w-5 h-5 ${isExpired ? 'text-red-500' : 'text-blue-500'}`} />} 
          label={isExpired ? 'Expiré depuis' : 'Temps Restant'} 
          value={<span className={isExpired ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}>{timeLeft}</span>} 
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />} 
          label="Options" 
          value={market.options.length} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <SectionCard title="Options & Probabilités" icon={<BarChart2 className="w-5 h-5" />}>
            {market.resolvedOption && (
              <div className="mb-6 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                <CheckCircle className="w-4 h-4" /> Marché résolu : {market.resolvedOption}
              </div>
            )}
            <div className="space-y-4">
              {market.options.map((opt, i) => {
                const colorClass = OPTION_COLORS[i % OPTION_COLORS.length] || 'bg-zinc-500';
                const isWinner = market.resolvedOption === opt.label;
                
                return (
                  <div key={opt._id ?? i} className="group relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold shrink-0 shadow-sm border border-zinc-200 dark:border-zinc-700">
                          {i + 1}
                        </span>
                        <span className={`text-sm font-semibold truncate max-w-[200px] md:max-w-xs ${isWinner ? 'text-emerald-600 dark:text-emerald-400 line-clamp-1 inline-flex items-center gap-2' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {opt.label} {isWinner && <CheckCircle className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-zinc-500">{opt.totalBets} paris</span>
                        <span className="text-sm font-black w-12 text-right text-zinc-900 dark:text-zinc-100">{opt.probability}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner flex">
                      <div 
                        className={`h-full ${colorClass} transition-all border-r border-white/20`}
                        style={{ width: `${opt.probability}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Resolve Section */}
          {market.status !== 'resolved' && (
            <div className={`rounded-xl border shadow-sm transition-all overflow-hidden ${resolveMode ? 'border-blue-500 dark:border-blue-500/50 bg-blue-50/50 dark:bg-blue-500/5' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
              <div className={`flex items-center justify-between p-6 ${resolveMode ? 'border-b border-blue-100 dark:border-blue-900/50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${resolveMode ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Résoudre le marché</h3>
                    <p className="text-xs text-zinc-500">Clôture et déclare l'option gagnante</p>
                  </div>
                </div>
                <button
                  onClick={() => setResolveMode(!resolveMode)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${resolveMode ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'}`}
                >
                  {resolveMode ? 'Annuler' : 'Démarrer →'}
                </button>
              </div>

              {resolveMode && (
                <div className="p-6 bg-white dark:bg-zinc-900/50">
                  <div className="mb-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Veuillez sélectionner l'option gagnante. <strong>⚠️ Cette action est irréversible.</strong> Le marché entrera ensuite dans une période de vérification de 48h.
                    </p>
                  </div>
                  
                  {resolveMsg && (
                    <div className="mb-4 flex items-center gap-2 p-3 text-sm rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      <CheckCircle className="w-4 h-4" /> {resolveMsg}
                    </div>
                  )}

                  <div className="grid gap-2 mb-6">
                    {market.options.map((o, i) => {
                      const active = resolvedOpt === o.label;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setResolvedOpt(o.label)}
                          className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80'} border text-left`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
                            {active && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                          </div>
                          <span className="flex-1 min-w-0 truncate">{o.label}</span>
                          <span className="text-xs text-zinc-500 font-semibold">{o.probability}%</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleResolve}
                    disabled={resolving || !resolvedOpt}
                    className="w-full flex justify-center items-center py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    {resolving ? 'En cours...' : 'Confirmer le gagnant'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <SectionCard title="Informations" icon={<AlignLeft className="w-4 h-4" />}>
            <div className="space-y-6">
              {market.rules && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide mb-2">
                    <ShieldCheck className="w-4 h-4 text-zinc-400" /> Règles de résolution
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                    {market.rules}
                  </p>
                </div>
              )}
              {market.contextNews && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide mb-2">
                    <Info className="w-4 h-4 text-zinc-400" /> Contexte / Actu
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                    {market.contextNews}
                  </p>
                </div>
              )}
              
              {!market.rules && !market.contextNews && (
                <p className="text-sm text-zinc-500 italic text-center py-4">Aucune information supplémentaire fournie.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Métadonnées" icon={<CalendarClock className="w-4 h-4" />}>
            <ul className="space-y-4">
              {[
                { label: 'Créateur', value: market.createdBy?.username ?? 'Admin' },
                { label: 'Date de Création', value: new Date(market.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Date d\'Expiration', value: new Date(market.endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                { label: 'Devise', value: market.currency === 'coins' ? '🪙 Coins' : '💶 Euros' },
                { label: 'Frais Créateur', value: `${market.creatorFeePercent}%` },
                { label: 'État Approbation', value: <span className="capitalize font-medium">{market.approvalStatus}</span> },
              ].map(({ label, value }, i) => (
                <li key={i} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{value}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
