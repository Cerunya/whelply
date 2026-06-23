import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import ListingCard from '@/components/ListingCard'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'

export const dynamic = 'force-dynamic'

export default async function ZuechterErwachseneHundePage({
  params,
}: {
  params: { slug: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const displayName = breeder.displayName || breeder.kennelName
  const now = new Date()

  const adultListings = await prisma.listing.findMany({
    where: { breederId: breeder.id, status: { in: ['available', 'reserved', 'sold'] }, type: 'adult_dog' },
    include: {
      breed: { select: { nameDe: true } },
      media: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
    orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="hunde" />

        <BreederPageContent>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
            Hunde zu vergeben
          </h2>

          {adultListings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">Aktuell keine Hunde zu vergeben.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {adultListings.map((listing) => (
                <div key={listing.id} className="relative">
                  <ListingCard
                    id={listing.id}
                    breedName={listing.breed.nameDe}
                    kennelName={displayName}
                    puppyName={listing.title}
                    city={breeder.city}
                    state={breeder.state}
                    priceCents={listing.priceCents}
                    isBoosted={!!listing.boostExpiresAt && listing.boostExpiresAt > now}
                    imageUrl={listing.media[0]?.url}
                  />
                  {listing.status !== 'available' && (
                    <span className={`absolute top-2 right-2 text-xs font-bold px-2.5 py-1 rounded-full ${
                      listing.status === 'reserved' ? 'bg-amber-400 text-amber-900' : 'bg-stone-700 text-white'
                    }`}>
                      {listing.status === 'reserved' ? 'Reserviert' : 'Verkauft'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </BreederPageContent>
      </main>
      <Footer />
    </>
  )
}
