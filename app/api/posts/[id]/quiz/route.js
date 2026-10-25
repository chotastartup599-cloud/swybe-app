import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';
import QuizAttempt from '@/models/QuizAttempt';
import { requireDbUser, authErrorResponse, serverError } from '@/lib/apiAuth';
import { isObjectId, istDayStartMs } from '@/lib/helpers';

const QUIZ_XP = 5;
const DAILY_QUIZ_XP_LIMIT = 10; // din me sirf 10 quizzes se XP milega

export async function POST(req, { params }) {
  const auth = await requireDbUser(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid post id' }, { status: 400 });
    }

    const { selectedIndex } = await req.json().catch(() => ({}));

    const post = await Post.findById(id).select('type quizData creatorUid creatorEmail').lean();
    if (!post || post.type !== 'quiz' || !post.quizData) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    const optionCount = post.quizData.options?.length || 0;
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= optionCount) {
      return NextResponse.json({ success: false, error: 'Invalid option' }, { status: 400 });
    }

    const userId = auth.uid;
    const correctOptionIndex = post.quizData.correctOptionIndex;
    const isCorrect = selectedIndex === correctOptionIndex;

    const alreadyAnswered = (attempt) =>
      NextResponse.json(
        {
          success: true,
          alreadyAnswered: true,
          selectedIndex: attempt.selectedIndex,
          isCorrect: attempt.isCorrect,
          correctOptionIndex,
          xpAwarded: 0,
        },
        { status: 200 }
      );

    // Ek quiz sirf ek baar
    const existing = await QuizAttempt.findOne({ postId: id, userId }).lean();
    if (existing) return alreadyAnswered(existing);

    // XP sirf: sahi jawab + real account + apna quiz nahi + daily limit baaki
    let xpAwarded = 0;
    if (isCorrect && !auth.isAnonymous) {
      const isOwn =
        (post.creatorUid && post.creatorUid === userId) ||
        (post.creatorEmail && post.creatorEmail === auth.user.email);

      if (!isOwn) {
        const todayCount = await QuizAttempt.countDocuments({
          userId,
          xpAwarded: { $gt: 0 },
          createdAt: { $gte: new Date(istDayStartMs()) },
        });
        if (todayCount < DAILY_QUIZ_XP_LIMIT) xpAwarded = QUIZ_XP;
      }
    }

    try {
      await QuizAttempt.create({ postId: id, userId, selectedIndex, isCorrect, xpAwarded });
    } catch (error) {
      // Do requests ek saath aayi to dusri yahan rukegi, XP dobara nahi milega
      if (error.code === 11000) {
        const again = await QuizAttempt.findOne({ postId: id, userId }).lean();
        if (again) return alreadyAnswered(again);
      }
      throw error;
    }

    if (xpAwarded > 0) {
      await User.updateOne({ firebaseUid: userId }, { $inc: { xp: xpAwarded } });
    }

    return NextResponse.json(
      {
        success: true,
        alreadyAnswered: false,
        selectedIndex,
        isCorrect,
        correctOptionIndex, // jawab dene ke baad hi bataya jata hai
        xpAwarded,
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError(error, 'Quiz');
  }
}