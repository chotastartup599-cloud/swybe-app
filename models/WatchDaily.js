import mongoose from 'mongoose';

const WatchDailySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  day: { type: Number, required: true }, // India ke hisaab se din ka number
  seconds: { type: Number, default: 0 },
  // 3 din baad apne aap delete (sirf daily limit ginne ke liye chahiye)
  createdAt: { type: Date, default: Date.now, expires: 3 * 24 * 60 * 60 },
});

WatchDailySchema.index({ userId: 1, day: 1 }, { unique: true });

const WatchDaily = mongoose.models.WatchDaily || mongoose.model('WatchDaily', WatchDailySchema);
export default WatchDaily;