import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ListingCard from '@/components/ListingCard'
import WelpenFilter from '@/components/WelpenFilter'
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
  const perPage = 24

  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true, slug: true },
  }).catch(() => [])

  const selectedBreed = breeds.find((b) => b.slug === searchParams.rasse)

  const where = {
    status: 'available' as const,
    type: 'puppy' as const,
    ...(selectedBreed ? { breedId: selectedBreed.id } : {}),
    ...(searchParams.region ? { breeder: { state: searchParams.region } } : {}),
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

        <div className="bg-cream px-4 pt-6 pb-2">
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
          <p className="text-sm text-stone-400 mb-6">
            <Link href="/" className="hover:text-stone-700">Startseite</Link>
            {' / '}
            <span className="text-stone-700">Welpen</span>
            {selectedBreed && <> / <span className="text-stone-700">{selectedBreed.nameDe}</span></>}
          </p>

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

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
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
      </main>
      <Footer />
    </>
  )
}
