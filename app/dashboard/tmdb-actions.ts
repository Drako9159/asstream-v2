'use server'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function searchTMDBMedia(query: string) {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) throw new Error('TMDB_API_KEY no está configurada')

  const url = `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=es-ES&page=1&include_adult=false`
  
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${apiKey}`
    }
  }

  // TMDB supports api_key param or Bearer auth. We'll use api_key param for simplicity if it's just a raw hash,
  // but if the user provides an Access Token (v4), Bearer is better. Standard v3 uses ?api_key=...
  // Let's fallback to query param to be safe if it's a v3 key.
  const fetchUrl = `${url}&api_key=${apiKey}`

  const response = await fetch(fetchUrl, { headers: { accept: 'application/json' } })
  if (!response.ok) {
    throw new Error('Error buscando en TMDB')
  }

  const data = await response.json()
  return data.results
}

export async function getTMDBDetails(id: number, mediaType: 'movie' | 'tv') {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) throw new Error('TMDB_API_KEY no está configurada')

  const url = `${TMDB_BASE_URL}/${mediaType}/${id}?language=es-ES&api_key=${apiKey}`
  
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) {
    throw new Error('Error obteniendo detalles en TMDB')
  }

  const data = await response.json()
  
  return {
    title: data.title || data.name,
    description: data.overview,
    poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
    banner_url: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : ''
  }
}
