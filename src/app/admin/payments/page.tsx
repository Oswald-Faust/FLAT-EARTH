'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { CreditCard, DollarSign, Wallet, ArrowDownRight, ArrowUpRight, Trophy, Undo, ChevronLeft, ChevronRight, Activity, Award } from 'lucide-react';
import { formatCoins } from '@/lib/utils';

interface Transaction {
  _id: string; 
  amount: number; 
  type: 'purchase' | 'bet' | 'win' | 'creator_fee' | 'refund';
  createdAt: string;
  reference?: string;
  userId?: { _id: string; username?: string; email?: string };
}

const TYPE_STYLE: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
  purchase:    { icon: <CreditCard className="w-4 h-4"/>,   bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Achat de crédit' },
  bet:         { icon: <ArrowDownRight className="w-4 h-4"/>,bg: 'bg-red-50 dark:bg-red-500/10',        text: 'text-red-600 dark:text-red-400',         label: 'Placement Pari' },
  win:         { icon: <Trophy className="w-4 h-4"/>,       bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-600 dark:text-amber-400',     label: 'Gain de pari' },
  creator_fee: { icon: <Award className="w-4 h-4"/>,        bg: 'bg-purple-50 dark:bg-purple-500/10',   text: 'text-purple-600 dark:text-purple-400',   label: 'Frais Créateur' },
  refund:      { icon: <Undo className="w-4 h-4"/>,         bg: 'bg-blue-50 dark:bg-blue-500/10',       text: 'text-blue-600 dark:text-blue-400',       label: 'Remboursement' },
};

function StatBox({ label, value, icon, colorClass }: { label: string; value: string; icon: React.ReactNode; colorClass: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}

export default function PaymentsAdminPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState({ totalPurchasesVolume: 0 });
  
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('purchase'); // Défaut sur les achats
  
  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '15',
      type: typeFilter,
    });
    
    fetch(`/api/admin/payments?${params}`)
      .then(r => r.json())
      .then(d => {
        setData(d.transactions || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
        if (d.stats) setStats(d.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Paiements & Flux</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Supervisez l'économie virtuelle et les paiements de la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatBox
          label="Volume Total des Achats"
          value={`🪙 ${formatCoins(stats.totalPurchasesVolume)}`}
          icon={<DollarSign className="w-5 h-5" />}
          colorClass="text-emerald-500"
        />
        <StatBox
          label="Transactions (Filtre actuel)"
          value={`${total}`}
          icon={<Activity className="w-5 h-5" />}
          colorClass="text-blue-500"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 bg-zinc-50/50 dark:bg-zinc-800/20">
          {[
            { v: 'purchase', label: 'Achats uniquement' },
            { v: 'bet', label: 'Paris' },
            { v: 'win', label: 'Gains' },
            { v: 'creator_fee', label: 'Frais Créateur' },
            { v: 'refund', label: 'Remboursements' },
            { v: 'all', label: 'Tous les flux' },
          ].map((f) => {
            const active = typeFilter === f.v;
            return (
              <button
                key={f.v}
                onClick={() => { setTypeFilter(f.v); setPage(1); }}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all border ${active ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm' : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Utilisateur</th>
                <th className="px-6 py-4 font-medium">Montant</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Référence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-800 dark:border-t-zinc-300 rounded-full animate-spin"></div>
                      Chargement des transactions...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Wallet className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">Aucune transaction trouvée.</p>
                    <p className="text-zinc-500 mt-1">Modifiez vos filtres pour voir d'autres résultats.</p>
                  </td>
                </tr>
              ) : (
                data.map(tx => {
                  const style = TYPE_STYLE[tx.type] ?? TYPE_STYLE.purchase;
                  const isPositive = ['purchase', 'win', 'creator_fee', 'refund'].includes(tx.type);
                  
                  return (
                    <tr key={tx._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold border border-transparent ${style.bg} ${style.text}`}>
                          {style.icon} {style.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tx.userId ? (
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{tx.userId.username ?? 'Anonyme'}</p>
                            <p className="text-xs text-zinc-500">{(tx.userId.email?.length || 0) > 20 ? tx.userId.email?.slice(0, 20) + '...' : tx.userId.email}</p>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">Utilisateur inconnu</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold flex items-center gap-1.5 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {isPositive ? '+' : '-'}{formatCoins(tx.amount)} 🪙
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tx.reference ? (
                          <span className="inline-block px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs text-zinc-500">
                            {tx.reference.length > 20 ? `${tx.reference.slice(0, 16)}...` : tx.reference}
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
            <span className="text-sm text-zinc-500 font-medium">Page {page} sur {pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 transition-colors shadow-sm"
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
