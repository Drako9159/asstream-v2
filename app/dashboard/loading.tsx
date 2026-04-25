import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-4 sm:p-8">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500 dark:text-neutral-400" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading dashboard...</p>
      </div>
    </div>
  )
}
