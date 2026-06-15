import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
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
              {litters.map((litter) => (
                <div key={litter.id} className="bg-white rounded-xl border border-cream-deep p-5 flex items-center gap-4 justify-between">
                  {litter.media[0]?.url && (
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={litter.media[0].url} alt={litter.breed.nameDe} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800 text-sm">{litter.breed.nameDe}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {litter.status === 'planned' && (litter.expectedDate ? `Erwartet: ${litter.expectedDate}` : 'Geplant')}
                      {litter.status === 'pregnant' && (litter.expectedDate ? `Erwartet: ${litter.expectedDate}` : 'Trächtig')}
                      {litter.status === 'born' && litter.bornDate && `Geboren am ${litter.bornDate.toLocaleDateString('de-DE')}`}
                      {litter.status === 'available' && 'Welpen abgabebereit'}
                      {litter.status === 'sold_out' && 'Ausverkauft'}
                      {litter.puppyCount && ` · ${litter.puppyCount} Welpen`}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
