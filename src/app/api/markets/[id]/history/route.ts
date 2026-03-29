import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MarketHistory from '@/models/MarketHistory';
import Market from '@/models/Market';
import { OPTION_COLORS } from '@/lib/demo-data';

// ─── Constantes ───────────────────────────────────────────────────────────────
const MAX_POINTS = 120;

const PERIOD_MS: Record<string, number> = {
  '1D': 24 * 3600 * 1000,
  '1W': 7 * 24 * 3600 * 1000,
  '1M': 30 * 24 * 3600 * 1000,
};

// Downsample un tableau à N points maximum (evenly spaced)
function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const result: T[] = [];
  const step = (arr.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) {
    result.push(arr[Math.round(i * step)]);
  }
  return result;
}

// ─── GET /api/markets/[id]/history?period=1D|1W|1M|ALL ───────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') ?? '1M';

  await connectDB();

  // Récupérer le marché pour les labels et les probabilités actuelles
  const market = await Market.findById(id).lean();
  if (!market) {
    return NextResponse.json({ error: 'Marché introuvable' }, { status: 404 });
  }

  // Construire la query temporelle
  const since = PERIOD_MS[period] ? new Date(Date.now() - PERIOD_MS[period]) : null;
  const query: Record<string, unknown> = { marketId: id };
  if (since) query.recordedAt = { $gte: since };

  const rawHistory = await MarketHistory
    .find(query)
    .sort({ recordedAt: 1 })
    .lean();

  const history = downsample(rawHistory, MAX_POINTS);
  const hasData = history.length > 0;

  // Construire les séries par option
  const optionMap = new Map(
    market.options.map(o => [o._id.toString(), o])
  );

  const series = market.options.slice(0, 5).map((opt, idx) => {
    const optId = opt._id.toString();
    const data: { time: number; probability: number }[] = hasData
      ? history.map(h => {
          const pt = h.probabilities.find(p => p.optionId === optId);
          return {
            time:        h.recordedAt.getTime(),
            probability: pt?.probability ?? opt.probability,
          };
        })
      // Fallback : si aucune donnée, ligne plate à la prob actuelle
      : [
          { time: Date.now() - 3600 * 1000, probability: opt.probability },
          { time: Date.now(),               probability: opt.probability },
        ];

    return {
      optionId:           optId,
      label:              opt.label,
      color:              OPTION_COLORS[idx] ?? '#aaa',
      data,
      currentProbability: opt.probability,
    };
  });

  return NextResponse.json({ series, hasData, period });
}
