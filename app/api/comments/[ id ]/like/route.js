import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/models/Comment';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedComment }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}