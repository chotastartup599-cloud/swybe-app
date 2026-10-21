import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const { firebaseUid } = await req.json();

    if (!firebaseUid) return NextResponse.json({ success: false, error: "UID required" }, { status: 400 });

    // Saare notifications ko read mark kar do
    await User.updateOne(
      { firebaseUid },
      { $set: { "notifications.$[].isRead": true } }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}