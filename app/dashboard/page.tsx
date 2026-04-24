import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { DashboardSidebarLayout } from '@/components/dashboard/dashboard-layout-client'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen w-full flex-col p-4 sm:p-8 bg-neutral-50 dark:bg-neutral-950">
      <header className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-4 sm:mb-8 gap-4 w-full max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50">Administración</h1>
        <form action={signout}>
          <Button type="submit" className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700 w-full sm:w-auto hover:cursor-pointer h-9 px-4 text-sm font-medium">
            Cerrar sesión
          </Button>
        </form>
      </header>

      <DashboardSidebarLayout 
        user={user} 
        categories={categories || []} 
        channels={channels || []} 
      />
    </div>
  )
}

