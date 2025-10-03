/**
 * OpenAPI Specification Endpoint
 * Serves the OpenAPI 3.0 specification as JSON
 */

import { NextResponse } from 'next/server'
import { generateOpenAPISpec } from '@/lib/openapi-spec'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const spec = generateOpenAPISpec()

    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate API specification',
      },
      { status: 500 }
    )
  }
}
