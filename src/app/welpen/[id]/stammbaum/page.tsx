import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

// Rekursiver Hunde-Typ für 4 Generationen
type DogNode = {
  id: string
  name: string
  titles: string | null
  birthDate: Date | null
  sex: string
  media: { url: string }[]
  parentSire: DogNode | null
  parentDam: DogNode | null
} | null

export default async function StammbaumPage({
  params,
}: {
  params: { id: string }
}) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      breed: { select: { nameDe: true } },
      media: { where: { isPrimary: true }, take: 1, select: { url: true } },
      litter: {
        include: {
          dam: {
            include: {
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
            },
          },
          sire: {
            include: {
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
            },
          },
        },
      },
    },
  })

  if (!listing || !listing.litter) notFound()

  const pupilName = listing.title || `Welpe`
  const photo = listing.media[0]?.url
  const sex = listing.sex === 'male' ? 'Rüde' : listing.sex === 'female' ? 'Hündin' : ''
  const bornDate = listing.litter.bornDate
  const dam = listing.litter.dam
  const sire = listing.litter.sire
  const sireExternal = listing.litter.sireExternal

  function ParentCard({ dog, role, color }: { dog: NonNullable<typeof dam>; role: string; color: 'pink' | 'blue' }) {
    return (
      <Link href={`/hund/${dog.id}`}
        className={`bg-white rounded-2xl border-2 p-4 hover:shadow-md transition-all block ${
          color === 'pink' ? 'border-pink-200 hover:border-pink-400' : 'border-blue-200 hover:border-blue-400'
        }`}>
        {dog.media[0]?.url && (
          <img src={dog.media[0].url} alt={dog.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />
        )}
        <p className={`text-xs font-bold uppercase tracking-wide text-center mb-1 ${color === 'pink' ? 'text-pink-500' : 'text-blue-500'}`}>{role}</p>
        <p className="font-serif font-bold text-stone-900 text-sm text-center leading-snug">{dog.name}</p>
        {dog.titles && <p className="text-xs text-stone-400 text-center mt-1 line-clamp-1">{dog.titles}</p>}
        {dog.birthDate && <p className="text-xs text-stone-300 text-center mt-1">Geb. {new Date(dog.birthDate).toLocaleDateString('de-DE')}</p>}
      </Link>
    )
  }

  function GrandCard({ dog, role, color }: { dog: { id: string; name: string } | null; role: string; color: 'pink' | 'blue' }) {
    if (!dog) return (
      <div className="bg-cream rounded-xl border border-cream-deep p-3 text-center">
        <p className={`text-xs font-semibold mb-1 ${color === 'pink' ? 'text-pink-300' : 'text-blue-300'}`}>{role}</p>
        <p className="text-xs text-stone-300">—</p>
      </div>
    )
    return (
      <Link href={`/hund/${dog.id}`}
        className={`bg-white rounded-xl border-2 p-3 block text-center hover:shadow transition-all ${
          color === 'pink' ? 'border-pink-100 hover:border-pink-300' : 'border-blue-100 hover:border-blue-300'
        }`}>
        <p className={`text-xs font-semibold mb-1 ${color === 'pink' ? 'text-pink-400' : 'text-blue-400'}`}>{role}</p>
        <p className="text-xs font-semibold text-stone-800 line-clamp-2">{dog.name}</p>
      </Link>
    )
  }

  function GreatCard({ dog, role }: { dog: { id: string; name: string } | null; role: string }) {
    if (!dog) return (
      <div className="bg-cream rounded-lg border border-cream-deep p-2 text-center">
        <p className="text-xs text-stone-300 leading-tight">{role}</p>
        <p className="text-xs text-stone-200 mt-0.5">—</p>
      </div>
    )
    return (
      <Link href={`/hund/${dog.id}`}
        className="bg-white rounded-lg border border-stone-200 hover:border-stone-400 p-2 block text-center transition-colors">
        <p className="text-xs text-stone-400 leading-tight">{role}</p>
        <p className="text-xs font-medium text-stone-700 line-clamp-2 leading-tight mt-0.5">{dog.name}</p>
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
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-5xl mx-auto px-4 py-10">

          <div className="mb-6">
            <Link href={`/welpen/${params.id}`} className="text-sm text-forest font-semibold hover:underline">
              ← Zurück zum Inserat
            </Link>
          </div>

          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">
            Stammbaum: {pupilName}
          </h1>
          <p className="text-stone-400 text-sm mb-10">
            {listing.breed.nameDe}{sex ? ` · ${sex}` : ''}
            {bornDate ? ` · Geboren am ${bornDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
          </p>

          {/* Generation 0: Welpe */}
          <div className="flex justify-center mb-0">
            <div className="bg-white rounded-2xl border-2 border-forest/30 p-5 w-52 text-center shadow-sm">
              {photo && <img src={photo} alt={pupilName} className="w-20 h-20 rounded-xl object-cover mx-auto mb-3" />}
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">{sex || 'Welpe'}</p>
              <p className="font-serif font-bold text-stone-900 text-sm">{pupilName}</p>
              <p className="text-xs text-stone-400 mt-0.5">{listing.breed.nameDe}</p>
              {bornDate && <p className="text-xs text-stone-300 mt-1">Geb. {bornDate.toLocaleDateString('de-DE')}</p>}
            </div>
          </div>
          <Connector />
          <Connector horizontal />

          {/* Generation 1: Eltern */}
          <div className="grid grid-cols-2 gap-6 mb-0">
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
                : sireExternal
                ? <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 w-full text-center"><p className="text-xs text-blue-500 font-bold uppercase mb-1">Vater (extern)</p><p className="font-serif font-bold text-stone-900 text-sm">{sireExternal}</p></div>
                : <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-full text-center text-stone-400 text-sm">Vater nicht eingetragen</div>}
            </div>
          </div>

          {/* Generation 2: Großeltern — immer alle 4 Felder anzeigen */}
          {(dam || sire || sireExternal) && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <Connector /><Connector />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Connector horizontal /><Connector horizontal />
              </div>
              <div className="grid grid-cols-4 gap-3 mb-0">
                <div className="flex flex-col items-center"><Connector /><GrandCard dog={dam?.parentSire ?? null} role="Großvater (m)" color="blue" /></div>
                <div className="flex flex-col items-center"><Connector /><GrandCard dog={dam?.parentDam ?? null} role="Großmutter (m)" color="pink" /></div>
                <div className="flex flex-col items-center"><Connector /><GrandCard dog={sire?.parentSire ?? null} role="Großvater (v)" color="blue" /></div>
                <div className="flex flex-col items-center"><Connector /><GrandCard dog={sire?.parentDam ?? null} role="Großmutter (v)" color="pink" /></div>
              </div>

              {/* Generation 3: Urgroßeltern — immer alle 8 Felder */}
              <>
                <div className="grid grid-cols-4 gap-3 mt-0">
                  {[0,1,2,3].map(i => <Connector key={i} />)}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[0,1,2,3].map(i => <Connector key={i} horizontal />)}
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {([
                    [(dam?.parentSire as any)?.parentSire, 'Urgroßvater'],
                    [(dam?.parentSire as any)?.parentDam, 'Urgroßmutter'],
                    [(dam?.parentDam as any)?.parentSire, 'Urgroßvater'],
                    [(dam?.parentDam as any)?.parentDam, 'Urgroßmutter'],
                    [(sire?.parentSire as any)?.parentSire, 'Urgroßvater'],
                    [(sire?.parentSire as any)?.parentDam, 'Urgroßmutter'],
                    [(sire?.parentDam as any)?.parentSire, 'Urgroßvater'],
                    [(sire?.parentDam as any)?.parentDam, 'Urgroßmutter'],
                  ] as [{ id: string; name: string } | null, string][]).map(([dog, role], i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-stone-200" />
                      <GreatCard dog={dog} role={role} />
                    </div>
                  ))}
                </div>
              </>
            </>
          )}

          <p className="text-xs text-stone-400 mt-10 text-center">
            Nur auf Whelply eingetragene und verknüpfte Hunde sind im Stammbaum sichtbar.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
