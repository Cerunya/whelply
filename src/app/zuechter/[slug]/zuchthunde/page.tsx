import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BreederNavbar from '@/components/BreederNavbar'
import Footer from '@/components/Footer'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'

export const dynamic = 'force-dynamic'

export default async function ZuechterZuchthundePage({
  params,
}: {
  params: { slug: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const accentColor = breeder.themeAccentColor || undefined

  const featuredDogs = await prisma.dog.findMany({
    where: { breederId: breeder.id, description: { not: null } },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: { sortOrder: 'asc' }, select: { url: true } },
    },
    orderBy: { name: 'asc' },
  })

  const studDogs = await prisma.dog.findMany({
    where: { breederId: breeder.id, isStud: true },
    include: {
      breed: { select: { nameDe: true } },
      media: { take: 1, select: { url: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="zuchthunde" />

        <BreederPageContent bgColor={breeder.themeBgColor}>
          {featuredDogs.length === 0 && studDogs.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">Noch keine Zuchthunde vorgestellt.</p>
            </div>
          )}

          {/* Unsere Zuchthunde — große Einzelvorstellung mit Foto + Text */}
          {featuredDogs.length > 0 && (
            <div className="mb-12 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                Unsere Zuchthunde
              </h2>
              {featuredDogs.map((dog, i) => (
                <div
                  key={dog.id}
                  className="bg-white rounded-2xl border border-cream-deep overflow-hidden md:grid md:grid-cols-3"
                >
                  <div className={`bg-cream-dark aspect-square md:aspect-auto ${i % 2 === 1 ? 'md:order-2' : ''}`}>
                    {dog.media[0]?.url ? (
                      <img src={dog.media[0].url} alt={dog.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 p-7">
                    <p className="text-xs text-forest font-semibold uppercase tracking-wider mb-1">
                      {dog.breed.nameDe}{dog.isStud ? ' · Deckrüde' : ''}
                    </p>
                    <h3 className="font-serif text-xl font-bold text-stone-900 mb-3">
                      <Link href={`/hund/${dog.id}`} className="hover:underline">
                        {dog.name}
                      </Link>
                    </h3>
                    <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                      {dog.description}
                    </p>
                    {dog.healthInfo && (
                      <p className="text-stone-500 text-xs leading-relaxed whitespace-pre-line mt-4 border-t border-cream-deep pt-3">
                        {dog.healthInfo}
                      </p>
                    )}
                    <Link
                      href={`/hund/${dog.id}`}
                      className="inline-block mt-4 text-sm text-forest font-semibold hover:underline"
                    >
                      Profil ansehen →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Zuchtrüden — kompakte Übersicht */}
          {studDogs.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
                Zuchtrüden
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {studDogs.map((dog) => (
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
                      <span
                        className="absolute top-2 left-2 bg-honey text-white text-xs font-bold px-2.5 py-1 rounded-full"
                        style={accentColor ? { backgroundColor: accentColor } : undefined}
                      >
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
        </BreederPageContent>
      </main>
      <Footer />
    </>
  )
}
