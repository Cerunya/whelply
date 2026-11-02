import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Suspense } from 'react'
import WelpenFilter from '@/components/WelpenFilter'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

export default async function ZuchtrudenPage({
  searchParams,
}: {
  searchParams: { rasse?: string; ort?: string; radius?: string; region?: string }
}) {
  // Umkreissuche
  let radiusFilter: any = {}
  let searchCoords: { lat: number; lng: number } | null = null
  const radiusKm = Number(searchParams.radius) || 0
  if (searchParams.ort && radiusKm > 0) {
    const { geocodeAddress } = await import('@/lib/geocode')
    searchCoords = await geocodeAddress({ city: searchParams.ort })
    if (searchCoords) {
      const delta = radiusKm / 111
      radiusFilter = {
        latitude: { gte: searchCoords.lat - delta, lte: searchCoords.lat + delta },
        longitude: { gte: searchCoords.lng - delta, lte: searchCoords.lng + delta },
      }
    }
  }

  const dogs = await prisma.dog.findMany({
    where: {
      sex: 'male',
      isStud: true,
      breeder: {
        isActive: true,
        ...(searchParams.region ? { state: searchParams.region } : {}),
        ...(searchParams.ort && (!radiusKm || !searchCoords) ? { OR: [{ zip: { startsWith: searchParams.ort } }, { city: { contains: searchParams.ort, mode: 'insensitive' as const } }] } : {}),
        ...radiusFilter,
      },
      ...(searchParams.rasse ? { breed: { slug: searchParams.rasse } } : {}),
    },
    include: {
      breed: { select: { nameDe: true, slug: true } },
      breeder: { select: { kennelName: true, displayName: true, city: true, state: true } },
      media: { orderBy: { sortOrder: 'asc' }, select: { url: true, purpose: true, isPrimary: true } },
    },
    orderBy: [{ isStud: 'desc' }, { createdAt: 'desc' }],
  })

  const breeds = Array.from(
    new Map(dogs.map((d) => [d.breed.slug, d.breed.nameDe])).entries()
  ).map(([slug, nameDe]) => ({ id: slug, nameDe, slug })).sort((a, b) => a.nameDe.localeCompare(b.nameDe))

  function calcAge(birthDate: Date | null) {
    if (!birthDate) return null
    const years = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    return years
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="relative overflow-hidden bg-forest px-4 pb-24 pt-12">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full text-white opacity-[0.035]" aria-hidden="true">
              <defs>
                <pattern id="zuchtrueden-paw-pattern" width="190" height="190" patternUnits="userSpaceOnUse">
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
              <rect width="100%" height="100%" fill="url(#zuchtrueden-paw-pattern)" />
            </svg>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-28 h-[330px] w-[330px] rounded-full bg-honey-light/[0.08]" aria-hidden="true" />
          <div className="relative z-10 mx-auto flex max-w-6xl px-4 flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-honey-light">Deckrüden von verifizierten Züchtern</p>
              <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">Den passenden Deckrüden finden</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                Freigegebene Deckrüden aus seriöser, eingetragener Zucht — mit transparenten Angaben zum Hund.
              </p>
            </div>
            <div className="max-w-xs rounded-2xl border border-white/15 bg-white/[0.07] p-5 lg:mr-0">
              <p className="text-sm font-bold text-white">Nur eingetragene Züchter</p>
              <p className="mt-2 text-xs leading-relaxed text-white/70">Mit nachvollziehbaren Angaben zu Herkunft, Gesundheit und Auszeichnungen.</p>
            </div>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-16 max-w-6xl px-4">
          <div className="rounded-2xl border border-cream-deep bg-white p-5 shadow-[7px_7px_0_rgba(18,38,25,0.08)]">
            <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-lg bg-stone-100" />}>
              <WelpenFilter breeds={breeds} basePath="/zuchtrueden" showStatus={false} />
            </Suspense>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-10 pt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl font-bold text-stone-900">{dogs.length} {dogs.length === 1 ? 'Deckrüde gefunden' : 'Deckrüden gefunden'}</h2>
            <span className="text-sm text-stone-400">Neueste zuerst</span>
          </div>

          {dogs.length === 0 ? (
            <div className="text-center py-24 bg-stone-50 rounded-2xl border border-stone-200">
              <svg className="w-12 h-12 mx-auto text-stone-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="font-serif text-lg font-bold text-stone-700 mb-2">
                Noch keine Rüden eingetragen
              </h2>
              <p className="text-stone-400 text-sm max-w-md mx-auto">
                Unsere Züchter tragen ihre Deckrüden gerade ein. Schau bald wieder vorbei.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 items-stretch">
              {dogs.map((dog) => {
                const breederName = dog.breeder.displayName || dog.breeder.kennelName
                const location = [dog.breeder.city, dog.breeder.state].filter(Boolean).join(', ')
                const age = calcAge(dog.birthDate)

                return (
                  <Link
                    key={dog.id}
                    href={`/hund/${dog.slug || dog.id}`}
                    className="group block h-full"
                  >
                    <div className="relative flex h-full flex-col overflow-hidden rounded-[26px] border border-[#B8D4EE] bg-[#D6E8F8] shadow-[7px_7px_0_#EDE4CE] transition-all duration-200 hover:-translate-y-1 hover:shadow-[9px_9px_0_#EDE4CE]">
                      <div className="relative flex aspect-[3/2] items-center justify-center overflow-hidden bg-cream-dark">
                        {(() => {
                          // 1. Bild mit purpose='primary' (vom User im Grid gesetzt)
                          // 2. isPrimary=true das KEIN Hintergrund ist
                          // 3. Irgendein Bild ohne purpose (=normales Foto)
                          const imgs = dog.media as { url: string; purpose: string | null; isPrimary: boolean }[]
                          const cardImg =
                            imgs.find((m) => m.purpose === 'primary') ??
                            imgs.find((m) => m.isPrimary === true && m.purpose === null) ??
                            imgs.find((m) => m.purpose === null) ??
                            imgs.find((m) => m.purpose !== 'dog_bg') ??
                            null
                          return (
                            <img
                              src={cardImg?.url || '/images/dog-placeholder.svg'}
                              alt={cardImg?.url ? dog.name : `Noch kein Foto von ${dog.name}`}
                              className={`h-full w-full ${cardImg?.url ? 'object-cover' : 'object-contain'}`}
                            />
                          )
                        })()}
                      </div>
                      <span className="mx-3 mt-3 inline-flex w-fit rounded-lg border border-forest/10 bg-[#EAF3EC] px-3 py-1.5 text-xs font-bold text-forest shadow-[3px_3px_0_rgba(27,58,45,0.08)] md:absolute md:left-3 md:top-3 md:m-0 md:px-3 md:py-2">
                        Deckrüde verfügbar
                      </span>
                      <div className="flex flex-1 flex-col p-4 pb-6 sm:p-5 sm:pb-7">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-forest">
                          {dog.breed.nameDe}
                        </p>
                        <h3 className="mb-0.5 line-clamp-1 text-base font-bold leading-snug text-stone-900 transition-colors group-hover:text-forest sm:text-lg">{dog.name}</h3>
                        <p className="mb-4 line-clamp-1 text-xs text-stone-500">
                          {age !== null && `${age} Jahre · `}{breederName}
                        </p>
                        {dog.titles && (
                          <p className="mb-3 line-clamp-2 text-xs italic text-stone-500">{dog.titles}</p>
                        )}
                        <div className="mt-auto border-t border-forest/10 pt-4">
                          <span className="text-xs text-stone-500">{location || 'Deutschland'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
