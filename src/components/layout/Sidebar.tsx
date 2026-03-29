'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Star, Globe, Gamepad2, Radio, Newspaper, Settings, LogOut, ChevronRight } from 'lucide-react';
import { MarketCategory, CATEGORY_LABELS } from '@/types';

const categories: { key: MarketCategory; icon: React.ReactNode; color: string }[] = [
  { key: 'sport', icon: <Zap size={16} />, color: '#00e676' },
  { key: 'tele-realite', icon: <Star size={16} />, color: '#ff6b9d' },
  { key: 'politique', icon: <Globe size={16} />, color: '#4fc3f7' },
  { key: 'pop-culture', icon: <Radio size={16} />, color: '#ce93d8' },
  { key: 'esport', icon: <Gamepad2 size={16} />, color: '#ffb74d' },
  { key: 'actualite', icon: <Newspaper size={16} />, color: '#80cbc4' },
];

const trendingUsers = [
  { name: 'Karim92', icon: '🏆' },
  { name: 'LucoBarca', icon: '⚽' },
  { name: 'ParisFan', icon: '🎯' },
  { name: 'GageBack', icon: '💰' },
  { name: 'Tertan', icon: '🎮' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col h-full py-3"
      style={{
        width: 200,
        background: 'rgba(13,16,53,0.95)',
        borderRight: '1px solid rgba(37,45,107,0.6)',
      }}
    >
      {/* Catégories */}
      <nav className="flex flex-col gap-0.5 px-2">
        {categories.map(({ key, icon, color }) => {
          const active = pathname.includes(`/category/${key}`);
          return (
            <Link
              key={key}
              href={`/category/${key}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium"
              style={{
                background: active ? `rgba(${hexToRgb(color)}, 0.15)` : 'transparent',
                color: active ? color : '#8892c4',
                borderLeft: active ? `2px solid ${color}` : '2px solid transparent',
              }}
            >
              <span style={{ color: active ? color : '#4a5380' }}>{icon}</span>
              {CATEGORY_LABELS[key]}
            </Link>
          );
        })}
      </nav>

      {/* Séparateur */}
      <div className="mx-4 my-3" style={{ height: 1, background: 'rgba(37,45,107,0.6)' }} />

      {/* Utilisateurs tendance */}
      <div className="flex flex-col gap-0.5 px-2">
        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a5380' }}>
          Tendances
        </p>
        {trendingUsers.map((u) => (
          <div
            key={u.name}
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
            style={{ color: '#8892c4' }}
          >
            <span className="text-base">{u.icon}</span>
            <span className="text-xs truncate">{u.name}</span>
            <ChevronRight size={12} className="ml-auto opacity-40" />
          </div>
        ))}
      </div>

      {/* Bas de sidebar */}
      <div className="mt-auto flex flex-col gap-0.5 px-2">
        <div className="mx-2 mb-2" style={{ height: 1, background: 'rgba(37,45,107,0.6)' }} />
        <button
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full text-left"
          style={{ color: '#4a5380' }}
        >
          <Settings size={15} />
          Paramètres
        </button>
        <button
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all w-full text-left"
          style={{ color: '#4a5380' }}
        >
          <LogOut size={15} />
          Déconnecter
        </button>
      </div>
    </aside>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0,230,118';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}
