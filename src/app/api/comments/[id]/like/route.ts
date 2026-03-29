import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Comment from '@/models/Comment';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const comment = await Comment.findByIdAndUpdate(
    id,
    { $inc: { likes: 1 } },
    { new: true }
  );

  if (!comment) {
    return NextResponse.json({ error: 'Commentaire introuvable' }, { status: 404 });
  }

  return NextResponse.json({ likes: comment.likes });
}
