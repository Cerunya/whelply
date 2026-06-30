import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'
import BreederContactSidebar from '@/components/BreederContactSidebar'

export const dynamic = 'force-dynamic'

export default async function ZuechterZuchthundePage({
  params,
}: {
  params: { slug: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const studDogs = await prisma.dog.findMany({
    where: { breederId: breeder.id, isStud: true, sex: 'male' },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: { sortOrder: 'asc' }, select: { url: true } },
    },
    orderBy: { name: 'asc' },
  })

  const breedingFemales = await prisma.dog.findMany({
    where: { breederId: breeder.id, isStud: true, sex: 'female' },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: { sortOrder: 'asc' }, select: { url: true } },
    },
    orderBy: { name: 'asc' },
  })

  // Hunde in Zuchtrente (isStud=false, aber mit Beschreibung = ehemals aktiv)
  const retiredDogs = await prisma.dog.findMany({
    where: { breederId: breeder.id, isStud: false, description: { not: null } },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: { sortOrder: 'asc' }, select: { url: true } },
    },
    orderBy: { name: 'asc' },
  })
  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="zuchthunde" />

        <BreederPageContent bgColor={breeder.themeBgColor} sidebar={
          <BreederContactSidebar
            kennelName={breeder.kennelName}
            displayName={breeder.displayName}
            slug={params.slug}
            city={breeder.city}
            state={breeder.state}
            street={breeder.street}
            zip={breeder.zip}
            showAddress={breeder.showAddress}
            phone={breeder.phone}
            showPhone={breeder.showPhone}
            website={breeder.website}
            socialInstagram={breeder.socialInstagram}
            socialFacebook={breeder.socialFacebook}
            socialTiktok={breeder.socialTiktok}
            socialYoutube={breeder.socialYoutube}
            themeColor={breeder.themeColor}
            themeAccentColor={breeder.themeAccentColor}
            verband={breeder.verband}
            verificationLevel={breeder.verificationLevel}
            fullName={breeder.fullName}
            showFullName={breeder.showFullName}
          />
        }>
          {studDogs.length === 0 && breedingFemales.length === 0 && retiredDogs.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">Noch keine Zuchthunde vorgestellt.</p>
            </div>
          )}

          {/* Zuchthündinnen */}
          {breedingFemales.length > 0 && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Zuchthündinnen</h2>              {breedingFemales.map((dog) => (
                <Link key={dog.id} href={`/hund/${dog.id}`}
                  className="flex flex-col md:flex-row bg-white rounded-2xl border border-cream-deep overflow-hidden hover:border-pink-300 hover:shadow-md transition-all group">
                  <div className="md:w-64 md:flex-shrink-0 bg-cream-dark aspect-[4/3] md:aspect-auto overflow-hidden relative">
                    {dog.media[0]?.url ? (
                      <img src={dog.media[0].url} alt={dog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">Zuchthündin</span>
                  </div>
                  <div className="flex-1 p-6 md:p-7">
                    <p className="text-xs text-forest font-semibold uppercase tracking-wider mb-1">{dog.breed.nameDe}</p>
                    <h3 className="font-serif text-2xl font-bold text-stone-900 mb-3">{dog.name}</h3>
                    {dog.description && <p className="text-stone-600 text-sm leading-relaxed mb-3">{dog.description}</p>}
                    {dog.healthInfo && (
                      <div className="border-t border-cream-deep pt-3 mt-3">
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Gesundheit</p>
                        <p className="text-sm text-stone-600">{dog.healthInfo}</p>
                      </div>
                    )}
                    <p className="text-sm text-forest font-semibold mt-4">Profil ansehen {'->'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {/* Zuchtrüden */}
          {studDogs.length > 0 && (
            <div className={`space-y-6 ${breedingFemales.length > 0 ? 'mt-12' : ''}`}>
              <h2 className="font-serif text-2xl font-bold text-stone-900">Zuchtrüden</h2>
              {studDogs.map((dog) => (
                <Link key={dog.id} href={`/hund/${dog.id}`}
                  className="flex flex-col md:flex-row bg-white rounded-2xl border border-cream-deep overflow-hidden hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="md:w-64 md:flex-shrink-0 bg-cream-dark aspect-[4/3] md:aspect-auto overflow-hidden relative">
                    {dog.media[0]?.url ? (
                      <img src={dog.media[0].url} alt={dog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">Deckrüde</span>
                  </div>
                  <div className="flex-1 p-6 md:p-7">
                    <p className="text-xs text-forest font-semibold uppercase tracking-wider mb-1">{dog.breed.nameDe}</p>
                    <h3 className="font-serif text-2xl font-bold text-stone-900 mb-3">{dog.name}</h3>
                    {dog.description && <p className="text-stone-600 text-sm leading-relaxed mb-3">{dog.description}</p>}
                    {dog.healthInfo && (
                      <div className="border-t border-cream-deep pt-3 mt-3">
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Gesundheit</p>
                        <p className="text-sm text-stone-600">{dog.healthInfo}</p>
                      </div>
                    )}
                    <p className="text-sm text-forest font-semibold mt-4">Profil ansehen {'->'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}


          {/* Zuchtrente */}
          {retiredDogs.length > 0 && (
            <div className={`space-y-6 ${(studDogs.length > 0 || breedingFemales.length > 0) ? 'mt-12' : ''}`}>
              <h2 className="font-serif text-2xl font-bold text-stone-900">In Zuchtrente</h2>
              {retiredDogs.map((dog) => (
                <Link key={dog.id} href={`/hund/${dog.id}`}
                  className="flex flex-col md:flex-row bg-white rounded-2xl border border-cream-deep overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all opacity-75 group">
                  <div className="md:w-64 md:flex-shrink-0 bg-cream-dark aspect-[4/3] md:aspect-auto overflow-hidden relative">
                    {dog.media[0]?.url ? (
                      <img src={dog.media[0].url} alt={dog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-stone-400 text-white text-xs font-bold px-3 py-1 rounded-full">In Rente</span>
                  </div>
                  <div className="flex-1 p-6 md:p-7">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">{dog.breed.nameDe}</p>
                    <h3 className="font-serif text-2xl font-bold text-stone-700 mb-3">{dog.name}</h3>
                    {dog.description && <p className="text-stone-500 text-sm leading-relaxed">{dog.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
                </BreederPageContent>
      </main>
      <BreederFooter
        kennelName={breeder.kennelName}
        slug={params.slug}
        themeColor={breeder.themeColor}
        themeAccentColor={breeder.themeAccentColor}
        socialInstagram={breeder.socialInstagram}
        socialFacebook={breeder.socialFacebook}
        socialTiktok={breeder.socialTiktok}
        socialYoutube={breeder.socialYoutube}
        website={breeder.website}
      />
    </>
  )
}
