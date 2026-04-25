'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').nullable().optional(),
})

const UpdateCategorySchema = CategorySchema.extend({
  id: z.string().min(1, 'Category ID is required'),
})

const DeleteCategorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
})

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  
  const validatedFields = CategorySchema.safeParse({
    name: formData.get('name') || '',
    description: formData.get('description') || '',
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    ...validatedFields.data
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateCategory(formData: FormData) {
  const supabase = await createClient()
  
  const validatedFields = UpdateCategorySchema.safeParse({
    id: formData.get('id') || '',
    name: formData.get('name') || '',
    description: formData.get('description') || '',
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { id, ...updateData } = validatedFields.data

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('categories')
    .update(updateData)
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
  
  const validatedFields = DeleteCategorySchema.safeParse({
    id: formData.get('id') || '',
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', validatedFields.data.id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
