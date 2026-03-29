'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Clock,
  Coins,
  Plus,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { formatCoins } from '@/lib/utils';

interface MarketRow {
  _id: string;
  title: string;
  category: string;
  status: string;
  totalVolume: number;
  endsAt: string;
  approvalStatus: string;
  createdAt?: string;
}

interface UserRow {
  _id: string;
  username: string;
  email: string;
  coins: number;
  role: string;
  createdAt: string;
}

interface CategoryRow {
  _id: string;
  marketCount: number;
  liveCount: number;
  totalVolume: number;
}

interface Stats {
  totalMarkets: number;
  liveMarkets: number;
  openMarkets: number;
  pendingMarkets: number;
  resolvedMarkets: number;
  totalUsers: number;
  totalBets: number;
  totalVolume: number;
  creatorUsers: number;
  adminUsers: number;
  newUsers7d: number;
  bets24h: number;
  bets7d: number;
  volume24h: number;
  activeMarkets: number;
  resolutionRate: number;
  liveShare: number;
  marketsEnding24h: number;
  pendingApprovalVolume: number;
  recentMarkets: MarketRow[];
  recentUsers: UserRow[];
  topMarkets: MarketRow[];
  endingSoonMarkets: MarketRow[];
  pendingApprovalMarkets: MarketRow[];
  topCategories: CategoryRow[];
}

const STATUS_LABELS: Record<string, string> = {
  live: 'En direct',
  open: 'Ouvert',
  closed: 'Fermé',
  resolved: 'Résolu',
  pending_validation: 'Validation',
};

const CATEGORY_LABELS: Record<string, string> = {
  sport: 'Sport',
  'tele-realite': 'Télé-réalité',
  politique: 'Politique',
  'pop-culture': 'Culture',
  esport: 'eSport',
  actualite: 'Actualité',
  crypto: 'Crypto',
  climat: 'Climat',
  economie: 'Économie',
  geopolitique: 'Géopolitique',
  tech: 'Tech & Science',
  mentions: 'Mentions',
  finance: 'Finance',
  meteo: 'Météo',
};

function Card({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
        </div>
        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
        </div>
      </div>
      {subtext && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">{subtext}</p>}
    </div>
  );
}

function MarketList({
  items,
  emptyLabel,
  hrefBase = '/admin/markets',
}: {
  items: MarketRow[];
  emptyLabel: string;
  hrefBase?: string;
}) {
  if (items.length === 0) {
    return <p className="px-6 py-8 text-sm text-center text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>;
  }

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {items.map((market) => (
        <Link
          key={market._id}
          href={`${hrefBase}/${market._id}`}
          className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {market.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              <span>{CATEGORY_LABELS[market.category] ?? market.category}</span>
              <span>•</span>
              <span>
                {new Date(market.endsAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
            {STATUS_LABELS[market.status] ?? 'Inconnu'}
          </span>
          <div className="text-right shrink-0 min-w-[80px]">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCoins(market.totalVolume)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Volume</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-red-500 font-medium">Impossible de charger les statistiques.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            Tableau de Bord
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Vue d'ensemble de la plateforme et des indicateurs de performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/markets?approvalStatus=pending"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            Modération ({stats.pendingMarkets})
          </Link>
          <Link
            href="/admin/markets/create"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-medium text-white dark:text-zinc-900 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Créer un marché
          </Link>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Volume global"
          value={formatCoins(stats.totalVolume)}
          subtext={`+${formatCoins(stats.volume24h)} en 24h`}
          icon={Coins}
        />
        <StatCard
          title="Marchés actifs"
          value={stats.activeMarkets}
          subtext={`${stats.liveMarkets} live, ${stats.openMarkets} ouverts`}
          icon={Activity}
        />
        <StatCard
          title="Utilisateurs"
          value={stats.totalUsers}
          subtext={`+${stats.newUsers7d} cette semaine`}
          icon={Users}
        />
        <StatCard
          title="Total des paris"
          value={formatCoins(stats.totalBets)}
          subtext={`${stats.bets24h} sur 24h`}
          icon={BarChart3}
        />
      </div>

      {/* Action alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Validation en attente">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.pendingMarkets}</p>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Marchés en attente de validation ({formatCoins(stats.pendingApprovalVolume)} de volume)
            </p>
            <Link href="/admin/markets?approvalStatus=pending" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Voir la file d'attente &rarr;
            </Link>
          </div>
        </Card>

        <Card title="Échéances proches">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.marketsEnding24h}</p>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Marchés se terminant dans les prochaines 24h
            </p>
            <Link href="/admin/markets" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Gérer les marchés &rarr;
            </Link>
          </div>
        </Card>

        <Card title="Nouveaux inscrits (7j)">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-500" />
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.newUsers7d}</p>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Nouvelles inscriptions sur les 7 derniers jours
            </p>
            <Link href="/admin/users" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Voir les utilisateurs &rarr;
            </Link>
          </div>
        </Card>
      </div>

      {/* Two columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card 
            title="Marchés se terminant bientôt"
            action={<Link href="/admin/markets" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Tout voir</Link>}
          >
            <MarketList items={stats.endingSoonMarkets} emptyLabel="Aucun marché ne se termine bientôt." />
          </Card>

          <Card title="Derniers inscrits">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {stats.recentUsers.length === 0 ? (
                <p className="px-6 py-8 text-sm text-center text-zinc-500 dark:text-zinc-400">Aucun utilisateur récent.</p>
              ) : (
                stats.recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user.username}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mb-1">
                        {user.role}
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card 
            title="Marchés récents" 
            action={<Link href="/admin/markets" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Voir les marchés</Link>}
          >
            <MarketList items={stats.recentMarkets} emptyLabel="Aucun marché récent." />
          </Card>

          <Card title="Catégories principales (Volume)">
            <div className="p-6 space-y-5">
              {stats.topCategories.length === 0 ? (
                <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">Aucune donnée trouvée.</p>
              ) : (
                stats.topCategories.slice(0, 5).map((category) => (
                  <div key={category._id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {CATEGORY_LABELS[category._id] ?? category._id}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCoins(category.totalVolume)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" 
                        style={{ width: `${Math.max(2, (category.totalVolume / Math.max(stats.totalVolume, 1)) * 100)}%` }} 
                      />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {category.marketCount} marchés associés
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
