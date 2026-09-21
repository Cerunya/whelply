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
import { getDogLink, type DogLinkTarget } from '@/lib/subdomain'
import { generateBreederMetadata } from '@/lib/breeder-metadata'

export async function generateMetadata({ params }: { params: { slug: string; id: string } }) {
  return generateBreederMetadata(params.slug, `/hund/${params.id}`, 'Zuchthund')
}

export const dynamic = 'force-dynamic'

const LITTER_STATUS: Record<string, string> = {
  planned: 'Geplant', pregnant: 'Trächtig', born: 'Geboren',
  available: 'Abgabebereit', sold_out: 'Vergeben',
}

// Level 3: Urgroßeltern — Name+ID+Besitzer (für züchterübergreifende Links)
const ggpSelect = { select: { id: true, name: true, slug: true, breederId: true, breeder: { select: { subdomain: true, kennelName: true } } } }

// Level 2: Großeltern — Bild + Besitzer + deren Eltern (Urgroßeltern)
const gpInclude = {
  media: { take: 1, select: { url: true } },
  breeder: { select: { subdomain: true, kennelName: true } },
  parentSire: ggpSelect,
  parentDam: ggpSelect,
}

// Level 1: Eltern — Bild + Besitzer + deren Eltern (Großeltern) die wiederum Urgroßeltern haben
const parentInclude = {
  media: { take: 1, select: { url: true } },
  breeder: { select: { subdomain: true, kennelName: true } },
  parentSire: { include: gpInclude },
  parentDam: { include: gpInclude },
}

export default async function ZuechterHundPage({ params }: { params: { slug: string; id: string } }) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()

  const session = await auth()
  const isOwner = session?.user?.id === breeder.userId

  // Slug oder ID akzeptieren
  const isCuid = /^c[a-z0-9]{20,}$/.test(params.id)
  const dog = await prisma.dog.findFirst({
    where: isCuid ? { id: params.id } : { slug: params.id },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], select: { id: true, url: true, purpose: true, isPrimary: true } },
      littersAsSire: {
        select: { id: true, name: true, status: true, expectedDate: true, puppyCount: true, breed: { select: { nameDe: true } }, listings: { where: { status: 'available' }, select: { id: true } } },
        orderBy: { expectedDate: 'desc' },
      },
      littersAsDam: {
        select: { id: true, name: true, status: true, expectedDate: true, puppyCount: true, breed: { select: { nameDe: true } }, listings: { where: { status: 'available' }, select: { id: true } } },
        orderBy: { expectedDate: 'desc' },
      },
      parentSire: { include: parentInclude },
      parentDam: { include: parentInclude },
    },
  })

  if (!dog || dog.breederId !== breeder.id) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const litters = dog.sex === 'male' ? dog.littersAsSire : dog.littersAsDam
  const photos = dog.media.filter((m) => m.purpose !== 'dog_bg')
  const bestImg = photos.find((m) => m.purpose === 'primary')?.url ?? photos.find((m) => m.isPrimary)?.url ?? photos[0]?.url ?? null

  const dam = dog.parentDam
  const sire = dog.parentSire

  type ParentDogType = NonNullable<typeof dam>
  type SimpleDog = (DogLinkTarget & { name: string }) | null

  function ParentCard({ dog: d, role, color }: { dog: ParentDogType; role: string; color: 'pink' | 'blue' }) {
    return (
      <Link href={getDogLink(d, breeder.id)}
        className={`bg-white rounded-2xl border-2 p-4 hover:shadow-md transition-all block w-full max-w-[180px] ${
          color === 'pink' ? 'border-pink-200 hover:border-pink-400' : 'border-blue-200 hover:border-blue-400'
        }`}>
        {d.media[0]?.url && (
          <img src={d.media[0].url} alt={d.name} className="w-14 h-14 rounded-xl object-cover mx-auto mb-2" />
        )}
        <p className={`text-[10px] font-bold uppercase tracking-wide text-center mb-1 ${color === 'pink' ? 'text-pink-500' : 'text-blue-500'}`}>{role}</p>
        <p className="font-serif font-bold text-stone-900 text-sm text-center leading-snug">{d.name}</p>
        {d.titles && <p className="text-xs text-stone-400 text-center mt-1 line-clamp-1">{d.titles}</p>}
        {d.birthDate && <p className="text-xs text-stone-300 text-center mt-1">Geb. {new Date(d.birthDate).toLocaleDateString('de-DE')}</p>}
      </Link>
    )
  }

  function GrandCard({ dog: d, role, color }: { dog: SimpleDog; role: string; color: 'pink' | 'blue' }) {
    if (!d) return (
      <div className="bg-cream rounded-xl border border-cream-deep p-3 text-center w-full">
        <p className={`text-[10px] font-semibold mb-1 ${color === 'pink' ? 'text-pink-300' : 'text-blue-300'}`}>{role}</p>
        <p className="text-xs text-stone-300">—</p>
      </div>
    )
    return (
      <Link href={getDogLink(d, breeder.id)}
        className={`bg-white rounded-xl border-2 p-3 block text-center hover:shadow transition-all w-full ${
          color === 'pink' ? 'border-pink-100 hover:border-pink-300' : 'border-blue-100 hover:border-blue-300'
        }`}>
        <p className={`text-[10px] font-semibold mb-1 ${color === 'pink' ? 'text-pink-400' : 'text-blue-400'}`}>{role}</p>
        <p className="text-xs font-semibold text-stone-800 line-clamp-2">{d.name}</p>
      </Link>
    )
  }

  function GreatCard({ dog: d, role }: { dog: SimpleDog; role: string }) {
    if (!d) return (
      <div className="bg-cream rounded-lg border border-cream-deep p-2 text-center w-full">
        <p className="text-[10px] text-stone-300 leading-tight">{role}</p>
        <p className="text-xs text-stone-200 mt-0.5">—</p>
      </div>
    )
    return (
      <Link href={getDogLink(d, breeder.id)}
        className="bg-white rounded-lg border border-stone-200 hover:border-stone-400 p-2 block text-center transition-colors w-full">
        <p className="text-[10px] text-stone-400 leading-tight">{role}</p>
        <p className="text-xs font-medium text-stone-700 line-clamp-2 leading-tight mt-0.5">{d.name}</p>
      </Link>
    )
  }

  function Connector({ horizontal = false }: { horizontal?: boolean }) {
    return horizontal
      ? <div className="flex justify-center"><div className="w-1/2 h-0.5 bg-stone-300" /></div>
      : <div className="flex justify-center"><div className="w-0.5 h-6 bg-stone-300" /></div>
  }

  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="zuchthunde" />

        <div className="max-w-5xl mx-auto px-4 mt-4">
          {isOwner && (
            <div className="bg-honey-pale border border-honey/30 rounded-xl px-5 py-3 mb-4 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-stone-700">Dies ist die öffentliche Ansicht dieses Zuchthundes.</p>
              <Link href={`/dashboard/hund/${dog.id}`} className="bg-forest text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-forest-light transition-colors">
                Bearbeiten
              </Link>
            </div>
          )}
        </div>

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
          {photos.length > 0 && (
            <div className="mb-6"><DogPhotoGrid media={photos} dogName={dog.name} /></div>
          )}

          <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${dog.sex === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                {dog.sex === 'female' ? 'Zuchthündin' : 'Zuchtrüde'}
              </span>
              <span className="text-xs text-stone-400">{dog.breed.nameDe}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">{dog.name}</h1>
            {(dog.color || dog.titles) && <p className="text-sm text-stone-500 mb-3">{[dog.color, dog.titles].filter(Boolean).join(' · ')}</p>}
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

          {dog.healthInfo && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h2 className="font-semibold text-stone-800 mb-2">Gesundheitsuntersuchungen</h2>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{dog.healthInfo}</p>
            </div>
          )}

          {litters.length > 0 && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h2 className="font-semibold text-stone-800 mb-3">Würfe als {dog.sex === 'female' ? 'Mutter' : 'Vater'}</h2>
              <div className="space-y-3">
                {litters.map((l) => (
                  <Link key={l.id} href={`/zuechter/${params.slug}/wuerfe`}
                    className="flex items-center justify-between bg-cream rounded-xl px-4 py-3 text-sm hover:bg-cream-dark transition-colors">
                    <div>
                      <p className="font-medium text-stone-800">{l.name || l.breed.nameDe}</p>
                      <p className="text-xs text-stone-400">
                        {l.name ? l.breed.nameDe + ' · ' : ''}
                        {l.expectedDate ? new Date(l.expectedDate).toLocaleDateString('de-DE') : ''}
                        {l.puppyCount ? ` · ${l.puppyCount} Welpen` : ''}
                        {l.listings.length > 0 ? ` · ${l.listings.length} verfügbar` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      l.status === 'available' ? 'bg-green-100 text-green-700' : l.status === 'pregnant' ? 'bg-blue-100 text-blue-700' : l.status === 'born' ? 'bg-honey/20 text-honey' : 'bg-stone-100 text-stone-600'
                    }`}>{LITTER_STATUS[l.status] ?? l.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stammbaum — 4 Generationen als Kartenbaum (kein Scrollbereich) */}
          <div className="bg-white rounded-2xl border border-cream-deep p-5 sm:p-7 mb-6">
            <h2 className="font-semibold text-stone-800 mb-6">Stammbaum</h2>

            {/* Generation 0: Dieser Hund */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl border-2 border-forest/30 p-4 w-44 text-center shadow-sm">
                {bestImg && <img src={bestImg} alt={dog.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />}
                <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">{dog.sex === 'male' ? 'Rüde' : 'Hündin'}</p>
                <p className="font-serif font-bold text-stone-900 text-sm leading-snug">{dog.name}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">{dog.breed.nameDe}</p>
              </div>
            </div>
            <Connector />
            <Connector horizontal />

            {/* Generation 1: Eltern */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center">
                <Connector />
                {dam
                  ? <ParentCard dog={dam} role="Mutter" color="pink" />
                  : <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-full text-center text-stone-400 text-sm">Mutter nicht eingetragen</div>}
              </div>
              <div className="flex flex-col items-center">
                <Connector />
                {sire
                  ? <ParentCard dog={sire} role="Vater" color="blue" />
                  : <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-full text-center text-stone-400 text-sm">Vater nicht eingetragen</div>}
              </div>
            </div>

            {/* Generation 2 + 3: nur wenn mindestens ein Elternteil eingetragen */}
            {(dam || sire) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Connector /><Connector />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Connector horizontal /><Connector horizontal />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center"><Connector /><GrandCard dog={dam?.parentSire ?? null} role="Großvater (m)" color="blue" /></div>
                  <div className="flex flex-col items-center"><Connector /><GrandCard dog={dam?.parentDam ?? null} role="Großmutter (m)" color="pink" /></div>
                  <div className="flex flex-col items-center"><Connector /><GrandCard dog={sire?.parentSire ?? null} role="Großvater (v)" color="blue" /></div>
                  <div className="flex flex-col items-center"><Connector /><GrandCard dog={sire?.parentDam ?? null} role="Großmutter (v)" color="pink" /></div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((i) => <Connector key={i} />)}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((i) => <Connector key={i} horizontal />)}
                </div>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {([
                    [(dam?.parentSire as any)?.parentSire, 'Urgroßvater'],
                    [(dam?.parentSire as any)?.parentDam, 'Urgroßmutter'],
                    [(dam?.parentDam as any)?.parentSire, 'Urgroßvater'],
                    [(dam?.parentDam as any)?.parentDam, 'Urgroßmutter'],
                    [(sire?.parentSire as any)?.parentSire, 'Urgroßvater'],
                    [(sire?.parentSire as any)?.parentDam, 'Urgroßmutter'],
                    [(sire?.parentDam as any)?.parentSire, 'Urgroßvater'],
                    [(sire?.parentDam as any)?.parentDam, 'Urgroßmutter'],
                  ] as [SimpleDog, string][]).map(([d, role], i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-stone-200" />
                      <GreatCard dog={d} role={role} />
                    </div>
                  ))}
                </div>
              </>
            )}

            <p className="text-xs text-stone-400 mt-8 text-center">
              Nur auf Whelply eingetragene und verknüpfte Hunde sind im Stammbaum sichtbar.
            </p>
          </div>

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
