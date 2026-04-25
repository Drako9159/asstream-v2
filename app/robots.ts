import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://asstream-v2.fly.dev'

  return {
    rules: {
      userAgent: '*',
      // Allow all, disallow private areas  
      allow: '/',
      disallow: [
        '/dashboard/',
        '/api/',
        '/auth/',
        '/login',
        '/register',
        '/forgot-password',
        '/update-password',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
