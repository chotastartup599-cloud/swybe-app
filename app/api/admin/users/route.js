import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { adminAuth } from '@/lib/firebaseAdmin';
import { requireAdmin, authErrorResponse, serverError, cleanText } from '@/lib/apiAuth';
import { isObjectId, escapeRegex } from '@/lib/helpers';
import { deleteUserData } from '@/lib/cleanup';

const VALID_ROLES = ['learner', 'master', 'admin'];
const MAX_LIMIT = 50;

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = cleanText(searchParams.get('q') || '', 60);
    const role = searchParams.get('role');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), MAX_LIMIT);
    const skip = Math.min(Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0), 100000);

    const filter = {};
    if (VALID_ROLES.includes(role)) filter.role = role;
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' };
      filter.$or = [{ name: rx }, { email: rx }];
    }

    // Sirf zaroori fields (notifications, followers lists wagairah nahi)
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firebaseUid name email photoURL role masterStatus masterDetails isProfileComplete xp streak lastActive createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data: users, total }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminUsersGet');
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { userId, role } = await req.json().catch(() => ({}));

    if (typeof userId !== 'string' || !userId || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: 'Missing or invalid fields' }, { status: 400 });
    }

    // Admin apna role galti se na badal le
    if (userId === auth.uid) {
      return NextResponse.json({ success: false, error: 'Apna role yahan se nahi badal sakte.' }, { status: 400 });
    }

    const current = await User.findOne({ firebaseUid: userId }).select('role').lean();
    if (!current) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const $set = { role };
    // Admin khud kisi ko Master banaye to wo seedha approved hota hai (application ka intezaar nahi)
    if (role === 'master' && current.role !== 'master') $set.masterStatus = 'approved';

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: userId },
      { $set },
      { new: true, runValidators: true }
    )
      .select('firebaseUid name email photoURL role masterStatus masterDetails isProfileComplete xp streak lastActive createdAt')
      .lean();

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminUsersUpdate');
  }
}

export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Valid ID required' }, { status: 400 });
    }

    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Admin apna account delete na kar de
    const sameEmail = user.email && auth.email && user.email.toLowerCase() === auth.email.toLowerCase();
    if (user.firebaseUid === auth.uid || sameEmail) {
      return NextResponse.json({ success: false, error: 'Admin account delete nahi ho sakta.' }, { status: 400 });
    }

    // Pehle Firebase account delete (warna user dobara login karke naya account bana leta tha)
    try {
      await adminAuth.deleteUser(user.firebaseUid);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
    }

    await deleteUserData(user);
    await User.deleteOne({ _id: id });

    return NextResponse.json({ success: true, message: 'User deleted' }, { status: 200 });
  } catch (error) {
    return serverError(error, 'AdminUsersDelete');
  }
}