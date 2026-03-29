import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { auth } from '@/lib/auth';

// ─── GET /api/comments?marketId=xxx ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marketId = searchParams.get('marketId');
  if (!marketId) return NextResponse.json({ error: 'marketId requis' }, { status: 400 });

  await connectDB();

  const all = await Comment.find({ marketId })
    .sort({ createdAt: -1 })
    .populate('userId', 'username avatar')
    .lean();

  // Séparer top-level et réponses
  const topLevel = all.filter(c => !c.parentId);
  const replies  = all.filter(c =>  c.parentId);

  const nested = topLevel.map(c => ({
    ...c,
    replies: replies
      .filter(r => r.parentId?.toString() === (c._id as unknown as { toString(): string }).toString())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  }));

  return NextResponse.json({ comments: nested, total: topLevel.length });
}

// ─── POST /api/comments ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Connecte-toi pour commenter' }, { status: 401 });
  }

  await connectDB();

  const { marketId, content, parentId } = await req.json();

  if (!marketId || !content?.trim()) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }
  if (content.trim().length > 500) {
    return NextResponse.json({ error: 'Max 500 caractères' }, { status: 400 });
  }

  const comment = await Comment.create({
    userId:   session.user.id,
    marketId,
    content:  content.trim(),
    parentId: parentId ?? null,
  });

  await comment.populate('userId', 'username avatar');

  return NextResponse.json({ comment }, { status: 201 });
}
