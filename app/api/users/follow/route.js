import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const { currentUserId, targetUserId, targetUserEmail, action } = await req.json();

    let targetUid = targetUserId;

    // Agar UID nahi mila, toh Email se dhoondho (Reels ke liye)
    if (!targetUid && targetUserEmail) {
      const targetUser = await User.findOne({ email: targetUserEmail });
      if (targetUser) targetUid = targetUser.firebaseUid;
    }

    if (!currentUserId || !targetUid) {
      return NextResponse.json({ success: false, error: "Missing IDs" }, { status: 400 });
    }

    if (action === 'follow') {
      await User.findOneAndUpdate({ firebaseUid: targetUid }, { $addToSet: { followers: currentUserId } });
      await User.findOneAndUpdate({ firebaseUid: currentUserId }, { $addToSet: { following: targetUid } });
    } else if (action === 'unfollow') {
      await User.findOneAndUpdate({ firebaseUid: targetUid }, { $pull: { followers: currentUserId } });
      await User.findOneAndUpdate({ firebaseUid: currentUserId }, { $pull: { following: targetUid } });
    }

    return NextResponse.json({ success: true, message: "Success" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}