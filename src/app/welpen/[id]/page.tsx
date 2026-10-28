import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { getBreederCanonicalUrl } from '@/lib/subdomain'
import { auth } from '@/lib/auth'
import ListingImageGallery from '@/components/ListingImageGallery'
import BookmarkButton from '@/components/BookmarkButton'
import ReportButton from '@/components/ReportButton'
import NachrichtButton from '@/components/NachrichtButton'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'

const LocationMap = nextDynamic(() => import('@/components/LocationMap'), { ssr: false })

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

export default async function WelpenDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // Slug oder ID akzeptieren
  const isCuid = /^c[a-z0-9]{20,}$/.test(params.id)
  const listing = await prisma.listing.findFirst({
    where: isCuid ? { id: params.id } : { slug: params.id },
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
              parentSire: { select: { id: true, name: true, slug: true } },
              parentDam: { select: { id: true, name: true, slug: true } },
            },
          },
          sire: {
            include: {
              media: { take: 1, select: { url: true } },
              parentSire: { select: { id: true, name: true, slug: true } },
              parentDam: { select: { id: true, name: true, slug: true } },
            },
          },
          listings: {
            include: {
              dog: { select: { id: true, name: true, sex: true, slug: true } },
              media: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  })

  if (!listing) notFound()

  const session = await auth()
  const isLoggedIn = !!session?.user?.id
  const viewerBreeder = session?.user
    ? await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
    : null
  const isOwner = !!viewerBreeder && viewerBreeder.id === listing.breederId

  const isBookmarked = session?.user?.id
    ? !!(await prisma.bookmark.findFirst({ where: { userId: session.user.id, listingId: listing.id } }))
    : false

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

  // Pfoten neben dem Namen: blau = Rüde, rosa = Hündin, neutral = Waldgrün
  const pawColor =
    listing.sex === 'male' ? 'text-blue-500' : listing.sex === 'female' ? 'text-pink-500' : 'text-forest/40'

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
      <main className="min-h-screen bg-cream relative">
        {/* Dezentes Pfotenmuster im Kopfbereich */}
        <div className="absolute top-0 left-0 right-0 h-[320px] overflow-hidden pointer-events-none [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]" aria-hidden="true">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pawPattern" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
                <g fill="#2f5d40" opacity="0.05">
                  <ellipse cx="30" cy="38" rx="13" ry="16" />
                  <ellipse cx="12" cy="20" rx="6" ry="8" />
                  <ellipse cx="30" cy="14" rx="6" ry="8" />
                  <ellipse cx="48" cy="20" rx="6" ry="8" />
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pawPattern)" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-10 relative">
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

          {/* === HERO: Kopfzeile + Galerie (volle Breite) === */}
          <div className="mb-5">
            {/* Titel-Zeile */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="inline-block text-[11px] font-extrabold text-white bg-forest px-3 py-1.5 rounded-full uppercase tracking-wider mb-2 -rotate-2">{listing.breed.nameDe}</p>
                <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-stone-900 leading-tight">
                  <span className="inline-flex items-center gap-2 flex-wrap">
                    {listing.title || listing.breeder.kennelName}
                    <span className={`inline-flex items-end ${pawColor}`} aria-hidden="true">
                      <svg width="34" height="34" viewBox="0 0 60 60" className="rotate-[14deg]" fill="currentColor"><ellipse cx="30" cy="40" rx="13" ry="15" /><ellipse cx="13" cy="22" rx="6" ry="8" /><ellipse cx="30" cy="16" rx="6" ry="8" /><ellipse cx="47" cy="22" rx="6" ry="8" /></svg>
                      <svg width="20" height="20" viewBox="0 0 60 60" className="-rotate-[18deg] -ml-1 mb-1.5" fill="currentColor"><ellipse cx="30" cy="40" rx="13" ry="15" /><ellipse cx="13" cy="22" rx="6" ry="8" /><ellipse cx="30" cy="16" rx="6" ry="8" /><ellipse cx="47" cy="22" rx="6" ry="8" /></svg>
                    </span>
                  </span>
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {sex && (
                    <span className={`text-sm font-semibold ${listing.sex === 'male' ? 'text-blue-500' : listing.sex === 'female' ? 'text-pink-500' : 'text-stone-400'}`}>{sex}</span>
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
              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                <div className="bg-white border-[2.5px] border-honey rounded-2xl px-5 py-2.5 text-center rotate-[1.5deg] shadow-sm">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#92610a]">Preis</p>
                  <p className="text-2xl font-extrabold text-forest">{price}</p>
                </div>
                {isLoggedIn && !viewerBreeder && (
                  <BookmarkButton
                    listingId={listing.id}
                    initialBookmarked={isBookmarked}
                    isLoggedIn={isLoggedIn}
                  />
                )}
              </div>
            </div>

            {/* Galerie — volle Breite, Sticker-Rahmen */}
            <div className="rounded-[1.5rem] overflow-hidden border-[3px] border-white shadow-[0_6px_0_#e3d9c6]">
              {listing.media.length > 0 ? (
                <ListingImageGallery media={listing.media} breedName={listing.breed.nameDe} />
              ) : (
                <div className="bg-cream-dark aspect-[21/9] flex items-center justify-center">
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
          </div>

          {/* === INFO-BEREICH: Details links, Züchter-Karte rechts (sticky) === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">

            {/* Linke Spalte: Eckdaten + Gesundheit + Training */}
            <div className="md:col-span-2 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Eckdaten */}
                <div className="bg-white rounded-3xl border-2 border-cream-deep shadow-[0_4px_0_#e9e0d2] p-5">
                  <h2 className="font-extrabold text-stone-900 text-sm mb-3">Eckdaten</h2>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Rasse</span>
                      <span className="font-semibold text-stone-800">{listing.breed.nameDe}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-400">Geschlecht</span>
                      <span className="font-semibold text-stone-800">{sex}</span>
                    </div>
                    {birthDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-400">Geboren</span>
                        <span className="font-semibold text-stone-800">
                          {birthDate.toLocaleDateString('de-DE')}{ageText && ` (${ageText})`}
                        </span>
                      </div>
                    )}
                    {listing.litter?.handoverDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-400">Abgabe ab</span>
                        <span className="font-semibold text-stone-800">
                          {listing.litter.handoverDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {listing.dog?.color && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-400">Farbe</span>
                        <span className="font-semibold text-stone-800">{listing.dog.color}</span>
                      </div>
                    )}
                    {listing.birthLocation && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-400">Geburtsort</span>
                        <span className="font-semibold text-stone-800">{listing.birthLocation}</span>
                      </div>
                    )}
                    {listing.chipNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-400">Chip-Nr.</span>
                        <span className="font-semibold text-stone-800">{listing.chipNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gesundheit & Dokumente */}
                <div className="bg-white rounded-3xl border-2 border-cream-deep shadow-[0_4px_0_#e9e0d2] p-5">
                  <h2 className="font-extrabold text-stone-900 text-sm mb-3">Gesundheit &amp; Dokumente</h2>
                  {(listing.hasPedigree || listing.isVaccinated || listing.isDewormed || listing.isChipped || listing.isInsured) ? (
                    <div className="flex flex-wrap gap-2.5">
                      {listing.hasPedigree && <a href="/badges#ahnentafel" className="text-[11px] font-bold bg-[#e3f0e5] text-forest rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#bcdcc2] hover:-translate-y-px transition-transform">Ahnentafel</a>}
                      {listing.isVaccinated && <a href="/badges#geimpft" className="text-[11px] font-bold bg-[#e3f0e5] text-forest rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#bcdcc2] hover:-translate-y-px transition-transform">Geimpft</a>}
                      {listing.isDewormed && <a href="/badges#entwurmt" className="text-[11px] font-bold bg-[#e3f0e5] text-forest rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#bcdcc2] hover:-translate-y-px transition-transform">Entwurmt</a>}
                      {listing.isChipped && <a href="/badges#gechipt" className="text-[11px] font-bold bg-[#e3f0e5] text-forest rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#bcdcc2] hover:-translate-y-px transition-transform">Gechipt</a>}
                      {listing.isInsured && <span className="text-[11px] font-bold bg-[#e3f0e5] text-forest rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#bcdcc2] hover:-translate-y-px transition-transform">Versichert</span>}
                    </div>
                  ) : (
                    <p className="text-stone-400 text-sm">Noch keine Angaben</p>
                  )}
                </div>
              </div>

              {/* Training & Sozialisierung */}
              <div className="bg-white rounded-3xl border-2 border-cream-deep shadow-[0_4px_0_#e9e0d2] p-5">
                <h2 className="font-extrabold text-stone-900 text-sm mb-3">Training &amp; Sozialisierung</h2>
                {(listing.trainingMedical || listing.trainingCharaktertest || listing.trainingAndereTiere || listing.trainingHaushaltsgeraeusche || listing.trainingKinder || listing.trainingAutofahren || listing.trainingBelebteOrte || listing.trainingNotes) ? (
                  <>
                    <div className="flex flex-wrap gap-2.5">
                      {listing.trainingMedical && <span className="text-[11px] font-bold bg-[#fdf0d5] text-[#92610a] rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#f2d8a0]">Medical Training</span>}
                      {listing.trainingCharaktertest && <span className="text-[11px] font-bold bg-[#fdf0d5] text-[#92610a] rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#f2d8a0]">Charaktertest</span>}
                      {listing.trainingAndereTiere && <span className="text-[11px] font-bold bg-[#fdf0d5] text-[#92610a] rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#f2d8a0]">Andere Tiere</span>}
                      {listing.trainingHaushaltsgeraeusche && <span className="text-[11px] font-bold bg-[#fdf0d5] text-[#92610a] rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#f2d8a0]">Haushaltsgeräusche</span>}
                      {listing.trainingKinder && <span className="text-[11px] font-bold bg-[#fdf0d5] text-[#92610a] rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#f2d8a0]">Kinder</span>}
                      {listing.trainingAutofahren && <span className="text-[11px] font-bold bg-[#fdf0d5] text-[#92610a] rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#f2d8a0]">Autofahren</span>}
                      {listing.trainingBelebteOrte && <span className="text-[11px] font-bold bg-[#fdf0d5] text-[#92610a] rounded-lg px-3 py-1.5 shadow-[2.5px_2.5px_0_#f2d8a0]">Belebte Orte</span>}
                    </div>
                    {listing.trainingNotes && (
                      <p className="text-stone-600 text-sm mt-3 whitespace-pre-line font-medium">{listing.trainingNotes}</p>
                    )}
                  </>
                ) : (
                  <p className="text-stone-400 text-sm">Noch keine Angaben</p>
                )}
              </div>
            </div>

            {/* Rechte Spalte: Züchter + Kontakt (sticky) */}
            <div>
              <div className="bg-gradient-to-b from-[#3a7250] to-forest rounded-3xl border-[3px] border-[#234a31] shadow-[0_6px_0_#234a31] p-6 text-white md:sticky md:top-5">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-honey mb-1">Dein Züchter</p>
                <p className="font-serif font-bold text-2xl mb-3">{listing.breeder.kennelName}</p>
                {(listing.breeder.verificationLevel !== 'none' || listing.breeder.diditStatus === 'approved') && (
                  <div className="flex flex-wrap gap-2 mb-5">{listing.breeder.diditStatus === 'approved' && (<a href="/badges#id-geprueft" className="text-[11px] font-bold bg-honey text-[#234a31] px-2.5 py-1 rounded-md shadow-[2.5px_2.5px_0_#b87e1a] hover:-translate-y-px transition-transform">✓ ID geprüft</a>)}{listing.breeder.verificationLevel === 'doc_verified' && (<a href="/badges#zucht-verifiziert" className="text-[11px] font-bold bg-white/15 text-white px-2.5 py-1 rounded-md shadow-[2.5px_2.5px_0_#234a31] hover:-translate-y-px transition-transform">✓ Zucht verifiziert</a>)}</div>
                )}
                <div className="space-y-2.5">
                  {listing.breeder.phone && (
                    <a href={`tel:${listing.breeder.phone}`}
                      className="block w-full bg-honey text-stone-900 text-center py-3 rounded-full text-sm font-extrabold hover:bg-honey-light transition-colors">
                      Anrufen
                    </a>
                  )}
                  {listing.breeder.isPublished !== false && (
                    <a href={getBreederCanonicalUrl(listing.breeder.subdomain, slugify(listing.breeder.kennelName))}
                      className="block w-full bg-white/15 text-white text-center py-3 rounded-full text-sm font-bold hover:bg-white/25 transition-colors">
                      Züchter-Profil ansehen
                    </a>
                  )}
                  {!isOwner && (
                    <div>
                      <NachrichtButton
                        breederId={listing.breeder.id}
                        kennelName={listing.breeder.kennelName}
                        isLoggedIn={isLoggedIn}
                        isOwnProfile={false}
                        variant="dark"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Beschreibung — volle Breite unter den Details */}
          {listing.description && (
            <div className="bg-white rounded-3xl border-2 border-cream-deep shadow-[0_4px_0_#e9e0d2] p-6 mb-5">
              <h2 className="font-extrabold text-stone-900 text-sm mb-3">{listing.title ? `Über ${listing.title}` : 'Beschreibung'}</h2>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line font-medium">{listing.description}</p>
            </div>
          )}

          {/* Standort-Karte — volle Breite */}
          {listing.breeder.latitude && listing.breeder.longitude && (
            <div className="bg-white rounded-3xl border-2 border-cream-deep shadow-[0_4px_0_#e9e0d2] p-6 mb-8">
              <h2 className="font-extrabold text-stone-900 text-sm mb-3">Ungefährer Standort</h2>
              <LocationMap
                lat={listing.breeder.latitude}
                lng={listing.breeder.longitude}
                label={[listing.breeder.city, listing.breeder.state].filter(Boolean).join(', ')}
                className="h-64"
              />
              <p className="text-xs text-stone-400 mt-2">Der Kreis zeigt den ungefähren Standort des Züchters.</p>
            </div>
          )}


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
                    <Link href={`/hund/${listing.litter.dam.slug || listing.litter.dam.id}`}
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
                    <Link href={`/hund/${listing.litter.sire.slug || listing.litter.sire.id}`}
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
                          <Link href={`/hund/${dog.slug || dog.id}`}
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
                  href={`/welpen/${listing.slug || listing.id}/stammbaum`}
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
                    <Link key={sibling.id} href={`/welpen/${sibling.slug || sibling.id}`}
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

          {/* Melden — ganz unten */}
          {!isOwner && (
            <div className="flex justify-center pt-4 pb-2">
              <ReportButton listingId={listing.id} isLoggedIn={isLoggedIn} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
