import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { firebaseUid, name, email, photoURL } = body;

    if (!firebaseUid) {
      return NextResponse.json({ success: false, error: "Firebase UID is required" }, { status: 400 });
    }

    // 1. Pehle firebaseUid se dhoondho
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      // 2. Agar UID se nahi mila, toh email se dhoondho (Account Linking)
      if (email) {
        user = await User.findOne({ email });
      }

      if (user) {
        // Purana account mil gaya, UID update kar do
        user.firebaseUid = firebaseUid;
        if (photoURL) user.photoURL = photoURL;
        await user.save();
      } else {
        // 3. Naya account banao (safe fallbacks ke saath)
        user = await User.create({
          firebaseUid,
          name: name || "Student",
          email: email || `user_${firebaseUid}@swybe.com`, // Fallback email if missing
          photoURL: photoURL || "",
          isProfileComplete: false,
        });
      }
    } else {
      // Agar user UID se mil gaya, toh bas photo update karo
      if (photoURL && user.photoURL !== photoURL) {
        user.photoURL = photoURL;
        await user.save();
      }
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    console.error("Sync Error Details:", error);
    // Mongoose validation errors ko print karo
    if (error.name === 'ValidationError') {
      const messages = Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`);
      console.error("Validation Details:", messages);
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}