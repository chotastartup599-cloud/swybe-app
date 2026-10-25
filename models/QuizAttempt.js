import mongoose from 'mongoose';

const QuizAttemptSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: String, required: true }, // Firebase UID
  selectedIndex: { type: Number, required: true },
  isCorrect: { type: Boolean, default: false },
  xpAwarded: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Ek user ek quiz sirf ek baar attempt kar sakta hai
QuizAttemptSchema.index({ postId: 1, userId: 1 }, { unique: true });
QuizAttemptSchema.index({ userId: 1, createdAt: -1 });

const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', QuizAttemptSchema);
export default QuizAttempt;