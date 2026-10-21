import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';

export async function GET() {
  try {
    await connectDB();
    
    // 1. Reel Insert Karo (Testing ke liye)
    const newReel = await Post.create({
      title: "Delhi Metro Update",
      caption: "Hello guys, aaj hum baat karenge Delhi Metro ki...",
      mediaUrls: ["https://res.cloudinary.com/demo/video/upload/dog.mp4"], // Array format
      type: "reel",
      creatorName: "Rohan Sah",
      creatorEmail: "sahrohan2008@gmail.com",
      likes: 120,
      comments: 15
    });

    // 2. Carousel Feed Post Insert Karo (Testing ke liye)
    const newFeedPost = await Post.create({
      title: "Physics", 
      caption: "Ye ek test post hai jisme carousel (side-by-side photos) check karna hai. Swipe karke dekho!",
      mediaUrls: [
        "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=600&auto=format&fit=crop"
      ],
      type: "feed", 
      subject: "Physics",
      classLevel: "Class 10",
      tags: ["Physics", "Space", "Science"],
      creatorName: "Rohan Sah",
      creatorEmail: "sahrohan2008@gmail.com",
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