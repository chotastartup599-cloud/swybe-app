import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    // FIX: 'creator' ki jagah 'master' kiya
    const pendingCreators = await User.find({ 
      role: 'master', 
      masterStatus: 'pending' 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: pendingCreators }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { firebaseUid, status } = await req.json();

    if (!firebaseUid || !status) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      { masterStatus: status }, // 'approved' ya 'rejected'
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}