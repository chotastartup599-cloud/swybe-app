import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Folder from '@/models/Folder';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });

    // Yahan .populate('posts') add kiya hai
    const folders = await Folder.find({ userId }).populate('posts').sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: folders }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { userId, name } = await req.json();

    if (!userId || !name) return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

    const newFolder = await Folder.create({ userId, name });
    return NextResponse.json({ success: true, data: newFolder }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Folder with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}