import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

export async function getBreederBySlug(slug: string) {
  // Alle Züchter laden und nach Slug matchen
  // (Hinweis: bei vielen Züchtern später durch eine echte slug-Spalte ersetzen)
  const breeders = await prisma.breederProfile.findMany({
    select: { id: true, userId: true, kennelName: true, subdomain: true },
  })
  const match = breeders.find((b) => slugify(b.kennelName) === slug || b.subdomain === slug)
  if (!match) return null
  const breeder = await prisma.breederProfile.findUnique({
    where: { id: match.id },
    include: {
      media: {
        where: { purpose: { in: ['header', 'background'] } },
        select: { url: true, purpose: true },


      },
      dogs: {
        select: { breed: { select: { nameDe: true } } },
        distinct: ['breedId'],
      },
    },
  })

  return breeder
}



export type BreederTabFlags = {
  zuchthunde: boolean
  wuerfe: boolean
  erwachseneHunde: boolean
  aktuelles: boolean
  galerie: boolean
}

export async function getBreederTabs(breederId: string): Promise<BreederTabFlags> {
  const [studDogsCount, featuredDogsCount, breedingFemalesCount, littersCount, adultListingsCount, newsCount, galleryCount] = await Promise.all([
    prisma.dog.count({ where: { breederId, isStud: true, sex: 'male' } }),
    prisma.dog.count({ where: { breederId, description: { not: null } } }),
    prisma.dog.count({ where: { breederId, isStud: true, sex: 'female' } }),
    prisma.litter.count({ where: { breederId } }),
    prisma.listing.count({ where: { breederId, status: { in: ['available', 'reserved', 'sold'] }, type: 'adult_dog' } }),
    prisma.newsPost.count({ where: { breederId } }),
    prisma.media.count({ where: { breederId, purpose: 'gallery' } }),
  ])

  return {
    zuchthunde: studDogsCount > 0 || featuredDogsCount > 0 || breedingFemalesCount > 0,
    wuerfe: littersCount > 0,
    erwachseneHunde: adultListingsCount > 0,
    aktuelles: newsCount > 0,
    galerie: galleryCount > 0,
  }
}