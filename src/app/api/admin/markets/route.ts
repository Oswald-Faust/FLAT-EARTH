import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Market from '@/models/Market';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const category       = searchParams.get('category') ?? '';
    const status         = searchParams.get('status') ?? '';
    const approvalStatus = searchParams.get('approvalStatus') ?? '';
    const search         = searchParams.get('search') ?? '';
    const limit          = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const page           = Math.max(parseInt(searchParams.get('page') ?? '1'), 1);

    const query: Record<string, unknown> = {};
    if (category)       query.category       = category;
    if (status)         query.status         = status;
    if (approvalStatus) query.approvalStatus  = approvalStatus;
    if (search)         query.title          = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;

    const [markets, total] = await Promise.all([
      Market.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username')
        .lean(),
      Market.countDocuments(query),
    ]);

    return NextResponse.json({ markets, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/admin/markets]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      title, description, rules, contextNews,
      category, subcategory, status,
      options, endsAt, creatorFeePercent,
      currency, isGoogleVerified,
    } = body;

    if (!title || !category || !options?.length || !endsAt) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }
    if (options.length < 2) {
      return NextResponse.json({ error: 'Minimum 2 options' }, { status: 400 });
    }

    // Use a system admin user or first admin found
    let adminUser = await User.findOne({ role: 'admin' }).select('_id').lean();
    if (!adminUser) {
      // Create a default admin user if none exists
      adminUser = await User.create({
        username: 'admin',
        email:    'admin@flatearth.com',
        password: 'flatearth_admin_2026',
        role:     'admin',
        coins:    0,
      });
    }

    const market = await Market.create({
      title:            title.trim(),
      description:      description ?? '',
      rules:            rules ?? '',
      contextNews:      contextNews ?? '',
      category,
      subcategory:      subcategory ?? '',
      status:           status ?? 'open',
      approvalStatus:   'approved',
      isGoogleVerified: isGoogleVerified ?? false,
      currency:         currency ?? 'coins',
      options:          options.map((o: { label: string; probability: number }) => ({
        label:       o.label,
        probability: o.probability ?? 50,
        totalBets:   0,
      })),
      endsAt:           new Date(endsAt),
      creatorFeePercent:creatorFeePercent ?? 2,
      createdBy:        adminUser._id,
    });

    return NextResponse.json(market, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/markets]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
