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

  let catQuery = supabase.from('categories').select('*').eq('user_id', userId)
  let chanQuery = supabase.from('channels').select('*').eq('is_active', true).eq('user_id', userId)

  const [
    { data: categories, error: catError },
    { data: channels, error: chanError }
  ] = await Promise.all([catQuery, chanQuery])

  if (catError || chanError || !categories || !channels) {
    return NextResponse.json({ error: 'Error adding data from supabase' }, { status: 500, headers: corsHeaders })
  }

  const feed: any = {
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

    // If the category is tvSpecials, try to get the direct m3u8 from Twitch using the channel title
    if (key === 'tvSpecials') {
      try {
        const twitch = require('twitch-m3u8')
        const twitchUsername = channel.title.replace(/\s+/g, '').toLowerCase()
        const streams = await twitch.getStream(twitchUsername)

        if (streams && streams.length > 0) {
          finalUrl = streams[0].url
        } else {
          // The Twitch channel is not live or no streams were found, it is skipped
          return null
        }
      } catch (err) {
        // Exceptions normally indicate that the user is not live or does not exist
        console.error('The channel is not live or the connection failed:', channel.title)
        return null
      }
    } else if (key === 'liveFeeds') {
      // Validating if the live stream URL responds
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout of 5s to not block

        // Make a HEAD request to only fetch headers, significantly faster than GET
        const response = await fetch(finalUrl, {
          method: 'HEAD',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          console.error(`Stream inactive (status ${response.status}) for channel:`, channel.title)
          return null
        }
      } catch (err) {
        console.error('Stream is not available or timeout expired for:', channel.title)
        return null
      }
    }

    const channelData = {
      id: channel.id,
      title: channel.title,
      content: {
        dateAdded: channel.created_at,
        videos: [
          {
            videoType: finalUrl.includes('.m3u8') ? "HLS" : "MP4",
            url: finalUrl,
            quality: channel.quality
          }
        ],
        duration: 123,
        captions: [
          {
            url: "https://static-delivery.sr.roku.com/17058b9e-a7dc-477e-afaa-0e10d97ddb99/captions/HDCP_Error_RokuTipsandTricks_20210120T003500_cc_eng.vtt",
            language: "en",
            captionType: "CLOSED_CAPTION"
          }
        ],
        trickPlayFiles: [
          {
            url: "https://static-delivery.sr.roku.com/17058b9e-a7dc-477e-afaa-0e10d97ddb99/images/17058b9e-a7dc-477e-afaa-0e10d97ddb99-sd.bif",
            quality: "SD"
          },
          {
            url: "https://static-delivery.sr.roku.com/17058b9e-a7dc-477e-afaa-0e10d97ddb99/images/17058b9e-a7dc-477e-afaa-0e10d97ddb99-hd.bif",
            quality: "HD"
          },
          {
            url: "https://static-delivery.sr.roku.com/17058b9e-a7dc-477e-afaa-0e10d97ddb99/images/17058b9e-a7dc-477e-afaa-0e10d97ddb99-fhd.bif",
            quality: "FHD"
          }
        ],
        language: "es",
        audioFormats: [
          "stereo"
        ],
        audioTracks: [
          {
            language: "en",
            label: "English (Original)"
          }
        ]
      },
      thumbnail: channel.poster_url || "https://via.placeholder.com/500",
      backdrop: channel.banner_url || "https://via.placeholder.com/1600",
      shortDescription: channel.description || "Sin descripción",
      releaseDate: channel.created_at.split('T')[0],
      longDescription: channel.description || "Sin descripción",
      tags: [
        category.name.toLowerCase(),
        "roku",
        "streaming",
        "content"
      ],
      genres: [
        category.name
      ],
      rating: {
        rating: "NR",
        ratingSource: "USA_PR"
      },
      externalIds: [
        {
          id: channel.id.substring(0, 8),
          idType: "PARTNER_ASSET_ID"
        },
        {
          idType: "PARTNER_TITLE_ID",
          id: channel.id.substring(0, 8)
        }
      ]
    }

    return { key, channelData }
  })

  // Esperar a que todos los canales resuelvan sus promesas (incluyendo la petición a Twitch)
  const resolvedChannels = await Promise.all(channelPromises)

  // Agregar los resultados al feed json
  resolvedChannels.forEach(res => {
    if (res && feed[res.key]) {
      feed[res.key].push(res.channelData)
    }
  })

  // --- External API Integration (IPTV-ORG) ---
  const ALLOWED_CATEGORIES = ['family', 'general', 'movies', 'entertainment'] // Escribe aquí las categorías que quieres obtener
  const IGNORED_CHANNELS = ['Telenovisa43', 'The Pet Collective', 'Buena TV', 'Canal Nets',
    'Canica TV', 'Capital 21', 'Cibaena TV', 'Ciudades del Ocio TV', 'Claro Vision TV',
    'EDN TV', 'GalaxiATeVe', 'Gex TV', 'GikTVMX', 'Girovisual', 'GO TV', 'Guaro TV',
    'Hispania TV', 'America TeVe', 'Antena 21', 'Bacan Te Veo', 'Chile Channel', 'MakroDigital Television',
    'Mas Talk', 'Mel Radio TV', 'Metro TV', '¡OPA!', 'Yunavision', 'WRUA-DT1', 'VB Media TV',
    'Univers TV', 'Unifranz', 'TV Canal Sur', 'TeveColombia', 'Telerayo', 'Telemundo Corpus Christi',
    'Super Cable', 'SolTV', 'SAS TV', 'Red+', 'RCN Mas', 'Radio Yguazu TV', 'Pula TV',
    'PSN', 'Power Max Radio TV', 'Popu TV', 'Oasis TV', 'Nitida TV', '5tv', 'AION TV',
    'Aire de Santa Fe', 'Alacanti TV', 'Alcarria TV', 'Algo Media TV', 'Alsacias Television',
    'AlternaTV', 'America Internacional', 'America Paraguay', 'Antofagasta TV', 'Arabi TV',
    'Argentinisima Satelital', 'Atabal TV', 'Atcco Canal 2', 'ATV Sur', 'Austral TV', 'Aysen TV',
    'B15 Fresnillo', 'B15 Zacatecas', 'Bolivision', 'Bonao TV', 'Bruno Masi TV', 'CaliTV',
    'Camu TV', 'Canal 11 TuTV', 'Canal Dos', 'CDN', 'Color Vision', 'Digital 15', 'Paraguay TV',
    'Radio Bocairent TV', 'SUR TV Itapua', 'Telefuturo', 'Trece', 'Telesistema 11', 'TVGE',
    'Radiocanal', 'Ciudad Magazine', 'Citytv Bogota', 'Caoba TV Radio', 'Canal Sur 2', 'Canal Sierra de Cadiz',
    'Canal San Roque', 'Canal Mundo Vision', 'Canal Mas Television', 'Canal Institucional', 'Canal Habana',
    'Canal Extremadura Satelite', 'Canal Calima TV', 'Canal 8 Vision TV', 'Canal 8 TV+', 'Canal 8',
    'Canal 7 Neuquen', 'Canal 5 TV Cozumel', 'Canal 56', 'Canal 4 RD', 'Canal 33 Tijuana', 'Canal 21 Tachira',
    'Canal 21 Huancayo', 'Canal 1 Nuble', 'Canal 12', 'ATV', 'TV Publica', 'Telemicro', 'TeleAragua', 'Tele Antillas',
    'KNSO 51.1', 'CreaLaTV', 'CNT Mas TV', 'CNC Santander de Quilichao', 'CNC Bugavision', 'CMM TV', 'Cinevision Canal 19',
    'CHTV', 'Cerritos TV3', 'CAtv', 'Catatumbo TV', 'Caritas TV', 'Capricho TV', 'Canal Malaga RTV',
    'Canal DTV', 'Aguacate TV', 'Colosal TV'] // Escribe aquí los nombres de canales que quieres skipear

  try {
    const [channelsRes, feedsRes, streamsRes, logosRes] = await Promise.all([
      fetch('https://iptv-org.github.io/api/channels.json').then(r => r.json()),
      fetch('https://iptv-org.github.io/api/feeds.json').then(r => r.json()),
      fetch('https://iptv-org.github.io/api/streams.json').then(r => r.json()),
      fetch('https://iptv-org.github.io/api/logos.json').then(r => r.json())
    ])

    // 1. Obtener IDs de canales con idioma español ("spa")
    const spanishChannelIds = new Set(
      feedsRes.filter((f: any) => f.languages && f.languages.includes('spa')).map((f: any) => f.channel)
    )

    // 2. Filtrar canales por idioma, categorías y blocklist
    const filteredChannels = channelsRes.filter((c: any) => {
      if (!c.categories) return false
      const hasAllowedCategory = c.categories.some((cat: string) => ALLOWED_CATEGORIES.includes(cat.toLowerCase()))
      const isSpanish = spanishChannelIds.has(c.id)
      const isNotIgnored = !IGNORED_CHANNELS.includes(c.name)
      return hasAllowedCategory && isSpanish && isNotIgnored
    })


    // 3. Mapear y validar los streams con control de concurrencia (ej. lotes de 20)
    const externalChannelPromises = filteredChannels.map(async (channel: any) => {
      const stream = streamsRes.find((s: any) => s.channel === channel.id)
      if (!stream || !stream.url) return null

      // Validación de disponibilidad del stream
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const response = await fetch(stream.url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal })
        clearTimeout(timeoutId)
        if (!response.ok) return null
      } catch (err) {
        return null // Stream inaccesible o timeout
      }

      // Obtener logo
      const logo = logosRes.find((l: any) => l.channel === channel.id)
      const thumbnailUrl = logo?.url || "https://via.placeholder.com/500"

      const assignedCategory = channel.categories.find((cat: string) => ALLOWED_CATEGORIES.includes(cat.toLowerCase())) || 'external'
      const key = toCamelCase(assignedCategory)

      const channelData = {
        id: channel.id,
        title: channel.name,
        content: {
          dateAdded: new Date().toISOString(),
          videos: [
            {
              videoType: stream.url.includes('.m3u8') ? "HLS" : "MP4",
              url: stream.url,
              quality: stream.quality || "HD"
            }
          ],
          duration: 123,
          captions: [],
          trickPlayFiles: [],
          language: "es",
          audioFormats: ["stereo"],
          audioTracks: [{ language: "es", label: "Spanish" }]
        },
        thumbnail: thumbnailUrl,
        backdrop: "https://via.placeholder.com/1600",
        shortDescription: channel.name || assignedCategory,
        releaseDate: new Date().toISOString().split('T')[0],
        longDescription: channel.name || assignedCategory,
        tags: [assignedCategory, "iptv", "external"],
        genres: [assignedCategory],
        rating: { rating: "NR", ratingSource: "USA_PR" }
      }

      return { key, channelData }
    })

    const resolvedExternal = await Promise.all(externalChannelPromises)

    resolvedExternal.forEach(res => {
      if (res) {
        if (!feed[res.key]) {
          feed[res.key] = []
        }
        feed[res.key].push(res.channelData)
      }
    })

  } catch (error) {
    console.error('Error fetching external IPTV API:', error)
  }

  // Eliminar arrays vacíos para un JSON más limpio y exacto al que espera el cliente si es necesario
  // Object.keys(feed).forEach(key => {
  //   if (Array.isArray(feed[key]) && feed[key].length === 0) {
  //     delete feed[key]
  //   }
  // })

  return NextResponse.json(feed, { headers: corsHeaders })
}
