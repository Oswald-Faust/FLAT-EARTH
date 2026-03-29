'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import MarketCard from '@/components/markets/MarketCard';
import { IMarket, CATEGORY_LABELS, CATEGORY_SUBCATEGORIES, MarketCategory } from '@/types';
import CategoryIcon, { CATEGORY_COLORS } from '@/components/ui/CategoryIcon';
import { Search, SlidersHorizontal, Bookmark, ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: PageProps) {
  const { slug } = use(params);
  const category = slug as MarketCategory;
  const label = CATEGORY_LABELS[category] ?? slug;
  const iconColor = CATEGORY_COLORS[category] ?? '#8d97b8';

  const subcategories = CATEGORY_SUBCATEGORIES[slug] ?? [{ key: 'all', label: 'Tous', count: 0 }];
  const [activeSub, setActiveSub] = useState('all');
  const [search, setSearch] = useState('');
  const [markets, setMarkets] = useState<IMarket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/markets?category=${slug}&limit=50`)
      .then(r => r.json())
      .then(data => {
        setMarkets(data.markets ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const filteredMarkets = markets.filter((m) => {
    const matchSub = activeSub === 'all' || m.subcategory === activeSub;
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    return matchSub && matchSearch;
  });

  const liveCount = markets.filter(m => m.status === 'live').length;

  const subWithCounts = subcategories.map((s) => ({
    ...s,
    count: s.key === 'all'
      ? markets.length
      : markets.filter(m => m.subcategory === s.key).length,
  }));

  const featuredMarket = filteredMarkets[0];
  const gridMarkets    = filteredMarkets.slice(1);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header isLoggedIn={false} coins={0} liveCount={liveCount} />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Subcategory Sidebar ────────────────────────────── */}
        <aside
          className="hidden md:flex flex-col shrink-0 overflow-y-auto py-4"
          style={{
            width: 200,
            background: 'var(--bg-deep)',
            borderRight: '1px solid var(--border-light)',
          }}
        >
          {subWithCounts.map((sub) => {
            const active = activeSub === sub.key;
            return (
              <button
                key={sub.key}
                onClick={() => setActiveSub(sub.key)}
                className="flex items-center justify-between px-4 py-2 text-sm text-left transition-all hover:bg-white/5"
                style={{
                  background: active ? 'var(--bg-item-hover)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  borderRight: active ? `2px solid var(--accent-green)` : '2px solid transparent',
                }}
              >
                <span className="truncate">{sub.label}</span>
                <span
                  className="text-xs ml-2 shrink-0 tabular-nums"
                  style={{ color: active ? 'var(--text-secondary)' : 'var(--text-muted)' }}
                >
                  {sub.count > 0 ? sub.count.toLocaleString() : ''}
                </span>
              </button>
            );
          })}
        </aside>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-xl mx-auto p-5">

            {/* Page header */}
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: iconColor }}><CategoryIcon slug={category} size={18} strokeWidth={2} /></span>
                {label}
                {liveCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(244,67,54,0.15)', color: '#f44336' }}>
                    {liveCount} LIVE
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-medium)' }}
                >
                  <Search size={13} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="bg-transparent outline-none text-xs w-32"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:brightness-110"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
                >
                  <SlidersHorizontal size={12} />
                  Filtres
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:brightness-110"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
                >
                  <Bookmark size={12} />
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl animate-pulse"
                    style={{ height: 180, background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
                  />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && filteredMarkets.length === 0 && (
              <div className="text-center py-24" style={{ color: 'var(--text-muted)' }}>
                <div className="flex justify-center mb-4" style={{ color: iconColor, opacity: 0.4 }}>
                  <CategoryIcon slug={category} size={52} strokeWidth={1} />
                </div>
                <p className="text-sm">Aucun pari disponible dans cette catégorie pour le moment</p>
                <Link href="/" className="mt-4 inline-flex items-center gap-1 text-xs" style={{ color: 'var(--accent-green)' }}>
                  <ChevronLeft size={12} /> Retour à l&apos;accueil
                </Link>
              </div>
            )}

            {/* Markets grid */}
            {!loading && filteredMarkets.length > 0 && (
              <>
                {/* Masonry grid avec featured */}
                {featuredMarket && (
                  <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                    <div style={{ gridRow: 'span 2' }}>
                      <MarketCard market={featuredMarket} variant="large" />
                    </div>
                    {gridMarkets.slice(0, 2).map((m) => (
                      <MarketCard key={String(m._id)} market={m} />
                    ))}
                  </div>
                )}

                {gridMarkets.length > 2 && (
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                  >
                    {gridMarkets.slice(2).map((m) => (
                      <MarketCard key={String(m._id)} market={m} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
