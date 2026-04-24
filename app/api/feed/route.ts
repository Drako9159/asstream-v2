import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 300 // Caché (ISR) de 5 minutos


// Generic helper to convert words to camelCase (e.g. "Live Feeds" -> "liveFeeds")
const toCamelCase = (str: string) => {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return index === 0 ? word.toLowerCase() : word.toUpperCase()
  }).replace(/\s+/g, '')
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Opcional: Permitir filtrar por un usuario específico a través de query params ?user_id=123
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  let catQuery = supabase.from('categories').select('*')
  let chanQuery = supabase.from('channels').select('*').eq('is_active', true)

  if (userId) {
    catQuery = catQuery.eq('user_id', userId)
    chanQuery = chanQuery.eq('user_id', userId)
  }

  const { data: categories, error: catError } = await catQuery
  const { data: channels, error: chanError } = await chanQuery

  if (catError || chanError || !categories || !channels) {
    return NextResponse.json({ error: 'Error agregando datos desde supabase' }, { status: 500 })
  }

  const feed: any = {
    providerName: "Roku Developer Account",
    lastUpdated: new Date().toISOString(),
    language: "en"
  }

  // Inicializar los arrays de las categorías
  categories.forEach(cat => {
    const key = toCamelCase(cat.name)
    feed[key] = []
  })

  // Agrupar los canales de forma asíncrona
  const channelPromises = channels.map(async (channel) => {
    const category = categories.find(c => c.id === channel.category_id)
    if (!category) return null

    const key = toCamelCase(category.name)
    let finalUrl = channel.source_url

    // Si la categoría es tvSpecials, intentamos obtener el m3u8 directo de Twitch usando el título del canal
    if (key === 'tvSpecials') {
      try {
        const twitch = require('twitch-m3u8')
        const twitchUsername = channel.title.replace(/\s+/g, '').toLowerCase()
        const streams = await twitch.getStream(twitchUsername)
        
        if (streams && streams.length > 0) {
          finalUrl = streams[0].url
        } else {
          // El canal de Twitch no está en vivo o no se encontraron streams, se omite
          return null
        }
      } catch (err) {
        // Excepciones normalmente indican que el usuario no está en vivo o no existe
        console.error('El canal no está en vivo o falló la conexión:', channel.title)
        return null
      }
    } else if (key === 'liveFeeds') {
      // Validamos si la URL del stream en vivo responde
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout de 5s para no bloquear
        
        // Hacemos un GET que solo traerá cabeceras hasta que consumamos el body
        const response = await fetch(finalUrl, { 
          method: 'GET', 
          signal: controller.signal 
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          console.error(`Stream inactivo (status ${response.status}) para el canal:`, channel.title)
          return null
        }
      } catch (err) {
        console.error('El stream no está disponible o el timeout expiró para:', channel.title)
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

  // Eliminar arrays vacíos para un JSON más limpio y exacto al que espera el cliente si es necesario
  // Object.keys(feed).forEach(key => {
  //   if (Array.isArray(feed[key]) && feed[key].length === 0) {
  //     delete feed[key]
  //   }
  // })

  return NextResponse.json(feed)
}
