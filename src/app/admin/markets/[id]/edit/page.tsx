'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MarketForm from '../../_form';

interface PageProps { params: Promise<{ id: string }> }

export default function EditMarketPage({ params }: PageProps) {
  const { id } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [market,   setMarket]   = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/markets/${id}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setMarket(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#00e676', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-4xl">🔍</p>
        <p className="text-lg font-bold" style={{ color: '#fff' }}>Marché introuvable</p>
        <Link href="/admin/markets" className="text-sm" style={{ color: '#4a5380' }}>← Retour à la liste</Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href={`/admin/markets/${id}`}
          className="flex items-center gap-1.5 text-xs font-semibold transition-all hover:text-white"
          style={{ color: '#4a5380' }}
        >
          <ArrowLeft size={13} />
          Détail du marché
        </Link>
        <span style={{ color: '#2a3050' }}>/</span>
        <span className="text-xs font-semibold" style={{ color: '#6b7db3' }}>Modifier</span>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: '#fff' }}>Modifier le marché</h1>
        <p className="text-sm mt-0.5 truncate" style={{ color: '#4a5380' }}>{market?.title}</p>
      </div>
      <MarketForm mode="edit" initial={market} />
    </div>
  );
}
