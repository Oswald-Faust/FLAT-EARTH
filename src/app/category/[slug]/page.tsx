'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import MarketCard from '@/components/markets/MarketCard';
import { IMarket, CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_SUBCATEGORIES, MarketCategory } from '@/types';
import { Search, SlidersHorizontal, Bookmark, ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: PageProps) {
  const { slug } = use(params);
  const category = slug as MarketCategory;
  const label = CATEGORY_LABELS[category] ?? slug;
  const icon  = CATEGORY_ICONS[category] ?? '🌍';

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
    <div className="flex flex-col min-h-screen" style={{ background: '#0f1117' }}>
      <Header isLoggedIn={false} coins={0} liveCount={liveCount} />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Subcategory Sidebar ────────────────────────────── */}
        <aside
          className="hidden md:flex flex-col shrink-0 overflow-y-auto py-4"
          style={{
            width: 200,
            background: 'rgba(9,11,17,0.97)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
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
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: active ? '#fff' : '#6b7db3',
                  fontWeight: active ? 600 : 400,
                  borderRight: active ? '2px solid #00e676' : '2px solid transparent',
                }}
              >
                <span className="truncate">{sub.label}</span>
                <span
                  className="text-xs ml-2 shrink-0 tabular-nums"
                  style={{ color: active ? '#8892c4' : '#4a5380' }}
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
              <h1 className="text-xl font-black flex items-center gap-2" style={{ color: '#fff' }}>
                <span>{icon}</span>
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
                  style={{ background: 'rgba(22,26,38,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Search size={13} style={{ color: '#4a5380' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="bg-transparent outline-none text-xs w-32"
                    style={{ color: '#fff' }}
                  />
                </div>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:brightness-125"
                  style={{ background: 'rgba(22,26,38,0.7)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892c4' }}
                >
                  <SlidersHorizontal size={12} />
                  Filtres
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:brightness-125"
                  style={{ background: 'rgba(22,26,38,0.7)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892c4' }}
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
                    style={{ height: 180, background: 'rgba(22,27,38,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}
                  />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && filteredMarkets.length === 0 && (
              <div className="text-center py-24" style={{ color: '#4a5380' }}>
                <p className="text-5xl mb-4">{icon}</p>
                <p className="text-sm">Aucun pari disponible dans cette catégorie pour le moment</p>
                <Link href="/" className="mt-4 inline-flex items-center gap-1 text-xs" style={{ color: '#00e676' }}>
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
