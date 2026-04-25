'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center space-y-4 p-4 sm:p-8 text-center">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Something went wrong!</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
        We encountered an error while loading your dashboard. Please try again.
      </p>
      <Button 
        onClick={() => reset()}
        className="bg-transparent border border-neutral-200 text-neutral-900 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800"
      >
        Try again
      </Button>
    </div>
  )
}
