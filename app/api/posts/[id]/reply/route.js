import { NextResponse } from 'next/server';
import Post from '@/models/Post';
import User from '@/models/User';
import { requireDbUser, authErrorResponse, serverError, cleanText } from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req, { params }) {
  // Reply ke liye real account chahiye (guest nahi)
  const auth = await requireDbUser(req, { allowAnonymous: false });
  if (auth.error) return authErrorResponse(auth);

  try {
    const limit = await rateLimit(`reply:${auth.uid}`, 20, 3600);
    if (!limit.ok) return rateLimitResponse(limit, 'Aapne bahut saare replies bhej diye. Thodi der baad try karo.');

    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid story id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const text = cleanText(body.text, 200, true);
    if (!text) {
      return NextResponse.json({ success: false, error: 'Reply khali nahi ho sakta.' }, { status: 400 });
    }

    const post = await Post.findById(id).select('type creatorUid creatorEmail expiresAt').lean();
    if (!post || post.type !== 'story') {
      return NextResponse.json({ success: false, error: 'Story nahi mili.' }, { status: 404 });
    }
    if (post.expiresAt && new Date(post.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'Ye story expire ho chuki hai.' }, { status: 410 });
    }

    const isOwn =
      (post.creatorUid && post.creatorUid === auth.uid) ||
      (post.creatorEmail && post.creatorEmail === auth.user.email);
    if (isOwn) {
      return NextResponse.json({ success: false, error: 'Apni story par reply nahi kar sakte.' }, { status: 400 });
    }
    if (!post.creatorUid && !post.creatorEmail) {
      return NextResponse.json({ success: false, error: 'Story ka owner nahi mila.' }, { status: 404 });
    }

    const ownerFilter = post.creatorUid ? { firebaseUid: post.creatorUid } : { email: post.creatorEmail };
    const preview = text.length > 60 ? `${text.substring(0, 60)}...` : text;
    const message = `${auth.user.name} replied to your story: "${preview}"`;

    // Bilkul same reply dobara bhejne par notification dobara nahi banti (spam se bachav)
    await User.updateOne(
      { ...ownerFilter, notifications: { $not: { $elemMatch: { type: 'story_reply', message } } } },
      {
        $push: {
          notifications: {
            $each: [{ message, type: 'story_reply', isRead: false, createdAt: new Date() }],
            $position: 0,
            $slice: 50,
          },
        },
      }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return serverError(error, 'StoryReply');
  }
}