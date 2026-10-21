import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    const users = await User.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { userId, role } = await req.json();
    
    if (!userId || !role) return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: userId },
      { role },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // MongoDB ID

    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "User deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}