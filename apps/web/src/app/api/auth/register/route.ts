import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Bu endpoint kullanımdan kaldırılmıştır
export async function POST(request: NextRequest) {
  console.warn('[DEPRECATED] /api/auth/register endpoint called. Use /api/v1/auth/register instead.')
  
  return NextResponse.json({
    ok: false,
    success: false,
    message: 'Bu endpoint kullanımdan kaldırılmıştır. Lütfen /api/v1/auth/register kullanın.',
    deprecated: true,
    newEndpoint: '/api/v1/auth/register'
  }, { 
    status: 410, // 410 Gone - endpoint deprecated
    headers: { 'Cache-Control': 'no-store' } 
  })
}

// CORS support
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
    },
  })
}