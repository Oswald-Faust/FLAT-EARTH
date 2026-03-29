import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  username: string;
  email: string;
  password: string;
  coins: number;
  balance: number; // solde wallet en centimes (ex: 1000 = 10.00€)
  role: 'user' | 'creator' | 'admin' | 'demo';
  avatar?: string;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  referralActivatedAt?: Date;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    coins: { type: Number, default: 100 }, // 100 coins offerts à l'inscription
    balance: { type: Number, default: 0 }, // wallet en centimes
    role: { type: String, enum: ['user', 'creator', 'admin', 'demo'], default: 'user' },
    avatar: { type: String },
    referralCode: { type: String, unique: true, uppercase: true, trim: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    referralActivatedAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ referralCode: 1 }, { unique: true });
UserSchema.index({ referredBy: 1 });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema);

export default User;
