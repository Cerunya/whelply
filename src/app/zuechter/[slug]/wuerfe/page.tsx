import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BreederPageHeader from '@/components/BreederPageHeader'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'

export const dynamic = 'force-dynamic'

export default async function ZuechterWuerfePage({
  params,
}: {
  params: { slug: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()

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
      <Navbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="wuerfe" />

        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
            Würfe & Planung
          </h2>

          {litters.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400 text-sm">Aktuell keine Würfe oder geplante Würfe.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {litters.map((litter) => {
                const title = litter.name || litter.breed.nameDe
                const available = litter.listings.filter((l) => l.status === 'available')
                const availableMales = available.filter((l) => l.sex === 'male').length
                const availableFemales = available.filter((l) => l.sex === 'female').length

                let statusText = ''
                if (litter.status === 'planned') statusText = litter.expectedDate ? `Geplant · erwartet ${litter.expectedDate}` : 'Geplant'
                else if (litter.status === 'pregnant') statusText = litter.expectedDate ? `Trächtig · erwartet ${litter.expectedDate}` : 'Trächtig'
                else if (litter.status === 'born') statusText = litter.bornDate ? `Geboren am ${litter.bornDate.toLocaleDateString('de-DE')}` : 'Geboren'
                else if (litter.status === 'available') statusText = litter.bornDate ? `Geboren am ${litter.bornDate.toLocaleDateString('de-DE')}` : 'Welpen abgabebereit'
                else if (litter.status === 'sold_out') statusText = 'Ausverkauft'

                return (
                  <Link
                    key={litter.id}
                    href={`/zuechter/${params.slug}/wuerfe/${litter.id}`}
                    className="bg-white rounded-xl border border-cream-deep p-5 flex items-center gap-4 hover:border-forest/30 hover:shadow-sm transition-all"
                  >
                    {litter.media[0]?.url ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={litter.media[0].url} alt={title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-cream-dark flex-shrink-0 flex items-center justify-center">
                        <svg className="w-7 h-7 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 text-sm">{title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {litter.name && `${litter.breed.nameDe} · `}{statusText}
                        {litter.puppyCount && ` · ${litter.puppyCount} Welpen`}
                      </p>
                      {litter.status === 'available' && (availableMales > 0 || availableFemales > 0) && (
                        <p className="text-xs text-green-700 font-medium mt-1">
                          Verfügbar: {availableMales} Rüden · {availableFemales} Hündinnen
                        </p>
                      )}
                      {(litter.dam || litter.sire || litter.sireExternal) && (
                        <p className="text-xs text-stone-400 mt-1">
                          {litter.sire ? `Vater: ${litter.sire.name}` : litter.sireExternal ? `Vater: ${litter.sireExternal}` : ''}
                          {(litter.sire || litter.sireExternal) && litter.dam ? ' · ' : ''}
                          {litter.dam ? `Mutter: ${litter.dam.name}` : ''}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                      litter.status === 'available' ? 'bg-green-50 text-green-700'
                      : litter.status === 'sold_out' ? 'bg-stone-200 text-stone-600'
                      : litter.status === 'born' ? 'bg-blue-50 text-blue-700'
                      : 'bg-stone-100 text-stone-500'
                    }`}>
                      {litter.status === 'available' ? 'Verfügbar'
                        : litter.status === 'sold_out' ? 'Ausverkauft'
                        : litter.status === 'born' ? 'Geboren'
                        : litter.status === 'pregnant' ? 'Trächtig'
                        : 'Geplant'}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
