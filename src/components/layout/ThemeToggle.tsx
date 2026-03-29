'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className="flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 shrink-0"
      style={{
        width: 32,
        height: 32,
        background: 'var(--bg-item)',
        border: '1px solid var(--border-medium)',
        color: theme === 'dark' ? '#ffd700' : '#f59e0b',
      }}
    >
      {theme === 'dark'
        ? <Sun size={15} />
        : <Moon size={15} style={{ color: 'var(--text-secondary)' }} />
      }
    </button>
  );
}
