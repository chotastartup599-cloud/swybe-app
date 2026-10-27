import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { adminAuth } from '@/lib/firebaseAdmin';
import { requireAuth, authErrorResponse, serverError } from '@/lib/apiAuth';
import { deleteUserData } from '@/lib/cleanup';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { isAdminEmail } from '@/lib/constants';

// Apna account khud delete karna (guest ho ya real account)
export async function DELETE(req) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();

    const limit = await rateLimit(`acctdel:${auth.uid}`, 3, 3600);
    if (!limit.ok) return rateLimitResponse(limit);

    const body = await req.json().catch(() => ({}));
    if (body.confirm !== 'DELETE') {
      return NextResponse.json({ success: false, error: 'Confirm karne ke liye DELETE likhna zaroori hai.' }, { status: 400 });
    }

    // Main admin account yahan se delete nahi hota
    if (isAdminEmail(auth.email)) {
      return NextResponse.json({ success: false, error: 'Admin account yahan se delete nahi ho sakta.' }, { status: 403 });
    }

    const user = await User.findOne({ firebaseUid: auth.uid }).lean();
    if (user && isAdminEmail(user.email)) {
      return NextResponse.json({ success: false, error: 'Admin account yahan se delete nahi ho sakta.' }, { status: 403 });
    }

    // Pehle poora data saaf. Agar ye beech me fail ho gaya to Firebase account abhi bacha rehta hai, user dobara try kar sakta hai.
    if (user) {
      await deleteUserData(user);
      await User.deleteOne({ _id: user._id });
    }

    // Phir Firebase account
    try {
      await adminAuth.deleteUser(auth.uid);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
    }

    return NextResponse.json({ success: true, message: 'Account deleted' }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AccountDelete');
  }
}