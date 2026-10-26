import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { requireAdmin, authErrorResponse, serverError } from '@/lib/apiAuth';
import { istDayStartMs } from '@/lib/helpers';

const DAY_MS = 24 * 60 * 60 * 1000;
const GUEST_EMAIL = /^guest_.*@swybe\.com$/;

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();

    const now = Date.now();
    const weekAgo = new Date(now - 7 * DAY_MS);
    const todayStart = new Date(istDayStartMs());

    const [
      users, learners, approvedMasters, pendingMasters, guests,
      activeToday, active7d, newUsers7d,
      posts, reels, liveStories, comments,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'learner' }),
      User.countDocuments({ role: 'master', masterStatus: 'approved' }),
      User.countDocuments({ role: 'master', masterStatus: 'pending' }),
      User.countDocuments({ email: GUEST_EMAIL }),
      User.countDocuments({ lastActive: { $gte: todayStart } }),
      User.countDocuments({ lastActive: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      Post.countDocuments({ type: { $in: ['feed', 'quiz'] } }),
      Post.countDocuments({ type: 'reel' }),
      Post.countDocuments({ type: 'story', $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }] }),
      Comment.countDocuments({}),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          users, learners, approvedMasters, pendingMasters, guests,
          activeToday, active7d, newUsers7d,
          posts, reels, liveStories, comments,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError(error, 'AdminStats');
  }
}