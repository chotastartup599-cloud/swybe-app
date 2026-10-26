import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';
import { requireAdmin, authErrorResponse, serverError, cleanText } from '@/lib/apiAuth';
import { isObjectId, escapeRegex } from '@/lib/helpers';
import { deletePostsAndData } from '@/lib/cleanup';

const POST_TYPES = ['feed', 'reel', 'story', 'quiz'];
const MAX_LIMIT = 50;

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const q = cleanText(searchParams.get('q') || '', 60);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), MAX_LIMIT);
    const skip = Math.min(Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0), 100000);

    const filter = {};
    if (POST_TYPES.includes(type)) filter.type = type;
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' };
      filter.$or = [{ title: rx }, { creatorName: rx }, { creatorEmail: rx }];
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .select('title type creatorName creatorEmail creatorUid likes views comments createdAt expiresAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data: posts, total }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminPostsGet');
  }
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

    const exists = await Post.exists({ _id: id });
    if (!exists) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    // Post ke saath uske comments, likes, saves, quiz attempts bhi saaf
    await deletePostsAndData([id]);

    return NextResponse.json({ success: true, message: 'Post deleted' }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminPostsDelete');
  }
}