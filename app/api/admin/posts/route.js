import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';

export async function GET() {
  try {
    await connectDB();
    const posts = await Post.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: posts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await Post.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Post deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}