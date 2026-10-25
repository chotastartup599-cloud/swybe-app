import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/models/Comment';
import CommentLike from '@/models/CommentLike';
import { requireAuth, authErrorResponse, serverError } from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid comment id' }, { status: 400 });
    }

    const comment = await Comment.findById(id).select('_id').lean();
    if (!comment) return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });

    const userId = auth.uid;
    const likesOf = async () => (await Comment.findById(id).select('likes').lean())?.likes ?? 0;

    // Toggle: pehle unlike try karo, delete hua tabhi count ghatao
    const removed = await CommentLike.deleteOne({ commentId: id, userId });
    if (removed.deletedCount === 1) {
      await Comment.updateOne({ _id: id, likes: { $gt: 0 } }, { $inc: { likes: -1 } });
      return NextResponse.json({ success: true, isLiked: false, likes: await likesOf() }, { status: 200 });
    }

    try {
      await CommentLike.create({ commentId: id, userId });
      await Comment.updateOne({ _id: id }, { $inc: { likes: 1 } });
    } catch (error) {
      if (error.code !== 11000) throw error; // already liked, count mat badhao
    }

    return NextResponse.json({ success: true, isLiked: true, likes: await likesOf() }, { status: 200 });
  } catch (error) {
    return serverError(error, 'CommentLike');
  }
}