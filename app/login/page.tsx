import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToastHandler } from '@/components/toast-handler'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, message?: string }>
}) {
  const { error, message } = await searchParams;
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 bg-neutral-100 dark:bg-neutral-900">
      <ToastHandler error={error} message={message} />
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold dark:text-neutral-50">Log in</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Enter your credentials to access</p>
        </div>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="dark:text-neutral-200">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@ejemplo.com" required className="dark:text-neutral-50" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="dark:text-neutral-200">Password</Label>
              <Link href="/forgot-password" className="text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 underline">
                Forgot your password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required className="dark:text-neutral-50" />
          </div>

          <Button formAction={login} className="w-full dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 hover:cursor-pointer">
            Login
          </Button>
        </form>
        <div className="text-center text-sm dark:text-neutral-400">
          Don&apos;t have an account? <Link href="/register" className="underline dark:text-neutral-300">Register</Link>
        </div>
      </div>
    </div>
  )
}
