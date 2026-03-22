import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
  });
}
