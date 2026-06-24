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
          />
        }>
          {studDogs.length === 0 && breedingFemales.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">Noch keine Zuchthunde vorgestellt.</p>
            </div>
          )}

          {/* Zuchtrüden */}
          {studDogs.length > 0 && (
            <div className="mb-10">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Zuchtrueden</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {studDogs.map((dog) => (
                  <Link key={dog.id} href={`/hund/${dog.id}`}
                    className="bg-white rounded-2xl border border-cream-deep overflow-hidden hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="bg-cream-dark aspect-[4/3] overflow-hidden relative">
                      {dog.media[0]?.url ? (
                        <img src={dog.media[0].url} alt={dog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Deckruede</span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">{dog.breed.nameDe}</p>
                      <p className="font-serif font-bold text-stone-900 text-lg">{dog.name}</p>
                      {dog.healthInfo && <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">{dog.healthInfo}</p>}
                      <p className="text-xs text-forest font-semibold mt-3">Profil ansehen {'->'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Zuchthündinnen */}
          {breedingFemales.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Zuchthuendinnen</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {breedingFemales.map((dog) => (
                  <Link key={dog.id} href={`/hund/${dog.id}`}
                    className="bg-white rounded-2xl border border-cream-deep overflow-hidden hover:border-pink-300 hover:shadow-md transition-all group">
                    <div className="bg-cream-dark aspect-[4/3] overflow-hidden relative">
                      {dog.media[0]?.url ? (
                        <img src={dog.media[0].url} alt={dog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Zuchthuendin</span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">{dog.breed.nameDe}</p>
                      <p className="font-serif font-bold text-stone-900 text-lg">{dog.name}</p>
                      {dog.healthInfo && <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">{dog.healthInfo}</p>}
                      <p className="text-xs text-forest font-semibold mt-3">Profil ansehen {'->'}</p>
                    </div>
                  </Link>
                ))}
              </div>
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
