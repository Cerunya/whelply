import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/dashboard-service/',
          '/admin/',
          '/api/',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
