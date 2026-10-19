import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { firebaseUid, name, email, photoURL } = body;

    if (!firebaseUid || !email) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check karo user pehle se database me hai ya nahi
    let user = await User.findOne({ firebaseUid });

    // 2. Agar nahi hai, toh naya user banao (Onboarding pending)
    if (!user) {
      user = await User.create({
        firebaseUid,
        name,
        email,
        photoURL,
        isProfileComplete: false, // Ye false hai matlab abhi form bharna baaki hai
      });
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}