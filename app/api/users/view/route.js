import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth, authErrorResponse, serverError } from '@/lib/apiAuth';

export async function POST(req) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { targetUserId } = await req.json().catch(() => ({}));

    if (typeof targetUserId !== 'string' || !targetUserId) {
      return NextResponse.json({ success: false, error: "Target ID required" }, { status: 400 });
    }

    // Apni profile ke views nahi badhne chahiye
    if (targetUserId === auth.uid) {
      return NextResponse.json({ success: true, message: "Own profile" }, { status: 200 });
    }

    await User.updateOne({ firebaseUid: targetUserId }, { $inc: { profileViews: 1 } });

    return NextResponse.json({ success: true, message: "View recorded" }, { status: 200 });
  } catch (error) {
    return serverError(error, "ProfileView");
  }
}