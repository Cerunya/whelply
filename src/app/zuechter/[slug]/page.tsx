import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ListingCard from '@/components/ListingCard'
import Link from 'next/link'

export default async function ZuechterProfilPage({
  params,
}: {
  params: { slug: string }
}) {
  // Alle Züchter laden und nach Slug matchen
  // (Hinweis: bei vielen Züchtern später durch eine echte slug-Spalte ersetzen)
  const breeders = await prisma.breederProfile.findMany({
    select: { id: true, kennelName: true },
  })
  const match = breeders.find((b) => slugify(b.kennelName) === params.slug)
  if (!match) notFound()

  const breeder = await prisma.breederProfile.findUnique({
    where: { id: match.id },
    include: {
      listings: {
        where: { status: { in: ['available', 'reserved', 'sold'] }, type: 'puppy' },
        include: {
          breed: { select: { nameDe: true } },
          media: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
      },
      litters: {
        include: {
          breed: { select: { nameDe: true } },
          media: { take: 1, select: { url: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      dogs: {
        where: { isStud: true },
        include: {
          breed: { select: { nameDe: true } },
          media: { take: 1, select: { url: true } },
        },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!breeder) notFound()

  // Separate Query: erwachsene Hunde zur Abgabe (eigene Relation-Instanz nötig, da
  // Prisma die gleiche Relation nicht zweimal mit unterschiedlichen Filtern in einem include erlaubt)
  const adultListings = await prisma.listing.findMany({
    where: { breederId: breeder.id, status: { in: ['available', 'reserved', 'sold'] }, type: 'adult_dog' },
    include: {
      breed: { select: { nameDe: true } },
      media: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
    orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
  })

  const now = new Date()
  const displayName = breeder.displayName || breeder.kennelName
  const location = [breeder.city, breeder.state].filter(Boolean).join(', ')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        {/* Header */}
        <section className="bg-forest px-4 py-14">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-semibold text-honey uppercase tracking-widest mb-2">
              {breeder.verband ? `${breeder.verband}-Züchter` : 'Züchter'}
            </p>
            <h1 className="font-serif text-4xl font-bold text-white mb-2">
              {displayName}
            </h1>
            {location && (
              <p className="text-white/70 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {location}
              </p>
            )}
            {breeder.verificationLevel !== 'none' && (
              <p className="text-honey text-sm mt-2 font-medium">✓ Verifizierter Züchter</p>
            )}
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Bio */}
          {breeder.bio && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-10">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-3">Über uns</h2>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                {breeder.bio}
              </p>
              {breeder.website && (
                <a
                  href={breeder.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-sm text-forest font-semibold hover:underline"
                >
                  Webseite besuchen →
                </a>
              )}
            </div>
          )}

          {/* Kontakt — Telefon/Adresse nur wenn vom Züchter freigegeben */}
          {(breeder.showPhone && breeder.phone) || (breeder.showAddress && breeder.street) ? (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-10">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-3">Kontakt</h2>
              <div className="space-y-2 text-sm text-stone-600">
                {breeder.showPhone && breeder.phone && (
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${breeder.phone}`} className="hover:text-forest">{breeder.phone}</a>
                  </p>
                )}
                {breeder.showAddress && breeder.street && (
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {breeder.street}{breeder.zip && `, ${breeder.zip}`}{breeder.city && ` ${breeder.city}`}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* Verfügbare Welpen */}
          <div className="mb-12">
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
              Welpen
            </h2>

            {breeder.listings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
                <p className="text-stone-400 text-sm">Aktuell keine Inserate.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {breeder.listings.map((listing) => (
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
          </div>

          {/* Würfe / Zuchtplanung */}
          {breeder.litters.length > 0 && (
            <div className="mb-12">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
                Würfe & Planung
              </h2>
              <div className="space-y-3">
                {breeder.litters.map((litter) => (
                  <div key={litter.id} className="bg-white rounded-xl border border-cream-deep p-5 flex items-center gap-4 justify-between">
                    {litter.media[0]?.url && (
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={litter.media[0].url} alt={litter.breed.nameDe} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800 text-sm">{litter.breed.nameDe}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {litter.status === 'planned' && 'Geplant'}
                        {litter.status === 'pregnant' && 'Trächtig'}
                        {litter.status === 'born' && litter.bornDate && `Geboren am ${litter.bornDate.toLocaleDateString('de-DE')}`}
                        {litter.status === 'available' && 'Welpen abgabebereit'}
                        {litter.status === 'sold_out' && 'Ausverkauft'}
                        {litter.puppyCount && ` · ${litter.puppyCount} Welpen`}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      litter.status === 'available' ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {litter.status === 'available' ? 'Verfügbar' : litter.status === 'sold_out' ? 'Ausverkauft' : 'In Planung'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Erwachsene Hunde zur Abgabe */}
          {adultListings.length > 0 && (
            <div className="mb-12">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
                Erwachsene Hunde zur Abgabe
              </h2>
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
            </div>
          )}

          {/* Zuchtrüden */}
          {breeder.dogs.length > 0 && (
            <div className="mb-12">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
                Zuchtrüden
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {breeder.dogs.map((dog) => (
                  <Link
                    key={dog.id}
                    href={`/hund/${dog.id}`}
                    className="bg-white rounded-2xl border border-cream-deep overflow-hidden hover:border-forest/30 hover:shadow-md transition-all"
                  >
                    <div className="bg-cream-dark aspect-square flex items-center justify-center relative">
                      {dog.media[0]?.url ? (
                        <img src={dog.media[0].url} alt={dog.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-10 h-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                      <span className="absolute top-2 left-2 bg-honey text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        Deckrüde
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-forest font-semibold uppercase tracking-wider mb-0.5">
                        {dog.breed.nameDe}
                      </p>
                      <p className="font-semibold text-stone-800 text-sm">{dog.name}</p>
                      {dog.titles && (
                        <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{dog.titles}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <Link href="/zuechter" className="text-sm text-forest font-semibold hover:underline">
              ← Alle Züchter durchsuchen
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
