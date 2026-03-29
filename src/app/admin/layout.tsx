'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Tag,
  TrendingUp,
  Users,
  Globe,
  CreditCard,
  Flag,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'Général',
    items: [
      { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { href: '/admin/markets', label: 'Marchés', icon: TrendingUp },
      { href: '/admin/categories', label: 'Catégories', icon: Tag },
    ],
  },
  {
    title: 'Communauté',
    items: [
      { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    ],
  },
  {
    title: 'Opérations',
    items: [
      { href: '/admin/payments', label: 'Paiements', icon: CreditCard },
      { href: '/admin/reports', label: 'Signalements', icon: Flag },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 sticky top-0 h-screen">
        
        {/* Logo */}
        <div className="px-6 py-6 shrink-0 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-105">
              FE
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">FLATEARTH</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Administration</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-8">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const exact = href === '/admin';
                  const basePath = href.split('?')[0];
                  const active = exact ? pathname === '/admin' : pathname.startsWith(basePath);

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Globe className="w-4 h-4" />
            Retour au site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
