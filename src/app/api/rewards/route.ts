import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { getRewardOverview } from '@/lib/competition';

export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();
    const data = await getRewardOverview(userId);

    if (!data) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/rewards]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
