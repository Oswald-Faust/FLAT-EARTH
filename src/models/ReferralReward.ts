import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReferralRewardDocument extends Document {
  referrerId: mongoose.Types.ObjectId;
  refereeId: mongoose.Types.ObjectId;
  kind: 'referrer_bonus' | 'referee_bonus';
  sourceType: 'coin_pack' | 'wallet_deposit' | 'market_creation';
  sourceSessionId: string;
  sourceAmountCents: number;
  rewardCoins: number;
  createdAt: Date;
}

const ReferralRewardSchema = new Schema<IReferralRewardDocument>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    refereeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    kind: {
      type: String,
      enum: ['referrer_bonus', 'referee_bonus'],
      required: true,
    },
    sourceType: {
      type: String,
      enum: ['coin_pack', 'wallet_deposit', 'market_creation'],
      required: true,
    },
    sourceSessionId: { type: String, required: true },
    sourceAmountCents: { type: Number, required: true },
    rewardCoins: { type: Number, required: true },
  },
  { timestamps: true }
);

ReferralRewardSchema.index({ referrerId: 1, createdAt: -1 });
ReferralRewardSchema.index({ refereeId: 1, createdAt: -1 });
ReferralRewardSchema.index({ sourceSessionId: 1, kind: 1 }, { unique: true });

const ReferralReward: Model<IReferralRewardDocument> =
  mongoose.models.ReferralReward ??
  mongoose.model<IReferralRewardDocument>('ReferralReward', ReferralRewardSchema);

export default ReferralReward;
