import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Block from '@/models/Block';
import { requireAdmin } from '@/lib/apiAuth';

// GET: Public (Dashboard aur Search page use karte hain)
export async function GET() {
  try {
    await connectDB();
    const blocks = await Block.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: blocks }, { status: 200 });
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
    const newBlock = await Block.create(body);
    return NextResponse.json({ success: true, data: newBlock }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
    
    await Block.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Block deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}