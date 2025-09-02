import { NextRequest, NextResponse } from 'next/server'
import { talentRegistrationSchema, agencyRegistrationSchema } from '@/lib/validations/auth'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Determine which schema to use based on role
    const schema = body.role === 'TALENT' ? talentRegistrationSchema : agencyRegistrationSchema
    
    // Validate the request body
    const validatedData = schema.parse(body)
    
    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Add IP and user agent to the data
    const dataWithMetadata = {
      ...validatedData,
      ipAddress,
      userAgent,
    }
    
    // Call the backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithMetadata),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Registration failed')
    }
    
    const result = await response.json()
    
    return NextResponse.json(result, { status: 201 })
    
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Registration failed' 
      },
      { status: 500 }
    )
  }
}
