import { NextResponse } from 'next/server';
import Post from '@/models/Post';
import Like from '@/models/Like';
import User from '@/models/User';
import { requireDbUser, authErrorResponse, serverError } from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req, { params }) {
  const auth = await requireDbUser(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    const limit = await rateLimit(`like:${auth.uid}`, 60, 60);
    if (!limit.ok) return rateLimitResponse(limit);

    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid post id' }, { status: 400 });
    }

    const post = await Post.findById(id).select('title creatorUid creatorEmail').lean();
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });

    const userId = auth.uid; // body ka userId ignore

    // Pehle unlike try karo: sach me delete hua tabhi count ghatega (count kabhi negative nahi hoga)
    const removed = await Like.deleteOne({ postId: id, userId });
    if (removed.deletedCount === 1) {
      await Post.updateOne({ _id: id, likes: { $gt: 0 } }, { $inc: { likes: -1 } });
      const fresh = await Post.findById(id).select('likes').lean();
      return NextResponse.json({ success: true, isLiked: false, likes: fresh?.likes ?? 0 }, { status: 200 });
    }

    try {
      await Like.create({ postId: id, userId });
    } catch (error) {
      // Do requests ek saath aayi: like pehle se ban chuka hai
      if (error.code === 11000) {
        const fresh = await Post.findById(id).select('likes').lean();
        return NextResponse.json({ success: true, isLiked: true, likes: fresh?.likes ?? 0 }, { status: 200 });
      }
      throw error;
    }

    await Post.updateOne({ _id: id }, { $inc: { likes: 1 } });

    // Notification: apni post par nahi, aur same notification dobara nahi
    const isOwn =
      (post.creatorUid && post.creatorUid === userId) ||
      (post.creatorEmail && post.creatorEmail === auth.user.email);

    if (!isOwn && (post.creatorUid || post.creatorEmail)) {
      const ownerFilter = post.creatorUid ? { firebaseUid: post.creatorUid } : { email: post.creatorEmail };
      const message = `${auth.user.name} liked your post "${post.title}"`;
      await User.updateOne(
        { ...ownerFilter, notifications: { $not: { $elemMatch: { type: 'like', message } } } },
        {
          $push: {
            notifications: {
              $each: [{ message, type: 'like', isRead: false, createdAt: new Date() }],
              $position: 0,
              $slice: 50,
            },
          },
        }
      );
    }

    const fresh = await Post.findById(id).select('likes').lean();
    return NextResponse.json({ success: true, isLiked: true, likes: fresh?.likes ?? 0 }, { status: 200 });
  } catch (error) {
    return serverError(error, 'PostLike');
  }
}