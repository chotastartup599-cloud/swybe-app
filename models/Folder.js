import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
  userId: {
    type: String, // Firebase UID
    required: true,
  },
  name: {
    type: String, // Folder ka naam (e.g., "Physics Notes")
    required: true,
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ek user ek naam se sirf ek folder bana sakta hai
FolderSchema.index({ userId: 1, name: 1 }, { unique: true });

const Folder = mongoose.models.Folder || mongoose.model('Folder', FolderSchema);
export default Folder;