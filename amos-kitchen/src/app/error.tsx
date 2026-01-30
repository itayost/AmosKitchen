'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { trackEvent } from '@/lib/analytics'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Application error:', error)

    // Track error in analytics
    trackEvent('error_boundary_triggered', {
      errorMessage: error.message,
      errorDigest: error.digest,
    } as any)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">משהו השתבש</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            אירעה שגיאה בלתי צפויה. אנא נסה שוב או חזור לדף הבית.
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
            <a href="/">
              <Home className="ml-2 h-4 w-4" />
              דף הבית
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
