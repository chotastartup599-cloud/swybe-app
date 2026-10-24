import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { requireAdmin } from '@/lib/apiAuth';

// GET: Public rehne diya hai (Onboarding page ko bhi chahiye settings, usme login admin nahi hota)
export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({
        classes: ["Class 9", "Class 10", "Class 11", "Class 12", "Dropper"],
        exams: ["JEE", "NEET", "NDA", "UPSC", "SSC", "CUET", "Other"],
        subjects: ["Physics", "Chemistry", "Maths", "Biology", "English", "Social Science", "Computer"],
        streams: ["Science (PCM)", "Science (PCB)", "Commerce", "Arts", "Other"],
        hobbies: ["Music", "Dancing", "Calisthenics", "Gaming", "Reading", "Art"]
      });
    }
    
    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectDB();
    const body = await req.json();
    
    const updatedSettings = await Settings.findOneAndUpdate(
      {}, 
      { $set: body }, 
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: updatedSettings }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}