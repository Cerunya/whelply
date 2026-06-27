import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'
import BreederContactSidebar from '@/components/BreederContactSidebar'

export const dynamic = 'force-dynamic'

export default async function LitterDetailPage({
  params,
}: {
  params: { slug: string; litterId: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const displayName = breeder.displayName || breeder.kennelName
  const now = new Date()

  const litter = await prisma.litter.findUnique({
    where: { id: params.litterId },
    include: {
      breed: { select: { nameDe: true } },
      dam: { select: { id: true, name: true, titles: true, media: { take: 1, select: { url: true } } } },
      sire: { select: { id: true, name: true, titles: true, media: { take: 1, select: { url: true } } } },
      media: { take: 1, select: { url: true } },
      listings: {
        where: { type: 'puppy' },
        include: {
          breed: { select: { nameDe: true } },
          media: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!litter || litter.breederId !== breeder.id) notFound()

  const title = litter.name || litter.breed.nameDe

  const availableMales = litter.listings.filter((l) => l.status === 'available' && l.sex === 'male').length
  const availableFemales = litter.listings.filter((l) => l.status === 'available' && l.sex === 'female').length
  const totalMales = litter.listings.filter((l) => l.sex === 'male').length
  const totalFemales = litter.listings.filter((l) => l.sex === 'female').length

  let plannedText = ''
  if (litter.status === 'planned') plannedText = litter.expectedDate ? `Geplant · erwartet ${litter.expectedDate}` : 'Geplant'
  else if (litter.status === 'pregnant') plannedText = litter.expectedDate ? `Trächtig · erwartet ${litter.expectedDate}` : 'Trächtig'

  const statusBadge = {
    planned: { label: 'Geplant', cls: 'bg-stone-100 text-stone-500' },
    pregnant: { label: 'Trächtig', cls: 'bg-stone-100 text-stone-500' },
    born: { label: 'Geboren', cls: 'bg-blue-50 text-blue-700' },
    available: { label: 'Verfügbar', cls: 'bg-green-50 text-green-700' },
    sold_out: { label: 'Ausverkauft', cls: 'bg-stone-200 text-stone-600' },
  }[litter.status]

  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="wuerfe" />

        <BreederPageContent bgColor={breeder.themeBgColor} sidebar={
          <BreederContactSidebar
            kennelName={breeder.kennelName}
            displayName={breeder.displayName}
            slug={params.slug}
            city={breeder.city}
            state={breeder.state}
            street={breeder.street}
            zip={breeder.zip}
            showAddress={breeder.showAddress}
            phone={breeder.phone}
            showPhone={breeder.showPhone}
            website={breeder.website}
            socialInstagram={breeder.socialInstagram}
            socialFacebook={breeder.socialFacebook}
            socialTiktok={breeder.socialTiktok}
            socialYoutube={breeder.socialYoutube}
            themeColor={breeder.themeColor}
            themeAccentColor={breeder.themeAccentColor}
            verband={breeder.verband}
            verificationLevel={breeder.verificationLevel}
          />
        }>
          <Link href={`/zuechter/${params.slug}/wuerfe`} className="text-sm text-forest font-semibold hover:underline">
            ← Würfe & Planung
          </Link>

          <div className="mt-4 mb-10 flex items-start gap-5">
            {litter.media[0]?.url && (
              <img src={litter.media[0].url} alt={title} className="w-28 h-28 rounded-2xl object-cover flex-shrink-0" />
            )}
            <div>
              <p className="text-xs text-forest font-semibold uppercase tracking-wider mb-1">{litter.breed.nameDe}</p>
              <h1 className="font-serif text-3xl font-bold text-stone-900">{title}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {litter.bornDate ? (
                  <p className="text-stone-500 text-sm flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Geboren am {litter.bornDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                ) : (
                  <p className="text-stone-500 text-sm">{plannedText}</p>
                )}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge.cls}`}>
                  {statusBadge.label}
                </span>
              </div>
              {litter.handoverDate && (
                <p className="text-stone-500 text-sm mt-1 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Abgabebereit ab {litter.handoverDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
              {litter.listings.length > 0 && (
                <p className="text-stone-500 text-sm mt-1">
                  {totalMales} {totalMales === 1 ? 'Rüde' : 'Rüden'}, {totalFemales} {totalFemales === 1 ? 'Hündin' : 'Hündinnen'} gesamt
                  {(availableMales > 0 || availableFemales > 0) && (
                    <span className="text-green-700 font-medium ml-2">
                      · {availableMales} {availableMales === 1 ? 'Rüde' : 'Rüden'} / {availableFemales} {availableFemales === 1 ? 'Hündin' : 'Hündinnen'} noch frei
                    </span>
                  )}
                </p>
              )}
              {litter.notes && (
                <p className="text-stone-600 text-sm mt-3 whitespace-pre-line">{litter.notes}</p>
              )}
            </div>
          </div>

          {/* Welpen */}
          <div className="mb-10">
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-4">Welpen aus diesem Wurf</h2>
            {litter.listings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-cream-deep">
                <p className="text-stone-400 text-sm">Noch keine Welpen eingetragen.</p>
              </div>
            ) : (
               <div className="space-y-4">
                 {litter.listings.map((listing) => {
                   const tint = listing.status === 'sold' ? 'sold' : listing.sex === 'male' ? 'male' : listing.sex === 'female' ? 'female' : null
                   const borderClass = tint === 'sold' ? 'border-stone-300 bg-stone-50 opacity-70'
                     : tint === 'male' ? 'border-blue-200 bg-blue-50 hover:border-blue-300'
                     : tint === 'female' ? 'border-pink-200 bg-pink-50 hover:border-pink-300'
                     : 'border-cream-deep bg-white hover:border-forest/20'
                   const price = listing.priceCents
                     ? (listing.priceCents / 100).toLocaleString('de-DE') + ' €'
                     : 'Auf Anfrage'
                   return (
                     <a
                       key={listing.id}
                       href={`/welpen/${listing.id}`}
                       className={`flex flex-col sm:flex-row rounded-2xl border overflow-hidden hover:shadow-md transition-all ${borderClass}`}
                     >
                       {listing.media[0]?.url ? (
                         <div className="sm:w-44 sm:flex-shrink-0 h-36 sm:h-auto overflow-hidden bg-cream-dark">
                           <img src={listing.media[0].url} alt={listing.title ?? ''} className="w-full h-full object-cover" />
                         </div>
                       ) : (
                         <div className="sm:w-44 sm:flex-shrink-0 h-36 sm:h-auto bg-cream-dark flex items-center justify-center">
                           <svg className="w-10 h-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                         </div>
                       )}
                       <div className="flex-1 p-5 flex flex-col justify-between">
                         <div>
                           <div className="flex items-start justify-between gap-2">
                             <div>
                               <p className="font-serif font-bold text-stone-900 text-lg">{listing.title || listing.breed.nameDe}</p>
                               {listing.sex && (
                                 <p className={`text-xs font-semibold mt-0.5 ${listing.sex === 'male' ? 'text-blue-500' : 'text-pink-500'}`}>
                                   {listing.sex === 'male' ? 'Rüde' : 'Hündin'}
                                 </p>
                               )}
                             </div>
                             <div className="flex-shrink-0 text-right space-y-1">
                               {listing.status === 'available' && <span className="block text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Noch frei</span>}
                               {listing.status === 'reserved' && <span className="block text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Reserviert</span>}
                               {listing.status === 'sold' && <span className="block text-xs font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">Verkauft</span>}
                               <p className="text-base font-bold text-stone-700">{price}</p>
                             </div>
                           </div>
                           {listing.description && <p className="text-sm text-stone-500 mt-2 line-clamp-2">{listing.description}</p>}
                         </div>
                         <p className="text-xs text-stone-400 mt-3">{listing.breed.nameDe}</p>
                       </div>
                     </a>
                   )
                 })}
               </div>
            )}
            {litter.listings.length > 0 && (
              <div className="flex items-center gap-4 mt-3 text-xs text-stone-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 inline-block" /> Rüde</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-pink-100 border border-pink-200 inline-block" /> Hündin</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-stone-200 border border-stone-300 inline-block" /> Verkauft</span>
              </div>
            )}
          </div>

          {/* Eltern */}
          {(litter.dam || litter.sire || litter.sireExternal) && (
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-4">Die Eltern</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {litter.dam && (
                  <Link
                    href={`/hund/${litter.dam.id}`}
                    className="bg-white rounded-xl border border-cream-deep p-5 hover:border-forest/30 hover:shadow-sm transition-all flex items-center gap-4"
                  >
                    {litter.dam.media[0]?.url && (
                      <img
                        src={litter.dam.media[0].url}
                        alt={litter.dam.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Mutter</p>
                      <p className="font-semibold text-stone-800">{litter.dam.name}</p>
                      {litter.dam.titles && (
                        <p className="text-sm text-stone-400 mt-1">{litter.dam.titles}</p>
                      )}
                    </div>
                  </Link>
                )}
                {(litter.sire || litter.sireExternal) && (
                  litter.sire ? (
                    <Link
                      href={`/hund/${litter.sire.id}`}
                      className="bg-white rounded-xl border border-cream-deep p-5 hover:border-forest/30 hover:shadow-sm transition-all flex items-center gap-4"
                    >
                      {litter.sire.media[0]?.url && (
                        <img
                          src={litter.sire.media[0].url}
                          alt={litter.sire.name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Vater</p>
                        <p className="font-semibold text-stone-800">{litter.sire.name}</p>
                        {litter.sire.titles && (
                          <p className="text-sm text-stone-400 mt-1">{litter.sire.titles}</p>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="bg-white rounded-xl border border-cream-deep p-5">
                      <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Vater</p>
                      <p className="font-semibold text-stone-800">{litter.sireExternal}</p>
                      <p className="text-xs text-stone-400 mt-1">Externer Deckrüde</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </BreederPageContent>
      </main>
      <BreederFooter
        kennelName={breeder.kennelName}
        slug={params.slug}
        themeColor={breeder.themeColor}
        themeAccentColor={breeder.themeAccentColor}
        socialInstagram={breeder.socialInstagram}
        socialFacebook={breeder.socialFacebook}
        socialTiktok={breeder.socialTiktok}
        socialYoutube={breeder.socialYoutube}
        website={breeder.website}
      />
    </>
  )
}
