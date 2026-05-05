'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { searchTMDBMedia, getTMDBDetails } from '@/app/dashboard/tmdb-actions'
import { createChannel, updateChannel, deleteChannel } from '@/app/dashboard/channels/actions'
import { toast } from 'sonner'
import { Category } from './category-client'
import { Database } from '@/types/supabase'

export type Channel = Database['public']['Tables']['channels']['Row']

export interface TMDBItem {
  id: number
  media_type?: 'movie' | 'tv'
  poster_path?: string
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
}

export function ChannelManager({ initialChannels, categories, viewMode = 'all' }: { initialChannels: Channel[], categories: Category[], viewMode?: 'all' | 'create' | 'list' }) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const filteredChannels = initialChannels.filter(c => filterCategory === 'all' || c.category_id === filterCategory)
  const totalPages = Math.max(1, Math.ceil(filteredChannels.length / ITEMS_PER_PAGE))
  const paginatedChannels = filteredChannels.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleFilterChange = (catId: string) => {
    setFilterCategory(catId)
    setCurrentPage(1)
  }

  const [isStreaming, setIsStreaming] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TMDBItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const [formState, setFormState] = useState({
    title: '',
    description: '',
    poster_url: '',
    banner_url: '',
    source_url: '',
    quality: 'HD',
    is_active: true,
    category_id: categories.length > 0 ? categories[0].id : ''
  })

  const resetForm = () => {
    setFormState({
      title: '', description: '', poster_url: '', banner_url: '', source_url: '',
      quality: 'HD', is_active: true, category_id: categories.length > 0 ? categories[0].id : ''
    })
    setSearchResults([])
    setSearchQuery('')
    setIsStreaming(true)
    setEditingId(null)
    if (formRef.current) formRef.current.reset()
  }

  const handleSearchTMDB = async () => {
    if (!searchQuery) return
    setIsSearching(true)
    try {
      const results = await searchTMDBMedia(searchQuery)
      setSearchResults(results)
    } catch (e) {
      toast.error((e as Error).message || 'Error buscando en TMDB')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectTMDB = async (item: TMDBItem) => {
    try {
      const details = await getTMDBDetails(item.id, item.media_type || 'movie')
      setFormState(prev => ({
        ...prev,
        title: details.title,
        description: details.description,
        poster_url: details.poster_url,
        banner_url: details.banner_url
      }))
      toast.success('Data auto-completed by TMDB')
      setSearchResults([])
    } catch (e) {
      toast.error('Error detailing the element', { description: (e as Error).message })
    }
  }

  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    if (isPending) return
    setIsPending(true)
    formData.set('is_streaming', isStreaming.toString())
    formData.set('is_active', formState.is_active.toString())
    formData.set('quality', formState.quality)

    if (editingId) {
      formData.set('id', editingId)
      const res = await updateChannel(formData)
      if (res?.error) toast.error('Error editing channel', { description: res.error })
      else {
        toast.success('Channel updated successfully')
        resetForm()
      }
    } else {
      const res = await createChannel(formData)
      if (res?.error) toast.error('Error creating channel', { description: res.error })
      else {
        toast.success('Channel created successfully')
        resetForm()
      }
    }
    setIsPending(false)
  }

  const handleEditClick = (channel: Channel) => {
    setEditingId(channel.id)
    setIsStreaming(channel.is_streaming ?? true)
    setFormState({
      title: channel.title,
      description: channel.description || '',
      poster_url: channel.poster_url || '',
      banner_url: channel.banner_url || '',
      source_url: channel.source_url || '',
      quality: channel.quality || 'HD',
      is_active: channel.is_active ?? true,
      category_id: channel.category_id
    })
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este canal?')) return
    const formData = new FormData()
    formData.append('id', id)
    const res = await deleteChannel(formData)
    if (res?.error) toast.error('Error deleting channel', { description: res.error })
    else toast.success('Channel deleted successfully')
  }

  if (categories.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded text-yellow-800 dark:text-yellow-100 mt-8">
        You cannot create channels because you don&apos;t have any categories. Please create a category first.
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${viewMode === 'all' ? 'mt-12 border-t border-neutral-200 dark:border-neutral-800 pt-8' : ''}`}>
      {viewMode === 'all' && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-neutral-50 text-neutral-900">Channel Management</h2>
        </div>
      )}

      {(viewMode === 'all' || viewMode === 'create' || editingId) && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-950 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <h3 className="text-lg font-medium dark:text-neutral-50">
              {editingId ? 'Edit Channel' : 'Create New Channel'}
            </h3>
            {editingId && (
              <Button type="button" onClick={resetForm} className="text-red-500 bg-white hover:bg-red-50 border border-red-200 h-8 px-3 text-xs dark:bg-neutral-900 dark:border-red-900/40 dark:hover:bg-red-900/20 hover:cursor-pointer">
                Cancel editing
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <Label className="dark:text-neutral-200 font-semibold">Content Type:</Label>
            <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded">
              <button
                type="button"
                className={`px-4 py-1 rounded text-sm transition-colors ${isStreaming ? 'bg-white dark:bg-neutral-600 shadow' : 'text-neutral-500 hover:cursor-pointer'}`}
                onClick={() => setIsStreaming(true)}>
                Streaming
              </button>
              <button
                type="button"
                className={`px-4 py-1 rounded text-sm transition-colors ${!isStreaming ? 'bg-white dark:bg-neutral-600 shadow' : 'text-neutral-500 hover:cursor-pointer'}`}
                onClick={() => setIsStreaming(false)}>
                VOD Content (TMDB)
              </button>
            </div>
          </div>

          {!isStreaming && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded mb-6 space-y-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-300">Search in TMDB</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. The Office, Avengers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-neutral-900"
                />
                <Button type="button" onClick={handleSearchTMDB} disabled={isSearching} className="bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer">
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.map(res => (
                    <div key={res.id} onClick={() => handleSelectTMDB(res)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer rounded flex items-center gap-3 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={res.poster_path ? `https://image.tmdb.org/t/p/w92${res.poster_path}` : 'https://via.placeholder.com/92x138'} alt={res.title || res.name} className="w-12 h-16 object-cover rounded" />
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{res.title || res.name}</p>
                        <p className="text-xs text-neutral-500">{res.media_type === 'movie' ? 'Movie' : 'TV Show'} • {res.release_date || res.first_air_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form ref={formRef} action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <select
                  name="category_id"
                  id="category_id"
                  className="w-full h-9 rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm dark:border-neutral-800 dark:text-neutral-50"
                  value={formState.category_id}
                  onChange={e => setFormState({ ...formState, category_id: e.target.value })}
                  required
                >
                  {categories.map(c => <option key={c.id} value={c.id} className="dark:bg-neutral-900">{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input name="title" id="title" required value={formState.title} onChange={e => setFormState({ ...formState, title: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input name="description" id="description" value={formState.description} onChange={e => setFormState({ ...formState, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poster_url">Poster URL</Label>
                <Input name="poster_url" id="poster_url" value={formState.poster_url} onChange={e => setFormState({ ...formState, poster_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner_url">Banner URL</Label>
                <Input name="banner_url" id="banner_url" value={formState.banner_url} onChange={e => setFormState({ ...formState, banner_url: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_url">Source URL</Label>
              <Input name="source_url" id="source_url" required value={formState.source_url} onChange={e => setFormState({ ...formState, source_url: e.target.value })} />
            </div>

            <div className="flex items-center gap-6 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Label>Quality:</Label>
                <select name="quality" value={formState.quality} onChange={e => setFormState({ ...formState, quality: e.target.value })} className="h-9 rounded border border-neutral-200 bg-transparent px-3 text-sm dark:border-neutral-800 dark:text-neutral-50 dark:bg-neutral-950 hover:cursor-pointer">
                  <option value="SD">SD</option>
                  <option value="HD">HD</option>
                  <option value="FHD">FHD</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={formState.is_active} onChange={e => setFormState({ ...formState, is_active: e.target.checked })} className="w-4 h-4 rounded hover:cursor-pointer" />
                <Label htmlFor="is_active" className="hover:cursor-pointer">Active</Label>
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="w-full mt-4 bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Create Channel'}
            </Button>
          </form>
        </div>
      )}

      {/* List */}
      {(viewMode === 'all' || viewMode === 'list') && !editingId && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-medium dark:text-neutral-50">Your Channels</h3>
            <div className="flex items-center gap-2">
              <Label className="text-sm dark:text-neutral-300">Filter:</Label>
              <select
                value={filterCategory}
                onChange={e => handleFilterChange(e.target.value)}
                className="h-8 rounded border border-neutral-200 bg-white dark:bg-neutral-900 px-2 text-sm dark:border-neutral-800 dark:text-neutral-50 max-w-[200px] hover:cursor-pointer"
              >
                <option value="all">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {initialChannels.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">You don&apos;t have any channels registered yet.</p>
          ) : filteredChannels.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No channels found in this category.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {paginatedChannels.map((cha) => {
                  const catName = categories.find(c => c.id === cha.category_id)?.name || 'Unknown'
                  return (
                    <div key={cha.id} className={`rounded border ${editingId === cha.id ? 'border-blue-500 shadow-md transform scale-[1.01] transition-all' : 'border-neutral-200 dark:border-neutral-800 shadow-sm'} p-4 bg-white dark:bg-neutral-950 flex flex-col gap-4`}>
                      <div className="flex gap-4 h-full">
                        {cha.poster_url ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={cha.poster_url} alt={cha.title} className="w-16 h-24 object-cover rounded shadow" />
                          </>
                        ) : (
                          <div className="w-16 h-24 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center rounded text-xs text-neutral-500 font-medium shadow">N/A</div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold dark:text-neutral-50 truncate" title={cha.title}>{cha.title}</h4>
                              <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${cha.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-neutral-100 text-neutral-500'}`}>
                                {cha.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Cat: {catName} • {cha.quality} • {cha.is_streaming ? 'Live' : 'VOD'}</p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">{cha.description || 'No description'}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button type="button" className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 dark:border-neutral-700 h-7 text-xs flex-1 hover:cursor-pointer" onClick={() => handleEditClick(cha)}>
                              {editingId === cha.id ? 'Editing...' : 'Edit'}
                            </Button>
                            <Button type="button" className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/40 h-7 text-xs flex-1 hover:cursor-pointer" onClick={() => handleDelete(cha.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 h-8 px-3 text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 h-8 px-3 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
