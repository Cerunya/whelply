import { prisma } from '@/lib/prisma'
import { distanceKm, geocodeAddress } from '@/lib/geocode'
import { slugify } from '@/lib/slugify'
import { getBreederCanonicalUrl } from '@/lib/subdomain'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Suspense } from 'react'
import WelpenFilter from '@/components/WelpenFilter'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

export default async function ZuechterVerzeichnisPage({
  searchParams,
}: {
  searchParams: { rasse?: string; region?: string; ort?: string; radius?: string }
}) {
  const allBreeds = await prisma.breed.findMany({
    select: { id: true, nameDe: true, slug: true },
    orderBy: { nameDe: 'asc' },
  })

  const radiusKm = Number(searchParams.radius) || 0
  const searchCoords = searchParams.ort && radiusKm > 0
    ? await geocodeAddress({ city: searchParams.ort })
    : null

  const breeders = await prisma.breederProfile.findMany({
    include: {
      dogs: {
        include: { breed: { select: { nameDe: true, slug: true } } },
        take: 1,
      },
      media: {
        where: { purpose: 'card' },
        take: 1,
        select: { url: true },
      },
      memberships: {
        select: { verband: true },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: {
          dogs: { where: { isStud: true } },
        },
      },
      listings: {
        where: { status: 'available', type: 'puppy' },
        select: { id: true, breed: { select: { nameDe: true, slug: true } } },
      },
      litters: {
        where: { status: { in: ['planned', 'pregnant'] } },
        select: { id: true, status: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Neu eingetragene Züchter (letzte 30 Tage)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const newestBreeders = breeders
    .filter((b) => b.isActive !== false && new Date(b.createdAt) > thirtyDaysAgo)
    .slice(0, 10)

  // Filtern
  let filtered = breeders.filter((b) => b.isActive !== false)
  if (searchParams.rasse) {
    const selectedBreed = allBreeds.find((b) => b.slug === searchParams.rasse)
    if (selectedBreed) {
      filtered = filtered.filter((b) =>
        b.dogs.some((d) => d.breed.slug === searchParams.rasse) ||
        b.listings.some((l) => l.breed.slug === searchParams.rasse)
      )
    }
  }
  if (searchParams.region) {
    filtered = filtered.filter((b) => b.state === searchParams.region)
  }
  if (searchParams.ort && radiusKm > 0 && searchCoords) {
    filtered = filtered.filter((b) =>
      b.latitude !== null && b.longitude !== null &&
      distanceKm(searchCoords.lat, searchCoords.lng, b.latitude, b.longitude) <= radiusKm
    )
  } else if (searchParams.ort) {
    const ort = searchParams.ort.toLowerCase()
    filtered = filtered.filter((b) =>
      (b.zip && b.zip.startsWith(ort)) || (b.city && b.city.toLowerCase().includes(ort))
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="relative overflow-hidden bg-forest px-4 pb-24 pt-12">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full text-white opacity-[0.035]" aria-hidden="true">
              <defs>
                <pattern id="zuechter-paw-pattern" width="190" height="190" patternUnits="userSpaceOnUse">
                  <g fill="currentColor" transform="translate(22 24) rotate(-18 30 30)">
                    <ellipse cx="30" cy="40" rx="13" ry="15" />
                    <ellipse cx="10" cy="25" rx="6" ry="8" />
                    <ellipse cx="23" cy="14" rx="6" ry="8" />
                    <ellipse cx="37" cy="14" rx="6" ry="8" />
                    <ellipse cx="50" cy="25" rx="6" ry="8" />
                  </g>
                  <g fill="currentColor" transform="translate(112 108) rotate(16 30 30)">
                    <ellipse cx="30" cy="40" rx="13" ry="15" />
                    <ellipse cx="10" cy="25" rx="6" ry="8" />
                    <ellipse cx="23" cy="14" rx="6" ry="8" />
                    <ellipse cx="37" cy="14" rx="6" ry="8" />
                    <ellipse cx="50" cy="25" rx="6" ry="8" />
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#zuechter-paw-pattern)" />
            </svg>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-28 h-[330px] w-[330px] rounded-full bg-honey-light/[0.08]" aria-hidden="true" />
          <div className="relative z-10 mx-auto flex max-w-6xl px-4 flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-honey-light">Seriöse Rassehundezucht entdecken</p>
              <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">Züchter mit Verantwortung finden</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                Registrierte Rassehunde-Züchter mit transparenten Profilen, aktuellen Würfen und verfügbaren Hunden.
              </p>
            </div>
            <div className="max-w-xs rounded-2xl border border-white/15 bg-white/[0.07] p-5 lg:mr-0">
              <p className="text-sm font-bold text-white">Nur eingetragene Züchter</p>
              <p className="mt-2 text-xs leading-relaxed text-white/70">Mit nachvollziehbaren Angaben zur Zuchtstätte und Verifizierung.</p>
            </div>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-16 max-w-6xl px-4">
          <div className="rounded-2xl border border-cream-deep bg-white p-5 shadow-[7px_7px_0_rgba(18,38,25,0.08)]">
            <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-lg bg-stone-100" />}>
              <WelpenFilter breeds={allBreeds} basePath="/zuechter" showStatus={false} />
            </Suspense>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-10 pt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl font-bold text-stone-900">{filtered.length} Züchter gefunden</h2>
            <span className="text-sm text-stone-400">Neueste zuerst</span>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-24 bg-stone-50 rounded-2xl border border-stone-200">
              <p className="text-stone-400 text-sm">Keine Züchter gefunden.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 pb-8" style={{overflow: 'visible'}}>
              {filtered.map((breeder) => {
                const displayName = breeder.displayName || breeder.kennelName
                const location = [breeder.city, breeder.state].filter(Boolean).join(', ')
                const breeds = Array.from(new Set(breeder.listings.map((l) => l.breed.nameDe)))
                const published = breeder.isPublished !== false
                const hasWelpen = breeder.listings.length > 0
                const hasLitter = breeder.litters.length > 0
                const hasStud = (breeder._count?.dogs ?? 0) > 0
                const bgImage = breeder.media[0]?.url

                const cardContent = (
                  <div className="relative h-full pb-10">
                  <div className={`flex h-full flex-col overflow-hidden rounded-[26px] border border-cream-deep bg-white shadow-[7px_7px_0_#EDE4CE] transition-all duration-200 ${ published ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[9px_9px_0_#EDE4CE]' : 'cursor-default' }`}>
                    {/* Hintergrundbild */}
                    {bgImage && (
                      <div className="relative aspect-[3/2] flex-shrink-0 overflow-hidden">
                        <img src={bgImage} alt={displayName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                      </div>
                    )}
                    <div className="relative flex flex-1 flex-col p-5 pb-12 sm:p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h2 className="font-serif text-xl font-bold text-stone-900">{displayName}</h2>
                          {(breeder.memberships.length > 0 || breeder.verband) && (
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-forest">
                              {breeder.memberships.length > 0
                                ? breeder.memberships.map((membership) => membership.verband).join(' · ')
                                : breeder.verband}
                            </p>
                          )}
                          {breeder.showFullName && breeder.fullName && (
                            <p className="text-xs text-stone-400 mt-0.5">{breeder.fullName}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                          {breeder.diditStatus === 'approved' && (
                            <a href="/badges#id-geprueft" className="text-xs text-green-700 font-semibold whitespace-nowrap bg-green-50 border border-green-200 px-2 py-0.5 rounded-full hover:border-green-400 transition-colors">ID ✓</a>
                          )}
                          {breeder.verificationLevel === 'doc_verified' && (
                            <a href="/badges#zucht-verifiziert" className="text-xs text-green-700 font-semibold whitespace-nowrap bg-green-50 border border-green-200 px-2 py-0.5 rounded-full hover:border-green-400 transition-colors">Zucht ✓</a>
                          )}
                        </div>
                      </div>
                      {location && (
                        <p className="text-sm text-stone-400 mb-2 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {location}
                        </p>
                      )}
                      {breeds.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {breeds.map((breed) => (
                            <span key={breed} className="text-xs bg-forest/5 text-forest font-medium px-2 py-1 rounded-full">
                              {breed}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-300 mb-2">Aktuell keine Inserate</p>
                      )}

                      {/* Runde Badges — außerhalb der Karte, überlappen nach unten */}
                    </div>
                    </div>
                    <div className="absolute -bottom-2 right-4 flex gap-2">
                        {hasWelpen && (
                          <div className="w-20 h-20 rounded-full bg-honey text-white flex flex-col items-center justify-center text-center shadow-lg border-[3px] border-white">
                            <span className="text-[10px] font-black leading-tight uppercase">Welpen</span>
                            <span className="text-[10px] font-black leading-tight uppercase">Dispo</span>
                          </div>
                        )}
                        {!hasWelpen && hasLitter && (
                          <div className={`w-20 h-20 rounded-full text-white flex flex-col items-center justify-center text-center shadow-lg border-[3px] border-white ${
                            breeder.litters[0]?.status === 'pregnant' ? 'bg-blue-400' : 'bg-blue-300'
                          }`}>
                            <span className="text-[10px] font-black leading-tight uppercase">Wurf</span>
                            <span className="text-[10px] font-black leading-tight uppercase">
                              {breeder.litters[0]?.status === 'pregnant' ? 'Erwartet' : 'Geplant'}
                            </span>
                          </div>
                        )}
                        {hasStud && (
                          <div className="w-20 h-20 rounded-full bg-forest text-white flex flex-col items-center justify-center text-center shadow-lg border-[3px] border-white">
                            <span className="text-[10px] font-black leading-tight uppercase">Zucht</span>
                            <span className="text-[10px] font-black leading-tight uppercase">Rüde</span>
                          </div>
                        )}
                      </div>
                  </div>
                )

                return published ? (
                  <a key={breeder.id} href={getBreederCanonicalUrl(breeder.subdomain, slugify(breeder.kennelName))}>
                    {cardContent}
                  </a>
                ) : (
                  <div key={breeder.id}>{cardContent}</div>
                )
              })}
            </div>
          )}

          {/* Zuletzt eingetragene Züchter — ganz unten */}
          {newestBreeders.length > 0 && !searchParams.rasse && !searchParams.region && !searchParams.ort && (
            <div className="mt-16 pt-10 border-t border-cream-deep">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Zuletzt eingetragene Züchter</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {newestBreeders.map((b) => {
                  const breeds = Array.from(new Set(b.listings.map((l) => l.breed.nameDe)))
                  const slug = b.kennelName.toLowerCase().replace(/\s+/g, '-')
                  const card = (
                    <div className="bg-white rounded-xl border border-cream-deep p-4 text-sm h-full hover:border-forest/30 hover:shadow-sm transition-all">
                      <p className="font-semibold text-stone-900 truncate">{b.displayName || b.kennelName}</p>
                      {breeds[0] && <p className="text-stone-500 text-xs truncate">{breeds[0]}</p>}
                      {(b.city || b.state) && (
                        <p className="text-forest text-xs mt-0.5 truncate">{[b.city, b.state].filter(Boolean).join(', ')}</p>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {b.listings.length > 0 && (
                          <span className="text-[10px] border border-stone-200 rounded px-1.5 py-0.5 text-stone-500">Welpen Dispo</span>
                        )}
                        {b.litters.some((l) => l.status === 'pregnant' || l.status === 'planned') && (
                          <span className="text-[10px] border border-stone-200 rounded px-1.5 py-0.5 text-stone-500">Welpen erwartet</span>
                        )}
                        {(b._count?.dogs ?? 0) > 0 && (
                          <span className="text-[10px] border border-stone-200 rounded px-1.5 py-0.5 text-stone-500">Deckrüde</span>
                        )}
                      </div>
                    </div>
                  )
                  return b.isPublished !== false ? (
                    <a key={b.id} href={getBreederCanonicalUrl(b.subdomain, slug)}>{card}</a>
                  ) : (
                    <div key={b.id}>{card}</div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
