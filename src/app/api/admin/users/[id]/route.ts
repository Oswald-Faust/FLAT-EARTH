import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Bet from '@/models/Bet';

// ── GET — détail utilisateur ──────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const [user, totalBets, wonBets, activeBets] = await Promise.all([
      User.findById(id).select('-password').lean(),
      Bet.countDocuments({ userId: id }),
      Bet.countDocuments({ userId: id, status: 'won' }),
      Bet.countDocuments({ userId: id, status: 'pending' }),
    ]);

    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

    const totalSpent = await Bet.aggregate([
      { $match: { userId: id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then(r => r[0]?.total ?? 0);

    return NextResponse.json({
      user,
      stats: { totalBets, wonBets, activeBets, totalSpent,
        winRate: totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0 },
    });
  } catch (err) {
    console.error('[GET /api/admin/users/[id]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── PATCH — modifier rôle / coins ─────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!['user', 'creator', 'admin'].includes(body.role)) {
        return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
      }
      update.role = body.role;
    }

    if (body.coinsAdjust !== undefined) {
      const user = await User.findById(id);
      if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
      const newCoins = Math.max(0, user.coins + Number(body.coinsAdjust));
      update.coins = newCoins;
    }

    if (body.coins !== undefined) {
      update.coins = Math.max(0, Number(body.coins));
    }

    if (body.password !== undefined) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: 'Mot de passe trop court (min. 6 caractères)' }, { status: 400 });
      }
      // On passe par save() pour déclencher le hook de hashage
      const user = await User.findById(id);
      if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
      user.password = body.password;
      Object.assign(user, update);
      await user.save();
      const { password: _pw, ...safe } = user.toObject();
      void _pw;
      return NextResponse.json({ user: safe });
    }

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).select('-password').lean();
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[PATCH /api/admin/users/[id]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── DELETE — supprimer utilisateur ────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findByIdAndDelete(id);
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

    // Annuler ses paris en cours (optionnel : ne pas supprimer l'historique)
    await Bet.updateMany({ userId: id, status: 'pending' }, { $set: { status: 'cancelled' } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/users/[id]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
