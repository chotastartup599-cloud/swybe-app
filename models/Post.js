import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  caption: { type: String, required: true },
  mediaUrl: { type: String, required: false }, // Optional (text posts ke liye)
  type: { type: String, enum: ['reel', 'feed', 'story'], default: 'reel' },
  creatorName: { type: String, default: 'Guest User' },
  creatorEmail: { type: String },
  
  // Personalized Feed & Search ke liye
  subject: { type: String, default: 'General' },
  tags: [{ type: String }], 
  
  // Interactions
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
export default Post;