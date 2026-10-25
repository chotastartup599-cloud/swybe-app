import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Folder from '@/models/Folder';
import { requireAuth, authErrorResponse, serverError, cleanText } from '@/lib/apiAuth';

const MAX_FOLDERS_PER_USER = 50;

export async function GET(req) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const light = searchParams.get('light') === '1';

    // Sirf apne folders (query ka userId ignore)
    let query = Folder.find({ userId: auth.uid }).sort({ createdAt: -1 });

    // light=1: posts sirf IDs ki list (save modal ke liye). Warna poori posts, par quiz ka sahi jawab nahi.
    if (!light) {
      query = query.populate({ path: 'posts', select: '-quizData.correctOptionIndex' });
    }

    const folders = await query.lean();
    return NextResponse.json({ success: true, data: folders }, { status: 200 });
  } catch (error) {
    return serverError(error, 'FoldersGet');
  }
}

export async function POST(req) {
  const auth = await requireAuth(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const name = cleanText(body.name, 40);

    if (!name) {
      return NextResponse.json({ success: false, error: 'Folder ka naam likho.' }, { status: 400 });
    }

    const count = await Folder.countDocuments({ userId: auth.uid });
    if (count >= MAX_FOLDERS_PER_USER) {
      return NextResponse.json({ success: false, error: 'Folders ki limit (50) puri ho gayi.' }, { status: 400 });
    }

    const newFolder = await Folder.create({ userId: auth.uid, name });
    return NextResponse.json({ success: true, data: newFolder }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Folder with this name already exists' }, { status: 400 });
    }
    return serverError(error, 'FoldersCreate');
  }
}