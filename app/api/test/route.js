import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';

export async function GET() {
  try {
    await connectDB();
    
    // 1. Ek dummy Reel insert karo (Reels page test karne ke liye)
    const newReel = await Post.create({
      title: "Delhi Metro Update",
      caption: "Hello guys, aaj hum baat karenge Delhi Metro ki...",
      mediaUrl: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
      type: "reel",
      creatorName: "Rohan Sah",
      creatorEmail: "sahrohan2008@gmail.com",
      likes: 120,
      comments: 15
    });

    // 2. Ek dummy Feed Post insert karo (Home Feed test karne ke liye)
    const newFeedPost = await Post.create({
      title: "Physics", 
      caption: "Newton ka second law samajh nahi aa raha, koi doubt clear kar do?",
      type: "feed", 
      creatorName: "Aman Student",
      creatorEmail: "aman@gmail.com",
      likes: 45,
      comments: 12
    });

    return NextResponse.json({ 
      success: true, 
      message: "Test Data Inserted Successfully!", 
      reel: newReel,
      post: newFeedPost 
    }, { status: 200 });

  } catch (error) {
    console.error("Test Insert Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}