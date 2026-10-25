import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth, authErrorResponse, serverError } from '@/lib/apiAuth';

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000; // India time (UTC+5:30) ke hisaab se din badalta hai
const DAILY_LOGIN_XP = 5;

const dayIndex = (ms) => Math.floor((ms + IST_OFFSET_MS) / DAY_MS);
const startOfDayMs = (idx) => idx * DAY_MS - IST_OFFSET_MS;

export async function POST(req) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();

    const user = await User.findOne({ firebaseUid: auth.uid });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const nowMs = Date.now();
    const todayIdx = dayIndex(nowMs);
    const lastMs = user.lastActive ? new Date(user.lastActive).getTime() : 0;
    const diffDays = todayIdx - dayIndex(lastMs);
    const currentStreak = user.streak || 0;
    const isFirstEver = currentStreak <= 0;

    // Aaj ka XP/streak ho chuka hai to kuch mat badlo (page reload se XP nahi milega)
    if (diffDays <= 0 && !isFirstEver) {
      return NextResponse.json({ success: true, data: user }, { status: 200 });
    }

    const newStreak = diffDays === 1 ? currentStreak + 1 : 1;

    const badgesToAdd = [];
    if (newStreak >= 3) badgesToAdd.push("Streak Starter");
    if (newStreak >= 7) badgesToAdd.push("Week Warrior");
    if (user.isProfileComplete) badgesToAdd.push("First Step");

    // Atomic filter: do tabs ek saath aaye to bhi XP sirf ek baar jayega
    const filter = {
      _id: user._id,
      $or: [
        { lastActive: { $lt: new Date(startOfDayMs(todayIdx)) } },
        { lastActive: { $exists: false } },
        { streak: { $lte: 0 } },
        { streak: { $exists: false } },
      ],
    };

    const update = {
      $set: { streak: newStreak, lastActive: new Date(nowMs) },
      $inc: { xp: DAILY_LOGIN_XP },
    };
    if (badgesToAdd.length > 0) {
      update.$addToSet = { badges: { $each: badgesToAdd } };
    }

    const updated = await User.findOneAndUpdate(filter, update, { new: true });
    const result = updated || (await User.findById(user._id));

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return serverError(error, "Activity");
  }
}