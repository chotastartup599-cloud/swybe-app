import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import CommentLike from '@/models/CommentLike';
import Like from '@/models/Like';
import Folder from '@/models/Folder';
import QuizAttempt from '@/models/QuizAttempt';
import PostView from '@/models/PostView';
import WatchDaily from '@/models/WatchDaily';
import { adminAuth } from '@/lib/firebaseAdmin';
import { requireAdmin, authErrorResponse, serverError } from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';

const VALID_ROLES = ['learner', 'master', 'admin'];

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    // Notifications admin ko nahi chahiye, response halka rahega
    const users = await User.find()
      .select('-notifications')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminUsersGet');
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { userId, role } = await req.json().catch(() => ({}));

    if (typeof userId !== 'string' || !userId || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: 'Missing or invalid fields' }, { status: 400 });
    }

    // Admin apna role galti se na badal le
    if (userId === auth.uid) {
      return NextResponse.json({ success: false, error: 'Apna role yahan se nahi badal sakte.' }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: userId },
      { $set: { role } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminUsersUpdate');
  }
}

// User ka saara data saaf karta hai (posts, comments, likes, folders, follows)
async function deleteUserData(user) {
  const uid = user.firebaseUid;

  // 1) Is user ki apni posts aur un par laga sab kuch
  const postFilter = { $or: [{ creatorUid: uid }, { creatorUid: null, creatorEmail: user.email }] };
  const myPosts = await Post.find(postFilter).select('_id').lean();
  const myPostIds = myPosts.map((p) => p._id);

  if (myPostIds.length > 0) {
    const commentsOnMyPosts = await Comment.find({ postId: { $in: myPostIds } }).select('_id').lean();
    const commentIds = commentsOnMyPosts.map((c) => c._id);

    await Promise.all([
      commentIds.length > 0 ? CommentLike.deleteMany({ commentId: { $in: commentIds } }) : null,
      Comment.deleteMany({ postId: { $in: myPostIds } }),
      Like.deleteMany({ postId: { $in: myPostIds } }),
      QuizAttempt.deleteMany({ postId: { $in: myPostIds } }),
      PostView.deleteMany({ postId: { $in: myPostIds } }),
      Folder.updateMany({ posts: { $in: myPostIds } }, { $pull: { posts: { $in: myPostIds } } }),
    ]);
    await Post.deleteMany({ _id: { $in: myPostIds } });
  }

  // 2) Dusron ki posts par is user ke likes: count wapas ghatao
  const myLikes = await Like.find({ userId: uid }).select('postId').lean();
  if (myLikes.length > 0) {
    await Post.bulkWrite(
      myLikes.map((l) => ({
        updateOne: { filter: { _id: l.postId, likes: { $gt: 0 } }, update: { $inc: { likes: -1 } } },
      }))
    );
    await Like.deleteMany({ userId: uid });
  }

  // 3) Is user ke comments (aur unke replies): post ka comment count dobara ginta hai
  const myComments = await Comment.find({ userId: uid }).select('_id postId').lean();
  if (myComments.length > 0) {
    const rootIds = myComments.map((c) => c._id);
    const replies = await Comment.find({ parentId: { $in: rootIds } }).select('_id').lean();
    const allIds = [...rootIds, ...replies.map((r) => r._id)];
    const affectedPostIds = [...new Set(myComments.map((c) => String(c.postId)))];

    await CommentLike.deleteMany({ commentId: { $in: allIds } });
    await Comment.deleteMany({ _id: { $in: allIds } });

    for (const postId of affectedPostIds) {
      const count = await Comment.countDocuments({ postId });
      await Post.updateOne({ _id: postId }, { $set: { comments: count } });
    }
  }

  // 4) Dusron ke comments par is user ke likes
  const myCommentLikes = await CommentLike.find({ userId: uid }).select('commentId').lean();
  if (myCommentLikes.length > 0) {
    await Comment.bulkWrite(
      myCommentLikes.map((l) => ({
        updateOne: { filter: { _id: l.commentId, likes: { $gt: 0 } }, update: { $inc: { likes: -1 } } },
      }))
    );
    await CommentLike.deleteMany({ userId: uid });
  }

  // 5) Baaki personal data
  await Promise.all([
    Folder.deleteMany({ userId: uid }),
    QuizAttempt.deleteMany({ userId: uid }),
    PostView.deleteMany({ userId: uid }),
    WatchDaily.deleteMany({ userId: uid }),
  ]);

  // 6) Followers/following lists se is user ko hatao
  await Promise.all([
    User.updateMany({ followers: uid }, { $pull: { followers: uid } }),
    User.updateMany({ following: uid }, { $pull: { following: uid } }),
  ]);
}

export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Valid ID required' }, { status: 400 });
    }

    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Admin apna account delete na kar de
    const sameEmail = user.email && auth.email && user.email.toLowerCase() === auth.email.toLowerCase();
    if (user.firebaseUid === auth.uid || sameEmail) {
      return NextResponse.json({ success: false, error: 'Admin account delete nahi ho sakta.' }, { status: 400 });
    }

    // Pehle Firebase account delete (warna user dobara login karke naya account bana leta tha)
    try {
      await adminAuth.deleteUser(user.firebaseUid);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
    }

    await deleteUserData(user);
    await User.deleteOne({ _id: id });

    return NextResponse.json({ success: true, message: 'User deleted' }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminUsersDelete');
  }
}