import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const resolvedParams = await params; // <-- Await karo
    const { uid } = resolvedParams;
    
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}