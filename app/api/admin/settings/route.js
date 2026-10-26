import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { requireAdmin, authErrorResponse, serverError, cleanList } from '@/lib/apiAuth';

const KEYS = ['classes', 'exams', 'subjects', 'streams', 'hobbies'];

const DEFAULTS = {
  classes: ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'Dropper'],
  exams: ['JEE', 'NEET', 'NDA', 'UPSC', 'SSC', 'CUET', 'Other'],
  subjects: ['Physics', 'Chemistry', 'Maths', 'Biology', 'English', 'Social Science', 'Computer'],
  streams: ['Science (PCM)', 'Science (PCB)', 'Commerce', 'Arts', 'Other'],
  hobbies: ['Music', 'Dancing', 'Calisthenics', 'Gaming', 'Reading', 'Art'],
};

// GET: Public (Onboarding aur Upload page ko bhi chahiye, wahan admin login nahi hota)
export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne().sort({ createdAt: 1 }).lean();

    if (!settings) {
      const created = await Settings.create(DEFAULTS);
      settings = created.toObject();
    }

    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error) {
    return serverError(error, 'SettingsGet');
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));

    // Sirf ye 5 lists accept hoti hain (pehle poori body seedha $set ho jaati thi)
    const $set = {};
    for (const key of KEYS) {
      if (!Array.isArray(body[key])) continue;
      let list = cleanList(body[key], 60, 40);
      // Subject ke naam database me key bante hain, isliye '.' aur '$' nahi chalte
      if (key === 'subjects') {
        list = [...new Set(list.map((s) => s.replace(/[.$]/g, '').trim()).filter(Boolean))];
      }
      $set[key] = list;
    }

    if (Object.keys($set).length === 0) {
      return NextResponse.json({ success: false, error: 'Update karne ke liye kuch nahi mila.' }, { status: 400 });
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      { $set },
      { new: true, upsert: true, sort: { createdAt: 1 }, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({ success: true, data: updatedSettings }, { status: 200 });
  } catch (error) {
    return serverError(error, 'SettingsUpdate');
  }
}