import { prisma } from '@/lib/prisma'
import { getBreederCanonicalUrl } from '@/lib/subdomain'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ListingCard from '@/components/ListingCard'
import WelpenFilter from '@/components/WelpenFilter'
import WelpenAlertButton from '@/components/WelpenAlertButton'
import Link from 'next/link'
import { Suspense } from 'react'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

export default async function WelpenPage({
  searchParams,
}: {
  searchParams: { rasse?: string; region?: string; seite?: string; geschlecht?: string }
}) {
  const page = Number(searchParams.seite ?? 1)
  const perPage = 36

  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true, slug: true },
  }).catch(() => [])

  const selectedBreed = breeds.find((b) => b.slug === searchParams.rasse)

  const where = {
    status: { in: ['available', 'reserved', 'sold'] as ('available' | 'reserved' | 'sold')[] },
    type: 'puppy' as const,
    breeder: {
      isActive: true,
      ...(searchParams.region ? { state: searchParams.region } : {}),
    },
    ...(selectedBreed ? { breedId: selectedBreed.id } : {}),
    ...(searchParams.geschlecht === 'male' ? { sex: 'male' as const } : {}),
    ...(searchParams.geschlecht === 'female' ? { sex: 'female' as const } : {}),
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        breed: { select: { nameDe: true } },
        breeder: { select: { kennelName: true, city: true, state: true } },
        media: { where: { isPrimary: true }, take: 1, select: { url: true } },
        // sex field is a scalar, automatically included
      },
    }).catch(() => []),
    prisma.listing.count({ where }).catch(() => 0),
  ])

  const now = new Date()
  const totalPages = Math.ceil(total / perPage)

  // Würfe mit erwarteten Welpen (pregnant / planned) für die Sektion unten
  const expectedLitters = await prisma.litter.findMany({
    where: {
      status: { in: ['pregnant', 'planned'] as const },
      breeder: { isActive: true, isPublished: true },
    },
    include: {
      breed: { select: { nameDe: true } },
      breeder: { select: { kennelName: true, city: true, state: true, subdomain: true } },
      dam: { include: { media: { where: { isPrimary: true }, take: 1, select: { url: true } } } },
      sire: { include: { media: { where: { isPrimary: true }, take: 1, select: { url: true } } } },
      media: { take: 2, select: { url: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { rasse: searchParams.rasse, region: searchParams.region, geschlecht: searchParams.geschlecht, ...params }
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v) })
    return `/welpen?${p.toString()}`
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="bg-forest px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              Welpen
            </h1>
            <p className="text-white/70 text-sm">
              Welpen unserer Züchter — von der Wurfankündigung bis zum abgabebereiten Hund.
            </p>
          </div>
        </section>

        <div className="border-b border-stone-200 bg-stone-50 px-4 py-4">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-3 items-center justify-between">
            <Suspense fallback={<div className="h-9 w-64 bg-stone-200 rounded-lg animate-pulse" />}>
              <WelpenFilter breeds={breeds} />
            </Suspense>
            <span className="text-sm text-stone-400">
              {total} {total === 1 ? 'Inserat' : 'Inserate'}
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10">
          {(selectedBreed || searchParams.region) && (
            <div className="flex items-center justify-end mb-6">
              <WelpenAlertButton
                breedName={selectedBreed?.nameDe}
                breedId={selectedBreed?.id}
                state={searchParams.region}
              />
            </div>
          )}

          {listings.length === 0 ? (
            <div className="text-center py-24 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-stone-600 font-medium mb-2">Keine Inserate gefunden</p>
              <p className="text-stone-400 text-sm mb-6">Versuch einen anderen Filter oder schau später nochmal.</p>
              <Link href="/welpen" className="text-sm text-stone-600 hover:text-stone-900 font-medium underline">
                Alle Inserate anzeigen
              </Link>
            </div>
          ) : (
            <>
              {/* Geschlechtsfilter */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-stone-500">Geschlecht:</span>
                {[
                  { label: 'Alle', value: undefined },
                  { label: 'Rüden', value: 'male' },
                  { label: 'Hündinnen', value: 'female' },
                ].map(({ label, value }) => (
                  <a
                    key={label}
                    href={buildUrl({ geschlecht: value, seite: undefined })}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      searchParams.geschlecht === value || (!value && !searchParams.geschlecht)
                        ? value === 'male' ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : value === 'female' ? 'bg-pink-100 border-pink-300 text-pink-700'
                          : 'bg-stone-800 border-stone-800 text-white'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    {label}
                  </a>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 items-stretch">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    breedName={listing.breed.nameDe}
                    kennelName={listing.breeder.kennelName}
                    puppyName={listing.title}
                    city={listing.breeder.city}
                    state={listing.breeder.state}
                    priceCents={listing.priceCents}
                    isBoosted={!!listing.boostExpiresAt && listing.boostExpiresAt > now}
                    imageUrl={listing.media[0]?.url}
                    tint={listing.sex === 'male' ? 'male' : listing.sex === 'female' ? 'female' : null}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  {page > 1 && (
                    <Link href={buildUrl({ seite: String(page - 1) })} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50 transition-colors">
                      ← Zurück
                    </Link>
                  )}
                  <span className="px-4 py-2 text-sm text-stone-500">
                    Seite {page} von {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={buildUrl({ seite: String(page + 1) })} className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50 transition-colors">
                      Weiter →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Welpen erwartet — Sektion wie auf französischen Seiten */}
        {expectedLitters.length > 0 && (
          <div className="mt-16 mb-8">
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Welpen demnächst erwartet</h2>
            <p className="text-stone-400 text-sm mb-8">Züchter mit geplanten oder bestätigten Würfen</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {expectedLitters.map((litter) => (
                <div key={litter.id} className="bg-white rounded-2xl border border-cream-deep overflow-hidden hover:shadow-md transition-all">
                  {/* Bilder-Reihe */}
                  <div className="flex h-40">
                    {litter.dam?.media[0]?.url ? (
                      <div className="flex-1 overflow-hidden">
                        <img src={litter.dam.media[0].url} alt="Mutter" className="w-full h-full object-cover" />
                      </div>
                    ) : litter.media[0]?.url ? (
                      <div className="flex-1 overflow-hidden">
                        <img src={litter.media[0].url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    {litter.sire?.media[0]?.url && (
                      <div className="flex-1 overflow-hidden">
                        <img src={litter.sire.media[0].url} alt="Vater" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-forest text-sm">{litter.breeder.kennelName}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {litter.status === 'pregnant' ? 'Trächtigkeit bestätigt' : 'Wurf geplant'}
                      {litter.expectedDate && ` · ${litter.expectedDate}`}
                    </p>
                    {(litter.breeder.city || litter.breeder.state) && (
                      <p className="text-xs text-stone-400 mt-0.5">{[litter.breeder.city, litter.breeder.state].filter(Boolean).join(', ')}</p>
                    )}
                    <div className="flex gap-3 mt-3">
                      {litter.dam && (
                        <div className="flex-1 text-center">
                          <p className="text-[10px] font-semibold text-pink-500 uppercase">Mutter</p>
                          <p className="text-xs text-stone-700 truncate">{litter.dam.name}</p>
                        </div>
                      )}
                      {(litter.sire || litter.sireExternal) && (
                        <div className="flex-1 text-center">
                          <p className="text-[10px] font-semibold text-blue-500 uppercase">Vater</p>
                          <p className="text-xs text-stone-700 truncate">{litter.sire?.name ?? litter.sireExternal}</p>
                        </div>
                      )}
                    </div>
                    <Link href={getBreederCanonicalUrl(litter.breeder.subdomain, litter.breeder.kennelName.toLowerCase().replace(/\s+/g, '-'), `/wuerfe/${litter.id}`)}
                      className="block mt-3 text-center text-xs font-semibold text-forest border border-forest/30 py-1.5 rounded-lg hover:bg-forest/5 transition-colors">
                      Zum Wurf →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
