import { NextResponse } from 'next/server'
import { z } from 'zod'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import * as jwt from 'jsonwebtoken'
import type { AuthResponse, AuthSuccessResponse, AuthErrorResponse } from './types'

// Response helpers
export function successResponse<T>(message: string, data?: T): NextResponse<AuthSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    message,
    data
  }, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }
  })
}

export function errorResponse(
  message: string, 
  status: number = 400, 
  errors?: string[], 
  code?: string
): NextResponse<AuthErrorResponse> {
  return NextResponse.json({
    success: false,
    message,
    errors,
    code
  }, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  })
}

export function validationErrorResponse(zodError: z.ZodError): NextResponse<AuthErrorResponse> {
  const errors = zodError.errors.map(err => {
    const field = err.path.join('.')
    switch (field) {
      case 'email':
        return 'Geçerli bir e-posta adresi giriniz'
      case 'password':
        return 'Şifre en az 8 karakter olmalı ve karmaşık olmalı'
      case 'passwordConfirm':
        return 'Şifre tekrarı eşleşmiyor'
      case 'kvkkConsent':
        return 'KVKK metnini onaylamanız gerekli'
      case 'role':
        return 'Geçerli bir rol seçiniz'
      default:
        return err.message
    }
  })

  return errorResponse('Doğrulama hatası', 422, errors, 'VALIDATION_ERROR')
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Token utilities
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// JWT utilities
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production'

export function generateAccessToken(payload: { userId: string, email: string, role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): { userId: string, email: string, role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as any
  } catch {
    return null
  }
}

// Email normalization
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// Request body parsing with error handling
export async function parseRequestBody<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
  const contentType = request.headers.get('content-type') || ''
  
  if (!contentType.includes('application/json')) {
    throw new Error('Content-Type must be application/json')
  }

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch (error) {
    throw new Error('Failed to read request body')
  }

  let jsonData: any
  try {
    jsonData = JSON.parse(rawBody || '{}')
  } catch (error) {
    throw new Error('Invalid JSON format')
  }

  return schema.parse(jsonData)
}

// Logging helper
export function logAuthAction(action: string, email?: string, details?: any) {
  const timestamp = new Date().toISOString()
  const emailMask = email ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'N/A'
  console.log(`[AUTH ${timestamp}] ${action} | Email: ${emailMask} | Details:`, details)
}
