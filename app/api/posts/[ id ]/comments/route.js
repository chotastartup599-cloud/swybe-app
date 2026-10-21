import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import User from '@/models/User';

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
      parentId: body.parentId || null,
      userName: body.userName,
      text: body.text
    });

    if (!body.parentId) {
      await Post.findByIdAndUpdate(id, { $inc: { comments: 1 } });

      // NAYA: Send Notification
      const post = await Post.findById(id);
      const currentUser = await User.findOne({ name: body.userName }); // Ideally pass UID from frontend
      
      if (post && currentUser && post.creatorEmail !== currentUser.email) {
        const newNotification = {
          message: `${body.userName} commented: "${body.text.substring(0, 30)}..." on your post`,
          type: "comment",
          isRead: false,
          createdAt: new Date()
        };
        await User.findOneAndUpdate(
          { email: post.creatorEmail },
          { $push: { notifications: { $each: [newNotification], $position: 0 } } }
        );
      }
    }

    return NextResponse.json({ success: true, data: newComment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}