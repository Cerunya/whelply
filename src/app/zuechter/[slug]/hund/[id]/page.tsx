import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import BreederContactSidebar from '@/components/BreederContactSidebar'
import DogPhotoGrid from '@/components/DogPhotoGrid'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'

export const dynamic = 'force-dynamic'

const LITTER_STATUS: Record<string, string> = {
  planned: 'Geplant', pregnant: 'Trächtig', born: 'Geboren',
  available: 'Abgabebereit', sold_out: 'Vergeben',
}

export default async function ZuechterHundPage({
  params,
}: {
  params: { slug: string; id: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()

  const dog = await prisma.dog.findUnique({
    where: { id: params.id },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, purpose: true } },
      littersAsSire: {
        include: { breed: { select: { nameDe: true } }, listings: { where: { status: 'available' }, select: { id: true } } },
        orderBy: { expectedDate: 'desc' },
      },
      littersAsDam: {
        include: { breed: { select: { nameDe: true } }, listings: { where: { status: 'available' }, select: { id: true } } },
        orderBy: { expectedDate: 'desc' },
      },
      parentSire: {
        include: {
          media: { take: 1, select: { url: true } },
          parentSire: { select: { id: true, name: true } },
          parentDam: { select: { id: true, name: true } },
        },
      },
      parentDam: {
        include: {
          media: { take: 1, select: { url: true } },
          parentSire: { select: { id: true, name: true } },
          parentDam: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!dog || dog.breederId !== breeder.id) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const litters = dog.sex === 'male' ? dog.littersAsSire : dog.littersAsDam

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
          {/* Fotos mit Lightbox */}
          {dog.media.length > 0 && (
            <div className="mb-6">
              <DogPhotoGrid media={dog.media} dogName={dog.name} />
            </div>
          )}

          {/* Infos */}
          <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                dog.sex === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {dog.sex === 'female' ? 'Zuchthündin' : 'Zuchtrüde'}
              </span>
              <span className="text-xs text-stone-400">{dog.breed.nameDe}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mb-4">{dog.name}</h1>
            {dog.description && <p className="text-stone-600 leading-relaxed mb-5">{dog.description}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {dog.sex && (
                <div className="bg-cream rounded-xl px-4 py-3">
                  <p className="text-xs text-stone-400 mb-0.5">Geschlecht</p>
                  <p className="font-medium text-stone-800">{dog.sex === 'male' ? 'Rüde' : 'Hündin'}</p>
                </div>
              )}
              {dog.birthDate && (
                <div className="bg-cream rounded-xl px-4 py-3">
                  <p className="text-xs text-stone-400 mb-0.5">Geburtsdatum</p>
                  <p className="font-medium text-stone-800">{new Date(dog.birthDate).toLocaleDateString('de-DE')}</p>
                </div>
              )}
              {dog.color && (
                <div className="bg-cream rounded-xl px-4 py-3">
                  <p className="text-xs text-stone-400 mb-0.5">Farbe</p>
                  <p className="font-medium text-stone-800">{dog.color}</p>
                </div>
              )}
              {dog.pedigreeNumber && (
                <div className="bg-cream rounded-xl px-4 py-3">
                  <p className="text-xs text-stone-400 mb-0.5">Zuchtbuchnr.</p>
                  <p className="font-medium text-stone-800">{dog.pedigreeNumber}</p>
                </div>
              )}
              {dog.titles && (
                <div className="bg-cream rounded-xl px-4 py-3 col-span-2">
                  <p className="text-xs text-stone-400 mb-0.5">Titel</p>
                  <p className="font-medium text-stone-800">{dog.titles}</p>
                </div>
              )}
            </div>
          </div>

          {/* Gesundheit */}
          {dog.healthInfo && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h2 className="font-semibold text-stone-800 mb-2">Gesundheitsuntersuchungen</h2>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{dog.healthInfo}</p>
            </div>
          )}

          {/* Würfe — VOR Stammbaum */}
          {litters.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h2 className="font-semibold text-stone-800 mb-3">
                Würfe als {dog.sex === 'female' ? 'Mutter' : 'Vater'}
              </h2>
              <div className="space-y-3">
                {litters.map((l) => (
                  <Link key={l.id} href={`/zuechter/${params.slug}/wuerfe`}
                    className="flex items-center justify-between bg-cream rounded-xl px-4 py-3 text-sm hover:bg-cream-dark transition-colors">
                    <div>
                      <p className="font-medium text-stone-800">{l.breed.nameDe}</p>
                      <p className="text-xs text-stone-400">
                        {l.expectedDate ? new Date(l.expectedDate).toLocaleDateString('de-DE') : ''}
                        {l.puppyCount ? ` · ${l.puppyCount} Welpen` : ''}
                        {l.listings.length > 0 ? ` · ${l.listings.length} verfügbar` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      l.status === 'available' ? 'bg-green-100 text-green-700' :
                      l.status === 'pregnant' ? 'bg-blue-100 text-blue-700' :
                      l.status === 'born' ? 'bg-honey/20 text-honey' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {LITTER_STATUS[l.status] ?? l.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stammbaum */}
          {(dog.parentSire || dog.parentDam) && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h2 className="font-semibold text-stone-800 mb-4">Stammbaum</h2>
              <div className="flex flex-col items-center gap-4">
                {/* Der Hund selbst */}
                <div className="bg-forest/5 border-2 border-forest/30 rounded-2xl p-4 w-44 text-center shadow-sm">
                  {dog.media[0]?.url && (
                    <img src={dog.media[0].url} alt={dog.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />
                  )}
                  <p className="font-bold text-stone-900 text-sm">{dog.name}</p>
                  <p className="text-xs text-stone-400">{dog.sex === 'male' ? 'Rüde' : 'Hündin'}</p>
                </div>

                {/* Verbindungslinie */}
                <div className="w-px h-6 bg-stone-300" />

                {/* Eltern */}
                <div className="flex gap-6 flex-wrap justify-center">
                  {/* Vater */}
                  {dog.parentSire ? (
                    <Link href={`/hund/${dog.parentSire.id}`}
                      className="bg-white rounded-2xl border-2 border-blue-200 p-4 w-44 text-center hover:border-blue-400 hover:shadow transition-all block">
                      {dog.parentSire.media[0]?.url && (
                        <img src={dog.parentSire.media[0].url} alt={dog.parentSire.name} className="w-14 h-14 rounded-xl object-cover mx-auto mb-2" />
                      )}
                      <p className="font-bold text-stone-900 text-sm">{dog.parentSire.name}</p>
                      <p className="text-xs text-blue-500">Vater →</p>
                      {/* Großeltern väterlicherseits */}
                      {(dog.parentSire.parentSire || dog.parentSire.parentDam) && (
                        <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 space-y-0.5">
                          {dog.parentSire.parentSire && <p>V: {dog.parentSire.parentSire.name}</p>}
                          {dog.parentSire.parentDam && <p>M: {dog.parentSire.parentDam.name}</p>}
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-44 text-center text-stone-400 text-sm">Vater nicht eingetragen</div>
                  )}

                  {/* Mutter */}
                  {dog.parentDam ? (
                    <Link href={`/hund/${dog.parentDam.id}`}
                      className="bg-white rounded-2xl border-2 border-pink-200 p-4 w-44 text-center hover:border-pink-400 hover:shadow transition-all block">
                      {dog.parentDam.media[0]?.url && (
                        <img src={dog.parentDam.media[0].url} alt={dog.parentDam.name} className="w-14 h-14 rounded-xl object-cover mx-auto mb-2" />
                      )}
                      <p className="font-bold text-stone-900 text-sm">{dog.parentDam.name}</p>
                      <p className="text-xs text-pink-500">Mutter →</p>
                      {(dog.parentDam.parentSire || dog.parentDam.parentDam) && (
                        <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400 space-y-0.5">
                          {dog.parentDam.parentSire && <p>V: {dog.parentDam.parentSire.name}</p>}
                          {dog.parentDam.parentDam && <p>M: {dog.parentDam.parentDam.name}</p>}
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-44 text-center text-stone-400 text-sm">Mutter nicht eingetragen</div>
                  )}
                </div>
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
