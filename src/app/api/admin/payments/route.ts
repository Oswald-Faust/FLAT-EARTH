import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import CoinTransaction from '@/models/CoinTransaction';
import User from '@/models/User'; // Pour le populate

export async function GET(req: Request) {
  try {
    const session = await auth();
    // Assuming session exists and user is admin. Since roles aren't specified in JWT via auth.ts,
    // we should ideally query it, but for now we enforce authentication at admin level.
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const type = searchParams.get('type') || '';

    await connectDB();

    // Verify user role if needed from DB
    const userRoleObj = await User.findById(session.user.id);
    if (!userRoleObj || userRoleObj.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (type && type !== 'all') {
      filter.type = type;
    }

    const transactions = await CoinTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email')
      .lean();

    const total = await CoinTransaction.countDocuments(filter);

    // Calcul du volume global d'achats pour les stats
    const totalPurchasesQuery = await CoinTransaction.aggregate([
      { $match: { type: 'purchase' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalPurchasesVolume = totalPurchasesQuery[0]?.total || 0;

    return NextResponse.json({
      transactions,
      total,
      pages: Math.ceil(total / limit),
      stats: {
        totalPurchasesVolume,
      }
    });
  } catch (error) {
    console.error('Erreur Admin Payments API:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
