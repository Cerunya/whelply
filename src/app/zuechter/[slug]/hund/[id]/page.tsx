import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
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

// 3 Generationen tief laden
const pedigreeInclude = {
  media: { take: 1, select: { url: true } },
  parentSire: {
    include: {
      media: { take: 1, select: { url: true } },
      parentSire: { include: { media: { take: 1, select: { url: true } } } },
      parentDam: { include: { media: { take: 1, select: { url: true } } } },
    },
  },
  parentDam: {
    include: {
      media: { take: 1, select: { url: true } },
      parentSire: { include: { media: { take: 1, select: { url: true } } } },
      parentDam: { include: { media: { take: 1, select: { url: true } } } },
    },
  },
}

export default async function ZuechterHundPage({ params }: { params: { slug: string; id: string } }) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()

  const session = await auth()
  const isOwner = session?.user?.id === breeder.userId

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
      parentSire: { include: pedigreeInclude },
      parentDam: { include: pedigreeInclude },
    },
  })

  if (!dog || dog.breederId !== breeder.id) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const litters = dog.sex === 'male' ? dog.littersAsSire : dog.littersAsDam
  const bestImg = dog.media.find((m) => m.purpose === 'primary')?.url ?? dog.media.find((m) => m.purpose !== 'dog_bg')?.url ?? null

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
          {/* Fotos mit Lightbox */}
          {dog.media.length > 0 && (
            <div className="mb-6">
              <DogPhotoGrid media={dog.media.filter((m) => m.purpose !== 'dog_bg')} dogName={dog.name} />
            </div>
          )}

          {/* Infos + Bearbeiten-Button */}
          <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                  dog.sex === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {dog.sex === 'female' ? 'Zuchthündin' : 'Zuchtrüde'}
                </span>
                <span className="text-xs text-stone-400">{dog.breed.nameDe}</span>
              </div>
              {isOwner && (
                <Link href={`/dashboard/hund/${dog.id}`}
                  className="text-xs text-forest font-semibold hover:underline">
                  Bearbeiten
                </Link>
              )}
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">{dog.name}</h1>
            {(dog.color || dog.titles) && (
              <p className="text-sm text-stone-500 mb-3">
                {[dog.color, dog.titles].filter(Boolean).join(' · ')}
              </p>
            )}
            {dog.description && <p className="text-stone-600 leading-relaxed mb-5">{dog.description}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-cream rounded-xl px-4 py-3">
                <p className="text-xs text-stone-400 mb-0.5">Geschlecht</p>
                <p className="font-medium text-stone-800">{dog.sex === 'male' ? 'Rüde' : 'Hündin'}</p>
              </div>
              {dog.birthDate && (
                <div className="bg-cream rounded-xl px-4 py-3">
                  <p className="text-xs text-stone-400 mb-0.5">Geburtsdatum</p>
                  <p className="font-medium text-stone-800">{new Date(dog.birthDate).toLocaleDateString('de-DE')}</p>
                </div>
              )}
              {dog.pedigreeNumber && (
                <div className="bg-cream rounded-xl px-4 py-3">
                  <p className="text-xs text-stone-400 mb-0.5">Zuchtbuchnr.</p>
                  <p className="font-medium text-stone-800">{dog.pedigreeNumber}</p>
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

          {/* Stammbaum — 3 Generationen */}
          {(dog.parentSire || dog.parentDam) && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h2 className="font-semibold text-stone-800 mb-4">Stammbaum</h2>
              <div className="flex flex-col items-center gap-4">
                {/* Der Hund selbst */}
                <PedigreeNode name={dog.name} sex={dog.sex} imgUrl={bestImg} highlight />
                <div className="w-px h-4 bg-stone-300" />

                {/* Eltern */}
                <div className="flex gap-6 flex-wrap justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <PedigreeNode name={dog.parentSire?.name} sex="male" imgUrl={dog.parentSire?.media[0]?.url} link={dog.parentSire ? `/hund/${dog.parentSire.id}` : undefined} label="Vater" />
                    {/* Großeltern väterlicherseits */}
                    {dog.parentSire && (dog.parentSire.parentSire || dog.parentSire.parentDam) && (
                      <>
                        <div className="w-px h-3 bg-stone-200" />
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center gap-2">
                            <PedigreeNode name={dog.parentSire.parentSire?.name} sex="male" imgUrl={dog.parentSire.parentSire?.media[0]?.url} label="GV" small link={dog.parentSire.parentSire ? `/hund/${dog.parentSire.parentSire.id}` : undefined} />
                            {/* Urgroßeltern */}
                            {dog.parentSire.parentSire && (dog.parentSire.parentSire.parentSire || dog.parentSire.parentSire.parentDam) && (
                              <div className="flex gap-1 mt-1">
                                {dog.parentSire.parentSire.parentSire && <MiniNode name={dog.parentSire.parentSire.parentSire.name} />}
                                {dog.parentSire.parentSire.parentDam && <MiniNode name={dog.parentSire.parentSire.parentDam.name} />}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <PedigreeNode name={dog.parentSire.parentDam?.name} sex="female" imgUrl={dog.parentSire.parentDam?.media[0]?.url} label="GM" small link={dog.parentSire.parentDam ? `/hund/${dog.parentSire.parentDam.id}` : undefined} />
                            {dog.parentSire.parentDam && (dog.parentSire.parentDam.parentSire || dog.parentSire.parentDam.parentDam) && (
                              <div className="flex gap-1 mt-1">
                                {dog.parentSire.parentDam.parentSire && <MiniNode name={dog.parentSire.parentDam.parentSire.name} />}
                                {dog.parentSire.parentDam.parentDam && <MiniNode name={dog.parentSire.parentDam.parentDam.name} />}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <PedigreeNode name={dog.parentDam?.name} sex="female" imgUrl={dog.parentDam?.media[0]?.url} link={dog.parentDam ? `/hund/${dog.parentDam.id}` : undefined} label="Mutter" />
                    {dog.parentDam && (dog.parentDam.parentSire || dog.parentDam.parentDam) && (
                      <>
                        <div className="w-px h-3 bg-stone-200" />
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center gap-2">
                            <PedigreeNode name={dog.parentDam.parentSire?.name} sex="male" imgUrl={dog.parentDam.parentSire?.media[0]?.url} label="GV" small link={dog.parentDam.parentSire ? `/hund/${dog.parentDam.parentSire.id}` : undefined} />
                            {dog.parentDam.parentSire && (dog.parentDam.parentSire.parentSire || dog.parentDam.parentSire.parentDam) && (
                              <div className="flex gap-1 mt-1">
                                {dog.parentDam.parentSire.parentSire && <MiniNode name={dog.parentDam.parentSire.parentSire.name} />}
                                {dog.parentDam.parentSire.parentDam && <MiniNode name={dog.parentDam.parentSire.parentDam.name} />}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <PedigreeNode name={dog.parentDam.parentDam?.name} sex="female" imgUrl={dog.parentDam.parentDam?.media[0]?.url} label="GM" small link={dog.parentDam.parentDam ? `/hund/${dog.parentDam.parentDam.id}` : undefined} />
                            {dog.parentDam.parentDam && (dog.parentDam.parentDam.parentSire || dog.parentDam.parentDam.parentDam) && (
                              <div className="flex gap-1 mt-1">
                                {dog.parentDam.parentDam.parentSire && <MiniNode name={dog.parentDam.parentDam.parentSire.name} />}
                                {dog.parentDam.parentDam.parentDam && <MiniNode name={dog.parentDam.parentDam.parentDam.name} />}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
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

function PedigreeNode({ name, sex, imgUrl, link, label, highlight, small }: {
  name?: string | null; sex?: string; imgUrl?: string | null; link?: string; label?: string; highlight?: boolean; small?: boolean
}) {
  const w = small ? 'w-28' : 'w-40'
  const borderColor = highlight ? 'border-forest/30' : sex === 'female' ? 'border-pink-200' : 'border-blue-200'
  const hoverBorder = sex === 'female' ? 'hover:border-pink-400' : 'hover:border-blue-400'
  const labelColor = sex === 'female' ? 'text-pink-500' : 'text-blue-500'

  const content = (
    <div className={`${w} rounded-xl border-2 ${borderColor} ${link ? hoverBorder + ' hover:shadow cursor-pointer' : ''} ${highlight ? 'bg-forest/5 shadow-sm' : 'bg-white'} p-3 text-center transition-all`}>
      {imgUrl && <img src={imgUrl} alt={name ?? ''} className={`${small ? 'w-10 h-10' : 'w-14 h-14'} rounded-lg object-cover mx-auto mb-1.5`} />}
      <p className={`font-bold text-stone-900 ${small ? 'text-[11px]' : 'text-sm'} truncate`}>{name ?? 'Unbekannt'}</p>
      {label && <p className={`${small ? 'text-[9px]' : 'text-xs'} ${labelColor}`}>{label}{link ? ' →' : ''}</p>}
    </div>
  )
  return link ? <Link href={link} className="block">{content}</Link> : content
}

function MiniNode({ name }: { name: string }) {
  return (
    <div className="bg-cream rounded-lg border border-cream-deep px-2 py-1 text-center w-20">
      <p className="text-[9px] font-medium text-stone-600 truncate">{name}</p>
    </div>
  )
}
