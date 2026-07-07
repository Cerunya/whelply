import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import BreederContactSidebar from '@/components/BreederContactSidebar'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'

export const dynamic = 'force-dynamic'

export default async function ZuechterZuchthundePage({ params }: { params: { slug: string } }) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()
  const tabs = await getBreederTabs(breeder.id)
  const session = await auth()
  const isOwner = session?.user?.id === breeder.userId

  const allDogs = await prisma.dog.findMany({
    where: { breederId: breeder.id, isStud: true },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: { sortOrder: 'asc' }, select: { url: true, purpose: true, isPrimary: true } },
    },
    orderBy: { name: 'asc' },
  })

  const studDogs = allDogs.filter((d) => d.sex === 'male')
  const breedingFemales = allDogs.filter((d) => d.sex === 'female')

  function getCardImage(dog: typeof allDogs[0]) {
    // 1. purpose='primary' (Deckrüden-Hauptbild)
    const byPurpose = dog.media.find((m) => m.purpose === 'primary')
    if (byPurpose) return byPurpose.url
    // 2. isPrimary=true (erstes hochgeladenes Bild)
    const byPrimary = dog.media.find((m) => m.isPrimary && m.purpose !== 'dog_bg')
    if (byPrimary) return byPrimary.url
    // 3. Erstes Bild das kein Hintergrund ist
    const first = dog.media.find((m) => m.purpose !== 'dog_bg')
    if (first) return first.url
    return null
  }

  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="zuchthunde" />

        {isOwner && (
          <div className="max-w-5xl mx-auto px-4 mt-4">
            <div className="bg-honey-pale border border-honey/30 rounded-xl px-5 py-3 mb-4 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-stone-700">Deine Zuchthunde verwalten</p>
              <Link href="/dashboard" className="bg-forest text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-forest-light transition-colors">
                Hunde verwalten
              </Link>
            </div>
          </div>
        )}

        <BreederPageContent bgColor={breeder.themeBgColor} sidebar={
          <BreederContactSidebar
            kennelName={breeder.kennelName} displayName={breeder.displayName} slug={params.slug}
            city={breeder.city} state={breeder.state} street={breeder.street} zip={breeder.zip}
            showAddress={breeder.showAddress} phone={breeder.phone} showPhone={breeder.showPhone}
            website={breeder.website} socialInstagram={breeder.socialInstagram} socialFacebook={breeder.socialFacebook}
            socialTiktok={breeder.socialTiktok} socialYoutube={breeder.socialYoutube}
            themeColor={breeder.themeColor} themeAccentColor={breeder.themeAccentColor}
            verband={breeder.verband} verificationLevel={breeder.verificationLevel}
            fullName={breeder.fullName} showFullName={breeder.showFullName}
          />
        }>
          {studDogs.length === 0 && breedingFemales.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">Noch keine Zuchthunde vorgestellt.</p>
            </div>
          )}

          {studDogs.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Zuchtrüden</h2>
              {studDogs.map((dog) => (
                <Link key={dog.id} href={`/hund/${dog.id}`}
                  className="flex bg-white rounded-2xl border border-cream-deep overflow-hidden hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="w-48 flex-shrink-0 overflow-hidden">
                    {getCardImage(dog) ? (
                      <img src={getCardImage(dog)!} alt={dog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-cream-dark flex items-center justify-center min-h-[180px]">
                        <svg className="w-12 h-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-blue-100 text-blue-700">Deckrüde</span>
                      <span className="text-xs text-stone-400">{dog.breed.nameDe}</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">{dog.name}</h3>
                    {(dog.color || dog.titles) && <p className="text-sm text-stone-500 mb-1">{[dog.color, dog.titles].filter(Boolean).join(' · ')}</p>}
                    {dog.description && <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">{dog.description}</p>}
                    <p className="text-sm text-forest font-semibold mt-2 group-hover:underline">Profil ansehen {'→'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {breedingFemales.length > 0 && (
            <div className={`space-y-4 ${studDogs.length > 0 ? 'mt-10 pt-8 border-t border-cream-deep' : ''}`}>
              <h2 className="font-serif text-2xl font-bold text-stone-900">Zuchthündinnen</h2>
              {breedingFemales.map((dog) => (
                <Link key={dog.id} href={`/zuechter/${params.slug}/hund/${dog.id}`}
                  className="flex bg-white rounded-2xl border border-cream-deep overflow-hidden hover:border-pink-300 hover:shadow-md transition-all group">
                  <div className="w-48 flex-shrink-0 overflow-hidden">
                    {getCardImage(dog) ? (
                      <img src={getCardImage(dog)!} alt={dog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-cream-dark flex items-center justify-center min-h-[180px]">
                        <svg className="w-12 h-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-pink-100 text-pink-700">Zuchthündin</span>
                      <span className="text-xs text-stone-400">{dog.breed.nameDe}</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">{dog.name}</h3>
                    {(dog.color || dog.titles) && <p className="text-sm text-stone-500 mb-1">{[dog.color, dog.titles].filter(Boolean).join(' · ')}</p>}
                    {dog.description && <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">{dog.description}</p>}
                    <p className="text-sm text-pink-500 font-semibold mt-2 group-hover:underline">Mehr erfahren {'→'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </BreederPageContent>
      </main>
      <BreederFooter
        kennelName={breeder.kennelName} slug={params.slug}
        themeColor={breeder.themeColor} themeAccentColor={breeder.themeAccentColor}
        socialInstagram={breeder.socialInstagram} socialFacebook={breeder.socialFacebook}
        socialTiktok={breeder.socialTiktok} socialYoutube={breeder.socialYoutube} website={breeder.website}
      />
    </>
  )
}
