'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCategory, updateCategory, deleteCategory } from '@/app/dashboard/actions'
import { toast } from 'sonner'

export type Category = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export function CategoryManager({ initialCategories, viewMode = 'all' }: { initialCategories: Category[], viewMode?: 'all' | 'create' | 'list' }) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = async (formData: FormData) => {
    const res = await createCategory(formData)
    if (res?.error) toast.error('Error', { description: res.error })
    else {
      toast.success('Categoría creada exitosamente')
    }
  }

  const handleUpdate = async (formData: FormData) => {
    const res = await updateCategory(formData)
    if (res?.error) toast.error('Error al editar', { description: res.error })
    else {
      toast.success('Categoría actualizada')
      setEditingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return
    const formData = new FormData()
    formData.append('id', id)
    const res = await deleteCategory(formData)
    if (res?.error) toast.error('Error al eliminar', { description: res.error })
    else toast.success('Categoría eliminada')
  }

  return (
    <div className={`space-y-8 ${viewMode === 'all' ? 'mt-8' : ''}`}>
      {/* Create form */}
      {(viewMode === 'all' || viewMode === 'create') && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-950 shadow-sm">
          <h3 className="text-lg font-medium mb-4 dark:text-neutral-50">Nueva Categoría</h3>
          <form action={handleCreate} className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="create_name" className="dark:text-neutral-200">Nombre</Label>
              <Input id="create_name" name="name" required className="dark:text-neutral-50" />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="create_desc" className="dark:text-neutral-200">Descripción</Label>
              <Input id="create_desc" name="description" className="dark:text-neutral-50" />
            </div>
            <Button type="submit" className="dark:bg-neutral-50 dark:text-neutral-900 w-full sm:w-auto hover:cursor-pointer dark:hover:bg-neutral-50/80">Crear</Button>
          </form>
        </div>
      )}

      {/* List */}
      {(viewMode === 'all' || viewMode === 'list') && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium dark:text-neutral-50">Tus Categorías</h3>
          {initialCategories.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No tienes categorías aún.</p>
          ) : (
            <div className="grid gap-4">
              {initialCategories.map((cat) => (
                <div key={cat.id} className="rounded border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {editingId === cat.id ? (
                    <form action={handleUpdate} className="flex flex-col sm:flex-row flex-1 gap-4 sm:items-end">
                      <input type="hidden" name="id" value={cat.id} />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`edit_name_${cat.id}`} className="dark:text-neutral-200">Nombre</Label>
                        <Input id={`edit_name_${cat.id}`} name="name" defaultValue={cat.name} required className="dark:text-neutral-50" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`edit_desc_${cat.id}`} className="dark:text-neutral-200">Descripción</Label>
                        <Input id={`edit_desc_${cat.id}`} name="description" defaultValue={cat.description || ''} className="dark:text-neutral-50" />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 h-10 w-full sm:w-auto px-6 hover:cursor-pointer">Guardar</Button>
                        <Button type="button" className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 h-10 w-full sm:w-auto hover:cursor-pointer" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h4 className="font-semibold dark:text-neutral-50">{cat.name}</h4>
                        {cat.description && <p className="text-sm text-neutral-500 dark:text-neutral-400">{cat.description}</p>}
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <Button type="button" className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 h-10 w-full sm:w-auto hover:cursor-pointer" onClick={() => setEditingId(cat.id)}>
                          Editar
                        </Button>
                        <Button type="button" className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700 h-10 w-full sm:w-auto px-4 hover:cursor-pointer" onClick={() => handleDelete(cat.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
