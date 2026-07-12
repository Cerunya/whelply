import { prisma } from '@/lib/prisma'

export type BreederHeaderData = {
  id: string
  kennelName: string
  displayName: string | null
  fullName: string | null
  showFullName: boolean
  city: string | null
  state: string | null
  street: string | null
  zip: string | null
  showAddress: boolean
  phone: string | null
  showPhone: boolean
  website: string | null
  verband: string | null
  mitgliedsnummer: string | null
  verificationLevel: string
  themeColor: string | null
  themeAccentColor: string | null
  themeNavColor: string | null
  themeBgColor: string | null
  themeFont: string | null
  themeAlign: string | null
  themeBgFixed: boolean
  themeBgOverlay: string | null
  subdomain: string | null
  isPublished: boolean
  socialInstagram: string | null
  socialFacebook: string | null
  socialTiktok: string | null
  socialYoutube: string | null
  userId: string
  headerImageUrl: string | null
  backgroundImageUrl: string | null
}

export async function getBreederBySlug(slug: string): Promise<BreederHeaderData | null> {
  const breeder = await prisma.breederProfile.findFirst({
    where: {
      user: {
        kennelName: {
          equals: slug,
          mode: 'insensitive',
        },
      },
    },
    select: {
      id: true,
      kennelName: true,
      displayName: true,
      fullName: true,
      showFullName: true,
      city: true,
      state: true,
      street: true,
      zip: true,
      showAddress: true,
      phone: true,
      showPhone: true,
      website: true,
      verband: true,
      mitgliedsnummer: true,
      verificationLevel: true,
      themeColor: true,
      themeAccentColor: true,
      themeNavColor: true,
      themeBgColor: true,
      themeFont: true,
      themeAlign: true,
      themeBgFixed: true,
      themeBgOverlay: true,
      subdomain: true,
	  isPublished: true,
      socialInstagram: true,
      socialFacebook: true,
      socialTiktok: true,
      socialYoutube: true,
      userId: true,
      media: {
        where: {
          purpose: { in: ['header', 'background'] },
        },
        select: {
          purpose: true,
          storageKey: true,
        },
      },
    },
  })

  if (!breeder) return null

  const headerMedia = breeder.media.find((m) => m.purpose === 'header')
  const bgMedia = breeder.media.find((m) => m.purpose === 'background')

  return {
    id: breeder.id,
    kennelName: breeder.kennelName,
    displayName: breeder.displayName,
    fullName: breeder.fullName,
    showFullName: breeder.showFullName ?? false,
    city: breeder.city,
    state: breeder.state,
    street: breeder.street,
    zip: breeder.zip,
    showAddress: breeder.showAddress ?? false,
    phone: breeder.phone,
    showPhone: breeder.showPhone ?? false,
    website: breeder.website,
    verband: breeder.verband,
    mitgliedsnummer: breeder.mitgliedsnummer,
    verificationLevel: breeder.verificationLevel ?? 'none',
    themeColor: breeder.themeColor,
    themeAccentColor: breeder.themeAccentColor,
    themeNavColor: breeder.themeNavColor,
    themeBgColor: breeder.themeBgColor,
    themeFont: breeder.themeFont,
    themeAlign: breeder.themeAlign,
    themeBgFixed: breeder.themeBgFixed ?? false,
    themeBgOverlay: breeder.themeBgOverlay,
    subdomain: breeder.subdomain,
	isPublished: breeder.isPublished ?? true,
    socialInstagram: breeder.socialInstagram,
    socialFacebook: breeder.socialFacebook,
    socialTiktok: breeder.socialTiktok,
    socialYoutube: breeder.socialYoutube,
    userId: breeder.userId,
    headerImageUrl: headerMedia
      ? `/api/media/${headerMedia.storageKey}/view`
      : null,
    backgroundImageUrl: bgMedia
      ? `/api/media/${bgMedia.storageKey}/view`
      : null,
  }
}

export async function getBreederTabs(breederId: string) {
  const [dogsCount, littersCount, newsCount, galleryCount, adultDogsCount] =
    await Promise.all([
      prisma.dog.count({
        where: { breederId, isStud: true },
      }),
      prisma.litter.count({
        where: { breederId },
      }),
      prisma.newsPost.count({
        where: { breederId },
      }),
      prisma.media.count({
        where: { breederId, purpose: 'gallery' },
      }),
      prisma.listing.count({
        where: {
          breederId,
          type: 'adult_dog',
          status: { in: ['available', 'reserved'] },
        },
      }),
    ])

  return {
    hasZuchthunde: dogsCount > 0,
    hasWuerfe: littersCount > 0,
    hasHunde: adultDogsCount > 0,
    hasAktuelles: newsCount > 0,
    hasGalerie: galleryCount > 0,
  }
}
