import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProbabilityPoint {
  optionId: string;
  probability: number;
}

export interface IMarketHistoryDocument extends Document {
  marketId: mongoose.Types.ObjectId;
  probabilities: IProbabilityPoint[];
  recordedAt: Date;
}

const ProbabilityPointSchema = new Schema<IProbabilityPoint>(
  {
    optionId:    { type: String, required: true },
    probability: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const MarketHistorySchema = new Schema<IMarketHistoryDocument>(
  {
    marketId:      { type: Schema.Types.ObjectId, ref: 'Market', required: true },
    probabilities: { type: [ProbabilityPointSchema], required: true },
    recordedAt:    { type: Date, required: true, default: Date.now },
  },
  { timestamps: false }
);

// Index principal : requêtes par marché + tri temporel
MarketHistorySchema.index({ marketId: 1, recordedAt: 1 });

const MarketHistory: Model<IMarketHistoryDocument> =
  mongoose.models.MarketHistory ??
  mongoose.model<IMarketHistoryDocument>('MarketHistory', MarketHistorySchema);

export default MarketHistory;
