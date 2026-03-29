import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProcessedCheckoutDocument extends Document {
  sessionId: string;
  type: 'coin_pack' | 'wallet_deposit' | 'market_creation';
  userId?: mongoose.Types.ObjectId;
  amountTotal?: number;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProcessedCheckoutSchema = new Schema<IProcessedCheckoutDocument>(
  {
    sessionId: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['coin_pack', 'wallet_deposit', 'market_creation'],
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    amountTotal: { type: Number },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ProcessedCheckout: Model<IProcessedCheckoutDocument> =
  mongoose.models.ProcessedCheckout ??
  mongoose.model<IProcessedCheckoutDocument>('ProcessedCheckout', ProcessedCheckoutSchema);

export default ProcessedCheckout;
