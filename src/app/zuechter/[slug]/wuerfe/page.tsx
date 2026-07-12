import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'
import BreederContactSidebar from '@/components/BreederContactSidebar'
import { generateBreederMetadata } from '@/lib/breeder-metadata'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return generateBreederMetadata(params.slug, '/wuerfe', 'Würfe')
}

export const dynamic = 'force-dynamic'

export default async function ZuechterWuerfePage({
  params,
}: {
  params: { slug: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()

  const tabs = await getBreederTabs(breeder.id)

  const litters = await prisma.litter.findMany({
    where: { breederId: breeder.id },
    include: {
      breed: { select: { nameDe: true } },
      media: { take: 1, select: { url: true } },
      dam: { select: { id: true, name: true } },
      sire: { select: { id: true, name: true } },
      listings: {
        where: { type: 'puppy' },
        select: { status: true, sex: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

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
            fullName={breeder.fullName}
            showFullName={breeder.showFullName}
          />
        }>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
            {'Würfe & Planung'}
          </h2>

          {litters.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">{'Aktuell keine Würfe oder geplante Würfe.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {litters.map((litter) => {
                const title = litter.name || litter.breed.nameDe
                const totalMales = litter.listings.filter((l) => l.sex === 'male').length
                const totalFemales = litter.listings.filter((l) => l.sex === 'female').length
                const available = litter.listings.filter((l) => l.status === 'available')
                const availableMales = available.filter((l) => l.sex === 'male').length
                const availableFemales = available.filter((l) => l.sex === 'female').length

                let statusText = ''
                if (litter.status === 'planned') {
                  statusText = litter.expectedDate
                    ? ('Geplant · erwartet ' + litter.expectedDate)
                    : 'Geplant'
                } else if (litter.status === 'pregnant') {
                  statusText = litter.expectedDate
                    ? ('Trächtig · erwartet ' + litter.expectedDate)
                    : 'Trächtig'
                }

                const statusLabel =
                  litter.status === 'available' ? 'Verfügbar'
                  : litter.status === 'sold_out' ? 'Ausverkauft'
                  : litter.status === 'born' ? 'Geboren'
                  : litter.status === 'pregnant' ? 'Trächtig'
                  : 'Geplant'

                const statusClass =
                  litter.status === 'available' ? 'bg-green-50 text-green-700'
                  : litter.status === 'sold_out' ? 'bg-stone-200 text-stone-600'
                  : litter.status === 'born' ? 'bg-blue-50 text-blue-700'
                  : 'bg-stone-100 text-stone-500'

                return (
                  <div
                    key={litter.id}
                    className="bg-white rounded-2xl border border-cream-deep p-5 hover:border-forest/30 hover:shadow-sm transition-all"
                  >
                    <Link
                      href={`/zuechter/${params.slug}/wuerfe/${litter.id}`}
                      className="flex flex-col sm:flex-row sm:items-start gap-3"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        {litter.media[0]?.url ? (
                          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={litter.media[0].url} alt={title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl bg-cream-dark flex-shrink-0 flex items-center justify-center">
                            <svg className="w-9 h-9 sm:w-12 sm:h-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        )}
                        {/* On mobile: show only born date + status badge next to image */}
                        <div className="flex-1 sm:hidden">
                          {litter.bornDate ? (
                            <p className="text-sm text-stone-500">
                              {'Geb. ' + litter.bornDate.toLocaleDateString('de-DE')}
                            </p>
                          ) : (
                            <p className="text-sm text-stone-500">{statusText || statusLabel}</p>
                          )}
                          <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      {/* Full info — always on desktop, below image on mobile */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-serif font-bold text-stone-900 text-lg sm:text-xl leading-snug">{title}</p>
                            {litter.name && <p className="text-xs sm:text-sm text-stone-400">{litter.breed.nameDe}</p>}
                          </div>
                          <span className={`hidden sm:inline-block flex-shrink-0 text-sm font-semibold px-3 py-1.5 rounded-full ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                        {litter.bornDate ? (
                          <p className="text-sm sm:text-base text-stone-500 mt-1">
                            {'Geboren am ' + litter.bornDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                            {litter.listings.length > 0 && (
                              ` · ${totalMales} ${totalMales === 1 ? 'Rüde' : 'Rüden'}, ${totalFemales} ${totalFemales === 1 ? 'Hündin' : 'Hündinnen'}`
                            )}
                          </p>
                        ) : (
                          <p className="hidden sm:block text-sm sm:text-base text-stone-500 mt-1">{statusText}</p>
                        )}
                        {litter.status === 'available' && (availableMales > 0 || availableFemales > 0) && (
                          <p className="text-sm sm:text-base text-green-700 font-medium mt-1">
                            {'Verfügbar: '}
                            {availableMales} {availableMales === 1 ? 'Rüde' : 'Rüden'}
                            {' · '}
                            {availableFemales} {availableFemales === 1 ? 'Hündin' : 'Hündinnen'}
                            {litter.handoverDate && (' · ab ' + litter.handoverDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }))}
                          </p>
                        )}
                      </div>
                    </Link>

                    {(litter.dam || litter.sire || litter.sireExternal) && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-cream-deep">
                        {litter.sire ? (
                          <Link
                            href={`/hund/${litter.sire.id}`}
                            className="text-sm bg-cream border border-cream-deep rounded-full px-3.5 py-1.5 text-stone-600 hover:border-forest/30 hover:text-forest transition-colors"
                          >
                            {'Vater: ' + litter.sire.name}
                          </Link>
                        ) : litter.sireExternal ? (
                          <span className="text-sm bg-cream border border-cream-deep rounded-full px-3.5 py-1.5 text-stone-600">
                            {'Vater: ' + litter.sireExternal}
                          </span>
                        ) : null}
                        {litter.dam && (
                          <Link
                            href={`/hund/${litter.dam.id}`}
                            className="text-sm bg-cream border border-cream-deep rounded-full px-3.5 py-1.5 text-stone-600 hover:border-forest/30 hover:text-forest transition-colors"
                          >
                            {'Mutter: ' + litter.dam.name}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
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
