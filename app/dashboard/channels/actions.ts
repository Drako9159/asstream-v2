'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createChannel(formData: FormData) {
  const supabase = await createClient()

  // Extract fields
  const category_id = formData.get('category_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const poster_url = formData.get('poster_url') as string
  const banner_url = formData.get('banner_url') as string
  const source_url = formData.get('source_url') as string
  const is_active = formData.get('is_active') === 'true'
  const is_streaming = formData.get('is_streaming') === 'true'
  const quality = formData.get('quality') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('channels').insert({
    user_id: user.id,
    category_id,
    title,
    description,
    poster_url,
    banner_url,
    source_url,
    is_active,
    is_streaming,
    quality
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateChannel(formData: FormData) {
  const supabase = await createClient()
  
  const id = formData.get('id') as string
  const category_id = formData.get('category_id') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const poster_url = formData.get('poster_url') as string
  const banner_url = formData.get('banner_url') as string
  const source_url = formData.get('source_url') as string
  const is_active = formData.get('is_active') === 'true'
  const is_streaming = formData.get('is_streaming') === 'true'
  const quality = formData.get('quality') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('channels')
    .update({ 
      category_id, title, description, poster_url, banner_url, 
      source_url, is_active, is_streaming, quality 
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteChannel(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
