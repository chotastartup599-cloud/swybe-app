import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import User from '@/models/User';
import Report from '@/models/Report';
import { requireAdmin, authErrorResponse, serverError, cleanText } from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';
import { deletePostsAndData, deleteCommentTree } from '@/lib/cleanup';

const STATUSES = ['open', 'resolved', 'dismissed'];
const MAX_LIMIT = 50;

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'open';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), MAX_LIMIT);
    const skip = Math.min(Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0), 100000);

    const filter = STATUSES.includes(status) ? { status } : {};

    // Open queue me sabse purani report pehle, baaki me sabse nayi pehle
    const sort = status === 'open' ? { createdAt: 1 } : { createdAt: -1 };

    const [reports, total, openCount] = await Promise.all([
      Report.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Report.countDocuments(filter),
      Report.countDocuments({ status: 'open' }),
    ]);

    // Kya reported cheez abhi bhi maujood hai?
    const postIds = reports.filter((r) => r.targetType === 'post' && isObjectId(r.targetId)).map((r) => r.targetId);
    const commentIds = reports.filter((r) => r.targetType === 'comment' && isObjectId(r.targetId)).map((r) => r.targetId);
    const userIds = reports.filter((r) => r.targetType === 'user').map((r) => r.targetId);

    const [posts, comments, users] = await Promise.all([
      postIds.length ? Post.find({ _id: { $in: postIds } }).select('_id').lean() : [],
      commentIds.length ? Comment.find({ _id: { $in: commentIds } }).select('_id').lean() : [],
      userIds.length ? User.find({ firebaseUid: { $in: userIds } }).select('firebaseUid').lean() : [],
    ]);

    const existing = new Set([
      ...posts.map((p) => `post:${p._id}`),
      ...comments.map((c) => `comment:${c._id}`),
      ...users.map((u) => `user:${u.firebaseUid}`),
    ]);

    // Isi cheez par kitni open reports hain
    const targetIds = [...new Set(reports.map((r) => r.targetId))];
    const grouped = targetIds.length
      ? await Report.aggregate([
          { $match: { status: 'open', targetId: { $in: targetIds } } },
          { $group: { _id: { t: '$targetType', i: '$targetId' }, n: { $sum: 1 } } },
        ])
      : [];
    const counts = new Map(grouped.map((g) => [`${g._id.t}:${g._id.i}`, g.n]));

    const data = reports.map((r) => ({
      ...r,
      targetExists: existing.has(`${r.targetType}:${r.targetId}`),
      openReportsOnTarget: counts.get(`${r.targetType}:${r.targetId}`) || 0,
    }));

    return NextResponse.json({ success: true, data, total, openCount }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminReportsGet');
  }
}

export async function PATCH(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { id, action, note } = await req.json().catch(() => ({}));

    if (!isObjectId(id) || !['dismiss', 'resolve', 'delete_content'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
    }

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report nahi mili.' }, { status: 404 });
    }

    // Sirf band karna: koi content nahi hatta
    if (action === 'dismiss' || action === 'resolve') {
      report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
      report.resolution = cleanText(note, 200) || (action === 'dismiss' ? 'Dismissed by admin' : 'Handled by admin');
      report.resolvedAt = new Date();
      await report.save();
      return NextResponse.json({ success: true, data: report }, { status: 200 });
    }

    // Content hatana
    if (report.targetType === 'user') {
      return NextResponse.json(
        { success: false, error: 'User ko hatane ke liye Users tab use karo.' },
        { status: 400 }
      );
    }
    if (!isObjectId(report.targetId)) {
      return NextResponse.json({ success: false, error: 'Invalid target.' }, { status: 400 });
    }

    const removalNote = 'Removed by admin';
    let ownerFilter = null;
    let message = '';
    let gone = false;

    if (report.targetType === 'post') {
      const post = await Post.findById(report.targetId).select('title creatorUid creatorEmail').lean();
      if (!post) {
        gone = true;
      } else {
        ownerFilter = post.creatorUid
          ? { firebaseUid: post.creatorUid }
          : post.creatorEmail
            ? { email: post.creatorEmail }
            : null;
        message = `Your post "${String(post.title).slice(0, 60)}" was removed because it did not follow our Community Guidelines.`;
        await deletePostsAndData([report.targetId], removalNote);
      }
    } else {
      const comment = await Comment.findById(report.targetId).select('userId').lean();
      if (!comment) {
        gone = true;
      } else {
        ownerFilter = comment.userId ? { firebaseUid: comment.userId } : null;
        message = 'Your comment was removed because it did not follow our Community Guidelines.';
        await deleteCommentTree(report.targetId, removalNote);
      }
    }

    if (gone) {
      report.status = 'resolved';
      report.resolution = 'Content was already removed';
      report.resolvedAt = new Date();
      await report.save();
    }

    // Content ke owner ko batao ki kyun hataya gaya
    if (ownerFilter && message) {
      await User.updateOne(ownerFilter, {
        $push: {
          notifications: {
            $each: [{ message, type: 'moderation', isRead: false, createdAt: new Date() }],
            $position: 0,
            $slice: 50,
          },
        },
      });
    }

    const fresh = await Report.findById(report._id).lean();
    return NextResponse.json({ success: true, data: fresh }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminReportsUpdate');
  }
}