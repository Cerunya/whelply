import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'
import { getDogLink, type DogLinkTarget } from '@/lib/subdomain'
import { generateBreederMetadata } from '@/lib/breeder-metadata'

export async function generateMetadata({ params }: { params: { slug: string; id: string } }) {
  return generateBreederMetadata(params.slug, `/hund/${params.id}/stammbaum`, 'Stammbaum')
}

export const dynamic = 'force-dynamic'

// ── Abfrage-Tiefe: Hund → Eltern → Großeltern → Urgroßeltern ─────────────
// Überall Besitzer-Infos dabei, damit Links züchterübergreifend auf die
// jeweilige Subdomain (oder das Züchterprofil) zeigen können.

// Gen 3 (Urgroßeltern): Basisdaten + Besitzer
const ggpSelect = { select: { id: true, name: true, slug: true, breederId: true, breeder: { select: { subdomain: true, kennelName: true } } } }

// Gen 2 (Großeltern): Bild + Besitzer + deren Eltern (Urgroßeltern)
const gpInclude = {
  media: { take: 1, select: { url: true } },
  breeder: { select: { subdomain: true, kennelName: true } },
  parentSire: ggpSelect,
  parentDam: ggpSelect,
}

// Gen 1 (Eltern): Bild + Besitzer + Großeltern inkl. Urgroßeltern
const parentInclude = {
  media: { take: 1, select: { url: true } },
  breeder: { select: { subdomain: true, kennelName: true } },
  parentSire: { include: gpInclude },
  parentDam: { include: gpInclude },
}

export default async function ZuechterHundStammbaumPage({ params }: { params: { slug: string; id: string } }) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()

  // Slug oder ID akzeptieren
  const isCuid = /^c[a-z0-9]{20,}$/.test(params.id)
  const dog = await prisma.dog.findFirst({
    where: isCuid ? { id: params.id } : { slug: params.id },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], select: { url: true, isPrimary: true, purpose: true } },
      parentSire: { include: parentInclude },
      parentDam: { include: parentInclude },
    },
  })

  if (!dog || dog.breederId !== breeder.id) notFound()

  // In eigene Konstante ziehen: TypeScript-Narrowing gilt nicht in den
  // verschachtelten Komponenten-Funktionen (hoisted function declarations)
  const currentBreederId = breeder.id

  const tabs = await getBreederTabs(breeder.id)
  const photos = dog.media.filter((m) => m.purpose !== 'dog_bg')
  const photo = photos.find((m) => m.isPrimary)?.url ?? photos[0]?.url
  const sex = dog.sex === 'male' ? 'Rüde' : dog.sex === 'female' ? 'Hündin' : ''
  const dam = dog.parentDam
  const sire = dog.parentSire

  type ParentDogType = NonNullable<typeof dam>
  type SimpleDog = (DogLinkTarget & { name: string }) | null

  function ParentCard({ dog: d, role, color }: { dog: ParentDogType; role: string; color: 'pink' | 'blue' }) {
    return (
      <Link href={getDogLink(d, currentBreederId)}
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
      <Link href={getDogLink(d, currentBreederId)}
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
      <Link href={getDogLink(d, currentBreederId)}
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
        <BreederPageContent bgColor={breeder.themeBgColor}>

          <div className="mb-6">
            <Link href={`/hund/${dog.slug || dog.id}`} className="text-sm text-forest font-semibold hover:underline">
              ← Zurück zu {dog.name}
            </Link>
          </div>

          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">
            Stammbaum: {dog.name}
          </h1>
          <p className="text-stone-400 text-sm mb-10">
            {dog.breed.nameDe}{sex ? ` · ${sex}` : ''}
            {dog.birthDate ? ` · Geboren am ${new Date(dog.birthDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
          </p>

          {/* Generation 0: Dieser Hund */}
          <div className="flex justify-center mb-0">
            <div className="bg-white rounded-2xl border-2 border-forest/30 p-5 w-52 text-center shadow-sm">
              {photo && <img src={photo} alt={dog.name} className="w-20 h-20 rounded-xl object-cover mx-auto mb-3" />}
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">{sex || 'Hund'}</p>
              <p className="font-serif font-bold text-stone-900 text-sm">{dog.name}</p>
              <p className="text-xs text-stone-400 mt-0.5">{dog.breed.nameDe}</p>
              {dog.birthDate && <p className="text-xs text-stone-300 mt-1">Geb. {new Date(dog.birthDate).toLocaleDateString('de-DE')}</p>}
            </div>
          </div>
          <Connector />
          <Connector horizontal />

          {/* Generation 1: Eltern */}
          <div className="grid grid-cols-2 gap-4 mb-0">
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

          <p className="text-xs text-stone-400 mt-10 text-center">
            Nur auf Whelply eingetragene und verknüpfte Hunde sind im Stammbaum sichtbar.
          </p>

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
