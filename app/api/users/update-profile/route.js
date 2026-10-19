import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const { firebaseUid, name, bio, photoURL, instagram, whatsapp } = await req.json();

    if (!firebaseUid) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const updateData = {
      name,
      bio,
      socialLinks: { instagram, whatsapp, email: "" }, // Email firebase se aayega generally, par yahan save kar sakte hain
    };

    if (photoURL) updateData.photoURL = photoURL;

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      updateData,
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}