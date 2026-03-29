export interface IUser {
  _id: string;
  username: string;
  email: string;
  coins: number;
  role: 'user' | 'creator' | 'admin';
  avatar?: string;
  createdAt: Date;
}

export interface IMarketOption {
  _id: string;
  label: string;
  probability: number; // 0-100
  totalBets: number;
}

export type MarketCategory =
  | 'sport'
  | 'tele-realite'
  | 'politique'
  | 'pop-culture'
  | 'esport'
  | 'actualite'
  | 'crypto'
  | 'climat'
  | 'economie'
  | 'geopolitique'
  | 'tech'
  | 'mentions'
  | 'finance'
  | 'meteo';

export type MarketStatus = 'open' | 'live' | 'closed' | 'resolved';

export interface IMarket {
  _id: string;
  title: string;
  description: string;
  rules?: string;
  category: MarketCategory;
  subcategory?: string;
  status: MarketStatus;
  options: IMarketOption[];
  totalVolume: number;
  marketCount?: number;
  createdBy: string | IUser;
  endsAt: Date;
  resolvedOption?: string;
  coverImage?: string;
  creatorFeePercent: number;
  createdAt: Date;
  contextNews?: string;
}

export interface IBet {
  _id: string;
  userId: string | IUser;
  marketId: string | IMarket;
  optionId: string;
  amount: number;
  odds: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  potentialWin: number;
  createdAt: Date;
}

export interface ICoinTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'bet' | 'win' | 'creator_fee' | 'refund';
  reference?: string;
  createdAt: Date;
}

export interface IComment {
  _id: string;
  userId: string | IUser;
  marketId: string;
  content: string;
  likes: number;
  createdAt: Date;
}

export type TabFilter = 'live' | 'today' | 'tomorrow' | 'upcoming' | 'esport';

export const CATEGORY_LABELS: Record<MarketCategory, string> = {
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

export const CATEGORY_ICONS: Record<MarketCategory, string> = {
  sport: '⚽',
  'tele-realite': '📺',
  politique: '🏛️',
  'pop-culture': '🎵',
  esport: '🎮',
  actualite: '📰',
  crypto: '₿',
  climat: '🌍',
  economie: '📈',
  geopolitique: '🌐',
  tech: '💻',
  mentions: '💬',
  finance: '💰',
  meteo: '☁️',
};

export interface SubCategory {
  key: string;
  label: string;
  count: number;
}

export const CATEGORY_SUBCATEGORIES: Record<string, SubCategory[]> = {
  politique: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'france', label: 'France', count: 0 },
    { key: 'elections', label: 'Élections', count: 0 },
    { key: 'usa', label: 'États-Unis', count: 0 },
    { key: 'europe', label: 'Europe', count: 0 },
    { key: 'chine', label: 'Chine', count: 0 },
    { key: 'israel', label: 'Israël', count: 0 },
    { key: 'ukraine', label: 'Ukraine', count: 0 },
    { key: 'international', label: 'International', count: 0 },
  ],
  sport: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'football', label: 'Football', count: 0 },
    { key: 'basketball', label: 'Basketball', count: 0 },
    { key: 'tennis', label: 'Tennis', count: 0 },
    { key: 'f1', label: 'Formule 1', count: 0 },
    { key: 'rugby', label: 'Rugby', count: 0 },
    { key: 'ufc', label: 'UFC / MMA', count: 0 },
    { key: 'golf', label: 'Golf', count: 0 },
  ],
  crypto: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'bitcoin', label: 'Bitcoin', count: 0 },
    { key: 'ethereum', label: 'Ethereum', count: 0 },
    { key: 'altcoins', label: 'Altcoins', count: 0 },
    { key: 'defi', label: 'DeFi', count: 0 },
    { key: 'nft', label: 'NFT', count: 0 },
    { key: 'regulation', label: 'Régulation', count: 0 },
  ],
  esport: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'cs2', label: 'CS2', count: 0 },
    { key: 'lol', label: 'League of Legends', count: 0 },
    { key: 'valorant', label: 'Valorant', count: 0 },
    { key: 'fortnite', label: 'Fortnite', count: 0 },
    { key: 'dota2', label: 'Dota 2', count: 0 },
  ],
  economie: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'inflation', label: 'Inflation', count: 0 },
    { key: 'emploi', label: 'Emploi', count: 0 },
    { key: 'banques', label: 'Banques centrales', count: 0 },
    { key: 'marches', label: 'Marchés', count: 0 },
    { key: 'entreprises', label: 'Entreprises', count: 0 },
  ],
  tech: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'ia', label: 'Intelligence Artificielle', count: 0 },
    { key: 'apple', label: 'Apple', count: 0 },
    { key: 'google', label: 'Google', count: 0 },
    { key: 'space', label: 'Espace', count: 0 },
    { key: 'securite', label: 'Cybersécurité', count: 0 },
  ],
  geopolitique: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'conflits', label: 'Conflits', count: 0 },
    { key: 'diplomatie', label: 'Diplomatie', count: 0 },
    { key: 'asie', label: 'Asie', count: 0 },
    { key: 'moyen-orient', label: 'Moyen-Orient', count: 0 },
    { key: 'ameriques', label: 'Amériques', count: 0 },
  ],
  actualite: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'france-actu', label: 'France', count: 0 },
    { key: 'monde', label: 'Monde', count: 0 },
    { key: 'science', label: 'Science', count: 0 },
    { key: 'sante', label: 'Santé', count: 0 },
  ],
  climat: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'records', label: 'Records', count: 0 },
    { key: 'tempetes', label: 'Tempêtes', count: 0 },
    { key: 'cop', label: 'COP & accords', count: 0 },
    { key: 'secheresse', label: 'Sécheresse', count: 0 },
  ],
  meteo: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'records-meteo', label: 'Records', count: 0 },
    { key: 'tempetes-meteo', label: 'Tempêtes', count: 0 },
    { key: 'france-meteo', label: 'Météo France', count: 0 },
  ],
  'tele-realite': [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'koh-lanta', label: 'Koh-Lanta', count: 0 },
    { key: 'secret-story', label: 'Secret Story', count: 0 },
    { key: 'les-marseillais', label: 'Les Marseillais', count: 0 },
    { key: 'the-voice', label: 'The Voice', count: 0 },
  ],
  finance: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'bourse', label: 'Bourse', count: 0 },
    { key: 'forex', label: 'Forex', count: 0 },
    { key: 'matieres-premieres', label: 'Matières premières', count: 0 },
    { key: 'obligations', label: 'Obligations', count: 0 },
  ],
  'pop-culture': [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'cinema', label: 'Cinéma', count: 0 },
    { key: 'musique', label: 'Musique', count: 0 },
    { key: 'celebrites', label: 'Célébrités', count: 0 },
    { key: 'series', label: 'Séries', count: 0 },
  ],
  mentions: [
    { key: 'all', label: 'Tous', count: 0 },
    { key: 'bac', label: 'Baccalauréat', count: 0 },
    { key: 'concours', label: 'Concours', count: 0 },
    { key: 'classements', label: 'Classements', count: 0 },
  ],
};
