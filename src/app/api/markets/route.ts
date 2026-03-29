import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Market from '@/models/Market';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const q = searchParams.get('q')?.trim() ?? '';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 200);
    const page = Math.max(parseInt(searchParams.get('page') ?? '1'), 1);

    const query: Record<string, unknown> = { approvalStatus: 'approved' };
    if (category) query.category = category;
    if (status) query.status = status;
    if (q) {
      const safeQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safeQuery, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { contextNews: regex },
        { subcategory: regex },
        { 'options.label': regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [markets, total] = await Promise.all([
      Market.find(query)
        .sort({ totalVolume: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username avatar')
        .lean(),
      Market.countDocuments(query),
    ]);

    return NextResponse.json({ markets, total, page, limit });
  } catch (error) {
    console.error('[GET /api/markets]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { title, description, rules, category, options, endsAt, createdBy, creatorFeePercent } = body;

    if (!title || !category || !options || !endsAt || !createdBy) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    const market = await Market.create({
      title, description, rules, category, options, endsAt, createdBy, creatorFeePercent: creatorFeePercent ?? 2,
    });

    return NextResponse.json(market, { status: 201 });
  } catch (error) {
    console.error('[POST /api/markets]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
