import mongoose, { Schema, Document, Model } from 'mongoose';

export type MarketStatus = 'open' | 'live' | 'closed' | 'resolved' | 'pending_validation';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected' | 'pending_payment';
export type MarketCurrency = 'coins' | 'euros';

export interface IMarketDocument extends Document {
  title: string;
  description: string;
  rules: string;
  contextNews?: string;
  category: string;
  subcategory?: string;
  status: MarketStatus;
  approvalStatus: ApprovalStatus;
  isGoogleVerified: boolean;
  currency: MarketCurrency;
  options: {
    _id: string;
    label: string;
    probability: number;
    totalBets: number;
  }[];
  totalVolume: number;
  marketCount?: number;
  createdBy: mongoose.Types.ObjectId;
  submittedBy?: mongoose.Types.ObjectId; // user who submitted (if user-created)
  endsAt: Date;
  resolvedOption?: string;
  resolvedAt?: Date;
  verificationEndsAt?: Date; // resolvedAt + 48h before payout
  coverImage?: string;
  creatorFeePercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema(
  {
    label:       { type: String, required: true, trim: true },
    probability: { type: Number, default: 50, min: 0, max: 100 },
    totalBets:   { type: Number, default: 0 },
  },
  { _id: true }
);

const ALL_CATEGORIES = [
  'sport', 'tele-realite', 'politique', 'pop-culture', 'esport',
  'actualite', 'crypto', 'climat', 'economie', 'geopolitique',
  'tech', 'mentions', 'finance', 'meteo',
];

const MarketSchema = new Schema<IMarketDocument>(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, default: '' },
    rules:       { type: String, default: '' },
    contextNews: { type: String, default: '' },

    category:    { type: String, enum: ALL_CATEGORIES, required: true },
    subcategory: { type: String, default: '' },

    status: {
      type:    String,
      enum:    ['open', 'live', 'closed', 'resolved', 'pending_validation'],
      default: 'open',
    },
    approvalStatus: {
      type:    String,
      enum:    ['approved', 'pending', 'rejected', 'pending_payment'],
      default: 'approved', // admin-created = auto approved
    },
    isGoogleVerified: { type: Boolean, default: false },

    currency: { type: String, enum: ['coins', 'euros'], default: 'coins' },

    options:     { type: [OptionSchema], required: true },
    totalVolume: { type: Number, default: 0 },
    marketCount: { type: Number, default: 1 },

    createdBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedBy:{ type: Schema.Types.ObjectId, ref: 'User' },

    endsAt:             { type: Date, required: true },
    resolvedOption:     { type: String },
    resolvedAt:         { type: Date },
    verificationEndsAt: { type: Date }, // resolvedAt + 48h

    coverImage:       { type: String },
    creatorFeePercent:{ type: Number, default: 2, min: 0, max: 15 },
  },
  { timestamps: true }
);

MarketSchema.index({ category: 1, status: 1 });
MarketSchema.index({ approvalStatus: 1 });
MarketSchema.index({ endsAt: 1 });
MarketSchema.index({ createdBy: 1 });

// Auto-set verificationEndsAt when resolving
MarketSchema.pre('save', function () {
  if (this.isModified('resolvedOption') && this.resolvedOption && !this.resolvedAt) {
    this.resolvedAt = new Date();
    this.verificationEndsAt = new Date(Date.now() + 48 * 3600 * 1000);
  }
});

const Market: Model<IMarketDocument> =
  mongoose.models.Market ?? mongoose.model<IMarketDocument>('Market', MarketSchema);

export default Market;
