// Health Check Endpoint
// GET /api/health
// Returns the health status of the application and its dependencies

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// Prevent caching of health checks
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    firebase: 'ok' | 'error'
    environment: 'ok' | 'error'
  }
  responseTimeMs?: number
}

// Track server start time for uptime calculation
const serverStartTime = Date.now()

export async function GET() {
  const startTime = Date.now()

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    checks: {
      firebase: 'ok',
      environment: 'ok',
    },
  }

  // Check Firebase connectivity by attempting a simple read
  try {
    // Try to read from a health check collection (or any accessible collection)
    await adminDb.collection('_health').doc('ping').get()
  } catch (error) {
    // If permission denied, Firebase is still working, just no access to _health collection
    // Try a simpler check - just verify we can make any Firestore call
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Permission denied means Firebase is connected but rules don't allow this read
    // That's actually fine - connection is working
    if (!errorMessage.includes('PERMISSION_DENIED') && !errorMessage.includes('permission-denied')) {
      health.checks.firebase = 'error'
      health.status = 'degraded'
    }
  }

  // Check critical environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
  ]

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar])

  if (missingVars.length > 0) {
    health.checks.environment = 'error'
    health.status = 'unhealthy'
  }

  // Calculate response time
  health.responseTimeMs = Date.now() - startTime

  // Return appropriate status code based on health
  const statusCode = health.status === 'unhealthy' ? 503 : 200

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
}
