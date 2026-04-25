import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://asstream-v2.fly.dev'

  // Aquí agregamos las rutas públicas que queremos que Google indexe
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1, // Prioridad máxima para la página de inicio
    },
    // Si en el futuro tienes un blog o páginas estáticas (ej. /pricing, /about), 
    // las agregarías aquí.
  ]
}
