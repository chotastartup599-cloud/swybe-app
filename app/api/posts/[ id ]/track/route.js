import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { firebaseUid, timeSpent } = await req.json(); // timeSpent in seconds

    if (!firebaseUid || !timeSpent) return NextResponse.json({ success: false, error: "Missing data" }, { status: 400 });

    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    
    const subject = post.subject || "General";
    
    await Post.findByIdAndUpdate(id, { $inc: { views: 1 } });

    const xpEarned = Math.floor(timeSpent / 10);
    
    // NAYA: Update Query for Watch Time & XP
    const updateQuery = {
      $inc: {
        [`subjectWatchTime.${subject}`]: timeSpent
      }
    };

    if (xpEarned > 0) {
      updateQuery.$inc.xp = xpEarned;
    }

    await User.findOneAndUpdate({ firebaseUid }, updateQuery);

    return NextResponse.json({ success: true, xpEarned }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}