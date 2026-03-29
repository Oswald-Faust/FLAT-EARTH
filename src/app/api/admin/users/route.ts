import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// ── GET — liste paginée ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const page   = Math.max(parseInt(searchParams.get('page')  ?? '1'), 1);
    const search = searchParams.get('search') ?? '';
    const role   = searchParams.get('role') ?? '';

    const query: Record<string, unknown> = {};
    if (search) query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
    ];
    if (role && ['user', 'creator', 'admin'].includes(role)) query.role = role;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password').lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({ users, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/admin/users]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── POST — créer un utilisateur ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, email, password, role = 'user', coins = 100 } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Champs username, email et password requis' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court (min. 6 caractères)' }, { status: 400 });
    }
    if (!['user', 'creator', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) {
      return NextResponse.json(
        { error: existing.email === email.toLowerCase() ? 'Email déjà utilisé' : 'Pseudo déjà pris' },
        { status: 409 },
      );
    }

    const user = await User.create({ username, email: email.toLowerCase(), password, role, coins });
    const { password: _pw, ...safe } = user.toObject();
    void _pw;
    return NextResponse.json({ user: safe }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/users]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
