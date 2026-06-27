import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

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
      listings: {
        where: { status: 'available', type: 'puppy' },
        select: { id: true, breed: { select: { nameDe: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Eindeutige Rassen über alle Inserate sammeln (für Filter)
  const allBreeds = new Set<string>()
  breeders.forEach((b) => b.listings.forEach((l) => allBreeds.add(l.breed.nameDe)))
  const breedOptions = Array.from(allBreeds).sort()

  const states = Array.from(
    new Set(breeders.map((b) => b.state).filter(Boolean))
  ).sort() as string[]

  // Filtern
  let filtered = breeders
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
          <div className="max-w-6xl mx-auto">
          <form className="flex flex-col sm:flex-row gap-3 items-center">
            <select
              name="rasse"
              defaultValue={searchParams.rasse ?? ''}
              className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              <option value="">Alle Rassen</option>
              {breedOptions.map((breed) => (
                <option key={breed} value={breed}>{breed}</option>
              ))}
            </select>
            <select
              name="bundesland"
              defaultValue={searchParams.bundesland ?? ''}
              className="border border-stone-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest/30"
            >
              <option value="">Alle Bundesländer</option>
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-honey text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-honey-light transition-colors"
            >
              Filtern
            </button>
            {(searchParams.rasse || searchParams.bundesland) && (
              <Link
                href="/zuechter"
                className="px-4 py-2.5 text-sm text-stone-400 hover:text-stone-700 transition-colors"
              >
                Filter zurücksetzen
              </Link>
            )}
          </form>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-10">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">Keine Züchter gefunden.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((breeder) => {
                const displayName = breeder.displayName || breeder.kennelName
                const location = [breeder.city, breeder.state].filter(Boolean).join(', ')
                const breeds = Array.from(new Set(breeder.listings.map((l) => l.breed.nameDe)))

                return (
                  <Link
                    key={breeder.id}
                    href={`/zuechter/${slugify(breeder.kennelName)}`}
                    className="bg-white rounded-2xl border border-cream-deep p-6 hover:border-forest/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="font-serif text-lg font-bold text-stone-900">
                        {displayName}
                      </h2>
                      {breeder.verificationLevel !== 'none' && (
                        <span className="text-xs text-honey font-semibold whitespace-nowrap ml-2">
                          ✓ Verifiziert
                        </span>
                      )}
                    </div>
                    {location && (
                      <p className="text-sm text-stone-400 mb-3 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {location}
                      </p>
                    )}
                    {breeds.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {breeds.map((breed) => (
                          <span key={breed} className="text-xs bg-forest/5 text-forest font-medium px-2 py-1 rounded-full">
                            {breed}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-300">Aktuell keine Inserate</p>
                    )}
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
