import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import { getAuthUser, serverError } from '@/lib/apiAuth';

// Posts/reels ki sahi ginti (pehle frontend sirf 10 posts dekhke ginta tha)
async function getCounts(user) {
  const creatorFilter = {
    $or: [
      { creatorUid: user.firebaseUid },
      { creatorUid: null, creatorEmail: user.email }, // purani posts
    ],
  };
  const [postCount, reelCount] = await Promise.all([
    Post.countDocuments({ ...creatorFilter, type: { $in: ['feed', 'quiz'] } }),
    Post.countDocuments({ ...creatorFilter, type: 'reel' }),
  ]);
  return { postCount, reelCount };
}

// Dusre log ko sirf ye public fields dikhte hain (email, notifications, etc. nahi)
function toPublicProfile(user, counts) {
  return {
    _id: user._id,
    firebaseUid: user.firebaseUid,
    name: user.name,
    photoURL: user.photoURL,
    role: user.role,
    masterStatus: user.masterStatus,
    bio: user.bio,
    socialLinks: {
      instagram: user.socialLinks?.instagram || '',
      whatsapp: user.socialLinks?.whatsapp || '',
    },
    followersCount: (user.followers || []).length,
    followingCount: (user.following || []).length,
    profileViews: user.profileViews || 0,
    createdAt: user.createdAt,
    ...counts,
  };
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { uid } = await params;

    const user = await User.findOne({ firebaseUid: uid }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const counts = await getCounts(user);

    // Apna account (token ka uid match) => poora data. Baaki sab => sirf public data.
    const viewer = await getAuthUser(req);
    if (viewer && viewer.uid === uid) {
      return NextResponse.json({ success: true, data: { ...user, ...counts } }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: toPublicProfile(user, counts) }, { status: 200 });
  } catch (error) {
    return serverError(error, 'GetUser');
  }
}