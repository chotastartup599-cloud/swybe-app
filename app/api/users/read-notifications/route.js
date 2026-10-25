import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth, authErrorResponse, serverError } from '@/lib/apiAuth';

export async function POST(req) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();

    await User.updateOne(
      { firebaseUid: auth.uid },
      { $set: { "notifications.$[].isRead": true } }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return serverError(error, "ReadNotifications");
  }
}