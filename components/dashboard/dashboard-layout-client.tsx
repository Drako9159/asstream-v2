'use client'

import { useState, useEffect } from 'react'
import { CategoryManager, Category } from './category-client'
import { ChannelManager, Channel } from './channel-client'
import { ListVideo, PlusCircle, LayoutList, FolderPlus } from 'lucide-react'

type Tab = 'list-channels' | 'create-channel' | 'list-categories' | 'create-category'

export function DashboardSidebarLayout({
  categories,
  channels,
  user
}: {
  categories: Category[]
  channels: Channel[]
  user: any
}) {
  const [activeTab, setActiveTab] = useState<Tab>('list-channels')
  const [fullUrl, setFullUrl] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFullUrl(`${window.location.origin}/api/feed?user_id=${user.id}`)
    }
  }, [user])

  const tabClass = (tab: Tab) =>
    `w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-md text-sm transition-colors ${activeTab === tab ? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 space-y-6">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 shadow-sm">
          <p className="text-xs text-neutral-500 mb-1 uppercase font-bold tracking-wider">Current Session</p>
          <div className="break-all text-sm font-medium dark:text-neutral-200 truncate" title={user.email}>
            {user.email}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 shadow-sm">
          <p className="text-xs text-neutral-500 mb-1 uppercase font-bold tracking-wider">Roku Feed URL</p>
          <div className="break-all text-xs font-mono dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-900 p-2 rounded mt-2 select-all">
            {fullUrl}
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 leading-tight">Paste this URL into your Roku Direct Publisher dashboard.</p>
        </div>

        <nav className="space-y-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-2 rounded-lg shadow-sm">
          <p className="text-xs text-neutral-500 mb-2 uppercase font-bold tracking-wider px-2 pt-2">Channels</p>
          <button onClick={() => setActiveTab('list-channels')} className={tabClass('list-channels') + ' hover:cursor-pointer'}>
            <ListVideo className="w-4 h-4" />
            Channels List
          </button>
          <button onClick={() => setActiveTab('create-channel')} className={tabClass('create-channel') + ' hover:cursor-pointer'}>
            <PlusCircle className="w-4 h-4" />
            New Channel
          </button>

          <div className="h-px bg-neutral-100 dark:bg-neutral-800 mx-2 my-2"></div>

          <p className="text-xs text-neutral-500 mb-2 uppercase font-bold tracking-wider px-2 pt-2">Categories</p>
          <button onClick={() => setActiveTab('list-categories')} className={tabClass('list-categories') + ' hover:cursor-pointer'}>
            <LayoutList className="w-4 h-4" />
            Categories List
          </button>
          <button onClick={() => setActiveTab('create-category')} className={tabClass('create-category') + ' hover:cursor-pointer'}>
            <FolderPlus className="w-4 h-4" />
            New Category
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm min-h-[500px]">
        {activeTab === 'list-channels' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-bold dark:text-neutral-50 text-neutral-900 mb-6">Channels List</h2>
            <ChannelManager initialChannels={channels} categories={categories} viewMode="list" />
          </div>
        )}
        {activeTab === 'create-channel' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-bold dark:text-neutral-50 text-neutral-900 mb-6">New Channel</h2>
            <ChannelManager initialChannels={channels} categories={categories} viewMode="create" />
          </div>
        )}
        {activeTab === 'list-categories' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-bold dark:text-neutral-50 text-neutral-900 mb-6">Categories List</h2>
            <CategoryManager initialCategories={categories} viewMode="list" />
          </div>
        )}
        {activeTab === 'create-category' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-bold dark:text-neutral-50 text-neutral-900 mb-6">New Category</h2>
            <CategoryManager initialCategories={categories} viewMode="create" />
          </div>
        )}
      </main>
    </div>
  )
}
