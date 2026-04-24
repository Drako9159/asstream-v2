import { updatePasswordAction } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToastHandler } from '@/components/toast-handler'

export default async function UpdatePasswordPage({
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
          <h1 className="text-2xl font-bold dark:text-neutral-50">Reset password</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Enter your new password</p>
        </div>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="dark:text-neutral-200">New password</Label>
            <Input id="password" name="password" type="password" required className="dark:text-neutral-50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="dark:text-neutral-200">Confirm password</Label>
            <Input id="confirm_password" name="confirm_password" type="password" required className="dark:text-neutral-50" />
          </div>

          <Button formAction={updatePasswordAction} className="w-full dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200">
            Reset password
          </Button>
        </form>
      </div>
    </div>
  )
}
