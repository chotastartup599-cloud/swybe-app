import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth, authErrorResponse, serverError } from '@/lib/apiAuth';

export async function POST(req) {
  // Follow ke liye real account chahiye (guest nahi)
  const auth = await requireAuth(req, { allowAnonymous: false });
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { targetUserId, targetUserEmail, action } = await req.json().catch(() => ({}));

    if (action !== 'follow' && action !== 'unfollow') {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    // Current user token se, body ka currentUserId ignore
    const currentUserId = auth.uid;

    let targetUser = null;
    if (typeof targetUserId === 'string' && targetUserId) {
      targetUser = await User.findOne({ firebaseUid: targetUserId });
    } else if (typeof targetUserEmail === 'string' && targetUserEmail) {
      targetUser = await User.findOne({ email: targetUserEmail });
    }

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const targetUid = targetUser.firebaseUid;

    if (targetUid === currentUserId) {
      return NextResponse.json({ success: false, error: "Khud ko follow nahi kar sakte." }, { status: 400 });
    }

    const currentUser = await User.findOne({ firebaseUid: currentUserId }).select('name');
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (action === 'follow') {
      const result = await User.updateOne(
        { firebaseUid: targetUid },
        { $addToSet: { followers: currentUserId } }
      );
      await User.updateOne(
        { firebaseUid: currentUserId },
        { $addToSet: { following: targetUid } }
      );

      // Notification sirf tab jab sach me nayi follow hui (follow/unfollow spam nahi chalega)
      if (result.modifiedCount === 1) {
        const newNotification = {
          message: `${currentUser.name} started following you`,
          type: "follow",
          isRead: false,
          createdAt: new Date(),
        };
        await User.updateOne(
          { firebaseUid: targetUid },
          { $push: { notifications: { $each: [newNotification], $position: 0, $slice: 50 } } }
        );
      }
    } else {
      await User.updateOne({ firebaseUid: targetUid }, { $pull: { followers: currentUserId } });
      await User.updateOne({ firebaseUid: currentUserId }, { $pull: { following: targetUid } });
    }

    return NextResponse.json({ success: true, message: "Success" }, { status: 200 });
  } catch (error) {
    return serverError(error, "Follow");
  }
}