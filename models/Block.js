import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Physics Notes"
  type: { type: String, default: 'Notes' }, // e.g., Notes, Current Affairs, Test
  icon: { type: String, default: '📚' }, // e.g., 🎯, 📚, 🧠
  url: { type: String, required: true }, // Blogger Link
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Block = mongoose.models.Block || mongoose.model('Block', BlockSchema);
export default Block;