import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  marketId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId | null;
  content: string;
  likes: number;
  createdAt: Date;
}

const CommentSchema = new Schema<ICommentDocument>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    marketId: { type: Schema.Types.ObjectId, ref: 'Market', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    content:  { type: String, required: true, maxlength: 500, trim: true },
    likes:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

CommentSchema.index({ marketId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });

const Comment: Model<ICommentDocument> =
  mongoose.models.Comment ?? mongoose.model<ICommentDocument>('Comment', CommentSchema);

export default Comment;
