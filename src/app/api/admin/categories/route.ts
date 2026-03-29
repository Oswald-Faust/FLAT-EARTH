import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import Market from '@/models/Market';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();

    // Add market count per category
    const withCounts = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        marketCount: await Market.countDocuments({ category: cat.slug }),
      }))
    );

    return NextResponse.json(withCounts);
  } catch (err) {
    console.error('[GET /api/admin/categories]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, slug, icon, description, order, subcategories } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'name et slug requis' }, { status: 400 });
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: 'Slug déjà utilisé' }, { status: 409 });
    }

    const category = await Category.create({
      name,
      slug:          slug.toLowerCase().trim(),
      icon:          icon ?? '🌍',
      description:   description ?? '',
      order:         order ?? 99,
      subcategories: subcategories ?? [],
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/categories]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
