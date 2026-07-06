import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import BreederContactSidebar from '@/components/BreederContactSidebar'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'

export const dynamic = 'force-dynamic'

function getBestImage(media: { url: string; purpose: string | null }[]) {
  return media.find((m) => m.purpose === 'primary')?.url
    ?? media.find((m) => !m.purpose || (m.purpose !== 'dog_bg'))?.url
    ?? null
}

export default async function ZuechterZuchthundePage({ params }: { params: { slug: string } }) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()
  const tabs = await getBreederTabs(breeder.id)

  const allDogs = await prisma.dog.findMany({
    where: { breederId: breeder.id, isStud: true },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: { sortOrder: 'asc' }, select: { url: true, purpose: true } },
    },
    orderBy: { name: 'asc' },
  })

  const studDogs = allDogs.filter((d) => d.sex === 'male')
  const breedingFemales = allDogs.filter((d) => d.sex === 'female')

  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="zuchthunde" />
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

          {/* Alle Hunde — gleiche Kartengröße */}
          {studDogs.length > 0 && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Zuchtrüden</h2>
              {studDogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} slug={params.slug} type="stud" />
              ))}
            </div>
          )}

          {breedingFemales.length > 0 && (
            <div className={`space-y-6 ${studDogs.length > 0 ? 'mt-12 pt-10 border-t border-cream-deep' : ''}`}>
              <h2 className="font-serif text-2xl font-bold text-stone-900">Zuchthündinnen</h2>
              {breedingFemales.map((dog) => (
                <DogCard key={dog.id} dog={dog} slug={params.slug} type="female" />
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

function DogCard({ dog, slug, type }: {
  dog: { id: string; name: string; description: string | null; healthInfo: string | null; color: string | null; titles: string | null; breed: { nameDe: string }; media: { url: string; purpose: string | null }[] }
  slug: string
  type: 'stud' | 'female'
}) {
  const img = getBestImage(dog.media)
  const href = type === 'stud' ? `/hund/${dog.id}` : `/zuechter/${slug}/hund/${dog.id}`
  const badge = type === 'stud'
    ? { bg: 'bg-blue-100 text-blue-700', label: 'Deckrüde' }
    : { bg: 'bg-pink-100 text-pink-700', label: 'Zuchthündin' }
  const hoverBorder = type === 'stud' ? 'hover:border-blue-300' : 'hover:border-pink-300'

  return (
    <Link href={href}
      className={`flex flex-col md:flex-row bg-white rounded-2xl border border-cream-deep overflow-hidden ${hoverBorder} hover:shadow-md transition-all group`}>
      <div className="md:w-64 md:flex-shrink-0 bg-cream-dark overflow-hidden" style={{ minHeight: '220px' }}>
        {img ? (
          <img src={img} alt={dog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 p-6 md:p-7">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${badge.bg}`}>{badge.label}</span>
          <span className="text-xs text-stone-400">{dog.breed.nameDe}</span>
        </div>
        <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">{dog.name}</h3>
        {(dog.color || dog.titles) && (
          <p className="text-sm text-stone-500 mb-2">
            {[dog.color, dog.titles].filter(Boolean).join(' · ')}
          </p>
        )}
        {dog.description && <p className="text-stone-600 text-sm leading-relaxed mb-3">{dog.description}</p>}
        {dog.healthInfo && (
          <div className="border-t border-cream-deep pt-3 mt-3">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Gesundheit</p>
            <p className="text-sm text-stone-600">{dog.healthInfo}</p>
          </div>
        )}
        <p className={`text-sm font-semibold mt-4 group-hover:underline ${type === 'stud' ? 'text-forest' : 'text-pink-500'}`}>
          Profil ansehen {'→'}
        </p>
      </div>
    </Link>
  )
}
