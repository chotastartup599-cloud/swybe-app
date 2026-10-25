import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import PostView from '@/models/PostView';
import WatchDaily from '@/models/WatchDaily';
import { requireAuth, authErrorResponse, serverError, cleanText } from '@/lib/apiAuth';
import { isObjectId, istDayIndex } from '@/lib/helpers';

const MAX_SECONDS_PER_CALL = 120;          // ek request me max 2 minute
const DAILY_WATCH_SECONDS_CAP = 6 * 3600;  // din me max 6 ghante ginenge
const DAILY_WATCH_XP_CAP = 100;            // watching se din me max 100 XP
const SECONDS_PER_XP = 10;

export async function POST(req, { params }) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid post id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    let timeSpent = Math.floor(Number(body.timeSpent));
    if (!Number.isFinite(timeSpent) || timeSpent < 1) {
      return NextResponse.json({ success: false, error: 'Invalid timeSpent' }, { status: 400 });
    }
    timeSpent = Math.min(timeSpent, MAX_SECONDS_PER_CALL);

    const post = await Post.findById(id).select('subject creatorUid creatorEmail').lean();
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });

    const userId = auth.uid;

    // 1) Unique view: ek user ka ek post par sirf ek view, apni post ka nahi
    const isOwn =
      (post.creatorUid && post.creatorUid === userId) ||
      (post.creatorEmail && auth.email && post.creatorEmail === auth.email);

    if (!isOwn) {
      try {
        const result = await PostView.updateOne(
          { postId: id, userId },
          { $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        );
        if (result.upsertedCount === 1) {
          await Post.updateOne({ _id: id }, { $inc: { views: 1 } });
        }
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }

    // 2) Daily watch limit (atomic counter)
    const day = istDayIndex();
    let daily;
    try {
      daily = await WatchDaily.findOneAndUpdate(
        { userId, day },
        { $inc: { seconds: timeSpent } },
        { upsert: true, new: true }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      daily = await WatchDaily.findOneAndUpdate({ userId, day }, { $inc: { seconds: timeSpent } }, { new: true });
    }

    const previous = daily.seconds - timeSpent;
    const credited = Math.max(0, Math.min(timeSpent, DAILY_WATCH_SECONDS_CAP - previous));

    let xpEarned = 0;
    if (credited > 0) {
      // Guest ko XP nahi, par uska watch time ginte hain
      if (!auth.isAnonymous) {
        const xpBefore = Math.min(Math.floor(previous / SECONDS_PER_XP), DAILY_WATCH_XP_CAP);
        const xpAfter = Math.min(Math.floor((previous + credited) / SECONDS_PER_XP), DAILY_WATCH_XP_CAP);
        xpEarned = xpAfter - xpBefore;
      }

      const subject = cleanText(post.subject, 40).replace(/[.$]/g, '') || 'General';
      const inc = { [`subjectWatchTime.${subject}`]: credited };
      if (xpEarned > 0) inc.xp = xpEarned;

      await User.updateOne({ firebaseUid: userId }, { $inc: inc });
    }

    return NextResponse.json({ success: true, xpEarned }, { status: 200 });
  } catch (error) {
    return serverError(error, 'Track');
  }
}