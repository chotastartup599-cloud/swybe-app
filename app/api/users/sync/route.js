import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth, authErrorResponse, serverError, cleanText } from '@/lib/apiAuth';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

const PLACEHOLDER_NAMES = ["Guest User", "Student"];

export async function POST(req) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();

    // Page reload par ye ek baar chalta hai, isliye limit kaafi ooncha rakha hai
    const limit = await rateLimit(`sync:${auth.uid}`, 60, 60);
    if (!limit.ok) return rateLimitResponse(limit);

    const body = await req.json().catch(() => ({}));

    // UID, email, photo SIRF verified token se, body par bharosa nahi
    const firebaseUid = auth.uid;
    const email = auth.email || `guest_${firebaseUid}@swybe.com`;
    const photoURL = auth.decoded.picture || "";

    const bodyName = cleanText(body.name, 50);
    const tokenName = cleanText(auth.decoded.name, 50);
    const realName = [bodyName, tokenName].find((n) => n && !PLACEHOLDER_NAMES.includes(n)) || "";

    let user = await User.findOne({ firebaseUid });

    // Account linking: sirf tab jab email Firebase ne verify kiya ho
    if (!user && auth.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        if (!auth.emailVerified) {
          return NextResponse.json(
            { success: false, error: "Is email se account pehle se bana hai. Pehle email verify karo ya Google se login karo." },
            { status: 409 }
          );
        }
        existing.firebaseUid = firebaseUid;
        if (photoURL) existing.photoURL = photoURL;
        await existing.save();
        user = existing;
      }
    }

    if (!user) {
      try {
        user = await User.create({
          firebaseUid,
          name: realName || (auth.isAnonymous ? "Guest User" : "Student"),
          email,
          photoURL,
          isProfileComplete: false,
        });
      } catch (error) {
        // Do requests ek saath aayi to dusri par duplicate error aata hai
        if (error.code === 11000) user = await User.findOne({ firebaseUid });
        else throw error;
      }
    } else {
      const changes = {};
      // Photo: sirf tab Google ki photo se badlo jab abhi photo hi nahi hai
      // (warna user ki apni upload ki hui photo har login par Google ki photo se overwrite ho jaati thi)
      if (photoURL && !user.photoURL) changes.photoURL = photoURL;
      // Signup ke time pehle sync me naam nahi hota, baad me asli naam aa jaata hai
      if (realName && PLACEHOLDER_NAMES.includes(user.name)) changes.name = realName;
      if (Object.keys(changes).length > 0) {
        user = await User.findOneAndUpdate({ firebaseUid }, { $set: changes }, { new: true });
      }
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "User create nahi ho paya." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    return serverError(error, "Sync");
  }
}