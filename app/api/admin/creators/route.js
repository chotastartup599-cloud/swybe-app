import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAdmin } from '@/lib/apiAuth';

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectDB();
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
  const auth = await requireAdmin(req);
  if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectDB();
    const { firebaseUid, status } = await req.json();

    if (!firebaseUid || !status) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      { masterStatus: status },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}