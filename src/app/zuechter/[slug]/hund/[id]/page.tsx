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

// Großeltern-Include (wiederverwendbar)
const grandparentInclude = {
  media: { take: 1, select: { url: true } },
  parentSire: { select: { id: true, name: true } },
  parentDam: { select: { id: true, name: true } },
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
      parentSire: {
        include: {
          ...grandparentInclude,
          parentSire: { include: grandparentInclude },
          parentDam: { include: grandparentInclude },
        },
      },
      parentDam: {
        include: {
          ...grandparentInclude,
          parentSire: { include: grandparentInclude },
          parentDam: { include: grandparentInclude },
        },
      },
    },
  })

  if (!dog || dog.breederId !== breeder.id) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const litters = dog.sex === 'male' ? dog.littersAsSire : dog.littersAsDam
  const photos = dog.media.filter((m) => m.purpose !== 'dog_bg')
  const bestImg = photos.find((m) => m.purpose === 'primary')?.url ?? photos[0]?.url ?? null

  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="zuchthunde" />

        {/* Bearbeiten-Button unter der Tab-Leiste */}
        {isOwner && (
          <div className="max-w-5xl mx-auto px-4 py-2 flex justify-end">
            <Link href={`/dashboard/hund/${dog.id}`} className="bg-forest text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-forest-light transition-colors">
              Hund bearbeiten
            </Link>
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
          {/* Fotos mit Lightbox */}
          {photos.length > 0 && (
            <div className="mb-6">
              <DogPhotoGrid media={photos} dogName={dog.name} />
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
              <h2 className="font-semibold text-stone-800 mb-3">Würfe als {dog.sex === 'female' ? 'Mutter' : 'Vater'}</h2>
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

          {/* Stammbaum — 3 Generationen (Eltern, Großeltern, Urgroßeltern) */}
          {(dog.parentSire || dog.parentDam) && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6 overflow-x-auto">
              <h2 className="font-semibold text-stone-800 mb-4">Stammbaum</h2>
              <div className="flex flex-col items-center gap-3 min-w-[600px]">
                {/* Der Hund selbst */}
                <PedigreeCard name={dog.name} sex={dog.sex} imgUrl={bestImg} highlight />
                <div className="w-px h-4 bg-stone-300" />
                {/* Eltern */}
                <div className="flex gap-8 justify-center">
                  <ParentBranch parent={dog.parentSire} sex="male" label="Vater" />
                  <ParentBranch parent={dog.parentDam} sex="female" label="Mutter" />
                </div>
              </div>
            </div>
          )}

        </BreederPageContent>
      </main>

      {/* Lightbox muss AUSSERHALB von BreederPageContent sein, damit fixed korrekt funktioniert */}

      <BreederFooter
        kennelName={breeder.kennelName} slug={params.slug}
        themeColor={breeder.themeColor} themeAccentColor={breeder.themeAccentColor}
        socialInstagram={breeder.socialInstagram} socialFacebook={breeder.socialFacebook}
        socialTiktok={breeder.socialTiktok} socialYoutube={breeder.socialYoutube} website={breeder.website}
      />
    </>
  )
}

/* ── Stammbaum-Komponenten ────────────────────────── */

function ParentBranch({ parent, sex, label }: { parent: any; sex: string; label: string }) {
  if (!parent) {
    return (
      <div className="flex flex-col items-center">
        <PedigreeCard name={null} sex={sex} label={label} />
      </div>
    )
  }

  const gps = parent.parentSire
  const gpd = parent.parentDam

  return (
    <div className="flex flex-col items-center gap-2">
      <PedigreeCard name={parent.name} sex={sex} imgUrl={parent.media?.[0]?.url} link={`/hund/${parent.id}`} label={label} />
      {(gps || gpd) && (
        <>
          <div className="w-px h-3 bg-stone-200" />
          <div className="flex gap-4">
            <GrandparentBranch gp={gps} sex="male" label="GV" />
            <GrandparentBranch gp={gpd} sex="female" label="GM" />
          </div>
        </>
      )}
    </div>
  )
}

function GrandparentBranch({ gp, sex, label }: { gp: any; sex: string; label: string }) {
  if (!gp) return <PedigreeCard name={null} sex={sex} label={label} small />

  return (
    <div className="flex flex-col items-center gap-2">
      <PedigreeCard name={gp.name} sex={sex} imgUrl={gp.media?.[0]?.url} link={`/hund/${gp.id}`} label={label} small />
      {(gp.parentSire || gp.parentDam) && (
        <>
          <div className="w-px h-2 bg-stone-100" />
          <div className="flex gap-2">
            {gp.parentSire && <MiniCard name={gp.parentSire.name} label="UGV" />}
            {gp.parentDam && <MiniCard name={gp.parentDam.name} label="UGM" />}
          </div>
        </>
      )}
    </div>
  )
}

function PedigreeCard({ name, sex, imgUrl, link, label, highlight, small }: {
  name?: string | null; sex?: string; imgUrl?: string | null; link?: string; label?: string; highlight?: boolean; small?: boolean
}) {
  const w = small ? 'w-28' : 'w-40'
  const border = highlight ? 'border-forest/30 bg-forest/5' : sex === 'female' ? 'border-pink-200' : 'border-blue-200'
  const hover = link ? (sex === 'female' ? 'hover:border-pink-400 hover:shadow' : 'hover:border-blue-400 hover:shadow') : ''
  const labelColor = sex === 'female' ? 'text-pink-500' : 'text-blue-500'

  const inner = (
    <div className={`${w} rounded-xl border-2 ${border} ${hover} bg-white p-2.5 text-center transition-all`}>
      {imgUrl && <img src={imgUrl} alt={name ?? ''} className={`${small ? 'w-9 h-9' : 'w-12 h-12'} rounded-lg object-cover mx-auto mb-1`} />}
      <p className={`font-bold text-stone-900 truncate ${small ? 'text-[10px]' : 'text-xs'}`}>{name ?? '—'}</p>
      {label && <p className={`${small ? 'text-[8px]' : 'text-[10px]'} ${labelColor}`}>{label}{link ? ' →' : ''}</p>}
    </div>
  )
  return link ? <Link href={link} className="block">{inner}</Link> : inner
}

function MiniCard({ name, label }: { name: string; label: string }) {
  return (
    <div className="bg-cream rounded-lg border border-cream-deep px-2 py-1 text-center w-20">
      <p className="text-[8px] text-stone-400">{label}</p>
      <p className="text-[9px] font-medium text-stone-600 truncate">{name}</p>
    </div>
  )
}
