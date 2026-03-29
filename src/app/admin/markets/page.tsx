'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Trash2, CheckCircle, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { formatCoins } from '@/lib/utils';

interface Market {
  _id: string; title: string; category: string; subcategory?: string;
  status: string; approvalStatus: string; totalVolume: number;
  endsAt: string; createdAt: string; isGoogleVerified: boolean;
  options: { label: string; probability: number }[];
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string; border: string }> = {
  live:               { bg: 'bg-red-500/10',    color: 'text-red-500',    border: 'border-red-500/20',    label: 'En direct' },
  open:               { bg: 'bg-emerald-500/10',color: 'text-emerald-500',border: 'border-emerald-500/20',label: 'Ouvert'    },
  closed:             { bg: 'bg-zinc-500/10',   color: 'text-zinc-500',   border: 'border-zinc-500/20',   label: 'Fermé'     },
  resolved:           { bg: 'bg-blue-500/10',   color: 'text-blue-500',   border: 'border-blue-500/20',   label: 'Résolu'    },
  pending_validation: { bg: 'bg-amber-500/10',  color: 'text-amber-500',  border: 'border-amber-500/20',  label: 'En attente'},
};

const APPROVAL_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  approved: { bg: 'bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400', label: 'Approuvé' },
  pending:  { bg: 'bg-amber-500/10',   color: 'text-amber-600 dark:text-amber-400',   label: 'En attente' },
  rejected: { bg: 'bg-red-500/10',     color: 'text-red-600 dark:text-red-400',       label: 'Rejeté' },
};

export default function MarketsAdmin() {
  const [markets,  setMarkets]  = useState<Market[]>([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: '15',
      ...(search         && { search }),
      ...(catFilter      && { category: catFilter }),
      ...(statusFilter   && { status: statusFilter }),
      ...(approvalFilter && { approvalStatus: approvalFilter }),
    });
    fetch(`/api/admin/markets?${params}`)
      .then(r => r.json())
      .then(d => { setMarkets(d.markets ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, catFilter, statusFilter, approvalFilter]);

  useEffect(() => { load(); }, [load]);

  const del = async (m: Market) => {
    if (!confirm(`Supprimer "${m.title}" ?`)) return;
    await fetch(`/api/admin/markets/${m._id}`, { method: 'DELETE' });
    load();
  };

  const approve = async (m: Market) => {
    await fetch(`/api/admin/markets/${m._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ approvalStatus: 'approved', status: 'open' }),
    });
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Marchés</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Gérez l'ensemble des marchés de la plateforme ({total} au total).</p>
        </div>
        <Link
          href="/admin/markets/create"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-medium text-white dark:text-zinc-900 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Créer un marché
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg flex-1 min-w-[200px] focus-within:ring-2 focus-within:ring-zinc-500/20 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-all">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par titre..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>
        {[
          { value: statusFilter,   set: (v: string) => { setStatusFilter(v);   setPage(1); }, opts: [['', 'Tous statuts'], ['live','En direct'],['open','Ouvert'],['closed','Fermé'],['resolved','Résolu'],['pending_validation','En attente']] },
          { value: approvalFilter, set: (v: string) => { setApprovalFilter(v); setPage(1); }, opts: [['', 'Toutes approbations'], ['approved','Approuvé'],['pending','En attente'],['rejected','Rejeté']] },
        ].map(({ value, set, opts }, fi) => (
          <select
            key={fi}
            value={value}
            onChange={e => set(e.target.value)}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
          >
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <th className="px-6 py-4 font-medium">Titre & Détails</th>
                <th className="px-6 py-4 font-medium">Catégorie</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Volume</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-800 dark:border-t-zinc-300 rounded-full animate-spin"></div>
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : markets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    Aucun marché trouvé pour cette recherche.
                  </td>
                </tr>
              ) : (
                markets.map((m) => {
                  const ss = STATUS_STYLE[m.status] ?? STATUS_STYLE.closed;
                  const as = APPROVAL_STYLE[m.approvalStatus] ?? APPROVAL_STYLE.approved;
                  return (
                    <tr key={m._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 max-w-md">
                          <Link href={`/admin/markets/${m._id}`} className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 hover:underline">
                            {m.title}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            <span>Expire le {new Date(m.endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {m.isGoogleVerified && (
                              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle className="w-3 h-3 mr-1" /> Google
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300 capitalize">
                        {m.category}
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${ss.bg} ${ss.color} ${ss.border} uppercase tracking-wider`}>
                            {ss.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${as.bg} ${as.color}`}>
                            {as.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">🪙 {formatCoins(m.totalVolume)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          {m.approvalStatus === 'pending' && (
                            <button onClick={() => approve(m)} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Approuver">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <Link href={`/admin/markets/${m._id}`} className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Voir le détail">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => del(m)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Page {page} sur {pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-600 dark:text-zinc-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-600 dark:text-zinc-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
