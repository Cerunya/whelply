import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Suspense } from 'react'
import ListingFilter from '@/components/ListingFilter'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

export default async function ZuchtrudenPage({
  searchParams,
}: {
  searchParams: { rasse?: string }
}) {
  const dogs = await prisma.dog.findMany({
    where: {
      sex: 'male',
      isStud: true,
      breeder: { isActive: true },
      ...(searchParams.rasse ? { breed: { slug: searchParams.rasse } } : {}),
    },
    include: {
      breed: { select: { nameDe: true, slug: true } },
      breeder: { select: { kennelName: true, displayName: true, city: true, state: true } },
      media: { where: { purpose: { not: 'dog_bg' } }, orderBy: { sortOrder: 'asc' }, take: 6, select: { url: true, purpose: true, isPrimary: true } },
    },
    orderBy: [{ isStud: 'desc' }, { createdAt: 'desc' }],
  })

  const breedOptions = Array.from(
    new Map(dogs.map((d) => [d.breed.slug, d.breed.nameDe])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]))

  function calcAge(birthDate: Date | null) {
    if (!birthDate) return null
    const years = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    return years
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="bg-forest px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              Zuchtrüden
            </h1>
            <p className="text-white/70 text-sm">
              Deckrüden unserer Züchter — nur als Deckrüde freigegebene Hunde.
            </p>
          </div>
        </section>

        <div className="border-b border-stone-200 bg-stone-50 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <Suspense fallback={<div className="h-9 w-64 bg-stone-200 rounded-lg animate-pulse" />}>
              <ListingFilter
                basePath="/zuchtrueden"
                filters={[
                  { key: 'rasse', placeholder: 'Alle Rassen', options: breedOptions.map(([slug, name]) => ({ value: slug, label: name })) },
                ]}
              />
            </Suspense>
            <p className="text-xs text-stone-400 flex-shrink-0">{dogs.length} {dogs.length === 1 ? 'Deckrüde' : 'Deckrüden'}</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-10">
          {dogs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-cream-deep">
              <svg className="w-12 h-12 mx-auto text-stone-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="font-serif text-lg font-bold text-stone-700 mb-2">
                Noch keine Rüden eingetragen
              </h2>
              <p className="text-stone-400 text-sm max-w-md mx-auto">
                Unsere Züchter tragen ihre Zuchtrüden gerade ein. Schau bald wieder vorbei.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dogs.map((dog) => {
                const breederName = dog.breeder.displayName || dog.breeder.kennelName
                const location = [dog.breeder.city, dog.breeder.state].filter(Boolean).join(', ')
                const age = calcAge(dog.birthDate)

                return (
                  <Link
                    key={dog.id}
                    href={`/hund/${dog.id}`}
                    className="bg-white rounded-2xl border border-cream-deep overflow-hidden hover:border-forest/30 hover:shadow-md transition-all"
                  >
                    <div className="bg-cream-dark aspect-[4/3] flex items-center justify-center relative">
                      {(() => {
                        const cardImg = dog.media.find((m: any) => m.purpose === 'primary') ?? dog.media[0]
                        return cardImg?.url ? (
                          <img src={cardImg.url} alt={dog.name} className="w-full h-full object-cover" />
                        ) : (
                        <svg className="w-12 h-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )
                      })()}
                      {dog.isStud && (
                        <span className="absolute top-2 left-2 bg-honey text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          Deckrüde verfügbar
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-forest font-semibold uppercase tracking-wider mb-1">
                        {dog.breed.nameDe}
                      </p>
                      <h3 className="font-serif font-bold text-stone-900 mb-1">{dog.name}</h3>
                      <p className="text-sm text-stone-400 mb-2">
                        {age !== null && `${age} Jahre · `}{breederName}
                        {location && ` · ${location}`}
                      </p>
                      {dog.titles && (
                        <p className="text-xs text-stone-500 italic">{dog.titles}</p>
                      )}
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
