import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';
import Like from '@/models/Like';
import User from '@/models/User';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });

    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });

    const existingLike = await Like.findOne({ postId: id, userId });

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      await Post.findByIdAndUpdate(id, { $inc: { likes: -1 } });
      return NextResponse.json({ success: true, isLiked: false }, { status: 200 });
    } else {
      // Like
      await Like.create({ postId: id, userId });
      await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } });

      // NAYA: Send Notification to post owner (if not liking own post)
      const currentUser = await User.findOne({ firebaseUid: userId });
      if (currentUser && post.creatorEmail !== currentUser.email) {
        const postOwner = await User.findOne({ email: post.creatorEmail });
        if (postOwner) {
          const newNotification = {
            message: `${currentUser.name} liked your post "${post.title}"`,
            type: "like",
            isRead: false,
            createdAt: new Date()
          };
          await User.findOneAndUpdate(
            { email: post.creatorEmail },
            { $push: { notifications: { $each: [newNotification], $position: 0 } } } // Add at top
          );
        }
      }

      return NextResponse.json({ success: true, isLiked: true }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}