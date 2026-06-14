import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

const LITTER_STATUS_LABELS: Record<string, string> = {
  planned: 'Geplant',
  pregnant: 'Trächtig',
  born: 'Geboren',
  available: 'Welpen abgabebereit',
  sold_out: 'Ausverkauft',
}

export default async function HundDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const dog = await prisma.dog.findUnique({
    where: { id: params.id },
    include: {
      breed: { select: { nameDe: true, slug: true } },
      breeder: { select: { kennelName: true, displayName: true, city: true, state: true } },
      media: { take: 1, select: { url: true } },
      littersAsDam: {
        include: {
          breed: { select: { nameDe: true } },
          listings: { where: { status: 'available' }, select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      littersAsSire: {
        include: {
          breed: { select: { nameDe: true } },
          listings: { where: { status: 'available' }, select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!dog) notFound()

  const session = await auth()
  const viewerBreeder = session?.user
    ? await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
    : null
  const isOwner = !!viewerBreeder && viewerBreeder.id === dog.breederId

  const breederName = dog.breeder.displayName || dog.breeder.kennelName
  const location = [dog.breeder.city, dog.breeder.state].filter(Boolean).join(', ')
  const litters = [...dog.littersAsDam, ...dog.littersAsSire]

  let age: number | null = null
  if (dog.birthDate) {
    age = Math.floor((Date.now() - dog.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Eigentümer-Hinweis */}
          {isOwner && (
            <div className="bg-honey-pale border border-honey/30 rounded-xl px-5 py-3 mb-6 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-stone-700">
                Dies ist die öffentliche Ansicht dieses Zuchthundes.
              </p>
              <Link
                href={`/dashboard/hund/${dog.id}`}
                className="bg-forest text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-forest-light transition-colors"
              >
                Bearbeiten
              </Link>
            </div>
          )}

          {/* Breadcrumb */}
          <p className="text-sm text-stone-400 mb-6">
            <Link href="/" className="hover:text-stone-700">Startseite</Link>
            {' / '}
            <Link href="/zuchtrueden" className="hover:text-stone-700">Zuchtrüden</Link>
            {' / '}
            <span className="text-stone-700">{dog.name}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Foto */}
            <div className="bg-white rounded-2xl border border-cream-deep overflow-hidden aspect-square flex items-center justify-center">
              {dog.media[0]?.url ? (
                <img src={dog.media[0].url} alt={dog.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-16 h-16 text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>

            {/* Infos */}
            <div>
              <p className="text-xs font-semibold text-forest uppercase tracking-wider mb-2">
                {dog.breed.nameDe}
              </p>
              <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">
                {dog.name}
              </h1>
              {dog.isStud && (
                <span className="inline-block bg-honey text-white text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                  Deckrüde verfügbar
                </span>
              )}
              <p className="text-sm text-stone-400 mb-4">{breederName}{location && ` · ${location}`}</p>

              <div className="bg-white rounded-2xl border border-cream-deep p-5 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Geschlecht</span>
                  <span className="font-medium text-stone-800">{dog.sex === 'male' ? 'Rüde' : 'Hündin'}</span>
                </div>
                {dog.birthDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Geboren am</span>
                    <span className="font-medium text-stone-800">
                      {dog.birthDate.toLocaleDateString('de-DE')}{age !== null && ` (${age} Jahre)`}
                    </span>
                  </div>
                )}
                {dog.color && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Farbe</span>
                    <span className="font-medium text-stone-800">{dog.color}</span>
                  </div>
                )}
                {dog.titles && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Titel</span>
                    <span className="font-medium text-stone-800">{dog.titles}</span>
                  </div>
                )}
                {dog.pedigreeNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Ahnentafel-Nr.</span>
                    <span className="font-medium text-stone-800">{dog.pedigreeNumber}</span>
                  </div>
                )}
              </div>

              <Link
                href={`/zuechter/${slugify(dog.breeder.kennelName)}`}
                className="block text-center border-2 border-forest text-forest font-semibold py-3 rounded-xl hover:bg-forest/5 transition-colors"
              >
                Züchter-Profil ansehen
              </Link>
            </div>
          </div>

          {/* Würfe */}
          {litters.length > 0 && (
            <div className="mt-10">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-4">
                Würfe als {dog.sex === 'male' ? 'Vater' : 'Mutter'}
              </h2>
              <div className="space-y-3">
                {litters.map((litter) => (
                  <div key={litter.id} className="bg-white rounded-xl border border-cream-deep p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">{litter.breed.nameDe}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {LITTER_STATUS_LABELS[litter.status]}
                      </p>
                    </div>
                    {litter.listings.length > 0 ? (
                      <Link
                        href={`/welpen/${litter.listings[0].id}`}
                        className="text-sm text-forest font-semibold hover:underline"
                      >
                        Welpen ansehen →
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-500">
                        {LITTER_STATUS_LABELS[litter.status]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
