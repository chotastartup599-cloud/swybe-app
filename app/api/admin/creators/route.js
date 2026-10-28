import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAdmin, authErrorResponse, serverError } from '@/lib/apiAuth';

const STATUSES = ['approved', 'rejected'];

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    // Sabse purani application sabse upar (jisne pehle apply kiya, uska pehle review)
    const pendingCreators = await User.find({ role: 'master', masterStatus: 'pending' })
      .select('firebaseUid name email photoURL masterDetails createdAt')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, data: pendingCreators }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminCreatorsGet');
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { firebaseUid, status } = await req.json().catch(() => ({}));

    if (typeof firebaseUid !== 'string' || !firebaseUid || !STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'Missing or invalid fields' }, { status: 400 });
    }

    const user = await User.findOne({ firebaseUid, role: 'master' }).select('masterStatus').lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Master application nahi mili.' }, { status: 404 });
    }

    const update = { $set: { masterStatus: status } };

    // Status sach me badla to user ko notification (dobara click par duplicate nahi)
    if (user.masterStatus !== status) {
      const message =
        status === 'approved'
          ? 'Congratulations! Your educator application is approved. You can now upload posts, reels and quizzes.'
          : 'Your educator application was not approved. You can update your details and apply again.';

      update.$push = {
        notifications: {
          $each: [{ message, type: 'application', isRead: false, createdAt: new Date() }],
          $position: 0,
          $slice: 50,
        },
      };
    }

    const updatedUser = await User.findOneAndUpdate({ firebaseUid, role: 'master' }, update, {
      returnDocument: 'after',
      runValidators: true,
    })
      .select('firebaseUid name email masterStatus')
      .lean();

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminCreatorsUpdate');
  }
}