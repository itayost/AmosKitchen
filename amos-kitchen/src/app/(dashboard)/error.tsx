'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { trackEvent } from '@/lib/analytics'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Dashboard error:', error)

    // Track error in analytics
    trackEvent('error_boundary_triggered', {
      errorMessage: error.message,
      errorDigest: error.digest,
      source: 'dashboard',
    })
  }, [error])

  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">שגיאה בטעינת הדף</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            אירעה שגיאה בטעינת התוכן. אנא נסה לרענן את הדף או נווט לדף אחר.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-red-50 rounded-md text-right">
              <p className="text-sm font-mono text-red-800 break-all">
                {error.message}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="ml-2 h-4 w-4" />
            נסה שוב
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="ml-2 h-4 w-4" />
              חזור לדשבורד
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
