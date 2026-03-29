import mongoose, { Schema, Document } from 'mongoose';

export interface ISubcategory {
  slug: string;
  label: string;
}

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  icon: string;
  description?: string;
  order: number;
  subcategories: ISubcategory[];
  createdAt: Date;
  updatedAt: Date;
}

const SubcategorySchema = new Schema<ISubcategory>(
  {
    slug:  { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name:          { type: String, required: true, trim: true },
    slug:          { type: String, required: true, unique: true, trim: true, lowercase: true },
    icon:          { type: String, required: true, default: '🌍' },
    description:   { type: String, default: '' },
    order:         { type: Number, default: 99 },
    subcategories: { type: [SubcategorySchema], default: [] },
  },
  { timestamps: true }
);

CategorySchema.index({ slug: 1 });
CategorySchema.index({ order: 1 });

const Category = mongoose.models.Category as mongoose.Model<ICategoryDocument>
  ?? mongoose.model<ICategoryDocument>('Category', CategorySchema);

export default Category;
