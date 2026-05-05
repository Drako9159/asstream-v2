import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 300 // Caché (ISR) de 5 minutos

// --- CORS Configuration ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// --- Basic In-Memory Rate Limiter ---
const rateLimitMap = new Map<string, { count: number, resetAt: number }>()

// --- In-Memory IPTV-ORG Cache ---
let iptvCache: { channelsRes: any, feedsRes: any, streamsRes: any, logosRes: any } | null = null
let iptvCacheTimestamp = 0
const IPTV_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function checkRateLimit(ip: string) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes window
  const maxRequests = 100 // 100 requests per 15 minutes

  let userRecord = rateLimitMap.get(ip)

  if (!userRecord || userRecord.resetAt < now) {
    userRecord = { count: 1, resetAt: now + windowMs }
    rateLimitMap.set(ip, userRecord)
    return { success: true }
  }

  if (userRecord.count >= maxRequests) {
    return { success: false }
  }

  userRecord.count += 1
  return { success: true }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Generic helper to convert words to camelCase (e.g. "Live Feeds" -> "liveFeeds")
const toCamelCase = (str: string) => {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return index === 0 ? word.toLowerCase() : word.toUpperCase()
  }).replace(/\s+/g, '')
}

export async function GET(request: Request) {
  // Check Rate Limit
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown-ip'
  const rateLimitResult = checkRateLimit(ip)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Limit is 100 requests per 15 minutes.' },
      { status: 429, headers: corsHeaders }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Require filtering by a specific user through query params ?user_id=123
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400, headers: corsHeaders })
  }

  // Queries
  const catQuery = supabase.from('categories').select('*').eq('user_id', userId)
  const chanQuery = supabase.from('channels').select('*').eq('is_active', true).eq('user_id', userId)
  const extSettingsQuery = supabase.from('external_settings').select('value').eq('user_id', userId).eq('key', 'allowed_categories').single()
  const extChannelsQuery = supabase.from('external_channels').select('external_id').eq('user_id', userId).eq('is_active', true)

  const [
    { data: categories, error: catError },
    { data: channels, error: chanError },
    { data: extSettings },
    { data: extChannels }
  ] = await Promise.all([catQuery, chanQuery, extSettingsQuery, extChannelsQuery])

  if (catError || chanError || !categories || !channels) {
    return NextResponse.json({ error: 'Error fetching data from supabase' }, { status: 500, headers: corsHeaders })
  }

  // Configuration from DB or defaults
  const ALLOWED_CATEGORIES = (extSettings?.value as string[]) || []
  const ALLOWED_CHANNELS = new Set((extChannels || []).map(c => c.external_id))

  const feed: Record<string, unknown> = {
    providerName: "Roku Developer Account",
    lastUpdated: new Date().toISOString(),
    language: "en"
  }

  // Initialize category arrays
  categories.forEach(cat => {
    const key = toCamelCase(cat.name)
    feed[key] = []
  })

  // Group channels asynchronously
  const channelPromises = channels.map(async (channel) => {
    const category = categories.find(c => c.id === channel.category_id)
    if (!category) return null

    const key = toCamelCase(category.name)
    let finalUrl = channel.source_url

    // Logic for tvSpecials (Twitch)
    if (key === 'tvSpecials') {
      try {
        const twitch = (await import('twitch-m3u8')).default || await import('twitch-m3u8')
        const twitchUsername = channel.title.replace(/\s+/g, '').toLowerCase()
        const streams = await twitch.getStream(twitchUsername)
        if (streams && streams.length > 0) {
          finalUrl = streams[0].url
        } else {
          return null
        }
      } catch {
        console.error('Twitch stream error:', channel.title)
        return null
      }
    } else if (key === 'liveFeeds') {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const response = await fetch(finalUrl, { method: 'HEAD', signal: controller.signal })
        clearTimeout(timeoutId)
        if (!response.ok) return null
      } catch {
        return null
      }
    }

    const channelData = {
      id: channel.id,
      title: channel.title,
      content: {
        dateAdded: channel.created_at,
        videos: [{ videoType: finalUrl.includes('.m3u8') ? "HLS" : "MP4", url: finalUrl, quality: channel.quality }],
        duration: 123,
        captions: [{ url: "https://static-delivery.sr.roku.com/17058b9e-a7dc-477e-afaa-0e10d97ddb99/captions/HDCP_Error_RokuTipsandTricks_20210120T003500_cc_eng.vtt", language: "en", captionType: "CLOSED_CAPTION" }],
        trickPlayFiles: [
          { url: "https://static-delivery.sr.roku.com/17058b9e-a7dc-477e-afaa-0e10d97ddb99/images/17058b9e-a7dc-477e-afaa-0e10d97ddb99-sd.bif", quality: "SD" },
          { url: "https://static-delivery.sr.roku.com/17058b9e-a7dc-477e-afaa-0e10d97ddb99/images/17058b9e-a7dc-477e-afaa-0e10d97ddb99-hd.bif", quality: "HD" },
          { url: "https://static-delivery.sr.roku.com/17058b9e-a7dc-477e-afaa-0e10d97ddb99/images/17058b9e-a7dc-477e-afaa-0e10d97ddb99-fhd.bif", quality: "FHD" }
        ],
        language: "es",
        audioFormats: ["stereo"],
        audioTracks: [{ language: "en", label: "English (Original)" }]
      },
      thumbnail: channel.poster_url || "https://via.placeholder.com/500",
      backdrop: channel.banner_url || "https://via.placeholder.com/1600",
      shortDescription: channel.description || "Sin descripción",
      releaseDate: channel.created_at.split('T')[0],
      longDescription: channel.description || "Sin descripción",
      tags: [category.name.toLowerCase(), "roku", "streaming", "content"],
      genres: [category.name],
      rating: { rating: "NR", ratingSource: "USA_PR" },
      externalIds: [
        { id: channel.id.substring(0, 8), idType: "PARTNER_ASSET_ID" },
        { idType: "PARTNER_TITLE_ID", id: channel.id.substring(0, 8) }
      ]
    }

    return { key, channelData }
  })

  const resolvedChannels = await Promise.all(channelPromises)
  resolvedChannels.forEach(res => {
    if (res && feed[res.key]) {
      (feed[res.key] as unknown[]).push(res.channelData)
    }
  })

  // --- External API Integration (IPTV-ORG) ---
  if (ALLOWED_CATEGORIES.length > 0 || ALLOWED_CHANNELS.size > 0) {
    try {
      const now = Date.now()
      
      if (!iptvCache || now - iptvCacheTimestamp > IPTV_CACHE_DURATION) {
        const [channelsRes, feedsRes, streamsRes, logosRes] = await Promise.all([
          fetch('https://iptv-org.github.io/api/channels.json').then(r => r.json()),
          fetch('https://iptv-org.github.io/api/feeds.json').then(r => r.json()),
          fetch('https://iptv-org.github.io/api/streams.json').then(r => r.json()),
          fetch('https://iptv-org.github.io/api/logos.json').then(r => r.json())
        ])
        
        iptvCache = { channelsRes, feedsRes, streamsRes, logosRes }
        iptvCacheTimestamp = now
      }

      const { channelsRes, feedsRes, streamsRes, logosRes } = iptvCache

      const spanishChannelIds = new Set(
        feedsRes.filter((f: { languages?: string[], channel: string }) => f.languages && f.languages.includes('spa')).map((f: { channel: string }) => f.channel)
      )

      const filteredChannels = channelsRes.filter((c: { id: string, categories?: string[] }) => {
        if (!c.categories) return false
        const hasAllowedCategory = c.categories.some((cat: string) => ALLOWED_CATEGORIES.includes(cat.toLowerCase()))
        const isSpanish = spanishChannelIds.has(c.id)
        const isWhitelisted = ALLOWED_CHANNELS.has(c.id)
        return isWhitelisted && isSpanish && hasAllowedCategory
      })

      const externalChannelPromises = filteredChannels.map(async (channel: { id: string, name: string, categories: string[] }) => {
        const stream = streamsRes.find((s: { channel: string, url: string, quality?: string }) => s.channel === channel.id)
        if (!stream || !stream.url) return null

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          const response = await fetch(stream.url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal })
          clearTimeout(timeoutId)
          if (!response.ok) return null
        } catch {
          return null
        }

        const logo = logosRes.find((l: { channel: string, url: string }) => l.channel === channel.id)
        const assignedCategory = channel.categories.find((cat: string) => ALLOWED_CATEGORIES.includes(cat.toLowerCase())) || 'external'
        const key = toCamelCase(assignedCategory)

        const channelData = {
          id: channel.id,
          title: channel.name,
          content: {
            dateAdded: new Date().toISOString(),
            videos: [{ videoType: stream.url.includes('.m3u8') ? "HLS" : "MP4", url: stream.url, quality: stream.quality || "HD" }],
            duration: 123,
            captions: [],
            trickPlayFiles: [],
            language: "es",
            audioFormats: ["stereo"],
            audioTracks: [{ language: "es", label: "Spanish" }]
          },
          thumbnail: logo?.url || "https://via.placeholder.com/500",
          backdrop: "https://via.placeholder.com/1600",
          shortDescription: channel.name,
          releaseDate: new Date().toISOString().split('T')[0],
          longDescription: channel.name,
          tags: [assignedCategory, "iptv", "external"],
          genres: [assignedCategory],
          rating: { rating: "NR", ratingSource: "USA_PR" }
        }

        return { key, channelData }
      })

      const resolvedExternal = await Promise.all(externalChannelPromises)
      resolvedExternal.forEach(res => {
        if (res) {
          if (!feed[res.key]) feed[res.key] = []
            ; (feed[res.key] as unknown[]).push(res.channelData)
        }
      })
    } catch (error) {
      console.error('Error fetching external IPTV API:', error)
    }
  }

  return NextResponse.json(feed, {
    headers: {
      ...corsHeaders,
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
