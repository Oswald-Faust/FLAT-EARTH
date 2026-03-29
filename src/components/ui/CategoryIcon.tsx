'use client';

import {
  Trophy,
  Tv2,
  Landmark,
  Sparkles,
  Gamepad2,
  Newspaper,
  Bitcoin,
  Leaf,
  TrendingUp,
  Globe,
  Cpu,
  AtSign,
  Banknote,
  CloudSun,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_COLORS: Record<string, string> = {
  sport:          '#00e676',
  'tele-realite': '#e91e8c',
  politique:      '#4fc3f7',
  'pop-culture':  '#ce93d8',
  esport:         '#7c4dff',
  actualite:      '#ff9800',
  crypto:         '#ffd700',
  climat:         '#69f0ae',
  economie:       '#00e676',
  geopolitique:   '#4fc3f7',
  tech:           '#00e5ff',
  mentions:       '#b39ddb',
  finance:        '#a5d6a7',
  meteo:          '#80deea',
};

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  sport:          Trophy,
  'tele-realite': Tv2,
  politique:      Landmark,
  'pop-culture':  Sparkles,
  esport:         Gamepad2,
  actualite:      Newspaper,
  crypto:         Bitcoin,
  climat:         Leaf,
  economie:       TrendingUp,
  geopolitique:   Globe,
  tech:           Cpu,
  mentions:       AtSign,
  finance:        Banknote,
  meteo:          CloudSun,
};

interface CategoryIconProps {
  slug: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function CategoryIcon({ slug, size = 16, className = '', strokeWidth = 2 }: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[slug] ?? Globe;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
}
