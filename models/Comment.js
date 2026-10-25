import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null, // Agar null hai, matlab ye main comment hai
  },
  // NAYA: comment karne wale ka Firebase UID
  userId: {
    type: String,
  },
  userName: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
export default Comment;