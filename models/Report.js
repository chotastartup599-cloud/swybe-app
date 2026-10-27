import mongoose from 'mongoose';

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate',
  'inappropriate',
  'unsafe',
  'misinformation',
  'copyright',
  'other',
];

const ReportSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['post', 'comment', 'user'], required: true },
  targetId: { type: String, required: true }, // post/comment ki _id, ya user ka firebaseUid
  postId: { type: String, default: '' },      // comment report me: wo comment kis post par hai

  reporterUid: { type: String, required: true },
  reporterName: { type: String, default: '' },

  reason: { type: String, enum: REPORT_REASONS, required: true },
  details: { type: String, default: '', maxlength: 300 },

  // Report ke waqt content kaisa tha (baad me delete ho jaye tab bhi admin dekh sakta hai)
  snapshot: {
    title: { type: String, default: '' },
    text: { type: String, default: '' },
    ownerUid: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    kind: { type: String, default: '' }, // feed / reel / story / quiz / comment / user
  },

  status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
  resolution: { type: String, default: '' },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Ek user ek cheez ko sirf ek baar report kar sakta hai
ReportSchema.index({ reporterUid: 1, targetType: 1, targetId: 1 }, { unique: true });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetType: 1, targetId: 1 });

const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export default Report;