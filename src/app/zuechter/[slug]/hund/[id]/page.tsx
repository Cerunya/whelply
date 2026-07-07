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

const gpInclude = {
  media: { take: 1, select: { url: true } },
  parentSire: { include: { media: { take: 1, select: { url: true } } } },
  parentDam: { include: { media: { take: 1, select: { url: true } } } },
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
      media: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, purpose: true, isPrimary: true } },
      littersAsSire: {
        include: { breed: { select: { nameDe: true } }, listings: { where: { status: 'available' }, select: { id: true } } },
        orderBy: { expectedDate: 'desc' },
      },
      littersAsDam: {
        include: { breed: { select: { nameDe: true } }, listings: { where: { status: 'available' }, select: { id: true } } },
        orderBy: { expectedDate: 'desc' },
      },
      parentSire: { include: { ...gpInclude, parentSire: { include: gpInclude }, parentDam: { include: gpInclude } } },
      parentDam: { include: { ...gpInclude, parentSire: { include: gpInclude }, parentDam: { include: gpInclude } } },
    },
  })

  if (!dog || dog.breederId !== breeder.id) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const litters = dog.sex === 'male' ? dog.littersAsSire : dog.littersAsDam
  const photos = dog.media.filter((m) => m.purpose !== 'dog_bg')
  const bestImg = photos.find((m) => m.purpose === 'primary')?.url ?? photos.find((m) => m.isPrimary)?.url ?? photos[0]?.url ?? null

  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="zuchthunde" />

        <div className="max-w-5xl mx-auto px-4">
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
                      <p className="font-medium text-stone-800">{l.breed.nameDe}</p>
                      <p className="text-xs text-stone-400">
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

          {/* Stammbaum — IMMER 3 Generationen, leere Felder für fehlende Ahnen */}
          <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6 overflow-x-auto">
            <h2 className="font-semibold text-stone-800 mb-4">Stammbaum</h2>
            <table className="w-full min-w-[700px] border-collapse">
              <tbody>
                {/* Generation 0: Der Hund */}
                <tr>
                  <td colSpan={8} className="text-center pb-4">
                    <div className="inline-block">
                      <TreeCard name={dog.name} imgUrl={bestImg} sex={dog.sex} highlight />
                    </div>
                  </td>
                </tr>
                {/* Generation 1: Eltern */}
                <tr>
                  <td colSpan={4} className="text-center pb-4 border-r border-stone-200">
                    <TreeCard name={dog.parentSire?.name} imgUrl={dog.parentSire?.media?.[0]?.url} sex="male" label="Vater" link={dog.parentSire ? `/hund/${dog.parentSire.id}` : undefined} />
                  </td>
                  <td colSpan={4} className="text-center pb-4">
                    <TreeCard name={dog.parentDam?.name} imgUrl={dog.parentDam?.media?.[0]?.url} sex="female" label="Mutter" link={dog.parentDam ? `/hund/${dog.parentDam.id}` : undefined} />
                  </td>
                </tr>
                {/* Generation 2: Großeltern */}
                <tr>
                  <td colSpan={2} className="text-center pb-4 border-r border-stone-100">
                    <TreeCard name={dog.parentSire?.parentSire?.name} imgUrl={dog.parentSire?.parentSire?.media?.[0]?.url} sex="male" label="GV" small link={dog.parentSire?.parentSire ? `/hund/${dog.parentSire.parentSire.id}` : undefined} />
                  </td>
                  <td colSpan={2} className="text-center pb-4 border-r border-stone-200">
                    <TreeCard name={dog.parentSire?.parentDam?.name} imgUrl={dog.parentSire?.parentDam?.media?.[0]?.url} sex="female" label="GM" small link={dog.parentSire?.parentDam ? `/hund/${dog.parentSire.parentDam.id}` : undefined} />
                  </td>
                  <td colSpan={2} className="text-center pb-4 border-r border-stone-100">
                    <TreeCard name={dog.parentDam?.parentSire?.name} imgUrl={dog.parentDam?.parentSire?.media?.[0]?.url} sex="male" label="GV" small link={dog.parentDam?.parentSire ? `/hund/${dog.parentDam.parentSire.id}` : undefined} />
                  </td>
                  <td colSpan={2} className="text-center pb-4">
                    <TreeCard name={dog.parentDam?.parentDam?.name} imgUrl={dog.parentDam?.parentDam?.media?.[0]?.url} sex="female" label="GM" small link={dog.parentDam?.parentDam ? `/hund/${dog.parentDam.parentDam.id}` : undefined} />
                  </td>
                </tr>
                {/* Generation 3: Urgroßeltern */}
                <tr>
                  <td className="text-center"><TreeCard name={dog.parentSire?.parentSire?.parentSire?.name} sex="male" label="UGV" tiny /></td>
                  <td className="text-center"><TreeCard name={dog.parentSire?.parentSire?.parentDam?.name} sex="female" label="UGM" tiny /></td>
                  <td className="text-center"><TreeCard name={dog.parentSire?.parentDam?.parentSire?.name} sex="male" label="UGV" tiny /></td>
                  <td className="text-center"><TreeCard name={dog.parentSire?.parentDam?.parentDam?.name} sex="female" label="UGM" tiny /></td>
                  <td className="text-center"><TreeCard name={dog.parentDam?.parentSire?.parentSire?.name} sex="male" label="UGV" tiny /></td>
                  <td className="text-center"><TreeCard name={dog.parentDam?.parentSire?.parentDam?.name} sex="female" label="UGM" tiny /></td>
                  <td className="text-center"><TreeCard name={dog.parentDam?.parentDam?.parentSire?.name} sex="male" label="UGV" tiny /></td>
                  <td className="text-center"><TreeCard name={dog.parentDam?.parentDam?.parentDam?.name} sex="female" label="UGM" tiny /></td>
                </tr>
              </tbody>
            </table>
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

function TreeCard({ name, imgUrl, sex, label, link, highlight, small, tiny }: {
  name?: string | null; imgUrl?: string | null; sex?: string; label?: string; link?: string; highlight?: boolean; small?: boolean; tiny?: boolean
}) {
  const borderColor = highlight ? 'border-forest/40 bg-forest/5' : sex === 'female' ? 'border-pink-200' : 'border-blue-200'
  const labelColor = sex === 'female' ? 'text-pink-400' : 'text-blue-400'
  const hover = link ? (sex === 'female' ? 'hover:border-pink-400 hover:shadow' : 'hover:border-blue-400 hover:shadow') : ''

  if (tiny) {
    const inner = (
      <div className={`rounded-lg border ${name ? borderColor : 'border-dashed border-stone-200'} px-2 py-1.5 text-center mx-0.5 ${hover} transition-all`}>
        <p className={`text-[8px] ${labelColor}`}>{label}</p>
        <p className="text-[9px] font-medium text-stone-600 truncate">{name ?? '—'}</p>
      </div>
    )
    return link && name ? <Link href={link} className="block">{inner}</Link> : inner
  }

  const inner = (
    <div className={`inline-block ${small ? 'w-28' : 'w-36'} rounded-xl border-2 ${name ? borderColor : 'border-dashed border-stone-200'} ${hover} bg-white p-2 text-center transition-all`}>
      {imgUrl && <img src={imgUrl} alt={name ?? ''} className={`${small ? 'w-8 h-8' : 'w-11 h-11'} rounded-lg object-cover mx-auto mb-1`} />}
      {label && <p className={`text-[9px] ${labelColor}`}>{label}</p>}
      <p className={`font-bold text-stone-900 truncate ${small ? 'text-[10px]' : 'text-xs'}`}>{name ?? '—'}</p>
      {link && name && <p className={`text-[8px] ${labelColor}`}>{'→'}</p>}
    </div>
  )
  return link && name ? <Link href={link} className="inline-block">{inner}</Link> : inner
}
