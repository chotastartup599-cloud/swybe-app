import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getAuthUser, serverError } from '@/lib/apiAuth';

// Dusre log ko sirf ye public fields dikhte hain
function toPublicProfile(user) {
  return {
    _id: user._id,
    firebaseUid: user.firebaseUid,
    name: user.name,
    photoURL: user.photoURL,
    // TEMP: profile/[uid] page abhi posts email se dhoondhta hai.
    // Batch 2 (creatorUid) ke baad ye hata denge.
    email: user.email,
    role: user.role,
    masterStatus: user.masterStatus,
    bio: user.bio,
    socialLinks: {
      instagram: user.socialLinks?.instagram || "",
      whatsapp: user.socialLinks?.whatsapp || "",
    },
    followers: user.followers || [],
    following: user.following || [],
    profileViews: user.profileViews || 0,
    createdAt: user.createdAt,
  };
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { uid } = await params;

    const user = await User.findOne({ firebaseUid: uid }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Apna account (token ka uid match) => poora data. Baaki sab => sirf public data.
    const viewer = await getAuthUser(req);
    if (viewer && viewer.uid === uid) {
      return NextResponse.json({ success: true, data: user }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: toPublicProfile(user) }, { status: 200 });
  } catch (error) {
    return serverError(error, "GetUser");
  }
}