'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateExternalSettings, addExternalChannel, removeExternalChannel } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import { Search, Plus, Trash2, Settings2, Globe } from 'lucide-react'

interface ExternalChannel {
  external_id: string
  name: string
  is_active: boolean | null
}

export function ExternalSourceManager({
  initialSettings,
  initialWhitelistedChannels
}: {
  initialSettings: { key: string, value: unknown }[]
  initialWhitelistedChannels: ExternalChannel[]
}) {
  const allowedCategories = initialSettings.find(s => s.key === 'allowed_categories')?.value || []
  const [searchQuery, setSearchQuery] = useState('')
  const [externalChannels, setExternalChannels] = useState<{ id: string, name: string, categories?: string[] }[]>([])

  const [whitelisted, setWhitelisted] = useState<Set<string>>(
    new Set(initialWhitelistedChannels.map(c => c.external_id))
  )
  const [localChannels, setLocalChannels] = useState<ExternalChannel[]>(initialWhitelistedChannels)

  // Sync local state if props change from server (e.g. after revalidatePath)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalChannels(initialWhitelistedChannels)
    setWhitelisted(new Set(initialWhitelistedChannels.map(c => c.external_id)))
  }, [initialWhitelistedChannels])

  // Load external channels from IPTV-ORG API
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch('https://iptv-org.github.io/api/channels.json')
        const data = await res.json()
        setExternalChannels(data)
      } catch (err) {
        console.error('Error fetching IPTV-ORG channels:', err)
      }
    }
    fetchChannels()
  }, [])

  const handleUpdateCategories = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const res = await updateExternalSettings(formData)
    if (res.success) {
      toast.success('Categories updated successfully')
    } else {
      toast.error(res.error || 'Failed to update categories')
    }
  }

  const handleAddChannel = async (channel: { id: string, name: string }) => {
    // Optimistic update
    setWhitelisted(prev => new Set(prev).add(channel.id))
    setLocalChannels(prev => [...prev, { external_id: channel.id, name: channel.name, is_active: true }])

    const res = await addExternalChannel({
      external_id: channel.id,
      name: channel.name
    })

    if (res.success) {
      toast.success(`Added ${channel.name} to whitelist`)
    } else {
      // Revert if failed
      setWhitelisted(prev => {
        const next = new Set(prev)
        next.delete(channel.id)
        return next
      })
      setLocalChannels(prev => prev.filter(c => c.external_id !== channel.id))
      toast.error('Failed to add channel')
    }
  }

  const handleRemoveChannel = async (externalId: string) => {
    // Optimistic update
    const previousChannels = [...localChannels]
    setWhitelisted(prev => {
      const next = new Set(prev)
      next.delete(externalId)
      return next
    })
    setLocalChannels(prev => prev.filter(c => c.external_id !== externalId))

    const res = await removeExternalChannel(externalId)
    if (res.success) {
      toast.success('Removed from whitelist')
    } else {
      // Revert if failed
      setWhitelisted(prev => new Set(prev).add(externalId))
      setLocalChannels(previousChannels)
      toast.error('Failed to remove channel')
    }
  }

  const filteredSearch = externalChannels
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 10) // Limit results for performance

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Categories Setup */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-neutral-500" />
          <h3 className="text-lg font-semibold">Global External Settings</h3>
        </div>
        <form onSubmit={handleUpdateCategories} className="space-y-4">
          <input type="hidden" name="key" value="allowed_categories" />
          <div>
            <label className="text-sm font-medium mb-1.5 block">Allowed Categories (comma separated) (general, news, movies, music, sports, animation, documentary, education, familiy, kids, lifestyle, comedy, classic, religious, shop)</label>
            <div className="flex gap-2">
              <Input
                name="value"
                defaultValue={Array.isArray(allowedCategories) ? allowedCategories.join(', ') : ''}
                placeholder="family, general, movies, news..."
                className="flex-1"
              />
              <Button type="submit" className='text-white hover:cursor-pointer bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200'>Save Categories</Button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Only channels from these categories will be fetched from the external API.
            </p>
          </div>
        </form>
      </section>

      {/* Whitelist Manager */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-neutral-500" />
          <h3 className="text-lg font-semibold">External Channels Whitelist</h3>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search external channels (e.g. Antena 3, Telecinco...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {searchQuery && (
          <div className="border border-neutral-100 dark:border-neutral-800 rounded-lg overflow-hidden mb-8">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
              Search Results
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredSearch.length > 0 ? (
                filteredSearch.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-neutral-500">{c.id} • {c.categories?.join(', ')}</p>
                    </div>
                    {whitelisted.has(c.id) ? (
                      <Button className="text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/20" disabled>
                        Already Whitelisted
                      </Button>
                    ) : (
                      <Button onClick={() => handleAddChannel(c)} className="gap-1">
                        <Plus className="w-3 h-3" /> Add to Whitelist
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-neutral-500">No channels found</div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            Your Whitelisted Channels ({localChannels.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {localChannels.length > 0 ? (
              localChannels.map((c) => (
                <div key={c.external_id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <span className="text-sm font-medium">{c.name}</span>
                  <Button className="gap-1 text-white hover:cursor-pointer bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200" onClick={() => handleRemoveChannel(c.external_id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-xl text-neutral-400 text-sm">
                No channels in whitelist yet. Search and add some above!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
