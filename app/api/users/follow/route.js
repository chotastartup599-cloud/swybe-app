import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth, authErrorResponse, serverError } from '@/lib/apiAuth';

const MAX_FOLLOWING = 1000;

export async function POST(req) {
  // Follow ke liye real account chahiye (guest nahi)
  const auth = await requireAuth(req, { allowAnonymous: false });
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { targetUserId, action } = await req.json().catch(() => ({}));

    if (action !== 'follow' && action !== 'unfollow') {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Sirf UID se follow hota hai (email se nahi, taaki koi email check na kar sake)
    if (typeof targetUserId !== 'string' || !targetUserId) {
      return NextResponse.json({ success: false, error: 'Target user required' }, { status: 400 });
    }

    // Current user token se, body ka currentUserId ignore
    const currentUserId = auth.uid;

    if (targetUserId === currentUserId) {
      return NextResponse.json({ success: false, error: 'Khud ko follow nahi kar sakte.' }, { status: 400 });
    }

    const targetUser = await User.findOne({ firebaseUid: targetUserId }).select('firebaseUid').lean();
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const currentUser = await User.findOne({ firebaseUid: currentUserId }).select('name').lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (action === 'follow') {
      const tooMany = await User.exists({
        firebaseUid: currentUserId,
        [`following.${MAX_FOLLOWING - 1}`]: { $exists: true },
      });
      if (tooMany) {
        return NextResponse.json({ success: false, error: `Aap max ${MAX_FOLLOWING} logon ko follow kar sakte ho.` }, { status: 400 });
      }

      const result = await User.updateOne(
        { firebaseUid: targetUserId },
        { $addToSet: { followers: currentUserId } }
      );
      await User.updateOne(
        { firebaseUid: currentUserId },
        { $addToSet: { following: targetUserId } }
      );

      // Notification sirf tab jab sach me nayi follow hui (follow/unfollow spam nahi chalega)
      if (result.modifiedCount === 1) {
        const newNotification = {
          message: `${currentUser.name} started following you`,
          type: 'follow',
          isRead: false,
          createdAt: new Date(),
        };
        await User.updateOne(
          { firebaseUid: targetUserId },
          { $push: { notifications: { $each: [newNotification], $position: 0, $slice: 50 } } }
        );
      }
    } else {
      await User.updateOne({ firebaseUid: targetUserId }, { $pull: { followers: currentUserId } });
      await User.updateOne({ firebaseUid: currentUserId }, { $pull: { following: targetUserId } });
    }

    return NextResponse.json({ success: true, message: 'Success' }, { status: 200 });
  } catch (error) {
    return serverError(error, 'Follow');
  }
}