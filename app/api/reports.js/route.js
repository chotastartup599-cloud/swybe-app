import { NextResponse } from 'next/server';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import User from '@/models/User';
import Report, { REPORT_REASONS } from '@/models/Report';
import { requireDbUser, authErrorResponse, serverError, cleanText } from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

const cut = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

export async function POST(req) {
  // Report ke liye real account chahiye (guest se spam ka risk hota hai)
  const auth = await requireDbUser(req, { allowAnonymous: false });
  if (auth.error) return authErrorResponse(auth);

  try {
    const limit = await rateLimit(`report:${auth.uid}`, 10, 3600);
    if (!limit.ok) {
      return rateLimitResponse(limit, 'Aapne bahut saari reports bheji hain. Thodi der baad try karo.');
    }

    const body = await req.json().catch(() => ({}));
    const targetType = body.targetType;
    const targetId = typeof body.targetId === 'string' ? body.targetId.trim() : '';
    const reason = body.reason;
    const details = cleanText(body.details, 300, true);

    if (!['post', 'comment', 'user'].includes(targetType) || !targetId || targetId.length > 128) {
      return NextResponse.json({ success: false, error: 'Invalid report.' }, { status: 400 });
    }
    if (!REPORT_REASONS.includes(reason)) {
      return NextResponse.json({ success: false, error: 'Report ki wajah chuno.' }, { status: 400 });
    }

    let snapshot;
    let postId = '';

    if (targetType === 'post') {
      if (!isObjectId(targetId)) {
        return NextResponse.json({ success: false, error: 'Invalid post.' }, { status: 400 });
      }
      const post = await Post.findById(targetId)
        .select('title caption type creatorUid creatorEmail creatorName')
        .lean();
      if (!post) return NextResponse.json({ success: false, error: 'Post nahi mili.' }, { status: 404 });

      const isOwn =
        (post.creatorUid && post.creatorUid === auth.uid) ||
        (post.creatorEmail && post.creatorEmail === auth.user.email);
      if (isOwn) {
        return NextResponse.json({ success: false, error: 'Apni hi post report nahi kar sakte.' }, { status: 400 });
      }

      snapshot = {
        title: cut(post.title, 100),
        text: cut(post.caption, 300),
        ownerUid: post.creatorUid || '',
        ownerName: cut(post.creatorName, 60),
        kind: post.type || 'feed',
      };
    } else if (targetType === 'comment') {
      if (!isObjectId(targetId)) {
        return NextResponse.json({ success: false, error: 'Invalid comment.' }, { status: 400 });
      }
      const comment = await Comment.findById(targetId).select('text userId userName postId').lean();
      if (!comment) return NextResponse.json({ success: false, error: 'Comment nahi mila.' }, { status: 404 });

      if (comment.userId && comment.userId === auth.uid) {
        return NextResponse.json({ success: false, error: 'Apna hi comment report nahi kar sakte.' }, { status: 400 });
      }

      postId = String(comment.postId);
      snapshot = {
        title: '',
        text: cut(comment.text, 300),
        ownerUid: comment.userId || '',
        ownerName: cut(comment.userName, 60),
        kind: 'comment',
      };
    } else {
      if (targetId === auth.uid) {
        return NextResponse.json({ success: false, error: 'Khud ko report nahi kar sakte.' }, { status: 400 });
      }
      const target = await User.findOne({ firebaseUid: targetId }).select('firebaseUid name bio').lean();
      if (!target) return NextResponse.json({ success: false, error: 'User nahi mila.' }, { status: 404 });

      snapshot = {
        title: cut(target.name, 60),
        text: cut(target.bio, 300),
        ownerUid: target.firebaseUid,
        ownerName: cut(target.name, 60),
        kind: 'user',
      };
    }

    try {
      await Report.create({
        targetType,
        targetId,
        postId,
        reporterUid: auth.uid,
        reporterName: cut(auth.user.name, 60),
        reason,
        details,
        snapshot,
      });
    } catch (error) {
      // Isi user ne isi cheez ko pehle bhi report kiya hai
      if (error.code === 11000) {
        return NextResponse.json({ success: true, already: true }, { status: 200 });
      }
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return serverError(error, 'ReportCreate');
  }
}