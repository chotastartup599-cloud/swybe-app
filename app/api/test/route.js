import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Test from '@/models/Test';

export async function GET() {
  try {
    // 1. Database se connect karo
    await connectDB();
    
    // 2. Ek naya data save karo
    const newTest = await Test.create({
      name: 'Swybe Database Successfully Connected!',
    });

    // 3. Saara data fetch karo
    const allTests = await Test.find({});

    // 4. Result return karo
    return NextResponse.json(
      { 
        success: true, 
        message: 'Database connected perfectly!', 
        data: allTests 
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}