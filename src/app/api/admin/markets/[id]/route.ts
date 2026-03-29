import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Market from '@/models/Market';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    const market = await Market.findById(id).populate('createdBy', 'username').lean();
    if (!market) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    return NextResponse.json(market);
  } catch (err) {
    console.error('[GET /api/admin/markets/[id]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id }   = await params;
    const body     = await req.json();
    const { resolve, resolvedOption, ...fields } = body;

    const market = await Market.findById(id);
    if (!market) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    // ── Résolution du marché ──────────────────────────────────────────────────
    if (resolve && resolvedOption) {
      const optExists = market.options.find(o => o._id.toString() === resolvedOption || o.label === resolvedOption);
      if (!optExists) return NextResponse.json({ error: 'Option de résolution invalide' }, { status: 400 });

      market.status              = 'resolved';
      market.resolvedOption      = resolvedOption;
      market.resolvedAt          = new Date();
      market.verificationEndsAt  = new Date(Date.now() + 48 * 3600 * 1000);
      await market.save();
      return NextResponse.json(market);
    }

    // ── Mise à jour normale ───────────────────────────────────────────────────
    const allowed = [
      'title', 'description', 'rules', 'contextNews',
      'category', 'subcategory', 'status', 'approvalStatus',
      'isGoogleVerified', 'currency', 'options',
      'endsAt', 'creatorFeePercent',
    ];
    for (const key of allowed) {
      if (key in fields) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (market as any)[key] = fields[key];
      }
    }
    await market.save();
    return NextResponse.json(market);
  } catch (err) {
    console.error('[PUT /api/admin/markets/[id]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    const market = await Market.findByIdAndDelete(id);
    if (!market) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/markets/[id]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
