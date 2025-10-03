'use client'

/**
 * API Documentation Page
 * Serves interactive Swagger UI for API exploration
 */

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SwaggerUI url="/api/docs/spec" />
    </div>
  )
}
