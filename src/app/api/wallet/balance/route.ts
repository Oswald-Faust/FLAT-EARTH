import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    await connectDB();
    const user = await User.findById(userId).select('balance').lean();
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json({ balance: (user as { balance?: number }).balance ?? 0 });
  } catch (err) {
    console.error('[GET /api/wallet/balance]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
