import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/models/Comment';
import CommentLike from '@/models/CommentLike';
import Post from '@/models/Post';
import User from '@/models/User';
import {
  getAuthUser,
  requireDbUser,
  authErrorResponse,
  serverError,
  cleanText,
} from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';

const MAX_COMMENTS_LOADED = 300;
const MAX_COMMENTS_PER_MINUTE = 10;

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid post id' }, { status: 400 });
    }

    const viewer = await getAuthUser(req);

    const comments = await Comment.find({ postId: id })
      .sort({ createdAt: -1 })
      .limit(MAX_COMMENTS_LOADED)
      .lean();

    // Is user ne kaun se comments like kiye (server se, localStorage se nahi)
    const likedSet = new Set();
    if (viewer && comments.length > 0) {
      const likes = await CommentLike.find({
        userId: viewer.uid,
        commentId: { $in: comments.map((c) => c._id) },
      })
        .select('commentId')
        .lean();
      likes.forEach((l) => likedSet.add(String(l.commentId)));
    }

    const data = comments.map((c) => ({ ...c, likedByMe: likedSet.has(String(c._id)) }));
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return serverError(error, 'CommentsGet');
  }
}

export async function POST(req, { params }) {
  // Comment ke liye real account chahiye (guest nahi)
  const auth = await requireDbUser(req, { allowAnonymous: false });
  if (auth.error) return authErrorResponse(auth);

  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid post id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const text = cleanText(body.text, 500, true);
    if (!text) {
      return NextResponse.json({ success: false, error: 'Comment khali nahi ho sakta.' }, { status: 400 });
    }

    const post = await Post.findById(id).select('creatorUid creatorEmail').lean();
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });

    // Spam rokne ke liye
    const recent = await Comment.countDocuments({
      userId: auth.uid,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    });
    if (recent >= MAX_COMMENTS_PER_MINUTE) {
      return NextResponse.json({ success: false, error: 'Bahut tez comment kar rahe ho. Thoda ruko.' }, { status: 429 });
    }

    // Reply hai to parent isi post ka hona chahiye; reply ke reply ko main comment ke neeche hi rakhte hain
    let parentId = null;
    if (body.parentId) {
      if (!isObjectId(body.parentId)) {
        return NextResponse.json({ success: false, error: 'Invalid parent comment' }, { status: 400 });
      }
      const parent = await Comment.findOne({ _id: body.parentId, postId: id }).select('parentId').lean();
      if (!parent) {
        return NextResponse.json({ success: false, error: 'Parent comment nahi mila.' }, { status: 400 });
      }
      parentId = parent.parentId || parent._id;
    }

    const user = auth.user;
    const newComment = await Comment.create({
      postId: id,
      parentId,
      userId: auth.uid,
      userName: user.name, // naam DB se, client ka bheja hua nahi
      text,
    });

    // Ab har comment (reply bhi) count hota hai, UI aur DB same rahenge
    await Post.updateOne({ _id: id }, { $inc: { comments: 1 } });

    // Post ke owner ko notification (apni post par nahi)
    const isOwn =
      (post.creatorUid && post.creatorUid === auth.uid) ||
      (post.creatorEmail && post.creatorEmail === user.email);

    if (!isOwn && (post.creatorUid || post.creatorEmail)) {
      const ownerFilter = post.creatorUid ? { firebaseUid: post.creatorUid } : { email: post.creatorEmail };
      const preview = text.length > 30 ? `${text.substring(0, 30)}...` : text;
      await User.updateOne(ownerFilter, {
        $push: {
          notifications: {
            $each: [
              {
                message: `${user.name} commented: "${preview}" on your post`,
                type: 'comment',
                isRead: false,
                createdAt: new Date(),
              },
            ],
            $position: 0,
            $slice: 50,
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: { ...newComment.toObject(), likedByMe: false } }, { status: 201 });
  } catch (error) {
    return serverError(error, 'CommentsCreate');
  }
}