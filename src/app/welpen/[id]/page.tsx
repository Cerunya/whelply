import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { auth } from '@/lib/auth'
import ListingImageGallery from '@/components/ListingImageGallery'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

export default async function WelpenDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      breed: true,
      breeder: true,
      media: { orderBy: { sortOrder: 'asc' } },
      dog: true,
      litter: {
        include: {
          dam: {
            include: {
              media: { take: 1, select: { url: true } },
              parentSire: { select: { id: true, name: true } },
              parentDam: { select: { id: true, name: true } },
            },
          },
          sire: {
            include: {
              media: { take: 1, select: { url: true } },
              parentSire: { select: { id: true, name: true } },
              parentDam: { select: { id: true, name: true } },
            },
          },
          listings: {
            where: { status: 'available' },
            include: {
              dog: { select: { id: true, name: true, sex: true } },
              media: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  })

  if (!listing) notFound()

  const session = await auth()
  const viewerBreeder = session?.user
    ? await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
    : null
  const isOwner = !!viewerBreeder && viewerBreeder.id === listing.breederId

  // Entwürfe sind nur für den Eigentümer sichtbar. Reservierte/verkaufte Inserate
  // bleiben (vorerst) für alle sichtbar — Dauer kann später noch festgelegt werden.
  if (listing.status === 'draft' && !isOwner) {
    notFound()
  }

  // Aufruf zählen — nicht für den Eigentümer selbst (verzerrt sonst die Statistik)
  if (!isOwner) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {}) // Fehler beim Zählen sollen die Seite nicht crashen
  }

  const price = listing.priceCents
    ? `${(listing.priceCents / 100).toLocaleString('de-DE')} €`
    : 'Preis auf Anfrage'

  const sex =
    listing.sex === 'male' ? 'Rüde' : listing.sex === 'female' ? 'Hündin' : 'Nicht angegeben'

  const birthDate = listing.dog?.birthDate ?? listing.litter?.bornDate ?? null
  let ageText: string | null = null
  if (birthDate) {
    const days = Math.floor((Date.now() - birthDate.getTime()) / (24 * 60 * 60 * 1000))
    if (days < 14) ageText = `${days} Tage`
    else if (days < 60) ageText = `${Math.floor(days / 7)} Wochen`
    else ageText = `${Math.floor(days / 30.44)} Monate`
  }

  // Wurfgeschwister: andere verfügbare Listings desselben Wurfs (ohne dieses)
  const siblings = (listing.litter?.listings ?? []).filter((l) => l.id !== listing.id)

  const location = [listing.breeder.city, listing.breeder.state]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Eigentümer-Hinweis */}
          {isOwner && (
            <div className="bg-honey-pale border border-honey/30 rounded-xl px-5 py-3 mb-6 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-stone-700">
                {listing.status === 'available'
                  ? 'Dies ist die öffentliche Ansicht deines Inserats.'
                  : listing.status === 'draft'
                  ? 'Entwurf — für andere Nutzer nicht sichtbar.'
                  : listing.status === 'reserved'
                  ? 'Als reserviert markiert.'
                  : 'Als verkauft markiert.'}
              </p>
              <Link
                href={`/dashboard/inserat/${listing.id}`}
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
            <Link href="/welpen" className="hover:text-stone-700">Welpen</Link>
            {' / '}
            <span className="text-stone-700">{listing.breed.nameDe}</span>
          </p>

          {/* === HERO: Galerie + Kopfzeile === */}
          <div className="mb-8">
            {/* Titel-Zeile */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-semibold text-forest uppercase tracking-wider mb-1">{listing.breed.nameDe}</p>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 leading-tight">
                  {listing.title || listing.breeder.kennelName}
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {sex && (
                    <span className={`text-sm font-semibold ${listing.sex === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>{sex}</span>
                  )}
                  {listing.status !== 'available' && listing.status !== 'draft' && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      listing.status === 'reserved' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {listing.status === 'reserved' ? 'Reserviert' : 'Verkauft'}
                    </span>
                  )}
                  {location && (
                    <span className="text-stone-400 text-sm flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {location}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-forest">{price}</p>
              </div>
            </div>

            {/* Galerie — volle Breite, klickbar */}
            {listing.media.length > 0 ? (
              <ListingImageGallery media={listing.media} breedName={listing.breed.nameDe} />
            ) : (
              <div className="bg-cream-dark rounded-2xl aspect-[16/9] flex items-center justify-center border border-cream-deep">
                <div className="text-center text-stone-300">
                  <svg className="w-20 h-20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm">Noch kein Foto</p>
                </div>
              </div>
            )}
          </div>

          {/* === INFO-KACHELN: 3-spaltig auf Desktop === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Eckdaten */}
            <div className="bg-white rounded-2xl border border-cream-deep p-5">
              <h2 className="font-semibold text-stone-800 text-sm mb-3">Eckdaten</h2>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Rasse</span>
                  <span className="font-medium text-stone-800">{listing.breed.nameDe}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Geschlecht</span>
                  <span className="font-medium text-stone-800">{sex}</span>
                </div>
                {birthDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Geboren</span>
                    <span className="font-medium text-stone-800">
                      {birthDate.toLocaleDateString('de-DE')}{ageText && ` (${ageText})`}
                    </span>
                  </div>
                )}
                {listing.litter?.handoverDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Abgabe ab</span>
                    <span className="font-medium text-stone-800">
                      {listing.litter.handoverDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {listing.dog?.color && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Farbe</span>
                    <span className="font-medium text-stone-800">{listing.dog.color}</span>
                  </div>
                )}
                {listing.birthLocation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Geburtsort</span>
                    <span className="font-medium text-stone-800">{listing.birthLocation}</span>
                  </div>
                )}
                {listing.chipNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Chip-Nr.</span>
                    <span className="font-medium text-stone-800">{listing.chipNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Gesundheit & Dokumente */}
            <div className="bg-white rounded-2xl border border-cream-deep p-5">
              <h2 className="font-semibold text-stone-800 text-sm mb-3">Gesundheit & Dokumente</h2>
              {(listing.hasPedigree || listing.isVaccinated || listing.isDewormed || listing.isChipped || listing.isInsured) ? (
                <div className="flex flex-wrap gap-2">
                  {listing.hasPedigree && <span className="text-xs font-medium bg-white border border-stone-300 text-stone-700 rounded-full px-2.5 py-1">Ahnentafel</span>}
                  {listing.isVaccinated && <span className="text-xs font-medium bg-white border border-stone-300 text-stone-700 rounded-full px-2.5 py-1">Geimpft</span>}
                  {listing.isDewormed && <span className="text-xs font-medium bg-white border border-stone-300 text-stone-700 rounded-full px-2.5 py-1">Entwurmt</span>}
                  {listing.isChipped && <span className="text-xs font-medium bg-white border border-stone-300 text-stone-700 rounded-full px-2.5 py-1">Gechipt</span>}
                  {listing.isInsured && <span className="text-xs font-medium bg-white border border-stone-300 text-stone-700 rounded-full px-2.5 py-1">Versichert</span>}
                </div>
              ) : (
                <p className="text-stone-400 text-sm">Noch keine Angaben</p>
              )}
            </div>

            {/* Züchter + Kontakt */}
            <div className="bg-forest rounded-2xl p-5 text-white flex flex-col justify-between">
              <div>
                <p className="font-serif font-bold text-lg mb-0.5">{listing.breeder.kennelName}</p>
                {listing.breeder.verificationLevel !== 'none' && (
                  <p className="text-white/70 text-xs mb-4">Verifizierter Züchter</p>
                )}
              </div>
              <div className="space-y-2">
                {listing.breeder.phone && (
                  <a href={`tel:${listing.breeder.phone}`}
                    className="block w-full bg-honey text-white text-center py-3 rounded-xl text-sm font-bold hover:bg-honey-light transition-colors">
                    Anrufen
                  </a>
                )}
                <Link href={`/zuechter/${slugify(listing.breeder.kennelName)}`}
                  className="block w-full bg-white/10 text-white text-center py-3 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors">


          {/* Beschreibung — volle Breite unter den 3 Blöcken */}
          {listing.description && (
            <div className="bg-white rounded-2xl border border-cream-deep p-6 mb-8">
              <h2 className="font-semibold text-stone-800 text-sm mb-3">Beschreibung</h2>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>
          )}

                  Züchter-Profil ansehen
                </Link>
              </div>
            </div>

          </div>


          {/* Stammbaum (Eltern + Großeltern) — ganz unten, nach Geschwistern */}
          {(listing.litter?.dam || listing.litter?.sire || listing.litter?.sireExternal) && (
            <div className="mt-14 border-t border-cream-deep pt-10">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-8 text-center">Stammbaum</h2>

              {/* Welpe */}
              <div className="flex justify-center mb-2">
                <div className="bg-white rounded-2xl border-2 border-forest/30 p-5 w-52 text-center shadow-sm">
                  {listing.media[0]?.url && (
                    <img src={listing.media[0].url} alt={listing.title ?? ''} className="w-20 h-20 rounded-xl object-cover mx-auto mb-2" />
                  )}
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
                    {listing.sex === 'male' ? 'Rüde' : listing.sex === 'female' ? 'Hündin' : 'Welpe'}
                  </p>
                  <p className="font-serif font-bold text-stone-900 text-sm">{listing.title || listing.breed.nameDe}</p>
                </div>
              </div>

              {/* Verbindung nach unten */}
              <div className="flex justify-center mb-0">
                <div className="w-0.5 h-8 bg-stone-300" />
              </div>
              <div className="flex justify-center mb-0">
                <div className="w-1/2 h-0.5 bg-stone-300" />
              </div>

              {/* Eltern */}
              <div className="grid grid-cols-2 gap-6 mb-2">
                {/* Mutter */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-8 bg-stone-300 mb-0" />
                  {listing.litter?.dam ? (
                    <Link href={`/hund/${listing.litter.dam.id}`}
                      className="bg-white rounded-2xl border-2 border-pink-200 p-4 w-full max-w-xs hover:border-pink-400 hover:shadow transition-all block">
                      {listing.litter.dam.media[0]?.url && (
                        <img src={listing.litter.dam.media[0].url} alt={listing.litter.dam.name}
                          className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />
                      )}
                      <p className="text-xs text-pink-500 font-bold uppercase tracking-wide text-center mb-1">Mutter</p>
                      <p className="font-serif font-bold text-stone-900 text-sm text-center">{listing.litter.dam.name}</p>
                      {listing.litter.dam.titles && <p className="text-xs text-stone-400 text-center mt-1">{listing.litter.dam.titles}</p>}
                    </Link>
                  ) : (
                    <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-full max-w-xs text-center text-stone-400 text-sm">Mutter nicht eingetragen</div>
                  )}
                </div>
                {/* Vater */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-8 bg-stone-300 mb-0" />
                  {listing.litter?.sire ? (
                    <Link href={`/hund/${listing.litter.sire.id}`}
                      className="bg-white rounded-2xl border-2 border-blue-200 p-4 w-full max-w-xs hover:border-blue-400 hover:shadow transition-all block">
                      {listing.litter.sire.media[0]?.url && (
                        <img src={listing.litter.sire.media[0].url} alt={listing.litter.sire.name}
                          className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />
                      )}
                      <p className="text-xs text-blue-500 font-bold uppercase tracking-wide text-center mb-1">Vater</p>
                      <p className="font-serif font-bold text-stone-900 text-sm text-center">{listing.litter.sire.name}</p>
                      {listing.litter.sire.titles && <p className="text-xs text-stone-400 text-center mt-1">{listing.litter.sire.titles}</p>}
                    </Link>
                  ) : listing.litter?.sireExternal ? (
                    <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 w-full max-w-xs text-center">
                      <p className="text-xs text-blue-500 font-bold uppercase tracking-wide mb-1">Vater (extern)</p>
                      <p className="font-serif font-bold text-stone-900 text-sm">{listing.litter.sireExternal}</p>
                    </div>
                  ) : (
                    <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-full max-w-xs text-center text-stone-400 text-sm">Vater nicht eingetragen</div>
                  )}
                </div>
              </div>

              {/* Großeltern — immer alle 4 Felder anzeigen */}
              {(listing.litter?.dam || listing.litter?.sire || listing.litter?.sireExternal) && (
                <>
                  <div className="grid grid-cols-2 gap-6 mb-0">
                    <div className="flex justify-center"><div className="w-0.5 h-6 bg-stone-200" /></div>
                    <div className="flex justify-center"><div className="w-0.5 h-6 bg-stone-200" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mb-0">
                    <div className="flex justify-center"><div className="w-1/2 h-0.5 bg-stone-200" /></div>
                    <div className="flex justify-center"><div className="w-1/2 h-0.5 bg-stone-200" /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Großvater (m)', dog: listing.litter?.dam?.parentSire, color: 'blue' },
                      { label: 'Großmutter (m)', dog: listing.litter?.dam?.parentDam, color: 'pink' },
                      { label: 'Großvater (v)', dog: listing.litter?.sire?.parentSire, color: 'blue' },
                      { label: 'Großmutter (v)', dog: listing.litter?.sire?.parentDam, color: 'pink' },
                    ].map(({ label, dog, color }) => (
                      <div key={label} className="flex flex-col items-center">
                        <div className="w-0.5 h-6 bg-stone-200 mb-0" />
                        {dog ? (
                          <Link href={`/hund/${dog.id}`}
                            className={`bg-white rounded-xl border-2 w-full p-3 block text-center hover:shadow transition-all ${color === 'pink' ? 'border-pink-100 hover:border-pink-200' : 'border-blue-100 hover:border-blue-200'}`}>
                            <p className={`text-xs font-semibold mb-1 ${color === 'pink' ? 'text-pink-400' : 'text-blue-400'}`}>{label}</p>
                            <p className="text-xs font-semibold text-stone-800 line-clamp-2">{dog.name}</p>
                          </Link>
                        ) : (
                          <div className="bg-cream rounded-xl border border-cream-deep p-3 w-full text-center">
                            <p className="text-xs text-stone-300">{label}</p>
                            <p className="text-xs text-stone-300 mt-1">—</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Link zum vollständigen Stammbaum */}
              <div className="mt-8 text-center">
                <Link
                  href={`/welpen/${listing.id}/stammbaum`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-forest border border-forest/30 rounded-xl px-6 py-3 hover:bg-forest hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Vollständiger Stammbaum
                </Link>
              </div>
            </div>
          )}

          {/* Wurfgeschwister */}
          {siblings.length > 0 && (
            <div className="mt-10">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-4">
                Geschwister aus diesem Wurf
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:gap-4 sm:overflow-visible">
                {siblings.map((sibling) => {
                  const sex = sibling.sex ?? sibling.dog?.sex
                  const borderClass = sex === 'male'
                    ? 'border-blue-300 bg-blue-50'
                    : sex === 'female'
                    ? 'border-pink-300 bg-pink-50'
                    : 'border-cream-deep bg-white'
                  return (
                    <Link key={sibling.id} href={`/welpen/${sibling.id}`}
                      className={`flex-shrink-0 w-40 sm:w-auto rounded-xl border-2 overflow-hidden hover:shadow-md transition-all ${borderClass}`}>
                      <div className="bg-cream-dark aspect-square flex items-center justify-center">
                        {sibling.media[0]?.url ? (
                          <img src={sibling.media[0].url} alt={sibling.dog?.name ?? ''} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-stone-800 text-sm">{sibling.dog?.name ?? sibling.title}</p>
                        <p className={`text-xs font-medium mt-0.5 ${sex === 'male' ? 'text-blue-500' : sex === 'female' ? 'text-pink-500' : 'text-stone-400'}`}>
                          {sex === 'male' ? 'Rüde' : sex === 'female' ? 'Hündin' : ''}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
