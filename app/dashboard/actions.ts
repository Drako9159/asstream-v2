'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name,
    description
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateCategory(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('categories')
    .update({ name, description })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
