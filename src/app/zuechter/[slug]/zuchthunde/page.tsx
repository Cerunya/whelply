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
import { generateBreederMetadata } from '@/lib/breeder-metadata'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return generateBreederMetadata(params.slug, '/zuchthunde', 'Zuchthunde')

export const dynamic = 'force-dynamic'

export default async function ZuechterZuchthundePage({ params }: { params: { slug: string } }) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()
  const tabs = await getBreederTabs(breeder.id)
  const session = await auth()
  const isOwner = session?.user?.id === breeder.userId

  const allDogs = await prisma.dog.findMany({
    where: { breederId: breeder.id, listings: { none: { type: 'puppy' } } },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], select: { url: true, purpose: true, isPrimary: true } },
    },
    orderBy: { name: 'asc' },
  })

  const males = allDogs.filter((d) => d.sex === 'male')
  const females = allDogs.filter((d) => d.sex === 'female')

  function getCardImage(dog: typeof allDogs[0]) {
    const m = dog.media
    return m.find((x) => x.purpose === 'primary')?.url
      ?? m.find((x) => x.isPrimary && x.purpose !== 'dog_bg')?.url
      ?? m.find((x) => x.purpose !== 'dog_bg')?.url
      ?? null
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
          {males.length === 0 && females.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">Noch keine Zuchthunde vorgestellt.</p>
            </div>
          )}

          {females.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Hündinnen</h2>
              {females.map((dog) => (
                <DogCard key={dog.id} dog={dog} img={getCardImage(dog)} href={`/zuechter/${params.slug}/hund/${dog.id}`} badge={dog.isStud ? "Zuchthündin" : "Hündin"} badgeColor={dog.isStud ? "bg-pink-100 text-pink-700" : "bg-stone-100 text-stone-600"} hoverColor={dog.isStud ? "hover:border-pink-300" : "hover:border-stone-400"} linkColor={dog.isStud ? "text-pink-500" : "text-stone-500"} />
              ))}
            </div>
          )}

          {males.length > 0 && (
            <div className={`space-y-4 ${females.length > 0 ? 'mt-10 pt-8 border-t border-cream-deep' : ''}`}>
              <h2 className="font-serif text-2xl font-bold text-stone-900">Rüden</h2>
              {males.map((dog) => (
                <DogCard key={dog.id} dog={dog} img={getCardImage(dog)} href={dog.isStud ? `/hund/${dog.id}` : `/zuechter/${params.slug}/hund/${dog.id}`} badge={dog.isStud ? "Deckrüde" : "Rüde"} badgeColor={dog.isStud ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-600"} hoverColor={dog.isStud ? "hover:border-blue-300" : "hover:border-stone-400"} linkColor={dog.isStud ? "text-forest" : "text-stone-500"} />
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

function DogCard({ dog, img, href, badge, badgeColor, hoverColor, linkColor }: {
  dog: { name: string; color: string | null; titles: string | null; description: string | null; breed: { nameDe: string } }
  img: string | null; href: string; badge: string; badgeColor: string; hoverColor: string; linkColor: string
}) {
  return (
    <Link href={href} className={`flex flex-col md:flex-row bg-white rounded-2xl border border-cream-deep overflow-hidden ${hoverColor} hover:shadow-md transition-all group md:h-[220px]`}>
      <div className="h-48 md:h-full md:w-56 flex-shrink-0 overflow-hidden bg-cream-dark">
        {img ? (
          <img src={img} alt={dog.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
        )}
      </div>
      <div className="flex-1 p-5 flex flex-col justify-center overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${badgeColor}`}>{badge}</span>
          <span className="text-xs text-stone-400">{dog.breed.nameDe}</span>
        </div>
        <h3 className="font-serif text-xl font-bold text-stone-900 mb-1 truncate">{dog.name}</h3>
        {(dog.color || dog.titles) && <p className="text-sm text-stone-500 mb-1 truncate">{[dog.color, dog.titles].filter(Boolean).join(' · ')}</p>}
        {dog.description && <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">{dog.description}</p>}
        <p className={`text-sm font-semibold mt-auto pt-2 group-hover:underline ${linkColor}`}>Profil ansehen {'→'}</p>
      </div>
    </Link>
  )
}
