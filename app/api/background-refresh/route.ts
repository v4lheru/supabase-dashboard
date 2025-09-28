import { NextRequest, NextResponse } from 'next/server'

// Background refresh service that runs periodically to keep cache warm
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    // Simple secret check for security (you can set this in .env.local)
    const expectedSecret = process.env.BACKGROUND_REFRESH_SECRET || 'default-secret'
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Background refresh started')
    
    // Call the dashboard API to refresh cache
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const refreshResponse = await fetch(`${baseUrl}/api/dashboard?action=refresh-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!refreshResponse.ok) {
      throw new Error(`Cache refresh failed: ${refreshResponse.statusText}`)
    }

    const result = await refreshResponse.json()
    console.log('✅ Background refresh completed:', result)

    return NextResponse.json({ 
      success: true, 
      message: 'Background refresh completed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('💥 Background refresh error:', error)
    return NextResponse.json(
      { 
        error: 'Background refresh failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Background refresh service is running'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
