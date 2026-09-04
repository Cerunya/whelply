import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Statische Seiten
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/welpen`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/zuchtrueden`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/hunde`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/zuechter`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/dienste`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/ratgeber`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/impressum`, lastModified: now, changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE}/datenschutz`, lastModified: now, changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE}/agb`, lastModified: now, changeFrequency: 'monthly', priority: 0.2 },
  ]

  // Welpen-Inserate (verfügbar/reserviert)
  const puppyListings = await prisma.listing.findMany({
    where: { status: { in: ['available', 'reserved'] }, type: 'puppy', slug: { not: null } },
    select: { slug: true, updatedAt: true },
  })
  const puppyPages: MetadataRoute.Sitemap = puppyListings.map((l) => ({
    url: `${BASE}/welpen/${l.slug}`,
    lastModified: l.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Erwachsene Hunde Inserate
  const adultListings = await prisma.listing.findMany({
    where: { status: { in: ['available', 'reserved'] }, type: { not: 'puppy' }, slug: { not: null } },
    select: { slug: true, updatedAt: true },
  })
  const adultPages: MetadataRoute.Sitemap = adultListings.map((l) => ({
    url: `${BASE}/inserate/${l.slug}`,
    lastModified: l.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Deckrüden
  // Hinweis: Dog hat kein updatedAt-Feld im Schema — createdAt als lastModified
  const studs = await prisma.dog.findMany({
    where: { isStud: true, slug: { not: null } },
    select: { slug: true, createdAt: true },
  })
  const studPages: MetadataRoute.Sitemap = studs.map((d) => ({
    url: `${BASE}/hund/${d.slug}`,
    lastModified: d.createdAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Züchter-Profile
  const breeders = await prisma.breederProfile.findMany({
    where: { isActive: true, isPublished: true, subdomain: { not: null } },
    select: { subdomain: true, updatedAt: true },
  })
  const breederPages: MetadataRoute.Sitemap = breeders.map((b) => ({
    url: `${BASE}/zuechter/${b.subdomain}`,
    lastModified: b.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // Ratgeber-Artikel
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    select: { slug: true, category: true, updatedAt: true },
  })
  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE}/${a.category === 'rassen' ? 'rassen' : 'ratgeber'}/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // Dienstleister
  // Hinweis: ServiceProvider hat kein updatedAt-Feld im Schema — createdAt als lastModified
  const services = await prisma.serviceProvider.findMany({
    select: { id: true, createdAt: true },
  })
  const servicePages: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${BASE}/dienste/${s.id}`,
    lastModified: s.createdAt,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [
    ...staticPages,
    ...puppyPages,
    ...adultPages,
    ...studPages,
    ...breederPages,
    ...articlePages,
    ...servicePages,
  ]
}
