import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    
    // Top 10 users fetch karo (sirf learners, jinke XP zyada hain)
    const topUsers = await User.find({ role: 'learner' })
      .sort({ xp: -1 })
      .limit(10)
      .select('name photoURL xp streak badges');

    return NextResponse.json({ success: true, data: topUsers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}