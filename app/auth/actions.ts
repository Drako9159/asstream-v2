'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (password !== confirmPassword) {
    redirect('/register?error=' + encodeURIComponent('The passwords do not match'))
  }

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  let origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`
  origin = origin.endsWith('/') ? origin.slice(0, -1) : origin

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect('/register?error=' + encodeURIComponent(error.message))
  }

  if (authData.user && authData.session === null) {
    redirect('/register?message=' + encodeURIComponent('Please check your email to verify your account.'))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPasswordEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  let origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`
  // remove trailing slash if present
  origin = origin.endsWith('/') ? origin.slice(0, -1) : origin

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/forgot-password?message=' + encodeURIComponent('We have sent you an email with instructions.'))
}

export async function updatePasswordAction(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (password !== confirmPassword) {
    redirect('/update-password?error=' + encodeURIComponent('The passwords do not match'))
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    redirect('/update-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/dashboard?message=' + encodeURIComponent('Password updated successfully'))
}
