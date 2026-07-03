import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Suspense } from 'react'
import ListingFilter from '@/components/ListingFilter'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

export default async function ZuechterVerzeichnisPage({
  searchParams,
}: {
  searchParams: { rasse?: string; bundesland?: string }
}) {
  const breeders = await prisma.breederProfile.findMany({
    include: {
      dogs: {
        include: { breed: { select: { nameDe: true } } },
        take: 1,
      },
      media: {
        where: { purpose: 'card' },
        take: 1,
        select: { url: true },
      },
      _count: {
        select: {
          dogs: { where: { isStud: true } },
        },
      },
      listings: {
        where: { status: 'available', type: 'puppy' },
        select: { id: true, breed: { select: { nameDe: true } } },
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

  // Eindeutige Rassen über alle Inserate sammeln (für Filter)
  const allBreeds = new Set<string>()
  breeders.forEach((b) => b.listings.forEach((l) => allBreeds.add(l.breed.nameDe)))
  const breedOptions = Array.from(allBreeds).sort()

  const states = Array.from(
    new Set(breeders.map((b) => b.state).filter(Boolean))
  ).sort() as string[]

  // Filtern
  // Inaktive Züchter komplett ausblenden
  let filtered = breeders.filter((b) => b.isActive !== false)
  if (searchParams.rasse) {
    filtered = filtered.filter((b) =>
      b.listings.some((l) => l.breed.nameDe === searchParams.rasse)
    )
  }
  if (searchParams.bundesland) {
    filtered = filtered.filter((b) => b.state === searchParams.bundesland)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="bg-forest px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              Züchter-Verzeichnis
            </h1>
            <p className="text-white/70 text-sm">
              Alle registrierten Rassehunde-Züchter auf Whelply — verifiziert über FCI-Zwingernamen.
            </p>
          </div>
        </section>

        <div className="border-b border-stone-200 bg-stone-50 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <Suspense fallback={<div className="h-9 w-64 bg-stone-200 rounded-lg animate-pulse" />}>
              <ListingFilter
                basePath="/zuechter"
                filters={[
                  { key: 'rasse', placeholder: 'Alle Rassen', options: breedOptions.map((b) => ({ value: b, label: b })) },
                  { key: 'bundesland', placeholder: 'Alle Bundesländer', options: states.map((s) => ({ value: s, label: s })) },
                ]}
              />
            </Suspense>
            <p className="text-xs text-stone-400 flex-shrink-0">{filtered.length} Züchter</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-10">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">Keine Züchter gefunden.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12 pb-8" style={{overflow: 'visible'}}>
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
                  <div className={`bg-white rounded-2xl border border-cream-deep transition-all h-full flex flex-col overflow-hidden ${
                    published
                      ? 'hover:border-forest/30 hover:shadow-md cursor-pointer'
                      : 'cursor-default'
                  }`}>
                    {/* Hintergrundbild */}
                    {bgImage && (
                      <div className="relative h-36 overflow-hidden flex-shrink-0">
                        <img src={bgImage} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                      </div>
                    )}
                    <div className="relative p-6 pb-12 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h2 className="font-serif text-lg font-bold text-stone-900">{displayName}</h2>
                          {breeder.showFullName && breeder.fullName && (
                            <p className="text-xs text-stone-400 mt-0.5">{breeder.fullName}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {breeder.verificationLevel !== 'none' && (
                            <span className="text-xs text-honey font-semibold whitespace-nowrap">✓ Verifiziert</span>
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

                      {/* Runde Badges — überlappen den Kartenrand */}
                      <div className="absolute -bottom-8 right-4 flex gap-2">
                        {hasWelpen && (
                          <div className="w-16 h-16 rounded-full bg-honey text-white flex flex-col items-center justify-center text-center shadow-lg border-[3px] border-white">
                            <span className="text-[9px] font-black leading-tight uppercase">Welpen</span>
                            <span className="text-[9px] font-black leading-tight uppercase">Dispo</span>
                          </div>
                        )}
                        {!hasWelpen && hasLitter && (
                          <div className={`w-16 h-16 rounded-full text-white flex flex-col items-center justify-center text-center shadow-lg border-[3px] border-white ${
                            breeder.litters[0]?.status === 'pregnant' ? 'bg-blue-400' : 'bg-blue-300'
                          }`}>
                            <span className="text-[9px] font-black leading-tight uppercase">Wurf</span>
                            <span className="text-[9px] font-black leading-tight uppercase">
                              {breeder.litters[0]?.status === 'pregnant' ? 'Erwartet' : 'Geplant'}
                            </span>
                          </div>
                        )}
                        {hasStud && (
                          <div className="w-16 h-16 rounded-full bg-forest text-white flex flex-col items-center justify-center text-center shadow-lg border-[3px] border-white">
                            <span className="text-[9px] font-black leading-tight uppercase">Zucht</span>
                            <span className="text-[9px] font-black leading-tight uppercase">Rüde</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )

                return published ? (
                  <Link key={breeder.id} href={`/zuechter/${slugify(breeder.kennelName)}`}>
                    {cardContent}
                  </Link>
                ) : (
                  <div key={breeder.id}>{cardContent}</div>
                )
              })}
            </div>
          )}

          {/* Zuletzt eingetragene Züchter — ganz unten */}
          {newestBreeders.length > 0 && !searchParams.rasse && !searchParams.bundesland && (
            <div className="mt-16 pt-10 border-t border-cream-deep">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-6">Zuletzt eingetragene Züchter</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {newestBreeders.map((b) => {
                  const breeds = Array.from(new Set(b.listings.map((l) => l.breed.nameDe)))
                  return (
                    <div key={b.id} className="bg-white rounded-xl border border-cream-deep p-4 text-sm">
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
