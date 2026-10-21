import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });

    const post = await Post.findById(id);
    if (!post || !post.quizData) return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });

    // Assuming correct answer check is already done in frontend, but we can re-verify if needed.
    // For now, just award XP (+5)
    const xpToAdd = 5;

    await User.findOneAndUpdate(
      { firebaseUid: userId },
      { $inc: { xp: xpToAdd } }
    );

    return NextResponse.json({ success: true, message: "XP awarded" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}