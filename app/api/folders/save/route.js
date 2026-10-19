import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Folder from '@/models/Folder';

export async function POST(req) {
  try {
    await connectDB();
    const { folderId, postId } = await req.json();

    if (!folderId || !postId) return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

    // Post ko folder ke posts array me add karo (Agar pehle se nahi hai toh)
    const updatedFolder = await Folder.findByIdAndUpdate(
      folderId,
      { $addToSet: { posts: postId } }, // $addToSet duplicate entries rokta hai
      { new: true }
    );

    if (!updatedFolder) return NextResponse.json({ success: false, error: "Folder not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: updatedFolder }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}