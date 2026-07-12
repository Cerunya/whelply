import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'
import BreederContactSidebar from '@/components/BreederContactSidebar'

import { generateBreederMetadata } from '@/lib/breeder-metadata'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return generateBreederMetadata(params.slug, '/hunde', 'Erwachsene Hunde')

export const dynamic = 'force-dynamic'

export default async function ZuechterErwachseneHundePage({
  params,
}: {
  params: { slug: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()

  const tabs = await getBreederTabs(breeder.id)

  const adultListings = await prisma.listing.findMany({
    where: { breederId: breeder.id, status: { in: ['available', 'reserved', 'sold'] }, type: 'adult_dog' },
    include: {
      breed: { select: { nameDe: true } },
      media: { where: { isPrimary: true }, take: 1, select: { url: true } },
      // sex, description, priceCents are scalar fields included automatically
    },
    orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="hunde" />

        <BreederPageContent bgColor={breeder.themeBgColor} sidebar={
          <BreederContactSidebar
            kennelName={breeder.kennelName}
            displayName={breeder.displayName}
            slug={params.slug}
            city={breeder.city}
            state={breeder.state}
            street={breeder.street}
            zip={breeder.zip}
            showAddress={breeder.showAddress}
            phone={breeder.phone}
            showPhone={breeder.showPhone}
            website={breeder.website}
            socialInstagram={breeder.socialInstagram}
            socialFacebook={breeder.socialFacebook}
            socialTiktok={breeder.socialTiktok}
            socialYoutube={breeder.socialYoutube}
            themeColor={breeder.themeColor}
            themeAccentColor={breeder.themeAccentColor}
            verband={breeder.verband}
            verificationLevel={breeder.verificationLevel}
            fullName={breeder.fullName}
            showFullName={breeder.showFullName}
          />
        }>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
            Hunde zu vergeben
          </h2>

          {adultListings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">Aktuell keine Hunde zu vergeben.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adultListings.map((listing) => {
                const tint = listing.status === 'sold' ? 'sold' : listing.sex === 'male' ? 'male' : listing.sex === 'female' ? 'female' : null
                const borderClass = tint === 'sold' ? 'border-stone-300 bg-stone-100 opacity-60'
                  : tint === 'male' ? 'border-blue-300 bg-blue-50'
                  : tint === 'female' ? 'border-pink-300 bg-pink-50'
                  : 'border-cream-deep bg-white hover:border-forest/20'
                const price = listing.priceCents
                  ? (listing.priceCents / 100).toLocaleString('de-DE') + ' \u20ac'
                  : 'Auf Anfrage'
                return (
                  <a key={listing.id} href={`/welpen/${listing.id}`}
                    className={`flex items-start gap-4 rounded-xl border p-4 hover:shadow-sm transition-all ${borderClass}`}>
                    {listing.media[0]?.url ? (
                      <img src={listing.media[0].url} alt={listing.title ?? ''} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-cream-dark flex-shrink-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-stone-800">{listing.title || listing.breed.nameDe}</p>
                          {listing.sex && (
                            <p className={`text-xs font-medium mt-0.5 ${tint === 'male' ? 'text-blue-500' : tint === 'female' ? 'text-pink-500' : 'text-stone-400'}`}>
                              {listing.sex === 'male' ? 'Rüde' : 'Hündin'}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right space-y-1">
                          {listing.status === 'available' && (
                            <span className="block text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Noch frei</span>
                          )}
                          {listing.status === 'reserved' && (
                            <span className="block text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Reserviert</span>
                          )}
                          {listing.status === 'sold' && (
                            <span className="block text-xs font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">Verkauft</span>
                          )}
                          <p className="text-sm font-bold text-stone-700">{price}</p>
                        </div>
                      </div>
                      {listing.description && (
                        <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">{listing.description}</p>
                      )}
                      <p className="text-xs text-stone-400 mt-1">{listing.breed.nameDe}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </BreederPageContent>
      </main>
      <BreederFooter
        kennelName={breeder.kennelName}
        slug={params.slug}
        themeColor={breeder.themeColor}
        themeAccentColor={breeder.themeAccentColor}
        socialInstagram={breeder.socialInstagram}
        socialFacebook={breeder.socialFacebook}
        socialTiktok={breeder.socialTiktok}
        socialYoutube={breeder.socialYoutube}
        website={breeder.website}
      />
    </>
  )
}
