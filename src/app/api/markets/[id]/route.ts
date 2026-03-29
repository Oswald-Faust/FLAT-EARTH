import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Market from '@/models/Market';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const market = await Market.findById(id)
      .populate('createdBy', 'username avatar')
      .lean();

    if (!market) {
      return NextResponse.json({ error: 'Marché introuvable' }, { status: 404 });
    }

    return NextResponse.json(market);
  } catch (error) {
    console.error('[GET /api/markets/[id]]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
