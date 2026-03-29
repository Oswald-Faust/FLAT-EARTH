import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court (6 car. min)' }, { status: 400 });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return NextResponse.json(
        { error: existing.email === email ? 'Email déjà utilisé' : 'Pseudo déjà pris' },
        { status: 409 }
      );
    }

    const user = await User.create({ username, email, password, coins: 100 });

    return NextResponse.json(
      { message: 'Compte créé ! 100 coins offerts.', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
