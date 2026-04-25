'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ChannelSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').nullable().optional(),
  poster_url: z.string().url('Invalid poster URL').nullable().optional().or(z.literal('')),
  banner_url: z.string().url('Invalid banner URL').nullable().optional().or(z.literal('')),
  source_url: z.string().url('Invalid source URL').or(z.literal('')),
  is_active: z.boolean(),
  is_streaming: z.boolean(),
  quality: z.string().max(50).nullable().optional(),
})

const UpdateChannelSchema = ChannelSchema.extend({
  id: z.string().min(1, 'Channel ID is required'),
})

const DeleteChannelSchema = z.object({
  id: z.string().min(1, 'Channel ID is required'),
})

export async function createChannel(formData: FormData) {
  const supabase = await createClient()

  const validatedFields = ChannelSchema.safeParse({
    category_id: formData.get('category_id') || '',
    title: formData.get('title') || '',
    description: formData.get('description') || '',
    poster_url: formData.get('poster_url') || '',
    banner_url: formData.get('banner_url') || '',
    source_url: formData.get('source_url') || '',
    is_active: formData.get('is_active') === 'true',
    is_streaming: formData.get('is_streaming') === 'true',
    quality: formData.get('quality') || '',
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('channels').insert({
    user_id: user.id,
    ...validatedFields.data
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateChannel(formData: FormData) {
  const supabase = await createClient()
  
  const validatedFields = UpdateChannelSchema.safeParse({
    id: formData.get('id') || '',
    category_id: formData.get('category_id') || '',
    title: formData.get('title') || '',
    description: formData.get('description') || '',
    poster_url: formData.get('poster_url') || '',
    banner_url: formData.get('banner_url') || '',
    source_url: formData.get('source_url') || '',
    is_active: formData.get('is_active') === 'true',
    is_streaming: formData.get('is_streaming') === 'true',
    quality: formData.get('quality') || '',
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { id, ...updateData } = validatedFields.data

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('channels')
    .update(updateData)
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
  
  const validatedFields = DeleteChannelSchema.safeParse({
    id: formData.get('id') || '',
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', validatedFields.data.id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
