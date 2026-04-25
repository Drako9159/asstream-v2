import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center space-y-6 p-4 sm:p-8 bg-neutral-50 dark:bg-neutral-950 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900">
        <FileQuestion className="h-10 w-10 text-neutral-500 dark:text-neutral-400" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">404 - Page Not Found</h1>
        <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
          We couldn't find the page you were looking for. The link might be broken, or the page may have been removed.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Link 
          href="/"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-neutral-900 text-neutral-50 shadow hover:bg-neutral-900/90 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90 h-9 px-8"
        >
          Go Home
        </Link>
        <Link 
          href="/dashboard"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-transparent border border-neutral-200 text-neutral-900 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800 h-9 px-8"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
