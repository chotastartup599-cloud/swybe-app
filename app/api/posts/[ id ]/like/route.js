import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';
import Like from '@/models/Like';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { userId } = await req.json(); // Frontend se user ki UID aayegi

    if (!userId) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });

    const existingLike = await Like.findOne({ postId: id, userId });

    if (existingLike) {
      // Agar pehle se like hai, toh Unlike karo
      await Like.deleteOne({ _id: existingLike._id });
      await Post.findByIdAndUpdate(id, { $inc: { likes: -1 } });
      return NextResponse.json({ success: true, isLiked: false }, { status: 200 });
    } else {
      // Agar like nahi hai, toh Like karo
      await Like.create({ postId: id, userId });
      await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } });
      return NextResponse.json({ success: true, isLiked: true }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}