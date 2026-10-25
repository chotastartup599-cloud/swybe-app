import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  photoURL: { type: String },
  role: { type: String, enum: ['learner', 'master', 'admin'], default: 'learner' },
  isProfileComplete: { type: Boolean, default: false },
  profileType: { type: String, enum: ['school', 'competitive', 'none'], default: 'none' },
  
  bio: { type: String, default: "Hey there! I am using Swybe." },
  socialLinks: {
    instagram: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    email: { type: String, default: "" },
  },

  followers: [{ type: String }],
  following: [{ type: String }],
  profileViews: { type: Number, default: 0 },

  learnerDetails: {
    schoolClass: String,
    medium: String,
    stream: [String],
    competitiveExams: [String],
    subjects: [String],
    strongSubjects: [String],
    weakSubjects: [String],
    targets: [String],
    hobbies: [String],
  },

  masterDetails: {
    instagramHandle: String,
    bio: String,
    subject: String,
    experience: String,
  },
  
  masterStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  
  streak: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  badges: [{ type: String }], 
  
  // Har subject ka watch time (seconds me)
  subjectWatchTime: { type: Object, default: {} }, 
  
  notifications: [{
    message: String,
    type: String, 
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Indexes: purani posts email se match hoti hain, leaderboard xp se sort hota hai
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, xp: -1 });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;