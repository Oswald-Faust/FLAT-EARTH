import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoinTransactionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'purchase' | 'bet' | 'win' | 'creator_fee' | 'refund';
  reference?: string;
  createdAt: Date;
}

const CoinTransactionSchema = new Schema<ICoinTransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['purchase', 'bet', 'win', 'creator_fee', 'refund'],
      required: true,
    },
    reference: { type: String },
  },
  { timestamps: true }
);

CoinTransactionSchema.index({ userId: 1, createdAt: -1 });

const CoinTransaction: Model<ICoinTransactionDocument> =
  mongoose.models.CoinTransaction ??
  mongoose.model<ICoinTransactionDocument>('CoinTransaction', CoinTransactionSchema);

export default CoinTransaction;
