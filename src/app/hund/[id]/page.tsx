import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { getBreederCanonicalUrl } from '@/lib/subdomain'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import DogPhotoGrid from '@/components/DogPhotoGrid'
import NachrichtButton from '@/components/NachrichtButton'

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
      breeder: { select: { id: true, kennelName: true, displayName: true, city: true, state: true, isPublished: true, subdomain: true, phone: true, showPhone: true, website: true, socialInstagram: true, socialFacebook: true, verificationLevel: true } },
      media: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], select: { id: true, url: true, isPrimary: true, sortOrder: true, purpose: true } },
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
  const isLoggedIn = !!session?.user?.id

  const breederName = dog.breeder.displayName || dog.breeder.kennelName
  const location = [dog.breeder.city, dog.breeder.state].filter(Boolean).join(', ')
  const breederUrl = getBreederCanonicalUrl(dog.breeder.subdomain, slugify(dog.breeder.kennelName))
  const litters = [...dog.littersAsDam, ...dog.littersAsSire]

  let age: number | null = null
  if (dog.birthDate) {
    age = Math.floor((Date.now() - dog.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  const hasBgImage = dog.isStud && dog.sex === 'male' && dog.media.some((m) => m.purpose === 'dog_bg')
  const pageBgColor = dog.pageBgColor ?? '#1e293b'

  return (
    <div style={{ backgroundColor: hasBgImage ? pageBgColor : '#faf8f3', minHeight: '100vh' }}>
      <Navbar />
      {(() => {
        const isStud = dog.isStud && dog.sex === 'male'
        const hasBg = isStud && dog.media.some((m) => m.purpose === 'dog_bg')
        const cardColor = dog.pageCardColor ?? '#ffffff'
        const textColor = dog.pageTextColor ?? '#44403c'
        const headingColor = dog.pageHeadingColor ?? '#1c1917'
        const bgColor = dog.pageBgColor ?? '#1e293b'
        const bgFixed = dog.pageBgFixed !== false
        return (
          <main className="min-h-screen relative">
            {hasBg && (
              <div className={`${bgFixed ? 'fixed' : 'absolute'} inset-x-0 top-0 z-0`} style={{ height: '100vh', pointerEvents: 'none' }}>
                <img src={dog.media.find((m) => m.purpose === 'dog_bg')!.url} alt="" className="w-full h-full object-cover" />
                {/* Gradient: oben transparent, ab 60vh Übergang zur Hintergrundfarbe */}
                <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 0px, transparent 85vh, ${bgColor}90 95vh, ${bgColor} 100vh)` }} />
              </div>
            )}
        <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
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

          {/* Ein Rahmen um den gesamten Inhalt */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: dog.pageCardColor ?? '#ffffff', color: dog.pageTextColor ?? '#44403c', padding: '2rem' }}>
          {(() => {
            const isStud = dog.isStud && dog.sex === 'male'
            const photos = dog.media.filter((m) => m.purpose !== 'dog_bg')

            return (
              <>
                {/* Fotos — Deckrüden: 5er-Grid, andere: großes Bild + Thumbnails */}
                {isStud ? (
                  <DogPhotoGrid media={photos} dogName={dog.name} />
                ) : (
                  photos.length > 0 && (
                    <div className="mb-8">
                      <div className="rounded-2xl overflow-hidden bg-cream-dark mb-3" style={{ height: '400px' }}>
                        <img src={photos[0].url} alt={dog.name} className="w-full h-full object-cover" />
                      </div>
                      {photos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {photos.slice(1).map((img) => (
                            <img key={img.id} src={img.url} alt="" className="h-20 w-20 object-cover rounded-xl flex-shrink-0 border border-cream-deep" />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
              </>
            )
          })()}

          {/* Header-Infos */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-forest uppercase tracking-wider mb-2">
              {dog.breed.nameDe}
            </p>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">
              {dog.name}
            </h1>
            {dog.isStud && (
              <span className="inline-block bg-honey text-white text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                {dog.sex === 'male' ? 'Deckrüde verfügbar' : 'Zuchthündin'}
              </span>
            )}
            <p className="text-sm text-stone-400">{breederName}{location && ` · ${location}`}</p>
          </div>

          {/* Eckdaten + Züchter nebeneinander */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="rounded-2xl border border-cream-deep p-5 space-y-3" style={{ backgroundColor: "#ffffff", color: dog.pageTextColor ?? "#44403c" }}>
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

            {/* Züchter-Kontakt */}
            <div className="bg-forest rounded-2xl p-5 text-white flex flex-col justify-between">
              <div>
                <p className="font-serif font-bold text-lg mb-0.5">{breederName}</p>
                {dog.breeder.verificationLevel !== 'none' && (
                  <p className="text-white/70 text-xs mb-4">Verifizierter Züchter</p>
                )}
              </div>
              <div className="space-y-2">
                {dog.breeder.showPhone && dog.breeder.phone && (
                  <a href={`tel:${dog.breeder.phone}`}
                    className="block w-full bg-honey text-white text-center py-3 rounded-xl text-sm font-bold hover:bg-honey-light transition-colors">
                    Anrufen
                  </a>
                )}
                {dog.breeder.isPublished !== false && (
                  <a href={breederUrl}
                    className="block w-full bg-white/10 text-white text-center py-3 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors">
                    Züchter-Profil ansehen
                  </a>
                )}
                {!isOwner && (
                  <div className="pt-1">
                    <NachrichtButton
                      breederId={dog.breederId}
                      kennelName={dog.breeder.kennelName}
                      isLoggedIn={isLoggedIn}
                      isOwnProfile={false}
                      variant="dark"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vorstellung */}
          {dog.description && (
            <div className="mt-10">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-4">Über {dog.name}</h2>
              <div className="rounded-2xl border border-cream-deep p-6" style={{ backgroundColor: "#ffffff", color: dog.pageTextColor ?? "#44403c" }}>
                <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                  {dog.description}
                </p>
              </div>
            </div>
          )}

          {/* Gesundheitstests */}
          {dog.healthInfo && (
            <div className="mt-10">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-4">Gesundheitstests</h2>
              <div className="rounded-2xl border border-cream-deep p-6" style={{ backgroundColor: "#ffffff", color: dog.pageTextColor ?? "#44403c" }}>
                <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                  {dog.healthInfo}
                </p>
              </div>
            </div>
          )}

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
                      <p className="font-semibold text-stone-800 text-sm">{litter.name || litter.breed.nameDe}</p>
                      {litter.name && <p className="text-xs text-stone-400">{litter.breed.nameDe}</p>}
                      <p className="text-xs text-stone-400 mt-0.5">
                        {LITTER_STATUS_LABELS[litter.status]}
                      </p>
                    </div>
                    {litter.listings.length > 0 ? (
                      <Link
                        href={getBreederCanonicalUrl(dog.breeder.subdomain, slugify(dog.breeder.kennelName), `/wuerfe/${litter.id}`)}
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

          {/* Stammbaum (Eltern + Großeltern) */}
          {(dog.parentSire || dog.parentDam) && (
            <div className="mt-10 border-t border-cream-deep pt-10">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-6 text-center">Stammbaum</h2>

              {/* Dieser Hund */}
              <div className="flex justify-center mb-0">
                <div className="rounded-2xl border-2 border-forest/30 p-4 w-44 text-center shadow-sm" style={{ backgroundColor: "#ffffff", color: dog.pageTextColor ?? "#44403c" }}>
                  {(() => { const img = dog.media.find((m) => m.purpose === 'primary')?.url ?? dog.media.find((m) => m.isPrimary && m.purpose !== 'dog_bg')?.url ?? dog.media.find((m) => m.purpose !== 'dog_bg')?.url; return img ? (
                    <img src={img} alt={dog.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />
                  ) : null })()}
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-0.5">
                    {dog.sex === 'male' ? 'Rüde' : dog.sex === 'female' ? 'Hündin' : ''}
                  </p>
                  <p className="font-serif font-bold text-stone-900 text-sm">{dog.name}</p>
                </div>
              </div>
              <div className="flex justify-center"><div className="w-0.5 h-6 bg-stone-300" /></div>
              <div className="flex justify-center"><div className="w-1/2 h-0.5 bg-stone-300" /></div>

              {/* Eltern */}
              <div className="grid grid-cols-2 gap-6 mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-stone-300" />
                  {dog.parentDam ? (
                    <Link href={`/hund/${dog.parentDam.id}`}
                      className="bg-white rounded-2xl border-2 border-pink-200 p-4 w-full max-w-xs hover:border-pink-400 hover:shadow transition-all block">
                      {dog.parentDam.media[0]?.url && (
                        <img src={dog.parentDam.media[0].url} alt={dog.parentDam.name} className="w-14 h-14 rounded-xl object-cover mx-auto mb-2" />
                      )}
                      <p className="text-xs text-pink-500 font-bold uppercase tracking-wide text-center mb-1">Mutter</p>
                      <p className="font-serif font-bold text-stone-900 text-sm text-center">{dog.parentDam.name}</p>
                    </Link>
                  ) : (
                    <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-full max-w-xs text-center text-stone-400 text-sm">Mutter nicht eingetragen</div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-stone-300" />
                  {dog.parentSire ? (
                    <Link href={`/hund/${dog.parentSire.id}`}
                      className="bg-white rounded-2xl border-2 border-blue-200 p-4 w-full max-w-xs hover:border-blue-400 hover:shadow transition-all block">
                      {dog.parentSire.media[0]?.url && (
                        <img src={dog.parentSire.media[0].url} alt={dog.parentSire.name} className="w-14 h-14 rounded-xl object-cover mx-auto mb-2" />
                      )}
                      <p className="text-xs text-blue-500 font-bold uppercase tracking-wide text-center mb-1">Vater</p>
                      <p className="font-serif font-bold text-stone-900 text-sm text-center">{dog.parentSire.name}</p>
                    </Link>
                  ) : (
                    <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-full max-w-xs text-center text-stone-400 text-sm">Vater nicht eingetragen</div>
                  )}
                </div>
              </div>

              {/* Großeltern */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex justify-center"><div className="w-0.5 h-5 bg-stone-200" /></div>
                <div className="flex justify-center"><div className="w-0.5 h-5 bg-stone-200" /></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex justify-center"><div className="w-1/2 h-0.5 bg-stone-200" /></div>
                <div className="flex justify-center"><div className="w-1/2 h-0.5 bg-stone-200" /></div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { dog: dog.parentDam?.parentSire ?? null, role: 'Großvater (m)', color: 'blue' },
                  { dog: dog.parentDam?.parentDam ?? null, role: 'Großmutter (m)', color: 'pink' },
                  { dog: dog.parentSire?.parentSire ?? null, role: 'Großvater (v)', color: 'blue' },
                  { dog: dog.parentSire?.parentDam ?? null, role: 'Großmutter (v)', color: 'pink' },
                ].map(({ dog: gp, role, color }) => (
                  <div key={role} className="flex flex-col items-center">
                    <div className="w-0.5 h-5 bg-stone-200" />
                    {gp ? (
                      <Link href={`/hund/${gp.id}`}
                        className={`bg-white rounded-xl border-2 w-full p-3 block text-center hover:shadow transition-all ${color === 'pink' ? 'border-pink-100 hover:border-pink-200' : 'border-blue-100 hover:border-blue-200'}`}>
                        <p className={`text-xs font-semibold mb-1 ${color === 'pink' ? 'text-pink-400' : 'text-blue-400'}`}>{role}</p>
                        <p className="text-xs font-semibold text-stone-800 line-clamp-2">{gp.name}</p>
                      </Link>
                    ) : (
                      <div className="bg-cream rounded-xl border border-cream-deep p-3 w-full text-center">
                        <p className="text-xs text-stone-300">{role}</p>
                        <p className="text-xs text-stone-300 mt-0.5">—</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>{/* Ende Inhalts-Rahmen */}
        </div>
      </main>
        )
      })()}
      <Footer />
    </div>
  )
}
