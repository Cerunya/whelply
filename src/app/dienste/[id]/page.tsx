import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import nextDynamic from 'next/dynamic'
import { Metadata } from 'next'

const LocationMap = nextDynamic(() => import('@/components/LocationMap'), { ssr: false })

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  vet: 'Tierarzt / Tierklinik',
  groomer: 'Hundefriseur / Groomer',
  pension: 'Tierpension / Hundesitter',
  trainer: 'Hundetrainer / Hundeschule',
  other: 'Sonstige Dienstleistung',
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const provider = await prisma.serviceProvider.findUnique({ where: { id: params.id }, select: { name: true, category: true, city: true } })
  if (!provider) return { title: 'Nicht gefunden' }
  return {
    title: `${provider.name} — ${CATEGORY_LABELS[provider.category]}${provider.city ? ` in ${provider.city}` : ''} | Whelply`,
    description: `${provider.name} — ${CATEGORY_LABELS[provider.category]}${provider.city ? ` in ${provider.city}` : ''}. Finde Dienstleister für deinen Hund auf Whelply.`,
  }
}

export default async function DienstDetailPage({ params }: { params: { id: string } }) {
  const provider = await prisma.serviceProvider.findUnique({
    where: { id: params.id },
    include: { media: { select: { url: true }, orderBy: { sortOrder: 'asc' } } },
  })

  if (!provider) notFound()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <span className="text-xs font-semibold text-forest uppercase tracking-wider bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              {CATEGORY_LABELS[provider.category]}
            </span>
            {provider.isPremium && <span className="text-xs text-honey font-semibold ml-2">★ Premium</span>}
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-3">{provider.name}</h1>
            {provider.city && (
              <p className="text-stone-500 mt-1">{[provider.city, provider.state].filter(Boolean).join(', ')}</p>
            )}
          </div>

          {/* Bilder-Galerie */}
          {provider.media.length > 0 && (
            <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-3">
              {provider.media.map((img, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden bg-cream ${i === 0 && provider.media.length > 2 ? 'col-span-2 row-span-2' : ''}`}>
                  <img src={img.url} alt={`${provider.name} Bild ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Linke Spalte — Beschreibung + Karte */}
            <div className="md:col-span-2 space-y-6">
              {provider.description && (
                <div className="bg-white rounded-2xl border border-cream-deep p-6">
                  <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Über uns</h2>
                  <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{provider.description}</p>
                </div>
              )}

              {/* Öffnungszeiten */}
              {provider.openingHours && (
                <div className="bg-white rounded-2xl border border-cream-deep p-6">
                  <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Öffnungszeiten</h2>
                  <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{provider.openingHours}</p>
                </div>
              )}

              {/* Karte */}
              {provider.lat && provider.lng && (
                <div className="bg-white rounded-2xl border border-cream-deep p-6">
                  <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Standort</h2>
                  <LocationMap
                    lat={provider.lat}
                    lng={provider.lng}
                    label={provider.name}
                    className="h-72"
                  />
                  {provider.street && (
                    <p className="text-sm text-stone-500 mt-3">{provider.street}, {provider.zip} {provider.city}</p>
                  )}
                </div>
              )}
            </div>

            {/* Rechte Spalte — Kontakt */}
            <div className="space-y-4">
              <div className="bg-forest rounded-2xl p-6 text-white">
                <h3 className="font-serif text-lg font-bold mb-4">Kontakt</h3>
                <div className="space-y-4 text-sm">
                  {provider.street && (
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Adresse</p>
                      <p>{provider.street}</p>
                      <p>{provider.zip} {provider.city}</p>
                    </div>
                  )}
                  {provider.phone && (
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Telefon</p>
                      <a href={`tel:${provider.phone}`} className="hover:text-honey transition-colors">{provider.phone}</a>
                    </div>
                  )}
                  {provider.website && (
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Website</p>
                      <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-honey transition-colors break-all">
                        {provider.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Öffnungszeiten kompakt (wenn Sidebar Platz hat) */}
              {provider.openingHours && (
                <div className="bg-white rounded-2xl border border-cream-deep p-5">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Öffnungszeiten</p>
                  <p className="text-sm text-stone-600 whitespace-pre-line leading-relaxed">{provider.openingHours}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 text-center">
            <a href="/dienste" className="text-sm text-forest hover:underline">← Alle Dienstleister</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
