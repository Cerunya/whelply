import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { FCI_GROUPS } from '@/lib/fci-groups'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RassenSuche from '@/components/RassenSuche'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rasselexikon: Hunderassen von A bis Z | Whelply',
  description: 'FCI-anerkannte Hunderassen entdecken: Alle Rassen nach FCI-Gruppen sortiert, mit verständlichen Porträts zu Wesen, Haltung und Pflege.',
  alternates: { canonical: '/rassen' },
}

const FCI_GROUPS_SHORT: Record<number, string> = {
  1: 'Hüte- & Treibhunde',
  2: 'Pinscher & Molosser',
  3: 'Terrier',
  4: 'Dachshunde',
  5: 'Spitze & Urtyp',
  6: 'Lauf- & Schweißhunde',
  7: 'Vorstehhunde',
  8: 'Apportier- & Wasserhunde',
  9: 'Gesellschafts- & Begleithunde',
  10: 'Windhunde',
}

export default async function RassenlexikonPage({
  searchParams,
}: {
  searchParams: { suche?: string; gruppe?: string }
}) {
  const query = searchParams.suche?.trim() ?? ''
  const breeds = await prisma.breed.findMany({
    select: { id: true, nameDe: true, nameEn: true, slug: true, fciGroup: true, fciNumber: true },
    orderBy: { nameDe: 'asc' },
  })

  const normalizedQuery = query.toLocaleLowerCase('de')
  const filteredBreeds = normalizedQuery
    ? breeds.filter((breed) =>
        breed.nameDe.toLocaleLowerCase('de').includes(normalizedQuery) ||
        breed.nameEn.toLocaleLowerCase('de').includes(normalizedQuery)
      )
    : breeds

  const byGroup = new Map<number, typeof filteredBreeds>()
  for (const breed of filteredBreeds) {
    const list = byGroup.get(breed.fciGroup) ?? []
    list.push(breed)
    byGroup.set(breed.fciGroup, list)
  }

  const groupNumbers = Array.from(byGroup.keys()).sort((a, b) => a - b)
  const requestedGroup = Number(searchParams.gruppe)
  const activeGroup = groupNumbers.includes(requestedGroup) ? requestedGroup : groupNumbers[0]
  const activeBreeds = activeGroup ? byGroup.get(activeGroup) ?? [] : []

  function groupUrl(group: number) {
    const params = new URLSearchParams({ gruppe: String(group) })
    if (query) params.set('suche', query)
    return `/rassen?${params.toString()}`
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="relative overflow-hidden bg-forest px-4 pb-24 pt-12">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full text-white opacity-[0.035]" aria-hidden="true">
              <defs>
                <pattern id="rassen-paw-pattern" width="190" height="190" patternUnits="userSpaceOnUse">
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
              <rect width="100%" height="100%" fill="url(#rassen-paw-pattern)" />
            </svg>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-28 h-[330px] w-[330px] rounded-full bg-honey-light/[0.08]" aria-hidden="true" />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-honey-light">FCI-anerkannte Hunderassen entdecken</p>
              <h1 className="max-w-3xl font-serif text-3xl font-bold text-white sm:text-4xl">Wissen, welcher Hund zu dir passt.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                Alle anerkannten Rassen von A bis Z – übersichtlich nach FCI-Gruppen sortiert und verständlich erklärt.
              </p>
            </div>
            <div className="max-w-xs rounded-2xl border border-white/15 bg-white/[0.07] p-5">
              <svg className="h-6 w-6 text-honey-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.25A4.25 4.25 0 0 0 7.75 2H3v15.5h4.75A4.25 4.25 0 0 1 12 21.75m0-15.5A4.25 4.25 0 0 1 16.25 2H21v15.5h-4.75A4.25 4.25 0 0 0 12 21.75m0-15.5v15.5" />
              </svg>
              <p className="mt-3 text-sm font-bold text-white">{breeds.length} Rassen im Lexikon</p>
              <p className="mt-2 text-xs leading-relaxed text-white/70">Mit Wesen, Haltung und Besonderheiten der einzelnen Rassen.</p>
            </div>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-16 max-w-6xl px-4">
          <div className="rounded-2xl border border-cream-deep bg-white p-5 shadow-[7px_7px_0_rgba(18,38,25,0.08)]">
            <RassenSuche initialQuery={query} activeGroup={activeGroup} resultCount={filteredBreeds.length} />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-10">
          {filteredBreeds.length === 0 ? (
            <div className="rounded-3xl border border-cream-deep bg-white px-6 py-16 text-center shadow-[5px_5px_0_#EDE4CE]">
              <svg className="mx-auto h-8 w-8 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-4-4" />
              </svg>
              <h2 className="mt-4 font-serif text-2xl font-bold text-forest">Keine Rasse gefunden</h2>
              <p className="mt-2 text-sm text-stone-500">Prüfe die Schreibweise oder starte die Suche erneut.</p>
              <Link href="/rassen" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-forest px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest-dark">
                Alle Rassen anzeigen
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-cream-deep bg-white shadow-[7px_7px_0_#EDE4CE] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
              <nav className="flex gap-2 overflow-x-auto border-b border-cream-deep bg-[#F5EFE0] p-3 lg:block lg:space-y-1 lg:border-b-0 lg:border-r lg:p-5" aria-label="FCI-Gruppen">
                <p className="mb-3 hidden px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500 lg:block">Nach FCI-Gruppe</p>
                {groupNumbers.map((groupNum) => {
                  const selected = groupNum === activeGroup
                  return (
                    <Link
                      key={groupNum}
                      href={groupUrl(groupNum)}
                      scroll={false}
                      aria-current={selected ? 'page' : undefined}
                      className={`flex min-h-12 flex-shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors lg:w-full ${
                        selected ? 'bg-forest text-white' : 'text-stone-600 hover:bg-white/70 hover:text-forest'
                      }`}
                    >
                      <span className={`font-serif text-base ${selected ? 'text-honey-light' : 'text-stone-400'}`}>
                        {String(groupNum).padStart(2, '0')}
                      </span>
                      <span>{FCI_GROUPS_SHORT[groupNum] ?? FCI_GROUPS[groupNum]}</span>
                      <svg className={`ml-auto hidden h-4 w-4 lg:block ${selected ? 'text-honey-light' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                      </svg>
                    </Link>
                  )
                })}
              </nav>

              <section className="p-6 sm:p-8 lg:p-10" aria-labelledby="aktive-fci-gruppe">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-honey">FCI-Gruppe {activeGroup}</p>
                <h2 id="aktive-fci-gruppe" className="max-w-3xl font-serif text-2xl font-bold leading-tight text-forest sm:text-3xl">
                  {FCI_GROUPS[activeGroup]}
                </h2>
                <p className="mb-7 mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
                  {activeBreeds.length} {activeBreeds.length === 1 ? 'Rasse' : 'Rassen'} in dieser Gruppe. Wähle eine Rasse für alle Details zu Wesen, Haltung und Pflege.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeBreeds.map((breed) => (
                    <Link
                      key={breed.id}
                      href={`/rassen/${breed.slug}`}
                      className="group flex min-h-[88px] items-center justify-between gap-4 rounded-2xl border border-cream-deep bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-forest"
                    >
                      <div>
                        <h3 className="font-serif text-base font-bold text-stone-800 transition-colors group-hover:text-forest">{breed.nameDe}</h3>
                        <p className="mt-1 text-xs text-stone-500">FCI-Nr. {breed.fciNumber} · Rasseporträt ansehen</p>
                      </div>
                      <svg className="h-5 w-5 flex-shrink-0 text-honey transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
