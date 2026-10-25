import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  caption: { type: String, default: "" },
  mediaUrls: [{ type: String }], // Multiple images/video
  
  // Type: feed, reel, story, quiz
  type: { type: String, enum: ['feed', 'reel', 'story', 'quiz'], default: 'feed' },
  
  // NAYA: creator ka Firebase UID (email se zyada safe pehchaan)
  creatorUid: { type: String },
  creatorName: { type: String, default: 'Guest User' },
  creatorEmail: { type: String },
  instagramHandle: { type: String, default: "" }, // Creator's Insta handle
  
  // Text Post Support (Instagram Style)
  isTextPost: { type: Boolean, default: false },
  backgroundColor: { type: String, default: "" }, // Gradient CSS class
  
  // Feed Filtering
  subject: { type: String, default: 'General' },
  classLevel: { type: String, default: 'General' },
  tags: [{ type: String }], 
  
  // Story Expiry (24 hours, 7 days, etc.)
  expiresAt: { type: Date },
  
  // Quiz Data
  quizData: {
    question: String,
    options: [String],
    correctOptionIndex: Number
  },

  // Stats
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Indexes: feed/reels/profile/search fast rahenge
PostSchema.index({ type: 1, createdAt: -1 });
PostSchema.index({ creatorUid: 1, createdAt: -1 });
PostSchema.index({ creatorEmail: 1, createdAt: -1 });
PostSchema.index({ subject: 1, createdAt: -1 });

// Expired stories ko 7 din baad DB se apne aap delete kar do (sirf type = story par)
PostSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60, partialFilterExpression: { type: 'story' } }
);

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
export default Post;