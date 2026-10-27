import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth, authErrorResponse, serverError, cleanText, cleanList } from '@/lib/apiAuth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();

    const limit = await rateLimit(`onboard:${auth.uid}`, 20, 3600);
    if (!limit.ok) return rateLimitResponse(limit);

    const body = await req.json().catch(() => ({}));
    const role = body.role;

    // 'admin' ya koi bhi aur role client se kabhi nahi aayega
    if (role !== 'learner' && role !== 'master') {
      return NextResponse.json({ success: false, error: "Invalid role." }, { status: 400 });
    }

    const user = await User.findOne({ firebaseUid: auth.uid });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (user.role === 'master' && user.masterStatus === 'approved') {
      return NextResponse.json({ success: false, error: "Approved master ka profile yahan se change nahi hoga." }, { status: 403 });
    }

    const isAdminRole = user.role === 'admin';
    const $set = { isProfileComplete: true };

    if (role === 'master') {
      if (auth.isAnonymous) {
        return NextResponse.json({ success: false, error: "Master application ke liye real account chahiye." }, { status: 403 });
      }
      if (isAdminRole) {
        return NextResponse.json({ success: false, error: "Admin ko master application ki zarurat nahi." }, { status: 400 });
      }

      const m = body.masterDetails || {};
      const masterDetails = {
        instagramHandle: cleanText(m.instagramHandle, 40),
        subject: cleanText(m.subject, 40),
        experience: cleanText(m.experience, 60),
        bio: cleanText(m.bio, 300, true),
      };

      if (!masterDetails.instagramHandle || !masterDetails.subject || !masterDetails.experience) {
        return NextResponse.json({ success: false, error: "Saari required details bharo." }, { status: 400 });
      }

      $set.role = 'master';
      $set.masterStatus = 'pending';
      $set.masterDetails = masterDetails;
    } else {
      const profileType = body.profileType;
      if (profileType !== 'school' && profileType !== 'competitive') {
        return NextResponse.json({ success: false, error: "Invalid profile type." }, { status: 400 });
      }

      const l = body.learnerDetails || {};
      $set.profileType = profileType;
      $set.learnerDetails = {
        schoolClass: cleanText(l.schoolClass, 30),
        medium: cleanText(l.medium, 30),
        stream: cleanList(l.stream),
        competitiveExams: cleanList(l.competitiveExams),
        subjects: cleanList(l.subjects),
        strongSubjects: cleanList(l.strongSubjects),
        weakSubjects: cleanList(l.weakSubjects),
        targets: cleanList(l.targets),
        hobbies: cleanList(l.hobbies),
      };
      if (!isAdminRole) $set.role = 'learner';
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: auth.uid },
      { $set },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error) {
    return serverError(error, "Update");
  }
}