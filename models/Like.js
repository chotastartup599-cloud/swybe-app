import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: String, required: true }, // Firebase UID
  createdAt: { type: Date, default: Date.now },
});

// Ek user ek post ko sirf ek baar like kar sakta hai
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

const Like = mongoose.models.Like || mongoose.model('Like', LikeSchema);
export default Like;