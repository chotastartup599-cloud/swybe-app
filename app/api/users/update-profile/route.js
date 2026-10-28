import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth, authErrorResponse, serverError, cleanText } from '@/lib/apiAuth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { deleteCloudinaryMedia } from '@/lib/cloudinaryAdmin';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'okuevkuf';
const MEDIA_PREFIX = `https://res.cloudinary.com/${CLOUD_NAME}/`;

export async function POST(req) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();

    const limit = await rateLimit(`profile:${auth.uid}`, 20, 3600);
    if (!limit.ok) return rateLimitResponse(limit);

    const body = await req.json().catch(() => ({}));
    const $set = {};

    if (body.name !== undefined) {
      const name = cleanText(body.name, 50);
      if (name.length < 1) {
        return NextResponse.json({ success: false, error: "Naam khali nahi ho sakta." }, { status: 400 });
      }
      $set.name = name;
    }

    if (body.bio !== undefined) {
      $set.bio = cleanText(body.bio, 200, true);
    }

    // Dotted path se sirf wahi field badlegi, baaki socialLinks safe rahenge
    if (body.instagram !== undefined) {
      $set['socialLinks.instagram'] = cleanText(body.instagram, 40).replace(/[^A-Za-z0-9._@]/g, '');
    }

    if (body.whatsapp !== undefined) {
      // wa.me link ke liye sirf digits (country code ke saath)
      $set['socialLinks.whatsapp'] = String(body.whatsapp).replace(/\D/g, '').slice(0, 15);
    }

    // Photo sirf hamare Cloudinary se
    if (
      typeof body.photoURL === 'string' &&
      body.photoURL.startsWith(MEDIA_PREFIX) &&
      body.photoURL.length <= 500
    ) {
      $set.photoURL = body.photoURL;
    }

    if (Object.keys($set).length === 0) {
      return NextResponse.json({ success: false, error: "Update karne ke liye kuch nahi mila." }, { status: 400 });
    }

    const existing = await User.findOne({ firebaseUid: auth.uid }).select('photoURL').lean();

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: auth.uid },
      { $set },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    // Nayi photo lagi to purani photo Cloudinary se hatao (best-effort)
    if (existing?.photoURL && $set.photoURL && existing.photoURL !== $set.photoURL) {
      await deleteCloudinaryMedia([existing.photoURL]);
    }

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    return serverError(error, "UpdateProfile");
  }
}