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
    title: `${provider.name} — ${CATEGORY_LABELS[provider.category]} ${provider.city ? `in ${provider.city}` : ''} | Whelply`,
    description: `${provider.name} — ${CATEGORY_LABELS[provider.category]}${provider.city ? ` in ${provider.city}` : ''}. Finde Dienstleister für deinen Hund auf Whelply.`,
  }
}

export default async function DienstDetailPage({ params }: { params: { id: string } }) {
  const provider = await prisma.serviceProvider.findUnique({
    where: { id: params.id },
  })

  if (!provider) notFound()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <span className="text-xs font-semibold text-forest uppercase tracking-wider bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              {CATEGORY_LABELS[provider.category]}
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-3">{provider.name}</h1>
            {provider.city && (
              <p className="text-stone-500 mt-1">{[provider.city, provider.state].filter(Boolean).join(', ')}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Beschreibung */}
            <div className="md:col-span-2 space-y-6">
              {provider.description && (
                <div className="bg-white rounded-2xl border border-cream-deep p-6">
                  <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Über uns</h2>
                  <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{provider.description}</p>
                </div>
              )}

              {/* Karte */}
              {provider.lat && provider.lng && (
                <div className="bg-white rounded-2xl border border-cream-deep p-6">
                  <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Standort</h2>
                  <LocationMap
                    lat={provider.lat}
                    lng={provider.lng}
                    label={provider.city || provider.name}
                    className="h-64"
                  />
                </div>
              )}
            </div>

            {/* Kontakt-Sidebar */}
            <div className="space-y-4">
              <div className="bg-forest rounded-2xl p-6 text-white">
                <h3 className="font-serif text-lg font-bold mb-4">Kontakt</h3>
                <div className="space-y-3 text-sm">
                  {provider.street && (
                    <div>
                      <p className="text-white/60 text-xs">Adresse</p>
                      <p>{provider.street}</p>
                      <p>{provider.zip} {provider.city}</p>
                    </div>
                  )}
                  {provider.phone && (
                    <div>
                      <p className="text-white/60 text-xs">Telefon</p>
                      <a href={`tel:${provider.phone}`} className="hover:text-honey">{provider.phone}</a>
                    </div>
                  )}
                  {provider.website && (
                    <div>
                      <p className="text-white/60 text-xs">Website</p>
                      <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-honey break-all">
                        {provider.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a href="/dienste" className="text-sm text-forest hover:underline">← Alle Dienstleister</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
