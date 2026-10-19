import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/models/Comment';
import Post from '@/models/Post';

export async function GET(req) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 2];

    const comments = await Comment.find({ postId: id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: comments }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 2];
    
    const body = await req.json();

    const newComment = await Comment.create({
      postId: id,
      parentId: body.parentId || null, // Reply ka id
      userName: body.userName,
      text: body.text
    });

    // Agar ye reply nahi hai, balki main comment hai, tabhi post ka counter badhao
    if (!body.parentId) {
      await Post.findByIdAndUpdate(id, { $inc: { comments: 1 } });
    }

    return NextResponse.json({ success: true, data: newComment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}