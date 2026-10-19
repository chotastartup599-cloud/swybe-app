import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    await connectDB();
    const { firebaseUid } = await req.json();

    if (!firebaseUid) {
      return NextResponse.json({ success: false, error: "UID required" }, { status: 400 });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const lastActive = user.lastActive ? new Date(user.lastActive) : new Date(now.getTime() - 86400000);
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()).getTime();
    
    const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

    let newStreak = user.streak || 0;
    let newBadges = user.badges || [];
    let newXP = (user.xp || 0) + 5; 

    if (diffDays === 1) {
      newStreak += 1;
      if (newStreak === 3 && !newBadges.includes("Streak Starter")) newBadges.push("Streak Starter");
      if (newStreak === 7 && !newBadges.includes("Week Warrior")) newBadges.push("Week Warrior");
    } else if (diffDays > 1) {
      newStreak = 1; 
    } else if (diffDays === 0 && newStreak === 0) {
      newStreak = 1;
    }

    if (user.isProfileComplete && !newBadges.includes("First Step")) {
      newBadges.push("First Step");
    }

    // FIX: user.save() ki jagah direct update karo (Validation error se bachne ke liye)
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { 
        $set: { 
          streak: newStreak, 
          xp: newXP, 
          badges: newBadges, 
          lastActive: now 
        } 
      },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Activity API Error Details:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}