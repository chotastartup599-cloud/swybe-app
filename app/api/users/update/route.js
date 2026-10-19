import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { firebaseUid, role, profileType, learnerDetails, masterDetails } = body;

    if (!firebaseUid || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const updateData = {
      role,
      isProfileComplete: true,
      ...(profileType && { profileType }),
      ...(role === 'learner' && learnerDetails && { learnerDetails }),
      ...(role === 'master' && masterDetails && { masterDetails, masterStatus: 'pending' }),
    };

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      updateData,
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}