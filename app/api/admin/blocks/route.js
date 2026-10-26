import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Block from '@/models/Block';
import { requireAdmin, authErrorResponse, serverError, cleanText } from '@/lib/apiAuth';
import { isObjectId } from '@/lib/helpers';

const BLOCK_TYPES = ['Notes', 'Current Affairs', 'Test'];

// Sirf http/https links allowed (javascript: jaise links nahi chalenge)
function cleanUrl(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().slice(0, 500);
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

// GET: Public sirf visible blocks dikhata hai. ?all=1 (admin) hidden blocks bhi deta hai.
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    if (searchParams.get('all') === '1') {
      const auth = await requireAdmin(req);
      if (auth.error) return authErrorResponse(auth);
      const all = await Block.find().sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, data: all }, { status: 200 });
    }

    const blocks = await Block.find({ isVisible: { $ne: false } }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: blocks }, { status: 200 });
  } catch (error) {
    return serverError(error, 'BlocksGet');
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));

    const title = cleanText(body.title, 60);
    const url = cleanUrl(body.url);
    if (!title) return NextResponse.json({ success: false, error: 'Title required hai.' }, { status: 400 });
    if (!url) return NextResponse.json({ success: false, error: 'Sahi URL daalo (https://...).' }, { status: 400 });

    const newBlock = await Block.create({
      title,
      url,
      type: BLOCK_TYPES.includes(body.type) ? body.type : 'Notes',
      icon: cleanText(body.icon, 8) || '📚',
      isVisible: true,
    });

    return NextResponse.json({ success: true, data: newBlock }, { status: 201 });
  } catch (error) {
    return serverError(error, 'BlocksCreate');
  }
}

// PATCH: block chhupana/dikhana ya edit karna
export async function PATCH(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return authErrorResponse(auth);

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));

    if (!isObjectId(body.id)) {
      return NextResponse.json({ success: false, error: 'Valid ID required' }, { status: 400 });
    }

    const $set = {};
    if (typeof body.isVisible === 'boolean') $set.isVisible = body.isVisible;
    if (body.title !== undefined) {
      const title = cleanText(body.title, 60);
      if (!title) return NextResponse.json({ success: false, error: 'Title khali nahi ho sakta.' }, { status: 400 });
      $set.title = title;
    }
    if (body.url !== undefined) {
      const url = cleanUrl(body.url);
      if (!url) return NextResponse.json({ success: false, error: 'Sahi URL daalo (https://...).' }, { status: 400 });
      $set.url = url;
    }
    if (body.icon !== undefined) $set.icon = cleanText(body.icon, 8) || '📚';
    if (body.type !== undefined && BLOCK_TYPES.includes(body.type)) $set.type = body.type;

    if (Object.keys($set).length === 0) {
      return NextResponse.json({ success: false, error: 'Update karne ke liye kuch nahi mila.' }, { status: 400 });
    }

    const updated = await Block.findByIdAndUpdate(body.id, { $set }, { new: true, runValidators: true }).lean();
    if (!updated) return NextResponse.json({ success: false, error: 'Block not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    return serverError(error, 'BlocksUpdate');
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

    await Block.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Block deleted' }, { status: 200 });
  } catch (error) {
    return serverError(error, 'BlocksDelete');
  }
}