import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Target ID required" }, { status: 400 });
    }

    // Profile views me +1 karo
    await User.findOneAndUpdate(
      { firebaseUid: targetUserId },
      { $inc: { profileViews: 1 } }
    );

    return NextResponse.json({ success: true, message: "View recorded" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}