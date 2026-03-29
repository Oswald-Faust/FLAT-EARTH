import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBetDocument extends Document {
  userId: mongoose.Types.ObjectId;
  marketId: mongoose.Types.ObjectId;
  optionId: string;
  amount: number;
  odds: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  createdAt: Date;
}

const BetSchema = new Schema<IBetDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    marketId: { type: Schema.Types.ObjectId, ref: 'Market', required: true },
    optionId: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    odds: { type: Number, required: true },
    potentialWin: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'won', 'lost', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

BetSchema.index({ userId: 1, status: 1 });
BetSchema.index({ marketId: 1 });

const Bet: Model<IBetDocument> =
  mongoose.models.Bet ?? mongoose.model<IBetDocument>('Bet', BetSchema);

export default Bet;
