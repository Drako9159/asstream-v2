import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToastHandler } from '@/components/toast-handler'
import Link from 'next/link'

export default async function RegisterPage({
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
          <h1 className="text-2xl font-bold dark:text-neutral-50">Create Account</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Enter your details to register</p>
        </div>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="dark:text-neutral-200">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@ejemplo.com" required className="dark:text-neutral-50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="dark:text-neutral-200">Password</Label>
            <Input id="password" name="password" type="password" required className="dark:text-neutral-50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="dark:text-neutral-200">Confirm password</Label>
            <Input id="confirm_password" name="confirm_password" type="password" required className="dark:text-neutral-50" />
          </div>

          <Button formAction={signup} className="w-full dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 hover:cursor-pointer">
            Sign up
          </Button>
        </form>
        <div className="text-center text-sm dark:text-neutral-400">
          Already have an account? <Link href="/login" className="underline dark:text-neutral-300">Log in</Link>
        </div>
      </div>
    </div>
  )
}
