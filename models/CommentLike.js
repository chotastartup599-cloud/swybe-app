import mongoose from 'mongoose';

const CommentLikeSchema = new mongoose.Schema({
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
  userId: { type: String, required: true }, // Firebase UID
  createdAt: { type: Date, default: Date.now },
});

// Ek user ek comment ko sirf ek baar like kar sakta hai
CommentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });

const CommentLike = mongoose.models.CommentLike || mongoose.model('CommentLike', CommentLikeSchema);
export default CommentLike;