import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import BreederContactSidebar from '@/components/BreederContactSidebar'
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
      media: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true } },
      littersAsSire: { include: { breed: { select: { nameDe: true } } }, orderBy: { expectedDate: 'desc' } },
      littersAsDam: { include: { breed: { select: { nameDe: true } } }, orderBy: { expectedDate: 'desc' } },
      parentSire: { select: { id: true, name: true } },
      parentDam: { select: { id: true, name: true } },
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
          {/* Foto */}
          {dog.media.length > 0 && (
            <div className="mb-6">
              <div className="rounded-2xl overflow-hidden bg-cream-dark" style={{ height: '360px' }}>
                <img src={dog.media[0].url} alt={dog.name} className="w-full h-full object-cover" />
              </div>
              {dog.media.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {dog.media.slice(1).map((m) => (
                    <img key={m.id} src={m.url} alt="" className="h-20 w-20 object-cover rounded-xl flex-shrink-0 border border-cream-deep" />
                  ))}
                </div>
              )}
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

            {dog.description && (
              <p className="text-stone-600 leading-relaxed mb-5">{dog.description}</p>
            )}

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
              <p className="text-stone-600 text-sm leading-relaxed">{dog.healthInfo}</p>
            </div>
          )}

          {/* Abstammung */}
          {(dog.parentSire || dog.parentDam) && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h2 className="font-semibold text-stone-800 mb-3">Abstammung</h2>
              <div className="flex gap-4 text-sm">
                {dog.parentSire && (
                  <div className="bg-cream rounded-xl px-4 py-3 flex-1">
                    <p className="text-xs text-stone-400">Vater</p>
                    <p className="font-medium text-stone-800">{dog.parentSire.name}</p>
                  </div>
                )}
                {dog.parentDam && (
                  <div className="bg-cream rounded-xl px-4 py-3 flex-1">
                    <p className="text-xs text-stone-400">Mutter</p>
                    <p className="font-medium text-stone-800">{dog.parentDam.name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Würfe */}
          {litters.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7">
              <h2 className="font-semibold text-stone-800 mb-3">
                Würfe {dog.sex === 'female' ? 'als Mutter' : 'als Vater'}
              </h2>
              <div className="space-y-3">
                {litters.map((l) => (
                  <div key={l.id} className="flex items-center justify-between bg-cream rounded-xl px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-stone-800">{l.breed.nameDe}</p>
                      {l.expectedDate && (
                        <p className="text-xs text-stone-400">{new Date(l.expectedDate).toLocaleDateString('de-DE')}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      l.status === 'available' ? 'bg-green-100 text-green-700' :
                      l.status === 'pregnant' ? 'bg-blue-100 text-blue-700' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {LITTER_STATUS[l.status] ?? l.status}
                    </span>
                  </div>
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
