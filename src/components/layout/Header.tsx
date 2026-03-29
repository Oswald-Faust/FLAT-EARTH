'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, Menu, LogOut, Wallet, Settings, ChevronDown, ArrowUpRight, Clock, Flame, Plus } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { CATEGORY_LABELS, MarketCategory, type IMarket } from '@/types';
import DepositModal from '@/components/wallet/DepositModal';
import ThemeToggle from '@/components/layout/ThemeToggle';

interface HeaderProps {
  coins?: number;
  isLoggedIn?: boolean;
  liveCount?: number;
  initialBalance?: number; // en centimes
}

// ── Catégories second row (sans duplication d'En Direct qui est dans le top nav) ──
const NAV_CATEGORIES: { key: MarketCategory | 'trending'; label: string }[] = [
  { key: 'trending',     label: 'Tendances' },
  { key: 'politique',    label: 'Politique' },
  { key: 'sport',        label: 'Sport' },
  { key: 'pop-culture',  label: 'Culture' },
  { key: 'crypto',       label: 'Crypto' },
  { key: 'climat',       label: 'Climat' },
  { key: 'economie',     label: 'Économie' },
  { key: 'mentions',     label: 'Mentions' },
  { key: 'esport',       label: 'eSport' },
  { key: 'finance',      label: 'Finance' },
  { key: 'tech',         label: 'Tech & Science' },
  { key: 'meteo',        label: 'Météo' },
  { key: 'geopolitique', label: 'Géopolitique' },
  { key: 'tele-realite', label: 'Télé-réalité' },
  { key: 'actualite',    label: 'Actualité' },
];

function getHref(key: string): string {
  if (key === 'trending') return '/';
  return `/category/${key}`;
}

type SearchResultMarket = Pick<
  IMarket,
  '_id' | 'title' | 'category' | 'status' | 'options' | 'totalVolume' | 'endsAt' | 'subcategory'
>;

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return volume.toLocaleString('fr-FR');
}

function formatTimeLabel(date: Date | string): string {
  const endsAt = new Date(date);
  const diffMs = endsAt.getTime() - Date.now();

  if (diffMs <= 0) return 'Terminé';

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (totalHours < 24) return `${Math.max(totalHours, 1)}h`;

  const totalDays = Math.floor(totalHours / 24);
  return `${totalDays}j`;
}

export default function Header({
  coins = 0,
  isLoggedIn = false,
  liveCount = 20,
  initialBalance = 0,
}: HeaderProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { data: session } = useSession();
  const [search,        setSearch]        = useState('');
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultMarket[]>([]);
  const [discoverMarkets, setDiscoverMarkets] = useState<SearchResultMarket[]>([]);
  const [depositOpen,   setDepositOpen]   = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(initialBalance);
  const menuRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const loggedIn  = isLoggedIn || !!session?.user;
  const username  = (session?.user as { name?: string })?.name ?? '';
  const userCoins = coins;

  // Charger le solde wallet quand l'utilisateur est connecté
  useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/wallet/balance')
      .then(r => r.json())
      .then(d => { if (typeof d.balance === 'number') setWalletBalance(d.balance); })
      .catch(() => {});
  }, [loggedIn]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (e.key === '/' && !isTypingField) {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }

      if (e.key === 'Escape') {
        setSearchOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    if (!searchOpen) return;

    const loadDiscover = async () => {
      if (discoverMarkets.length > 0) return;

      try {
        setSearchLoading(true);
        const response = await fetch('/api/markets?limit=8', { cache: 'no-store' });
        const data = await response.json();
        if (!cancelled) {
          setDiscoverMarkets((data.markets ?? []) as SearchResultMarket[]);
        }
      } catch {
        if (!cancelled) {
          setDiscoverMarkets([]);
        }
      } finally {
        if (!cancelled && search.trim().length < 2) {
          setSearchLoading(false);
        }
      }
    };

    loadDiscover();

    return () => {
      cancelled = true;
    };
  }, [searchOpen, discoverMarkets.length, search]);

  useEffect(() => {
    let cancelled = false;
    const query = search.trim();

    if (!searchOpen) return;
    if (query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(`/api/markets?q=${encodeURIComponent(query)}&limit=8`, { cache: 'no-store' });
        const data = await response.json();

        if (!cancelled) {
          setSearchResults((data.markets ?? []) as SearchResultMarket[]);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search, searchOpen]);

  const liveResults = (search.trim().length >= 2 ? searchResults : discoverMarkets).filter((market) => market.status === 'live').slice(0, 3);
  const browseCategories = NAV_CATEGORIES.filter(({ key }) => key !== 'trending').slice(0, 6);
  const visibleResults = search.trim().length >= 2 ? searchResults : discoverMarkets;

  const activeKey = (() => {
    if (pathname === '/') return 'trending';
    const m = pathname.match(/^\/category\/(.+)$/);
    return m ? m[1] : '';
  })();

  return (
    <header
      className="sticky top-0 z-50 flex flex-col w-full"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-medium)',
      }}
    >
      {/* ════════════════════════════════════════════════════
          LIGNE 1 — Top bar
      ════════════════════════════════════════════════════ */}
      <div className="flex items-center px-4 sm:px-5 h-14 gap-2 sm:gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <FlatEarthLogo />
          {/* Texte caché sur très petit écran (<480px) */}
          <span
            className="font-black tracking-widest uppercase"
            style={{
              color: '#00e676',
              letterSpacing: '0.1em',
              fontSize: 15,
              display: 'none',
            }}
          >
            FLATEARTH
          </span>
          {/* CSS media query via style tag inline — plus fiable que breakpoints Tailwind pour ce cas */}
          <style>{`
            @media (min-width: 480px) {
              .fe-logo-text { display: block !important; }
            }
          `}</style>
          <span
            className="fe-logo-text font-black tracking-widest uppercase"
            style={{ color: '#00e676', letterSpacing: '0.1em', fontSize: 15, display: 'none' }}
          >
            FLATEARTH
          </span>
        </Link>

        {/* Nav items — visible uniquement sur desktop (lg+) */}
        <nav className="hidden lg:flex items-center shrink-0">
          <TopNavItem href="/" active={pathname === '/'}>MARCHÉS</TopNavItem>
          <TopNavItem href="/live" active={pathname === '/live'} redBadge={liveCount}>
            EN DIRECT
          </TopNavItem>
        </nav>

        {/* Barre de recherche — flex-1, largeur max généreuse */}
        <div className="flex-1 min-w-0 mx-2 sm:mx-3 lg:mx-4" ref={searchRef}>
          <div
            className="relative"
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl w-full transition-all"
              style={{
                maxWidth: 680,
                margin: '0 auto',
                border: `1px solid ${searchOpen ? 'var(--border-medium)' : 'var(--border)'}`,
                background: searchOpen ? 'var(--bg-elevated)' : 'var(--bg-input)',
                boxShadow: searchOpen ? '0 0 0 2px var(--border-light)' : 'none',
              }}
            >
              <Search size={14} className="shrink-0 transition-colors" style={{ color: searchOpen ? 'var(--text-secondary)' : 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && visibleResults[0]) {
                    router.push(`/market/${visibleResults[0]._id}`);
                    setSearchOpen(false);
                  }
                }}
                placeholder="Rechercher marchés, sujets..."
                className="flex-1 min-w-0 bg-transparent outline-none text-[13px]"
                style={{ color: 'var(--text-primary)' }}
              />
              <kbd
                className="hidden sm:flex items-center justify-center px-1.5 py-0.5 rounded-md shrink-0 text-[10px] font-medium"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-item-hover)', color: 'var(--text-muted)' }}
              >
                /
              </kbd>
            </div>

            {searchOpen && (
              <div
                className="absolute top-full mt-2 rounded-xl overflow-hidden z-[80] shadow-2xl"
                style={{
                  width: 'calc(100vw - 32px)',
                  maxWidth: 720,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: '0 20px 60px var(--shadow-overlay)',
                }}
              >
                {search.trim().length < 2 ? (
                  <div className="p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                      Parcourir
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {browseCategories.map(({ key, label }) => (
                        <Link
                          key={key}
                          href={getHref(key)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:brightness-110"
                          style={{ background: 'var(--bg-item-hover)', color: 'var(--text-label)', border: '1px solid var(--border)' }}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>

                    <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                          Marchés en vue
                        </p>
                        <div className="space-y-1">
                          {discoverMarkets.slice(0, 5).map((market) => (
                            <SearchMarketRow key={market._id} market={market} onSelect={() => setSearchOpen(false)} />
                          ))}
                        </div>
                      </div>

                      <div className="hidden md:block">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            En direct
                          </p>
                        </div>
                        <div className="space-y-1">
                          {liveResults.length > 0 ? liveResults.map((market) => (
                            <SearchMarketRow key={market._id} market={market} compact onSelect={() => setSearchOpen(false)} />
                          )) : (
                            <div className="rounded-lg px-4 py-3 text-sm text-center" style={{ background: 'var(--bg-item)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                              Aucun marché live mis en avant.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="xl:hidden mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                          En direct
                        </p>
                        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          Sélection rapide
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {liveResults.length > 0 ? liveResults.map((market) => (
                          <SearchMarketRow key={market._id} market={market} onSelect={() => setSearchOpen(false)} />
                        )) : (
                          <div
                            className="rounded-xl px-3 py-3 text-sm"
                            style={{ background: 'var(--bg-item)', color: 'var(--text-secondary)' }}
                          >
                            Aucun marché live mis en avant.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-2 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                        Résultats
                      </p>
                      {searchLoading && (
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Recherche...
                        </span>
                      )}
                    </div>

                    {!searchLoading && visibleResults.length === 0 && (
                      <div className="px-3 py-8 text-center">
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-bright)' }}>
                          Aucun marché trouvé pour "{search.trim()}"
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Essaie un titre, une équipe, un sujet ou une catégorie.
                        </p>
                      </div>
                    )}

                    {visibleResults.length > 0 && (
                      <div className="space-y-1">
                        {visibleResults.map((market) => (
                          <SearchMarketRow key={market._id} market={market} onSelect={() => setSearchOpen(false)} />
                        ))}
                      </div>
                    )}

                    {visibleResults.length > 0 && (
                      <div
                        className="flex items-center justify-between px-3 py-2 mt-2 rounded-xl"
                        style={{ background: 'var(--bg-item)', color: 'var(--text-secondary)' }}
                      >
                        <span className="text-xs">Entrée ouvre le premier marché</span>
                        <span className="text-xs">{visibleResults.length} résultat{visibleResults.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Auth / profil */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {loggedIn ? (
            <>
              {/* Wallet balance + bouton Déposer */}
              <button
                onClick={() => setDepositOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 group"
                style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)', color: '#00e676' }}
              >
                <Wallet size={13} />
                <span>{(walletBalance / 100).toFixed(2)} €</span>
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded-lg transition-all"
                  style={{ background: 'rgba(0,230,118,0.15)', color: '#00e676' }}
                >
                  + Déposer
                </span>
              </button>

              {/* Créer un pari */}
              <Link
                href="/create-market"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all hover:brightness-110 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #00e676, #00b8d4)', color: '#000' }}
              >
                <Plus size={13} />
                Créer un pari
              </Link>

              {/* Avatar dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl transition-all hover:bg-white/5"
                  style={{ border: '1px solid var(--border-medium)' }}
                >
                  {/* Avatar gradient */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: 'linear-gradient(135deg, #00e676, #4fc3f7)', color: '#000' }}
                  >
                    {username ? username[0].toUpperCase() : <User size={12} />}
                  </div>
                  <span className="hidden sm:block text-xs font-semibold" style={{ color: 'var(--text-bright)' }}>{username}</span>
                  <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 rounded-2xl overflow-hidden z-50"
                    style={{
                      width: 220,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-medium)',
                      boxShadow: '0 8px 32px var(--shadow-overlay)',
                    }}
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                        style={{ background: 'linear-gradient(135deg, #00e676, #4fc3f7)', color: '#000' }}
                      >
                        {username ? username[0].toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{username}</p>
                        <p className="text-xs font-semibold" style={{ color: 'var(--accent-green)' }}>
                          {(walletBalance / 100).toFixed(2)} € disponible
                        </p>
                      </div>
                    </div>

                    {/* Bouton déposer dans le menu */}
                    <button
                      onClick={() => { setMenuOpen(false); setDepositOpen(true); }}
                      className="flex items-center gap-3 px-4 py-3 text-sm w-full text-left transition-all hover:bg-white/5"
                      style={{ color: 'var(--accent-green)', borderBottom: '1px solid var(--border)' }}
                    >
                      <Wallet size={14} />
                      Déposer des fonds
                    </button>

                    {/* Menu items */}
                    {[
                      { href: '/profile',       icon: <User size={14} />,    label: 'Mon profil' },
                      { href: '/create-market', icon: <Plus size={14} />,    label: 'Créer un pari' },
                      { href: '/settings',      icon: <Settings size={14} />, label: 'Paramètres' },
                    ].map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-white/5"
                        style={{ color: 'var(--text-bright)' }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}

                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      <button
                        onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm w-full text-left transition-all hover:bg-white/5"
                        style={{ color: '#f44336' }}
                      >
                        <LogOut size={14} />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden sm:block px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:brightness-110"
                style={{ color: 'var(--text-secondary)' }}
              >
                Se connecter
              </Link>
              <Link
                href="/auth/register"
                className="px-3 sm:px-4 py-1.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #00e676, #00b8d4)', color: '#000', boxShadow: '0 0 16px rgba(0,230,118,0.25)', fontSize: 13 }}
              >
                <span className="sm:hidden">Inscrire</span>
                <span className="hidden sm:inline">S&apos;inscrire</span>
              </Link>
            </>
          )}

          {/* Hamburger — visible sm et md (pas sur desktop) */}
          <ThemeToggle />

          {/* Hamburger — visible sm et md (pas sur desktop) */}
          <button
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'var(--bg-item-hover)', color: 'var(--text-secondary)' }}
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* DepositModal */}
      {depositOpen && (
        <DepositModal
          onClose={() => setDepositOpen(false)}
          currentBalance={walletBalance}
        />
      )}

      {/* ════════════════════════════════════════════════════
          LIGNE 2 — Barre catégories
          px-5 = même padding que le contenu de la page
      ════════════════════════════════════════════════════ */}
      <div
        className="no-scrollbar overflow-x-auto"
        style={{
          borderTop: '1px solid var(--border-light)',
          height: searchOpen ? 0 : 42,
          display: 'flex',
          alignItems: 'stretch',
          paddingLeft: 20,   /* identique au p-5 du contenu */
          paddingRight: 20,
          opacity: searchOpen ? 0 : 1,
          pointerEvents: searchOpen ? 'none' : 'auto',
          overflow: 'hidden',
          transition: 'height 0.16s ease, opacity 0.16s ease',
        }}
      >
        {NAV_CATEGORIES.map(({ key, label }) => {
          const active = activeKey === key;
          return (
            <Link
              key={key}
              href={getHref(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                position: 'relative',
                flexShrink: 0,
                transition: 'color 0.15s',
                textDecoration: 'none',
                height: '100%',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-label)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >
              {label}
              {/* Underline active — colle au bas de la barre */}
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 12,
                    right: 12,
                    height: 2,
                    borderRadius: 2,
                    background: '#00e676',
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

function SearchMarketRow({
  market,
  compact = false,
  onSelect,
}: {
  market: SearchResultMarket;
  compact?: boolean;
  onSelect: () => void;
}) {
  const topOption = market.options[0];

  return (
    <Link
      href={`/market/${market._id}`}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all hover:brightness-105"
      style={{ background: 'transparent' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-item-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: market.status === 'live' ? 'rgba(0,230,118,0.14)' : 'var(--bg-item-hover)',
          border: `1px solid ${market.status === 'live' ? 'rgba(0,230,118,0.24)' : 'var(--border)'}`,
          color: market.status === 'live' ? 'var(--accent-green)' : 'var(--text-secondary)',
        }}
      >
        {market.status === 'live' ? <Flame size={15} /> : <Search size={15} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--text-bright)', maxWidth: compact ? '100%' : undefined }}
          >
            {market.title}
          </p>
          {market.status === 'live' && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black"
              style={{ background: 'rgba(0,230,118,0.12)', color: 'var(--accent-green)' }}
            >
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--text-secondary)' }}>
          <span>{CATEGORY_LABELS[market.category]}</span>
          {market.subcategory && <span>{market.subcategory}</span>}
          {topOption && (
            <span style={{ color: 'var(--text-label)' }}>
              {topOption.label} {topOption.probability}%
            </span>
          )}
        </div>
      </div>

      {!compact && (
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold" style={{ color: 'var(--text-label)' }}>
              {formatVolume(market.totalVolume)}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              volume
            </p>
          </div>
          <div
            className="flex items-center gap-1 text-xs rounded-full px-2 py-1"
            style={{ background: 'var(--bg-item)', color: 'var(--text-secondary)' }}
          >
            <Clock size={11} />
            {formatTimeLabel(market.endsAt)}
          </div>
          <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
    </Link>
  );
}

// ── Composant item top-nav ────────────────────────────────────────────────────
function TopNavItem({
  href,
  active,
  redBadge,
  children,
}: {
  href: string;
  active: boolean;
  redBadge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all whitespace-nowrap shrink-0 hover:brightness-110"
      style={{
        background: active ? 'var(--bg-item-hover)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
    >
      {redBadge !== undefined && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
      )}
      {children}
      {redBadge != null && redBadge > 0 && (
        <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black ml-0.5">
          {redBadge}
        </span>
      )}
    </Link>
  );
}

// ── Logo SVG ──────────────────────────────────────────────────────────────────
function FlatEarthLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="15" cy="15" r="13" fill="none" stroke="rgba(0,230,118,0.35)" strokeWidth="1.2" />
      <ellipse cx="15" cy="17" rx="11" ry="4.5" fill="#1565c0" />
      <ellipse cx="15" cy="16" rx="11" ry="4.5" fill="#1976d2" />
      <path d="M10 14 Q15 11 20 14 Q18 18 15 17 Q12 18 10 14Z" fill="#388e3c" />
      <ellipse cx="15" cy="16" rx="11" ry="4.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
      <ellipse cx="15" cy="16" rx="14" ry="6" fill="none" stroke="rgba(255,215,0,0.35)" strokeWidth="0.8" />
      <circle cx="3.5" cy="14" r="2.5" fill="#ffd700" style={{ filter: 'drop-shadow(0 0 4px #ffd700)' }} />
    </svg>
  );
}
