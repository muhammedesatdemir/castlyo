import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
