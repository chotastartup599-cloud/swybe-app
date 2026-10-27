import { NextResponse } from 'next/server';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import { requireDbUser, authErrorResponse, serverError } from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';
import { deleteCommentTree } from '@/lib/cleanup';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

// Comment delete: comment likhne wala khud, ya us post ka owner
export async function DELETE(req, { params }) {
  const auth = await requireDbUser(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid comment id' }, { status: 400 });
    }

    const limit = await rateLimit(`commentdel:${auth.uid}`, 30, 3600);
    if (!limit.ok) return rateLimitResponse(limit);

    const comment = await Comment.findById(id).select('userId postId').lean();
    if (!comment) {
      return NextResponse.json({ success: false, error: 'Comment nahi mila.' }, { status: 404 });
    }

    const post = await Post.findById(comment.postId).select('creatorUid creatorEmail').lean();

    const isCommentOwner = !!comment.userId && comment.userId === auth.uid;
    const isPostOwner =
      !!post &&
      (post.creatorUid
        ? post.creatorUid === auth.uid
        : !!post.creatorEmail && post.creatorEmail === auth.user.email);

    if (!isCommentOwner && !isPostOwner) {
      return NextResponse.json({ success: false, error: 'Aap ye comment delete nahi kar sakte.' }, { status: 403 });
    }

    const result = await deleteCommentTree(id, isCommentOwner ? 'Deleted by author' : 'Deleted by post owner');

    return NextResponse.json(
      { success: true, removedIds: result.removedIds, commentsCount: result.commentsCount },
      { status: 200 }
    );
  } catch (error) {
    return serverError(error, 'CommentDelete');
  }
}