import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Post from '@/models/Post';

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const creatorEmail = searchParams.get('creatorEmail');
    const interests = searchParams.get('interests')?.split(',') || []; // User ke interests
    
    let query = {};
    if (type) query.type = type;
    if (creatorEmail) query.creatorEmail = creatorEmail;
    
    let posts = await Post.find(query).sort({ createdAt: -1 });

    // Agar interests hain, toh unko match karke upar laao (Personalization Logic)
    if (interests.length > 0) {
      posts = posts.sort((a, b) => {
        const aMatch = interests.includes(a.subject) || a.tags.some(t => interests.includes(t));
        const bMatch = interests.includes(b.subject) || b.tags.some(t => interests.includes(t));
        return bMatch - aMatch; // Matching posts pehle aayengi
      });
    }

    return NextResponse.json({ success: true, data: posts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const newPost = await Post.create(body);
    return NextResponse.json({ success: true, data: newPost }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}