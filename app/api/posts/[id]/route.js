import { NextResponse } from 'next/server';
import Post from '@/models/Post';
import { requireDbUser, authErrorResponse, serverError } from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';
import { deletePostsAndData } from '@/lib/cleanup';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

// Apni post (reel / story / quiz bhi) khud delete karna
export async function DELETE(req, { params }) {
  const auth = await requireDbUser(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid post id' }, { status: 400 });
    }

    const limit = await rateLimit(`postdel:${auth.uid}`, 20, 3600);
    if (!limit.ok) return rateLimitResponse(limit);

    const post = await Post.findById(id).select('creatorUid creatorEmail').lean();
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post nahi mili.' }, { status: 404 });
    }

    // Owner: nayi posts creatorUid se, purani posts (jinme uid nahi) email se
    const isOwner = post.creatorUid
      ? post.creatorUid === auth.uid
      : !!post.creatorEmail && post.creatorEmail === auth.user.email;

    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Aap sirf apni post delete kar sakte ho.' }, { status: 403 });
    }

    // Post ke saath uske comments, likes, saves, quiz attempts bhi saaf
    await deletePostsAndData([id], 'Deleted by owner');

    return NextResponse.json({ success: true, message: 'Post deleted' }, { status: 200 });
  } catch (error) {
    return serverError(error, 'PostDelete');
  }
}