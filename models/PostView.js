import mongoose from 'mongoose';

const PostViewSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: String, required: true }, // Firebase UID
  createdAt: { type: Date, default: Date.now },
});

// Ek user ka ek post par sirf ek unique view gina jayega
PostViewSchema.index({ postId: 1, userId: 1 }, { unique: true });

const PostView = mongoose.models.PostView || mongoose.model('PostView', PostViewSchema);
export default PostView;