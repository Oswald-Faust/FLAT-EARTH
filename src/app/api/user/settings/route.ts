import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const { type, ...payload } = body;

    await connectDB();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

    if (type === 'profile') {
      // Mise à jour username
      const { username } = payload;
      if (!username || username.length < 3) {
        return NextResponse.json({ error: 'Pseudo trop court (min. 3 caractères)' }, { status: 400 });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json({ error: 'Pseudo invalide (lettres, chiffres, _ uniquement)' }, { status: 400 });
      }
      // Vérifier unicité
      const existing = await User.findOne({ username, _id: { $ne: userId } });
      if (existing) {
        return NextResponse.json({ error: 'Ce pseudo est déjà pris' }, { status: 409 });
      }
      user.username = username;
      await user.save();
      return NextResponse.json({ success: true, username: user.username });
    }

    if (type === 'password') {
      const { currentPassword, newPassword } = payload;
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Nouveau mot de passe trop court (min. 8 caractères)' }, { status: 400 });
      }

      const ok = await user.comparePassword(currentPassword);
      if (!ok) {
        return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
      }

      user.password = newPassword; // Le pre-save hook hashera automatiquement
      await user.save();
      return NextResponse.json({ success: true });
    }

    if (type === 'email') {
      const { newEmail, password } = payload;
      if (!newEmail || !password) {
        return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
      }
      if (!newEmail.includes('@')) {
        return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
      }
      const ok = await user.comparePassword(password);
      if (!ok) {
        return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 400 });
      }
      const existing = await User.findOne({ email: newEmail.toLowerCase(), _id: { $ne: userId } });
      if (existing) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
      }
      user.email = newEmail.toLowerCase();
      await user.save();
      return NextResponse.json({ success: true, email: user.email });
    }

    return NextResponse.json({ error: 'Type inconnu' }, { status: 400 });
  } catch (err) {
    console.error('[PUT /api/user/settings]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
