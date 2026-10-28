import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import RateLimit from '@/models/RateLimit';

// Fixed-window limiter: "key" ke liye "windowSec" seconds me max "limit" requests.
// Agar limiter ka database call khud fail ho jaye, to request rokte nahi (app band nahi hona chahiye).
export async function rateLimit(key, limit, windowSec) {
  try {
    await connectDB();

    const windowMs = windowSec * 1000;
    const windowId = Math.floor(Date.now() / windowMs);
    const id = `${key}:${windowId}`;
    const resetAt = (windowId + 1) * windowMs;

    const run = () =>
      RateLimit.findOneAndUpdate(
        { _id: id },
        { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(resetAt + 60 * 1000) } },
        { upsert: true, returnDocument: 'after' }
      ).lean();

    let doc;
    try {
      doc = await run();
    } catch (error) {
      // Do requests ek saath pehli baar aayi to ek ko duplicate-key error aata hai, dobara try
      if (error.code === 11000) doc = await run();
      else throw error;
    }

    const count = doc?.count || 1;
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
    };
  } catch (error) {
    console.error('RateLimit error (request allowed):', error);
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
}

export function rateLimitResponse(result, message = 'Bahut zyada requests. Thodi der baad try karo.') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
  );
}