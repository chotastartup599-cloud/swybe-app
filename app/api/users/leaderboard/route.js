import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getAuthUser, serverError } from '@/lib/apiAuth';

const GUEST_EMAIL = /^guest_.*@swybe\.com$/;
const MAX_LIMIT = 50;

// Leaderboard me wahi aate hain: learner, profile complete, XP > 0, aur guest nahi
const eligibleFilter = () => ({
  role: 'learner',
  isProfileComplete: true,
  xp: { $gt: 0 },
  email: { $not: GUEST_EMAIL },
});

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), MAX_LIMIT);

    // Email, notifications wagairah kuch nahi bhejte, sirf public fields
    const topUsers = await User.find(eligibleFilter())
      .sort({ xp: -1, streak: -1, createdAt: 1 })
      .limit(limit)
      .select('firebaseUid name photoURL xp streak badges')
      .lean();

    // Logged-in user ka apna rank (agar top list me na ho to bhi dikhane ke liye)
    let me = null;
    const viewer = await getAuthUser(req);
    if (viewer) {
      const self = await User.findOne({ firebaseUid: viewer.uid })
        .select('xp role email isProfileComplete')
        .lean();

      if (self) {
        const eligible =
          self.role === 'learner' &&
          self.isProfileComplete === true &&
          (self.xp || 0) > 0 &&
          !GUEST_EMAIL.test(self.email || '');

        let rank = null;
        if (eligible) {
          const ahead = await User.countDocuments({ ...eligibleFilter(), xp: { $gt: self.xp } });
          rank = ahead + 1;
        }
        me = { firebaseUid: viewer.uid, xp: self.xp || 0, rank, eligible };
      }
    }

    return NextResponse.json({ success: true, data: topUsers, me }, { status: 200 });
  } catch (error) {
    return serverError(error, 'Leaderboard');
  }
}