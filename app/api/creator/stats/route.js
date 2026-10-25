import { NextResponse } from 'next/server';
import Post from '@/models/Post';
import { requireDbUser, authErrorResponse, serverError, isApprovedCreator } from '@/lib/apiAuth';
import { stripQuizAnswer } from '@/lib/helpers';

export async function GET(req) {
  const auth = await requireDbUser(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    if (!isApprovedCreator(auth.user)) {
      return NextResponse.json({ success: false, error: 'Sirf approved Master ke liye.' }, { status: 403 });
    }

    // Stories ko analytics me nahi ginte; purani posts (uid ke bina) email se match hoti hain
    const filter = {
      type: { $ne: 'story' },
      $or: [
        { creatorUid: auth.uid },
        { creatorUid: null, creatorEmail: auth.user.email },
      ],
    };

    // Pehle sirf latest 10 posts ka total dikhta tha. Ab saari posts ka sahi total.
    const [totals] = await Post.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          posts: { $sum: 1 },
          likes: { $sum: '$likes' },
          views: { $sum: '$views' },
          comments: { $sum: '$comments' },
        },
      },
    ]);

    const recent = await Post.find(filter).sort({ createdAt: -1 }).limit(8).lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          totals: {
            posts: totals?.posts || 0,
            likes: totals?.likes || 0,
            views: totals?.views || 0,
            comments: totals?.comments || 0,
          },
          recent: recent.map(stripQuizAnswer),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError(error, 'CreatorStats');
  }
}