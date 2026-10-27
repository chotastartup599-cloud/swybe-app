import mongoose from 'mongoose';

// Rate limiting ke counters. Har window khatam hone ke thodi der baad apne aap delete ho jaate hain.
const RateLimitSchema = new mongoose.Schema({
  _id: { type: String },
  count: { type: Number, default: 0 },
  expireAt: { type: Date, required: true },
});

RateLimitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit = mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);
export default RateLimit;