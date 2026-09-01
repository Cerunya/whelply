import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Suspense } from 'react'
import DiensteSuche from '@/components/DiensteSuche'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  vet: 'Tierärzte',
  groomer: 'Hundefriseure & Groomer',
  pension: 'Tierpensionen',
  trainer: 'Hundetrainer',
  other: 'Sonstige Dienstleister',
}

export default async function DienstePage({
  searchParams,
}: {
  searchParams: { kategorie?: string; ort?: string; region?: string; radius?: string }
}) {
  // Umkreissuche
  let radiusFilter: any = {}
  const radiusKm = Number(searchParams.radius) || 0
  if (searchParams.ort && radiusKm > 0) {
    const { geocodeAddress } = await import('@/lib/geocode')
    const coords = await geocodeAddress({ zip: searchParams.ort, city: searchParams.ort })
    if (coords) {
      const delta = radiusKm / 111
      radiusFilter = {
        lat: { gte: coords.lat - delta, lte: coords.lat + delta },
        lng: { gte: coords.lng - delta, lte: coords.lng + delta },
      }
    }
  }

  const providers = await prisma.serviceProvider.findMany({
    where: {
      ...(searchParams.kategorie ? { category: searchParams.kategorie as any } : {}),
      ...(searchParams.region ? { state: searchParams.region } : {}),
      ...(searchParams.ort && !radiusKm ? { OR: [{ zip: { startsWith: searchParams.ort } }, { city: { contains: searchParams.ort, mode: 'insensitive' as const } }] } : {}),
      ...radiusFilter,
    },
    orderBy: [{ isPremium: 'desc' }, { createdAt: 'desc' }],
  })

  const categories = Object.entries(CATEGORY_LABELS)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="bg-forest px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              Dienstleister rund um den Hund
            </h1>
            <p className="text-white/70 text-sm">
              Tierärzte, Hundefriseure, Pensionen und Trainer in deiner Nähe.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Kategorie-Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <a
              href="/dienste"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !searchParams.kategorie
                  ? 'bg-forest text-white'
                  : 'bg-white border border-cream-deep text-stone-600 hover:border-forest/30'
              }`}
            >
              Alle
            </a>
            {categories.map(([key, label]) => (
              <a
                key={key}
                href={`/dienste?kategorie=${key}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  searchParams.kategorie === key
                    ? 'bg-forest text-white'
                    : 'bg-white border border-cream-deep text-stone-600 hover:border-forest/30'
                }`}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Standortsuche */}
          <div className="flex flex-wrap gap-3 items-center mb-6">
            <Suspense fallback={null}>
              <DiensteSuche />
            </Suspense>
          </div>

          {providers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-cream-deep">
              <svg className="w-12 h-12 mx-auto text-stone-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
              </svg>
              <h2 className="font-serif text-lg font-bold text-stone-700 mb-2">
                Noch keine Einträge
              </h2>
              <p className="text-stone-400 text-sm max-w-md mx-auto">
                Wir bauen das Dienstleister-Verzeichnis gerade auf. Bist du Tierarzt, Hundefriseur,
                Trainer oder betreibst eine Hundepension? Melde dich bald hier an.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <Link
                  key={provider.id}
                  href={`/dienste/${provider.id}`}
                  className={`bg-white rounded-2xl border p-6 hover:shadow-md transition-all group ${
                    provider.isPremium ? 'border-honey ring-1 ring-honey/30' : 'border-cream-deep hover:border-forest/20'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    {(provider as any).logoUrl && (
                      <img src={(provider as any).logoUrl} alt="" className="w-12 h-12 rounded-xl object-contain border border-cream-deep flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-forest transition-colors">{provider.name}</h3>
                    {provider.isPremium && (
                      <span className="text-xs text-honey font-semibold whitespace-nowrap ml-2">★ Premium</span>
                    )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-forest font-semibold uppercase tracking-wide mb-3">
                    {CATEGORY_LABELS[provider.category]}
                  </p>
                  {provider.description && (
                    <p className="text-sm text-stone-500 mb-3 line-clamp-2">{provider.description}</p>
                  )}
                  {(provider.city || provider.state) && (
                    <p className="text-sm text-stone-400">
                      {[provider.city, provider.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
