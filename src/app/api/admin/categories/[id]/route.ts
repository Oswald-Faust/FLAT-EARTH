import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import Market from '@/models/Market';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const category = await Category.findByIdAndUpdate(
      id,
      {
        $set: {
          name:          body.name,
          icon:          body.icon,
          description:   body.description,
          order:         body.order,
          subcategories: body.subcategories,
        },
      },
      { new: true, runValidators: true }
    );

    if (!category) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    return NextResponse.json(category);
  } catch (err) {
    console.error('[PUT /api/admin/categories/[id]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const { id } = await params;

    const category = await Category.findById(id);
    if (!category) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const marketCount = await Market.countDocuments({ category: category.slug });
    if (marketCount > 0) {
      return NextResponse.json(
        { error: `Impossible : ${marketCount} marché(s) associé(s) à cette catégorie` },
        { status: 409 }
      );
    }

    await category.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/categories/[id]]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
